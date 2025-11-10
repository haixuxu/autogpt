export interface ActionMetadata {
  readonly createdAt: number;
  readonly cycle: number;
  readonly source: 'agent' | 'human';
}

export interface ActionProposal {
  readonly command: string;
  readonly arguments: Record<string, unknown>;
  readonly reasoning: string[];
  readonly plan?: string[];
  readonly metadata: ActionMetadata;
}

export interface ActionResult {
  readonly success: boolean;
  readonly output: unknown;
  readonly summary: string;
  readonly metadata: ActionMetadata;
  readonly error?: Error;
}

export interface ActionExecutor {
  execute(proposal: ActionProposal): Promise<ActionResult>;
  reverse?(result: ActionResult): Promise<void>;
}
