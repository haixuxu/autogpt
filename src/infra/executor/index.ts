export interface CodeExecutionResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly truncated?: boolean;
}

export interface ExecutionRequest {
  readonly language: string;
  readonly code: string;
  readonly timeoutMs?: number;
  readonly workingDirectory?: string;
  readonly files?: ExecutionFile[];
  readonly environment?: Record<string, string>;
}

export interface ExecutionFile {
  readonly path: string;
  readonly content: string;
  readonly executable?: boolean;
}

export interface SandboxPolicy {
  readonly maxCpuSeconds: number;
  readonly maxMemoryMb: number;
  readonly networkAccess: 'none' | 'outbound' | 'full';
  readonly filesystemScope: 'workspace' | 'temp' | 'sandbox';
}

export interface CodeExecutor {
  readonly policy: SandboxPolicy;
  execute(request: ExecutionRequest): Promise<CodeExecutionResult>;
  verifyPolicy(policy: SandboxPolicy): void;
}

export interface ExecutorFactory {
  createDockerExecutor(policy: SandboxPolicy): Promise<CodeExecutor>;
  createLocalSandbox(policy: SandboxPolicy): Promise<CodeExecutor>;
}

export { LocalSandboxExecutor } from './local-executor';
export { DockerExecutor } from './docker-executor';
export { DefaultExecutorFactory, DEFAULT_SANDBOX_POLICY } from './factory';
export * from './sandbox-utils';
