import { z } from 'zod';
import type { AppConfig, LlmConfig, TelemetryConfig, WorkspaceConfig, PluginConfig } from './index';

export const LlmConfigSchema = z.object({
  provider: z.string().default('openai'),
  model: z.string().default('gpt-4'),
  apiKey: z.string().min(1, 'API key is required'),
  baseURL: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(2000),
  embeddingModel: z.string().optional().default('text-embedding-3-small'),
  embeddingProvider: z.string().optional(),
});

export const TelemetryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  sentryDsn: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logDir: z.string().default('./logs'),
});

export const WorkspaceConfigSchema = z.object({
  root: z.string().default('./workspace'),
  restrictToWorkspace: z.boolean().default(true),
});

export const PluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  directories: z.array(z.string()).default(['./plugins']),
});

export const AppConfigSchema = z.object({
  llm: LlmConfigSchema,
  telemetry: TelemetryConfigSchema,
  workspace: WorkspaceConfigSchema,
  plugins: PluginConfigSchema,
});

export class ConfigValidator {
  static parse(raw: unknown): AppConfig {
    return AppConfigSchema.parse(raw) as AppConfig;
  }

  static parsePartial(raw: unknown): Partial<AppConfig> {
    return AppConfigSchema.partial().parse(raw);
  }
}

