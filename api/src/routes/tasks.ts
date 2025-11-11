import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all tasks (agents)
  fastify.get('/', async (request, reply) => {
    try {
      const tasks = await prisma.agent.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          task: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { cycles: true },
          },
        },
      });

      return { tasks };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch tasks' };
    }
  });

  // Create new task
  fastify.post('/', async (request, reply) => {
    const { task, workspace } = request.body as {
      task: string;
      workspace?: string;
    };

    if (!task) {
      reply.code(400);
      return { error: 'Task description is required' };
    }

    try {
      const agent = await prisma.agent.create({
        data: {
          name: `Task: ${task.substring(0, 50)}`,
          task,
          status: 'ACTIVE',
          profile: JSON.stringify({ description: 'Web-created agent' }),
          directives: JSON.stringify({
            constraints: [],
            resources: [],
          }),
          config: JSON.stringify({ workspace: workspace || './workspace' }),
        },
      });

      return { agent };
    } catch (error: any) {
      fastify.log.error('Failed to create task:', error);
      reply.code(500);
      return { error: 'Failed to create task', details: error.message };
    }
  });

  // Get task by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const task = await prisma.agent.findUnique({
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

      if (!task) {
        reply.code(404);
        return { error: 'Task not found' };
      }

      const serializeJson = <T>(value: string | null): T | null => {
        if (!value) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch (error) {
          fastify.log.error(
            { error, id, value },
            'Failed to parse JSON field for task'
          );
          return null;
        }
      };

      const formattedTask = {
        id: task.id,
        name: task.name,
        status: task.status,
        task: task.task,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        profile: serializeJson<Record<string, unknown>>(task.profile),
        directives: serializeJson<Record<string, unknown>>(task.directives),
        config: serializeJson<Record<string, unknown>>(task.config),
        cycles: task.cycles.map((cycle) => ({
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
                  serializeJson<Record<string, unknown>>(
                    cycle.proposal.arguments
                  ) ?? {},
                reasoning: (() => {
                  const raw = serializeJson<string[] | string>(
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
                  const parsed = serializeJson<
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
                  serializeJson<Record<string, unknown>>(
                    cycle.result.output
                  ) ?? null,
                summary: cycle.result.summary,
                error: (() => {
                  const raw = serializeJson<Record<string, unknown> | string>(
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
        memories: task.memories.map((memory) => ({
          id: memory.id,
          type: memory.type,
          content: memory.content,
          metadata: serializeJson<Record<string, unknown>>(
            memory.metadata ?? null
          ),
          createdAt: memory.createdAt,
          cycleId: memory.cycleId,
        })),
        workspaces: task.workspaces.map((workspace) => ({
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
            metadata: serializeJson<Record<string, unknown>>(
              file.metadata ?? null
            ),
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
          })),
        })),
      };

      return { task: formattedTask };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch task' };
    }
  });

  // Delete task by ID
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.agent.delete({
        where: { id },
      });

      reply.code(204);
      return;
    } catch (error: any) {
      fastify.log.error('Failed to delete task:', error);
      reply.code(500);
      return { error: 'Failed to delete task', details: error.message };
    }
  });
};
