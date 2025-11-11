import { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { DefaultAgentLoop } from '../../../src/core/agent/agent-loop.js';
import {
  DefaultActionExecutor,
  DefaultThoughtProcess,
} from '../../../src/core/agent/index.js';
import { StubMemoryManager } from '../../../src/core/agent/memory-manager.js';
import {
  DefaultToolRegistry,
  registerBuiltinTools,
} from '../../../src/core/tools/index.js';
import { OpenAIProvider } from '../../../src/infra/llm/provider.js';
import { DefaultConfigLoader } from '../../../src/core/config/loader.js';
import { EnvConfigSource } from '../../../src/core/config/sources.js';
import type { AppConfig, LlmConfig } from '../../../src/core/config/index.js';
import type { Logger } from '../../../src/core/telemetry/index.js';
import { createAgentMessage, getPendingFeedbackMessages, markMessagesHandled } from './agent-messages.js';
import { broadcastAgentEvent } from './ws-hub.js';

const prisma = new PrismaClient();
const runningAgents = new Map<string, Promise<void>>();

class RunnerLogger implements Logger {
  constructor(private base: FastifyBaseLogger) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.base.debug(meta ?? {}, message);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.base.info(meta ?? {}, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.base.warn(meta ?? {}, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.base.error(meta ?? {}, message);
  }
}

async function loadConfig(): Promise<AppConfig> {
  const loader = new DefaultConfigLoader();
  loader.register(new EnvConfigSource());
  return loader.resolve();
}

async function buildExecutionComponents(config: AppConfig, logger: Logger) {
  const toolRegistry = new DefaultToolRegistry();
  registerBuiltinTools(toolRegistry);

  const provider = new OpenAIProvider(config.llm as LlmConfig);
  const memory = new StubMemoryManager();
  const thoughtProcess = new DefaultThoughtProcess(
    provider,
    config.llm,
    toolRegistry.list()
  );
  const actionExecutor = new DefaultActionExecutor(toolRegistry, logger);

  return {
    toolRegistry,
    provider,
    memory,
    thoughtProcess,
    actionExecutor,
  };
}

async function consumeUserFeedback(agentId: string): Promise<string | undefined> {
  const pending = await getPendingFeedbackMessages(agentId);
  if (pending.length === 0) {
    return undefined;
  }

  await markMessagesHandled(
    pending.map((message) => message.id),
    'agent-runner'
  );

  const collected = pending
    .map((message) => {
      const text = message.content?.text;
      return typeof text === 'string' ? text : JSON.stringify(message.content);
    })
    .filter(Boolean);

  if (collected.length === 0) {
    return undefined;
  }

  return collected.join('\n');
}

async function recordAgentStatus(agentId: string, status: string): Promise<void> {
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      status,
    },
  });
}

export async function startAgentRun(
  agentId: string,
  logger: FastifyBaseLogger
): Promise<void> {
  if (runningAgents.has(agentId)) {
    throw new Error('Agent is already running');
  }

  const runPromise = (async () => {
    const runnerLogger = new RunnerLogger(logger);
    const config = await loadConfig();

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await recordAgentStatus(agentId, 'RUNNING');

    const {
      memory,
      thoughtProcess,
      actionExecutor,
    } = await buildExecutionComponents(config, runnerLogger);

    await createAgentMessage({
      agentId,
      role: 'system',
      type: 'system',
      content: {
        text: 'Agent execution started.',
      },
    });

    const loop = new DefaultAgentLoop({
      maxCycles: config.workspace.restrictToWorkspace ? 50 : 20,
      hooks: {
        onCycleStart: async (context) => {
          await createAgentMessage({
            agentId,
            role: 'system',
            type: 'info',
            content: {
              text: `Cycle ${context.cycle + 1} started.`,
            },
          });
        },
        onActionProposed: async (proposal) => {
          await createAgentMessage({
            agentId,
            role: 'assistant',
            type: 'thought',
            content: {
              command: proposal.command,
              arguments: proposal.arguments,
              reasoning: proposal.reasoning,
              plan: proposal.plan,
            },
          });
        },
        onActionCompleted: async (result) => {
          await createAgentMessage({
            agentId,
            role: 'assistant',
            type: 'result',
            content: {
              success: result.success,
              summary: result.summary,
              output: result.output,
              error: result.error ? String(result.error) : null,
            },
          });
        },
        onTerminate: async () => {
          await createAgentMessage({
            agentId,
            role: 'system',
            type: 'system',
            content: {
              text: 'Agent execution terminated.',
            },
          });
        },
      },
      feedbackProvider: async () => consumeUserFeedback(agentId),
    });

    try {
      await loop.start({
        agentId,
        task: agent.task,
        config: config.workspace,
        memory,
        thoughtProcess,
        actionExecutor,
      });
      await createAgentMessage({
        agentId,
        role: 'assistant',
        type: 'system',
        content: {
          text: 'Agent execution completed successfully.',
        },
      });
      await recordAgentStatus(agentId, 'COMPLETED');
    } catch (error) {
      runnerLogger.error('Agent execution failed', { error });
      await createAgentMessage({
        agentId,
        role: 'system',
        type: 'system',
        content: {
          text: `Agent execution failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      });
      await recordAgentStatus(agentId, 'FAILED');
    }
  })().finally(() => {
    runningAgents.delete(agentId);
    broadcastAgentEvent({
      type: 'agent_status',
      agentId,
      event: {
        running: false,
      },
    });
  });

  runningAgents.set(agentId, runPromise);

  broadcastAgentEvent({
    type: 'agent_status',
    agentId,
    event: {
      running: true,
    },
  });
}

export function isAgentRunning(agentId: string): boolean {
  return runningAgents.has(agentId);
}

