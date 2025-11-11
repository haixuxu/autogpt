import type { ActionProposal } from './actions';
import type { MemorySnapshot } from './memory';

export interface ThoughtInputs {
  readonly task: string;
  readonly cycle: number;
  readonly memory: MemorySnapshot;
  readonly directives: DirectiveBundle;
  readonly userFeedback?: string;
}

export interface DirectiveBundle {
  readonly constraints: string[];
  readonly resources: string[];
  readonly bestPractices: string[];
}

export interface ThoughtProcess {
  preparePrompt(inputs: ThoughtInputs): Promise<PromptPayload>;
  callModel(prompt: PromptPayload): Promise<ThoughtResponsePayload>;
  parseResponse(response: ThoughtResponsePayload): Promise<ActionProposal>;
}

export interface PromptPayload {
  readonly messages: PromptMessage[];
  readonly functions?: PromptFunction[];
  readonly temperature: number;
  readonly model: string;
}

export interface PromptMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface PromptFunction {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
}

export interface ThoughtResponsePayload {
  readonly raw: string;
  readonly parsed?: unknown;
}

export { DefaultThoughtProcess } from './thought-process';
