import type { ExecutorFactory, CodeExecutor, SandboxPolicy } from './index';
import { LocalSandboxExecutor } from './local-executor';

export class DefaultExecutorFactory implements ExecutorFactory {
  async createLocalSandbox(policy: SandboxPolicy): Promise<CodeExecutor> {
    return new LocalSandboxExecutor(policy);
  }

  async createDockerExecutor(policy: SandboxPolicy): Promise<CodeExecutor> {
    throw new Error('Docker executor not yet implemented - use local sandbox');
  }
}

export const DEFAULT_SANDBOX_POLICY: SandboxPolicy = {
  maxCpuSeconds: 30,
  maxMemoryMb: 512,
  networkAccess: 'outbound',
  filesystemScope: 'workspace',
};

