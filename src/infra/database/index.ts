export interface DatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  transaction<T>(handler: () => Promise<T>): Promise<T>;
}

export interface MigrationRunner {
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface AgentRepository {
  save(agent: PersistedAgent): Promise<void>;
  findById(id: string): Promise<PersistedAgent | null>;
  list(): Promise<PersistedAgent[]>;
}

export interface CycleRepository {
  append(cycle: PersistedAgentCycle): Promise<void>;
  findByAgent(agentId: string, limit?: number): Promise<PersistedAgentCycle[]>;
}

export interface MemoryRepository {
  create(record: PersistedMemoryRecord): Promise<void>;
  search(params: MemorySearchParams): Promise<PersistedMemoryRecord[]>;
}

export interface PersistedAgent {
  readonly id: string;
  readonly name: string;
  readonly task: string;
  readonly status: 'ACTIVE' | 'PAUSED' | 'TERMINATED';
  readonly profile: Record<string, unknown>;
  readonly directives: Record<string, unknown>;
  readonly config: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PersistedAgentCycle {
  readonly id: string;
  readonly agentId: string;
  readonly cycleIndex: number;
  readonly userFeedback?: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly proposal?: SerializedActionProposal;
  readonly result?: SerializedActionResult;
}

export interface SerializedActionProposal {
  readonly command: string;
  readonly arguments: Record<string, unknown>;
  readonly reasoning: string[];
  readonly plan?: string[];
  readonly createdAt: Date;
}

export interface SerializedActionResult {
  readonly success: boolean;
  readonly output: Record<string, unknown>;
  readonly summary: string;
  readonly error?: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface PersistedMemoryRecord {
  readonly id: string;
  readonly agentId: string;
  readonly cycleId?: string;
  readonly type: 'OBSERVATION' | 'REFLECTION' | 'PLAN' | 'RESULT';
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
  readonly embedding?: number[];
  readonly createdAt: Date;
}

export interface MemorySearchParams {
  readonly agentId: string;
  readonly query: string;
  readonly limit?: number;
  readonly namespace?: string;
}
