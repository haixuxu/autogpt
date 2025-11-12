import Docker from 'dockerode';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

import type {
  CodeExecutor,
  ExecutionRequest,
  CodeExecutionResult,
  SandboxPolicy,
} from './index';
import {
  truncateOutput,
  sanitizeEnvironment,
  createTimeoutPromise,
} from './sandbox-utils';

export class DockerExecutor implements CodeExecutor {
  private docker: Docker;

  constructor(public readonly policy: SandboxPolicy) {
    this.docker = new Docker();
    this.verifyPolicy(policy);
  }

  verifyPolicy(policy: SandboxPolicy): void {
    if (policy.maxCpuSeconds <= 0 || policy.maxCpuSeconds > 300) {
      throw new Error('maxCpuSeconds must be between 1 and 300');
    }
    if (policy.maxMemoryMb <= 0 || policy.maxMemoryMb > 4096) {
      throw new Error('maxMemoryMb must be between 1 and 4096');
    }

    // Verify Docker is available
    this.docker.ping().catch(() => {
      throw new Error(
        'Docker daemon is not running or not accessible. Please ensure Docker is installed and running.'
      );
    });
  }

  async execute(request: ExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = request.timeoutMs || this.policy.maxCpuSeconds * 1000;

    let containerId: string | undefined;

    try {
      // Prepare execution environment
      const workDir = request.workingDirectory || process.cwd();
      const tempDir = join(workDir, '.autogpt_temp');

      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }

      // Write code to temporary file
      const ext = this.getFileExtension(request.language);
      const scriptName = `script_${Date.now()}${ext}`;
      const scriptPath = join(tempDir, scriptName);
      await writeFile(scriptPath, request.code, 'utf-8');

      // Write additional files if provided
      if (request.files) {
        for (const file of request.files) {
          const filePath = join(tempDir, file.path);
          await writeFile(filePath, file.content, 'utf-8');
        }
      }

      // Get appropriate Docker image
      const imageName = this.getImageName(request.language);
      await this.ensureImage(imageName);

      // Create and execute container
      const result = await Promise.race([
        this.executeInContainer(
          imageName,
          request.language,
          tempDir,
          scriptName,
          request.environment
        ),
        createTimeoutPromise(timeoutMs),
      ]);

      // Cleanup
      await this.cleanup(scriptPath, request.files?.map(f => join(tempDir, f.path)) || []);

      const duration = Date.now() - startTime;
      return {
        ...result,
        durationMs: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Cleanup container if it exists
      if (containerId) {
        try {
          const container = this.docker.getContainer(containerId);
          await container.stop({ t: 1 });
          await container.remove();
        } catch {
          // Ignore cleanup errors
        }
      }

      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        durationMs: duration,
      };
    }
  }

  private async ensureImage(imageName: string): Promise<void> {
    try {
      // Check if image exists
      await this.docker.getImage(imageName).inspect();
    } catch {
      // Image doesn't exist, pull it
      console.log(`Pulling Docker image: ${imageName}...`);
      await new Promise((resolve, reject) => {
        this.docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }

          this.docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Successfully pulled ${imageName}`);
              resolve(undefined);
            }
          });
        });
      });
    }
  }

  private async executeInContainer(
    imageName: string,
    language: string,
    tempDir: string,
    scriptName: string,
    env?: Record<string, string>
  ): Promise<Omit<CodeExecutionResult, 'durationMs'>> {
    const command = this.getCommand(language, `/workspace/${scriptName}`);
    
    // Prepare environment variables
    const sanitizedEnv = env
      ? { ...sanitizeEnvironment(process.env as Record<string, string>), ...env }
      : sanitizeEnvironment(process.env as Record<string, string>);

    const envArray = Object.entries(sanitizedEnv).map(
      ([key, value]) => `${key}=${value}`
    );

    // Create container
    const container = await this.docker.createContainer({
      Image: imageName,
      Cmd: [command.cmd, ...command.args],
      AttachStdout: true,
      AttachStderr: true,
      Env: envArray,
      HostConfig: {
        Memory: this.policy.maxMemoryMb * 1024 * 1024,
        MemorySwap: this.policy.maxMemoryMb * 1024 * 1024,
        NanoCpus: 1000000000, // 1 CPU core
        NetworkMode: this.policy.networkAccess === 'none' ? 'none' : 'bridge',
        AutoRemove: false, // We'll manually remove after getting logs
        ReadonlyRootfs: false, // Allow writes to /tmp
        Binds: [`${tempDir}:/workspace:ro`], // Mount workspace as read-only
      },
      WorkingDir: '/workspace',
    });

    try {
      // Start container
      await container.start();

      // Wait for container to finish
      await container.wait();

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
      });

      // Parse logs (Docker combines stdout/stderr in the stream)
      const logString = logs.toString('utf-8');
      const lines = logString.split('\n');
      
      let stdout = '';
      let stderr = '';
      
      for (const line of lines) {
        if (line.length > 8) {
          // Docker log format: first 8 bytes are header
          const content = line.substring(8);
          const streamType = line.charCodeAt(0);
          
          if (streamType === 1) {
            // stdout
            stdout += content + '\n';
          } else if (streamType === 2) {
            // stderr
            stderr += content + '\n';
          } else {
            // Fallback: treat as stdout
            stdout += line + '\n';
          }
        }
      }

      // Get exit code
      const inspection = await container.inspect();
      const exitCode = inspection.State.ExitCode || 0;

      // Remove container
      await container.remove();

      return {
        stdout: truncateOutput(stdout.trim()),
        stderr: truncateOutput(stderr.trim()),
        exitCode,
      };
    } catch (error) {
      // Ensure container is removed
      try {
        await container.remove({ force: true });
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  private getCommand(language: string, scriptPath: string): { cmd: string; args: string[] } {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return { cmd: 'node', args: [scriptPath] };
      case 'python':
      case 'py':
        return { cmd: 'python3', args: [scriptPath] };
      case 'bash':
        // Alpine uses ash/sh, not bash - use sh for compatibility
        return { cmd: 'sh', args: [scriptPath] };
      case 'sh':
        return { cmd: 'sh', args: [scriptPath] };
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private getImageName(language: string): string {
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        return 'python:3.11-alpine';
      case 'javascript':
      case 'js':
        return 'node:20-alpine';
      case 'bash':
      case 'sh':
        return 'alpine:latest';
      default:
        return 'alpine:latest';
    }
  }

  private getFileExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return '.js';
      case 'python':
      case 'py':
        return '.py';
      case 'bash':
      case 'sh':
        return '.sh';
      default:
        return '.txt';
    }
  }

  private async cleanup(scriptPath: string, additionalFiles: string[]): Promise<void> {
    try {
      await unlink(scriptPath);
      for (const file of additionalFiles) {
        if (existsSync(file)) {
          await unlink(file);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

