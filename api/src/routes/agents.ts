import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
  const safeParse = <T>(value: string | null): T | null => {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      fastify.log.error({ error, value }, 'Failed to parse JSON payload');
      return null;
    }
  };

  // Get all agents
  fastify.get('/', async (request, reply) => {
    try {
      const agents = await prisma.agent.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              cycles: true,
              memories: true,
            },
          },
        },
      });

      return {
        agents: agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          task: agent.task,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          profile: safeParse<Record<string, unknown>>(agent.profile),
          directives: safeParse<Record<string, unknown>>(agent.directives),
          config: safeParse<Record<string, unknown>>(agent.config),
          cyclesCount: agent._count.cycles,
          memoriesCount: agent._count.memories,
        })),
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch agents' };
    }
  });

  // Get agent by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          cycles: {
            orderBy: { cycleIndex: 'asc' },
            include: {
              proposal: true,
              result: true,
            },
          },
          memories: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          workspaces: {
            include: {
              files: {
                orderBy: { createdAt: 'desc' },
                take: 20,
              },
            },
          },
        },
      });

      if (!agent) {
        reply.code(404);
        return { error: 'Agent not found' };
      }

      return {
        agent: {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          task: agent.task,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          profile: safeParse<Record<string, unknown>>(agent.profile),
          directives: safeParse<Record<string, unknown>>(agent.directives),
          config: safeParse<Record<string, unknown>>(agent.config),
          cycles: agent.cycles.map((cycle) => ({
            id: cycle.id,
            cycleIndex: cycle.cycleIndex,
            userFeedback: cycle.userFeedback,
            startedAt: cycle.startedAt,
            completedAt: cycle.completedAt,
            proposal: cycle.proposal
              ? {
                  id: cycle.proposal.id,
                  command: cycle.proposal.command,
                  arguments:
                    safeParse<Record<string, unknown>>(
                      cycle.proposal.arguments
                    ) ?? {},
                  reasoning: (() => {
                    const raw = safeParse<string[] | string>(
                      cycle.proposal!.reasoning
                    );
                    if (!raw) {
                      return [];
                    }
                    return Array.isArray(raw) ? raw : [String(raw)];
                  })(),
                  plan: (() => {
                    if (!cycle.proposal?.plan) {
                      return null;
                    }
                    const parsed = safeParse<
                      string[] | Record<string, unknown>
                    >(cycle.proposal.plan);
                    return parsed ?? null;
                  })(),
                  createdAt: cycle.proposal.createdAt,
                }
              : null,
            result: cycle.result
              ? {
                  id: cycle.result.id,
                  success: cycle.result.success,
                  output:
                    safeParse<Record<string, unknown>>(cycle.result.output) ??
                    null,
                  summary: cycle.result.summary,
                  error: (() => {
                    const raw = safeParse<Record<string, unknown> | string>(
                      cycle.result!.error ?? null
                    );
                    if (!raw) {
                      return null;
                    }
                    return typeof raw === 'string' ? { message: raw } : raw;
                  })(),
                  createdAt: cycle.result.createdAt,
                }
              : null,
          })),
          memories: agent.memories.map((memory) => ({
            id: memory.id,
            type: memory.type,
            content: memory.content,
            metadata:
              safeParse<Record<string, unknown>>(memory.metadata ?? null) ??
              null,
            createdAt: memory.createdAt,
            cycleId: memory.cycleId,
          })),
          workspaces: agent.workspaces.map((workspace) => ({
            id: workspace.id,
            rootPath: workspace.rootPath,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            files: workspace.files.map((file) => ({
              id: file.id,
              path: file.path,
              kind: file.kind,
              hash: file.hash,
              sizeBytes: file.sizeBytes,
              metadata:
                safeParse<Record<string, unknown>>(file.metadata ?? null) ??
                null,
              createdAt: file.createdAt,
              updatedAt: file.updatedAt,
            })),
          })),
        },
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch agent' };
    }
  });
};
