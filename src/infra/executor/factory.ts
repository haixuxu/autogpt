import type { ExecutorFactory, CodeExecutor, SandboxPolicy } from './index';
import { LocalSandboxExecutor } from './local-executor';
import { DockerExecutor } from './docker-executor';

export class DefaultExecutorFactory implements ExecutorFactory {
  async createLocalSandbox(policy: SandboxPolicy): Promise<CodeExecutor> {
    return new LocalSandboxExecutor(policy);
  }

  async createDockerExecutor(policy: SandboxPolicy): Promise<CodeExecutor> {
    try {
      return new DockerExecutor(policy);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Docker executor: ${message}`);
    }
  }
}

export const DEFAULT_SANDBOX_POLICY: SandboxPolicy = {
  maxCpuSeconds: 30,
  maxMemoryMb: 512,
  networkAccess: 'outbound',
  filesystemScope: 'workspace',
};

