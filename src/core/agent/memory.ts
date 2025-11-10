import type { ActionProposal, ActionResult } from './actions';

export interface MemoryRecord {
  readonly id: string;
  readonly type: 'observation' | 'reflection' | 'plan' | 'result';
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: number;
}

export interface MemorySnapshot {
  readonly shortTerm: MemoryRecord[];
  readonly longTerm: MemoryRecord[];
}

export interface MemoryManager {
  captureProposal(proposal: ActionProposal): Promise<void>;
  captureResult(result: ActionResult): Promise<void>;
  recall(query: string, limit?: number): Promise<MemoryRecord[]>;
  snapshot(): Promise<MemorySnapshot>;
  vectorSearch(query: string, options?: VectorSearchOptions): Promise<MemoryRecord[]>;
}

export interface VectorSearchOptions {
  readonly limit?: number;
  readonly namespace?: string;
}
