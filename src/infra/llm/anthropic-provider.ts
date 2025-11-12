import Anthropic from '@anthropic-ai/sdk';
import type { LlmConfig } from '../../core/config/index';

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  LlmProvider,
} from './types';

export class AnthropicProvider implements LlmProvider {
  private client: Anthropic;
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    // Convert messages to Anthropic format
    const anthropicMessages = this.convertMessages(messages);
    
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system')?.content;

    // Prepare tools if functions are provided
    const tools = options?.functions
      ? this.convertFunctionsToTools(options.functions)
      : undefined;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      system: systemMessage,
      messages: anthropicMessages,
      tools,
    });

    // Handle tool use (function calling)
    const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
    
    return {
      content: this.extractTextContent(response.content),
      role: 'assistant',
      functionCall: toolUseBlock
        ? {
            name: (toolUseBlock as any).name,
            arguments: JSON.stringify((toolUseBlock as any).input),
          }
        : undefined,
      finishReason: this.mapStopReason(response.stop_reason),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatStreamChunk> {
    const anthropicMessages = this.convertMessages(messages);
    const systemMessage = messages.find((m) => m.role === 'system')?.content;

    const tools = options?.functions
      ? this.convertFunctionsToTools(options.functions)
      : undefined;

    const stream = await this.client.messages.create({
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      system: systemMessage,
      messages: anthropicMessages,
      tools,
      stream: true,
    });

    let currentToolUse: { name?: string; input: string } | undefined;

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;

        if (delta.type === 'text_delta') {
          yield {
            delta: {
              role: 'assistant',
              content: delta.text,
            },
            finishReason: null,
          };
        } else if (delta.type === 'input_json_delta') {
          // Accumulate tool use input
          if (!currentToolUse) {
            currentToolUse = { input: '' };
          }
          currentToolUse.input += (delta as any).partial_json;
        }
      } else if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          currentToolUse = {
            name: (block as any).name,
            input: '',
          };
        }
      } else if (event.type === 'message_delta') {
        const stopReason = this.mapStopReason(event.delta.stop_reason);
        
        if (currentToolUse && currentToolUse.name) {
          yield {
            delta: {
              role: 'assistant',
              functionCall: {
                name: currentToolUse.name,
                arguments: currentToolUse.input,
              },
            },
            finishReason: stopReason,
          };
        } else if (stopReason) {
          yield {
            delta: {},
            finishReason: stopReason,
          };
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Anthropic doesn't provide embeddings API
    // Fallback to a lightweight embedding or throw error
    throw new Error(
      'Anthropic does not provide embeddings API. Please use OpenAI or another provider for embeddings.'
    );
  }

  private convertMessages(
    messages: ChatMessage[]
  ): Anthropic.MessageParam[] {
    return messages
      .filter((m) => m.role !== 'system') // System messages handled separately
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
  }

  private convertFunctionsToTools(
    functions: ChatOptions['functions']
  ): Anthropic.Tool[] {
    if (!functions) return [];

    return functions.map((fn) => ({
      name: fn.name,
      description: fn.description,
      input_schema: fn.parameters as Anthropic.Tool.InputSchema,
    }));
  }

  private extractTextContent(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');
  }

  private mapStopReason(
    reason: string | null
  ): ChatResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'function_call';
      case 'stop_sequence':
        return 'stop';
      default:
        return null;
    }
  }
}

