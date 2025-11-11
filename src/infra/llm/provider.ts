import OpenAI from 'openai';
import type { LlmConfig } from '../../core/config/index';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  EmbeddingResponse,
} from './types';

export interface LlmProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterator<ChatStreamChunk>;
  embed(texts: string[]): Promise<number[][]>;
}

export class OpenAIProvider implements LlmProvider {
  private client: OpenAI;
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: options?.maxTokens ? this.config.model : this.config.model,
      messages: messages.map((m) => {
        const message: any = {
          role: m.role,
          content: m.content,
        };
        if (m.name) {
          message.name = m.name;
        }
        return message;
      }),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      functions: options?.functions,
      function_call: options?.functionCall,
    });

    const choice = response.choices[0];
    const message = choice.message;

    return {
      content: message.content || '',
      role: 'assistant',
      functionCall: message.function_call
        ? {
            name: message.function_call.name,
            arguments: message.function_call.arguments,
          }
        : undefined,
      finishReason: choice.finish_reason as ChatResponse['finishReason'],
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterator<ChatStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages.map((m) => {
        const message: any = {
          role: m.role,
          content: m.content,
        };
        if (m.name) {
          message.name = m.name;
        }
        return message;
      }),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      functions: options?.functions,
      function_call: options?.functionCall,
      stream: true,
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      yield {
        delta: {
          role: choice.delta.role as 'assistant' | undefined,
          content: choice.delta.content || undefined,
          functionCall: choice.delta.function_call
            ? {
                name: choice.delta.function_call.name,
                arguments: choice.delta.function_call.arguments,
              }
            : undefined,
        },
        finishReason: choice.finish_reason as ChatStreamChunk['finishReason'],
      };
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.config.embeddingModel || 'text-embedding-3-small';

    const response = await this.client.embeddings.create({
      model,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  }
}

