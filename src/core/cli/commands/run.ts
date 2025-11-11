import type { AppConfig } from '../../config/index';
import type { Logger } from '../../telemetry/index';
import { CliUI } from '../ui';
import {
  DefaultAgentLoop,
  StubMemoryManager,
  DefaultActionExecutor,
  DefaultThoughtProcess,
} from '../../agent/index';
import {
  DefaultToolRegistry,
  registerBuiltinTools,
} from '../../tools/index';
import { OpenAIProvider } from '../../../infra/llm/index';

export interface RunCommandOptions {
  workspace?: string;
  continuous?: boolean;
  maxCycles?: number;
  config?: AppConfig;
  logger?: Logger;
}

export async function runCommand(
  task: string,
  options: RunCommandOptions
): Promise<void> {
  const ui = new CliUI();
  const logger = options.logger!;
  const config = options.config!;

  ui.section('AutoGPT - Starting Agent');
  ui.info(`Task: ${task}`);
  ui.info(`Workspace: ${options.workspace || 'current directory'}`);
  ui.info(`Continuous: ${options.continuous ? 'Yes' : 'No'}`);
  ui.info(`Max Cycles: ${options.maxCycles || 50}`);

  try {
    // Initialize components
    ui.startSpinner('Initializing agent components...');

    const toolRegistry = new DefaultToolRegistry();
    registerBuiltinTools(toolRegistry);

    const provider = new OpenAIProvider(config.llm);
    const memory = new StubMemoryManager();
    const thoughtProcess = new DefaultThoughtProcess(
      provider,
      config.llm,
      toolRegistry.list()
    );
    const actionExecutor = new DefaultActionExecutor(toolRegistry, logger);

    ui.succeedSpinner('Components initialized');

    // Create agent loop
    const agentLoop = new DefaultAgentLoop({
      maxCycles: options.maxCycles || 50,
      continuous: options.continuous,
      hooks: {
        onCycleStart: async (ctx) => {
          ui.section(`Cycle ${ctx.cycle + 1}`);
        },
        onActionProposed: async (proposal) => {
          ui.logAction(proposal.command, proposal.arguments);
          console.log('Reasoning:', proposal.reasoning.join('\n'));
        },
        onActionCompleted: async (result) => {
          ui.logResult(result.success, result.summary);
        },
      },
    });

    // Start agent
    await agentLoop.start({
      agentId: `agent_${Date.now()}`,
      task,
      config: {},
      memory,
      thoughtProcess,
      actionExecutor,
    });

    ui.success('Agent execution completed');
  } catch (error) {
    ui.error(`Agent execution failed: ${error}`);
    logger.error('Agent execution failed', { error });
    throw error;
  }
}

