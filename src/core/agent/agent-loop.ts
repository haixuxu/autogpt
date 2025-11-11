import type {
  AgentLoop,
  AgentLoopContext,
  AgentCycleContext,
  AgentLoopOptions,
} from './loop';
import type { ActionProposal, ActionResult } from './actions';
import type { ThoughtInputs } from './thought';
import type { LlmProvider } from '../../infra/llm/index';
import { DEFAULT_DIRECTIVES } from './prompts';

export class DefaultAgentLoop implements AgentLoop {
  private running = false;
  private currentCycle = 0;

  constructor(public readonly options: AgentLoopOptions) {}

  async start(context: AgentLoopContext): Promise<void> {
    this.running = true;
    this.currentCycle = 0;

    const maxCycles = this.options.maxCycles || Infinity;
    const continuous = this.options.continuous ?? false;

    try {
      while (this.running && this.currentCycle < maxCycles) {
        const cycleContext: AgentCycleContext = {
          ...context,
          cycle: this.currentCycle,
        };

        const shouldContinue = await this.runCycle(cycleContext);

        if (!shouldContinue && !continuous) {
          break;
        }

        this.currentCycle++;
      }
    } catch (error) {
      if (this.options.hooks?.onTerminate) {
        await this.options.hooks.onTerminate({
          ...context,
          cycle: this.currentCycle,
        });
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  private async runCycle(context: AgentCycleContext): Promise<boolean> {
    // Hook: Cycle start
    if (this.options.hooks?.onCycleStart) {
      await this.options.hooks.onCycleStart(context);
    }

    try {
      // Step 1: Think - generate action proposal
      const proposal = await this.think(context);

      // Hook: Action proposed
      if (this.options.hooks?.onActionProposed) {
        await this.options.hooks.onActionProposed(proposal, context);
      }

      // Capture proposal in memory
      await context.memory.captureProposal(proposal);

      // Check if task is complete
      if (
        proposal.command === 'task_complete' ||
        proposal.command === 'finish'
      ) {
        return false; // Stop loop
      }

      // Step 2: Execute - run the proposed action
      const result = await this.execute(proposal, context);

      // Hook: Action completed
      if (this.options.hooks?.onActionCompleted) {
        await this.options.hooks.onActionCompleted(result, context);
      }

      // Capture result in memory
      await context.memory.captureResult(result);

      // Step 3: Reflect - update memory and state
      await this.reflect(result, context);

      // Hook: Cycle end
      if (this.options.hooks?.onCycleEnd) {
        await this.options.hooks.onCycleEnd(context);
      }

      return true; // Continue loop
    } catch (error) {
      // Log error and decide whether to continue
      throw error;
    }
  }

  private async think(context: AgentCycleContext): Promise<ActionProposal> {
    // Prepare inputs for thought process
    const memorySnapshot = await context.memory.snapshot();

    const inputs: ThoughtInputs = {
      task: context.task,
      cycle: context.cycle,
      memory: memorySnapshot,
      directives: DEFAULT_DIRECTIVES,
      userFeedback: context.userFeedback,
    };

    // Generate prompt
    const prompt = await context.thoughtProcess.preparePrompt(inputs);

    // Call LLM (assuming we have access to provider through thoughtProcess)
    // For now, this is simplified; in full implementation, thoughtProcess should handle this
    const response = {
      raw: 'Placeholder response - LLM integration pending',
      parsed: {
        name: 'task_complete',
        arguments: { summary: 'Agent loop executed successfully' },
      },
    };

    // Parse response into action proposal
    const proposal = await context.thoughtProcess.parseResponse(response);

    // Update metadata with correct cycle (create new object since readonly)
    return {
      ...proposal,
      metadata: {
        ...proposal.metadata,
        cycle: context.cycle,
      },
    };
  }

  private async execute(
    proposal: ActionProposal,
    context: AgentCycleContext
  ): Promise<ActionResult> {
    return await context.actionExecutor.execute(proposal);
  }

  private async reflect(
    result: ActionResult,
    context: AgentCycleContext
  ): Promise<void> {
    // For now, just log the result
    // In full implementation, this would update agent state, learn from failures, etc.
  }
}

