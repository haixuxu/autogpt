import type { ZodTypeAny } from 'zod';

export type ConfigSource = {
  readonly name: string;
  readonly load: () => Promise<Record<string, unknown>>;
};

export interface ConfigLoader {
  register(source: ConfigSource): void;
  resolve(): Promise<AppConfig>;
}

export interface AppConfig {
  readonly llm: LlmConfig;
  readonly telemetry: TelemetryConfig;
  readonly workspace: WorkspaceConfig;
  readonly plugins: PluginConfig;
  readonly databaseUrl?: string;
  readonly chromaUrl?: string;
}

export interface LlmConfig {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  embeddingModel?: string;
}

export interface TelemetryConfig {
  enabled: boolean;
  sentryDsn?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logDir?: string;
}

export interface WorkspaceConfig {
  root: string;
  restrictToWorkspace: boolean;
}

export interface PluginConfig {
  enabled: boolean;
  directories: string[];
}

export interface SchemaValidator<TConfig extends object> {
  schema: ZodTypeAny;
  parse(value: unknown): TConfig;
}

export type ConfigOverride = Partial<AppConfig> & {
  llm?: Partial<LlmConfig>;
  telemetry?: Partial<TelemetryConfig>;
  workspace?: Partial<WorkspaceConfig>;
  plugins?: Partial<PluginConfig>;
};

// Export implementations
export { DefaultConfigLoader } from './loader';
export { EnvConfigSource, JsonConfigSource, mergeConfigs } from './sources';
export { ConfigValidator } from './schema';
