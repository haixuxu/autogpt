import type { LlmConfig } from '../../core/config/index';

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  LlmProvider,
} from './types';
import { OpenAIProvider } from './provider';
import { AnthropicProvider } from './anthropic-provider';
import { OllamaProvider } from './ollama-provider';

export class LlmProviderFactory {
  /**
   * Create a single LLM provider based on configuration
   */
  static create(config: LlmConfig): LlmProvider {
    const provider = config.provider.toLowerCase();

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);

      case 'anthropic':
      case 'claude':
        return new AnthropicProvider(config);

      case 'ollama':
      case 'local':
        return new OllamaProvider(config);

      case 'azure':
      case 'azure-openai':
        // Azure OpenAI uses OpenAI SDK with different baseURL
        return new OpenAIProvider({
          ...config,
          baseURL: config.baseURL || 'https://YOUR_RESOURCE.openai.azure.com',
        });

      default:
        throw new Error(
          `Unknown LLM provider: ${config.provider}. Supported providers: openai, anthropic, ollama, azure`
        );
    }
  }

  /**
   * Create a provider with automatic fallback to alternative providers
   */
  static createWithFallback(
    primaryConfig: LlmConfig,
    fallbackConfigs: LlmConfig[]
  ): LlmProvider {
    const providers = [
      this.create(primaryConfig),
      ...fallbackConfigs.map((config) => this.create(config)),
    ];

    return new FallbackLlmProvider(providers);
  }
}

/**
 * Provider that automatically falls back to alternative providers on failure
 */
export class FallbackLlmProvider implements LlmProvider {
  constructor(private providers: LlmProvider[]) {
    if (providers.length === 0) {
      throw new Error('FallbackLlmProvider requires at least one provider');
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    let lastError: Error | undefined;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        const response = await provider.chat(messages, options);
        
        // Log fallback if not using primary provider
        if (i > 0) {
          console.warn(
            `Primary provider failed, used fallback provider #${i + 1}`
          );
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log error and try next provider
        console.error(
          `Provider #${i + 1} failed:`,
          lastError.message
        );
        
        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(
            `All ${this.providers.length} provider(s) failed. Last error: ${lastError.message}`
          );
        }
      }
    }

    // Should never reach here, but satisfy TypeScript
    throw lastError || new Error('All providers failed');
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatStreamChunk> {
    let lastError: Error | undefined;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        // Log fallback if not using primary provider
        if (i > 0) {
          console.warn(
            `Primary provider failed, using fallback provider #${i + 1} for streaming`
          );
        }

        const stream = provider.chatStream(messages, options);
        for await (const chunk of stream) {
          yield chunk;
        }
        return; // Successfully streamed, exit
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(
          `Provider #${i + 1} streaming failed:`,
          lastError.message
        );
        
        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(
            `All ${this.providers.length} provider(s) failed for streaming. Last error: ${lastError.message}`
          );
        }
      }
    }

    // Should never reach here
    throw lastError || new Error('All providers failed for streaming');
  }

  async embed(texts: string[]): Promise<number[][]> {
    let lastError: Error | undefined;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        const embeddings = await provider.embed(texts);
        
        if (i > 0) {
          console.warn(
            `Primary provider failed, used fallback provider #${i + 1} for embeddings`
          );
        }
        
        return embeddings;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(
          `Provider #${i + 1} embeddings failed:`,
          lastError.message
        );
        
        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(
            `All ${this.providers.length} provider(s) failed for embeddings. Last error: ${lastError.message}`
          );
        }
      }
    }

    throw lastError || new Error('All providers failed for embeddings');
  }
}

/**
 * Utility function to test if a provider is available
 */
export async function testProvider(provider: LlmProvider): Promise<boolean> {
  try {
    const response = await provider.chat([
      {
        role: 'user',
        content: 'Say "OK" if you can hear me.',
      },
    ]);

    return response.content.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

