import { Ollama } from 'ollama';
import type { LlmConfig } from '../../core/config/index';

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  LlmProvider,
} from './types';

export class OllamaProvider implements LlmProvider {
  private client: Ollama;
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
    this.client = new Ollama({
      host: config.baseURL || 'http://localhost:11434',
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    // Convert messages to Ollama format
    const ollamaMessages = messages.map((m) => ({
      role: m.role === 'function' ? 'assistant' : m.role,
      content: m.content,
    }));

    // Handle functions through prompt engineering
    let systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
    
    if (options?.functions && options.functions.length > 0) {
      systemPrompt += this.generateFunctionPrompt(options.functions);
    }

    const response = await this.client.chat({
      model: this.config.model,
      messages: ollamaMessages,
      options: {
        temperature: options?.temperature ?? this.config.temperature,
        num_predict: options?.maxTokens ?? this.config.maxTokens,
      },
      stream: false,
    });

    // Try to parse function calls from response
    const functionCall = options?.functions
      ? this.extractFunctionCall(response.message.content, options.functions)
      : undefined;

    return {
      content: response.message.content,
      role: 'assistant',
      functionCall,
      finishReason: response.done ? 'stop' : null,
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatStreamChunk> {
    const ollamaMessages = messages.map((m) => ({
      role: m.role === 'function' ? 'assistant' : m.role,
      content: m.content,
    }));

    let systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
    
    if (options?.functions && options.functions.length > 0) {
      systemPrompt += this.generateFunctionPrompt(options.functions);
    }

    const stream = await this.client.chat({
      model: this.config.model,
      messages: ollamaMessages,
      options: {
        temperature: options?.temperature ?? this.config.temperature,
        num_predict: options?.maxTokens ?? this.config.maxTokens,
      },
      stream: true,
    });

    let accumulatedContent = '';

    for await (const chunk of stream) {
      accumulatedContent += chunk.message.content;

      yield {
        delta: {
          role: 'assistant',
          content: chunk.message.content,
        },
        finishReason: chunk.done ? 'stop' : null,
      };

      if (chunk.done && options?.functions) {
        // Try to extract function call from accumulated content
        const functionCall = this.extractFunctionCall(
          accumulatedContent,
          options.functions
        );

        if (functionCall) {
          yield {
            delta: {
              functionCall,
            },
            finishReason: 'function_call',
          };
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const embeddingModel = this.config.embeddingModel || 'nomic-embed-text';
    
    const embeddings: number[][] = [];

    for (const text of texts) {
      const response = await this.client.embeddings({
        model: embeddingModel,
        prompt: text,
      });

      embeddings.push(response.embedding);
    }

    return embeddings;
  }

  private generateFunctionPrompt(functions: ChatOptions['functions']): string {
    if (!functions || functions.length === 0) return '';

    const functionsDesc = functions
      .map((fn) => {
        const params = JSON.stringify(fn.parameters, null, 2);
        return `- ${fn.name}: ${fn.description}\n  Parameters: ${params}`;
      })
      .join('\n');

    return `

You have access to the following functions:
${functionsDesc}

To call a function, respond with JSON in this exact format:
{
  "function_call": {
    "name": "function_name",
    "arguments": { "param1": "value1" }
  }
}

If you're not calling a function, respond normally.`;
  }

  private extractFunctionCall(
    content: string,
    functions: ChatOptions['functions']
  ): ChatResponse['functionCall'] | undefined {
    if (!functions || functions.length === 0) return undefined;

    // Try to find JSON function call in response
    const jsonMatch = content.match(/\{[\s\S]*"function_call"[\s\S]*\}/);
    
    if (!jsonMatch) return undefined;

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.function_call && parsed.function_call.name) {
        return {
          name: parsed.function_call.name,
          arguments: JSON.stringify(parsed.function_call.arguments || {}),
        };
      }
    } catch {
      // Failed to parse, no function call
      return undefined;
    }

    return undefined;
  }
}

