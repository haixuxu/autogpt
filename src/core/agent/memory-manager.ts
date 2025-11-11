import type {
  MemoryManager,
  MemoryRecord,
  MemorySnapshot,
  VectorSearchOptions,
} from './memory';
import type { ActionProposal, ActionResult } from './actions';

/**
 * Stub implementation of MemoryManager for Phase 2
 * Full implementation with vector search in Phase 3
 */
export class StubMemoryManager implements MemoryManager {
  private records: MemoryRecord[] = [];

  async captureProposal(proposal: ActionProposal): Promise<void> {
    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random()}`,
      type: 'plan',
      content: `Planned: ${proposal.command} - ${proposal.reasoning.join('; ')}`,
      timestamp: proposal.metadata.createdAt,
      metadata: {
        command: proposal.command,
        cycle: proposal.metadata.cycle,
      },
    };
    this.records.push(record);
  }

  async captureResult(result: ActionResult): Promise<void> {
    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random()}`,
      type: 'result',
      content: `Result: ${result.summary}`,
      timestamp: result.metadata.createdAt,
      metadata: {
        success: result.success,
        cycle: result.metadata.cycle,
      },
    };
    this.records.push(record);
  }

  async recall(query: string, limit: number = 10): Promise<MemoryRecord[]> {
    // Simple keyword matching for now
    const keywords = query.toLowerCase().split(' ');
    const matches = this.records.filter((r) => {
      const content = r.content.toLowerCase();
      return keywords.some((kw) => content.includes(kw));
    });
    return matches.slice(-limit);
  }

  async snapshot(): Promise<MemorySnapshot> {
    return {
      shortTerm: this.records.slice(-10),
      longTerm: [],
    };
  }

  async vectorSearch(
    query: string,
    options?: VectorSearchOptions
  ): Promise<MemoryRecord[]> {
    // Stub: just return recent records
    return this.records.slice(-(options?.limit || 5));
  }
}

