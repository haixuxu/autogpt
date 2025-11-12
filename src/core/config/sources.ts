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

    // Determine provider (defaults to openai)
    const provider = (process.env.LLM_PROVIDER || process.env.OPENAI_PROVIDER || 'openai').toLowerCase();
    
    // Load config based on provider
    const llmConfig: Record<string, unknown> = { provider };
    
    switch (provider) {
      case 'anthropic':
      case 'claude':
        llmConfig.model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
        llmConfig.apiKey = process.env.ANTHROPIC_API_KEY || '';
        llmConfig.baseURL = process.env.ANTHROPIC_BASE_URL;
        llmConfig.temperature = process.env.ANTHROPIC_TEMPERATURE
          ? parseFloat(process.env.ANTHROPIC_TEMPERATURE)
          : undefined;
        llmConfig.maxTokens = process.env.ANTHROPIC_MAX_TOKENS
          ? parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10)
          : undefined;
        llmConfig.embeddingModel = process.env.ANTHROPIC_EMBEDDING_MODEL;
        break;
      
      case 'ollama':
      case 'local':
        llmConfig.model = process.env.OLLAMA_MODEL || 'llama2';
        llmConfig.apiKey = process.env.OLLAMA_API_KEY || '';  // Optional for Ollama
        llmConfig.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        llmConfig.temperature = process.env.OLLAMA_TEMPERATURE
          ? parseFloat(process.env.OLLAMA_TEMPERATURE)
          : undefined;
        llmConfig.maxTokens = process.env.OLLAMA_MAX_TOKENS
          ? parseInt(process.env.OLLAMA_MAX_TOKENS, 10)
          : undefined;
        llmConfig.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
        break;
      
      case 'azure':
      case 'azure-openai':
        llmConfig.model = process.env.AZURE_OPENAI_MODEL || 'gpt-4';
        llmConfig.apiKey = process.env.AZURE_OPENAI_API_KEY || '';
        llmConfig.baseURL = process.env.AZURE_OPENAI_BASE_URL;
        llmConfig.temperature = process.env.AZURE_OPENAI_TEMPERATURE
          ? parseFloat(process.env.AZURE_OPENAI_TEMPERATURE)
          : undefined;
        llmConfig.maxTokens = process.env.AZURE_OPENAI_MAX_TOKENS
          ? parseInt(process.env.AZURE_OPENAI_MAX_TOKENS, 10)
          : undefined;
        llmConfig.embeddingModel = process.env.AZURE_OPENAI_EMBEDDING_MODEL;
        break;
      
      case 'openai':
      default:
        llmConfig.model = process.env.OPENAI_MODEL || 'gpt-4';
        llmConfig.apiKey = process.env.OPENAI_API_KEY || '';
        llmConfig.baseURL = process.env.OPENAI_BASE_URL;
        llmConfig.temperature = process.env.OPENAI_TEMPERATURE
          ? parseFloat(process.env.OPENAI_TEMPERATURE)
          : undefined;
        llmConfig.maxTokens = process.env.OPENAI_MAX_TOKENS
          ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
          : undefined;
        llmConfig.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL;
        break;
    }

    // Map environment variables to config structure
    const config: Record<string, unknown> = {
      llm: llmConfig,
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

