import { spawn } from 'child_process';
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
  validatePath,
  truncateOutput,
  sanitizeEnvironment,
  createTimeoutPromise,
} from './sandbox-utils';

export class LocalSandboxExecutor implements CodeExecutor {
  constructor(public readonly policy: SandboxPolicy) {
    this.verifyPolicy(policy);
  }

  verifyPolicy(policy: SandboxPolicy): void {
    if (policy.maxCpuSeconds <= 0 || policy.maxCpuSeconds > 300) {
      throw new Error('maxCpuSeconds must be between 1 and 300');
    }
    if (policy.maxMemoryMb <= 0 || policy.maxMemoryMb > 2048) {
      throw new Error('maxMemoryMb must be between 1 and 2048');
    }
  }

  async execute(request: ExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = request.timeoutMs || this.policy.maxCpuSeconds * 1000;

    try {
      // Prepare execution environment
      const workDir = request.workingDirectory || process.cwd();
      const tempDir = join(workDir, '.autogpt_temp');
      
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }

      // Write code to temporary file
      const ext = this.getFileExtension(request.language);
      const scriptPath = join(tempDir, `script_${Date.now()}${ext}`);
      await writeFile(scriptPath, request.code, 'utf-8');

      // Write additional files if provided
      if (request.files) {
        for (const file of request.files) {
          const filePath = join(tempDir, file.path);
          await writeFile(filePath, file.content, 'utf-8');
        }
      }

      // Execute with timeout
      const result = await Promise.race([
        this.executeScript(request.language, scriptPath, workDir, request.environment),
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
      return {
        stdout: '',
        stderr: String(error),
        exitCode: 1,
        durationMs: duration,
      };
    }
  }

  private async executeScript(
    language: string,
    scriptPath: string,
    workDir: string,
    env?: Record<string, string>
  ): Promise<Omit<CodeExecutionResult, 'durationMs'>> {
    const command = this.getCommand(language, scriptPath);
    
    return new Promise((resolve) => {
      const sanitizedEnv = env 
        ? { ...sanitizeEnvironment(process.env as Record<string, string>), ...env }
        : sanitizeEnvironment(process.env as Record<string, string>);

      const proc = spawn(command.cmd, command.args, {
        cwd: workDir,
        env: sanitizedEnv,
        shell: false,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          stdout: truncateOutput(stdout),
          stderr: truncateOutput(stderr),
          exitCode: code || 0,
        });
      });

      proc.on('error', (error) => {
        resolve({
          stdout: truncateOutput(stdout),
          stderr: truncateOutput(stderr + '\n' + error.message),
          exitCode: 1,
        });
      });
    });
  }

  private getCommand(language: string, scriptPath: string): { cmd: string; args: string[] } {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return { cmd: 'node', args: [scriptPath] };
      case 'typescript':
      case 'ts':
        return { cmd: 'ts-node', args: [scriptPath] };
      case 'python':
      case 'py':
        return { cmd: 'python3', args: [scriptPath] };
      case 'shell':
      case 'bash':
        return { cmd: 'bash', args: [scriptPath] };
      case 'sh':
        return { cmd: 'sh', args: [scriptPath] };
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private getFileExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return '.js';
      case 'typescript':
      case 'ts':
        return '.ts';
      case 'python':
      case 'py':
        return '.py';
      case 'shell':
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

