import { config as loadEnv } from 'dotenv';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ConfigSource } from './index';

export class EnvConfigSource implements ConfigSource {
  readonly name = 'environment';

  constructor(private envPath?: string) {}

  async load(): Promise<Record<string, unknown>> {
    // Load .env file if specified
    if (this.envPath && existsSync(this.envPath)) {
      loadEnv({ path: this.envPath });
    } else {
      loadEnv(); // Load from default .env location
    }

    // Map environment variables to config structure
    const config: Record<string, unknown> = {
      llm: {
        provider: process.env.OPENAI_PROVIDER || 'openai',
        model: process.env.OPENAI_MODEL,
        apiKey: process.env.OPENAI_API_KEY,
        temperature: process.env.OPENAI_TEMPERATURE
          ? parseFloat(process.env.OPENAI_TEMPERATURE)
          : undefined,
        maxTokens: process.env.OPENAI_MAX_TOKENS
          ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
          : undefined,
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
      },
      telemetry: {
        enabled: process.env.TELEMETRY_ENABLED !== 'false',
        sentryDsn: process.env.SENTRY_DSN,
        logLevel: process.env.LOG_LEVEL,
        logDir: process.env.LOG_DIR,
      },
      workspace: {
        root: process.env.WORKSPACE_ROOT,
        restrictToWorkspace:
          process.env.RESTRICT_TO_WORKSPACE !== 'false',
      },
      plugins: {
        enabled: process.env.PLUGINS_ENABLED !== 'false',
        directories: process.env.PLUGIN_DIRECTORIES
          ? process.env.PLUGIN_DIRECTORIES.split(',')
          : undefined,
      },
    };

    // Also include DATABASE_URL and CHROMA_URL at root level
    if (process.env.DATABASE_URL) {
      config.databaseUrl = process.env.DATABASE_URL;
    }
    if (process.env.CHROMA_URL) {
      config.chromaUrl = process.env.CHROMA_URL;
    }

    return config;
  }
}

export class JsonConfigSource implements ConfigSource {
  readonly name = 'json';

  constructor(private configPath: string) {}

  async load(): Promise<Record<string, unknown>> {
    if (!existsSync(this.configPath)) {
      return {};
    }

    try {
      const content = await readFile(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to load config from ${this.configPath}: ${error}`
      );
    }
  }
}

export function mergeConfigs(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeConfigs(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

