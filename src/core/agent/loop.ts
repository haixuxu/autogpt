import type { ActionExecutor, ActionProposal, ActionResult } from './actions';
import type { MemoryManager } from './memory';
import type { ThoughtProcess } from './thought';

export interface AgentLoopContext {
  readonly agentId: string;
  readonly task: string;
  readonly config: Record<string, unknown>;
  readonly memory: MemoryManager;
  readonly thoughtProcess: ThoughtProcess;
  readonly actionExecutor: ActionExecutor;
}

export interface AgentCycleContext extends AgentLoopContext {
  readonly cycle: number;
  readonly userFeedback?: string;
}

export interface AgentLifecycleHooks {
  readonly onCycleStart?: (context: AgentCycleContext) => Promise<void> | void;
  readonly onActionProposed?: (
    proposal: ActionProposal,
    context: AgentCycleContext,
  ) => Promise<void> | void;
  readonly onActionCompleted?: (
    result: ActionResult,
    context: AgentCycleContext,
  ) => Promise<void> | void;
  readonly onCycleEnd?: (context: AgentCycleContext) => Promise<void> | void;
  readonly onTerminate?: (context: AgentCycleContext) => Promise<void> | void;
}

export interface AgentLoopOptions {
  readonly maxCycles?: number;
  readonly continuous?: boolean;
  readonly hooks?: AgentLifecycleHooks;
  readonly feedbackProvider?: (
    context: AgentCycleContext
  ) => Promise<string | undefined | null>;
}

export interface AgentLoop {
  readonly options: AgentLoopOptions;
  start(context: AgentLoopContext): Promise<void>;
  stop(): Promise<void>;
}
