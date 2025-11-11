export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  functions?: ChatFunction[];
  functionCall?: 'auto' | 'none' | { name: string };
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  role: 'assistant';
  functionCall?: {
    name: string;
    arguments: string;
  };
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamChunk {
  delta: {
    role?: 'assistant';
    content?: string;
    functionCall?: {
      name?: string;
      arguments?: string;
    };
  };
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

