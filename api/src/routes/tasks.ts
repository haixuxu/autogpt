import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TaskQuerystring {
  page?: string;
  pageSize?: string;
}

// Transform Agent to Agent Protocol Task format
function transformToTaskFormat(agent: any) {
  return {
    task_id: agent.id,
    input: agent.task,
    status: mapAgentStatusToTaskStatus(agent.status),
    created_at: agent.createdAt.toISOString(),
    modified_at: agent.updatedAt.toISOString(),
    artifacts: agent.steps?.flatMap((step: any) =>
      (step.artifacts || []).map((artifact: any) => ({
        artifact_id: artifact.id,
        file_name: artifact.fileName,
        relative_path: artifact.relativePath,
      }))
    ) || [],
  };
}

// Map internal agent status to Agent Protocol task status
function mapAgentStatusToTaskStatus(agentStatus: string): string {
  switch (agentStatus.toUpperCase()) {
    case 'ACTIVE':
    case 'RUNNING':
      return 'running';
    case 'COMPLETED':
    case 'SUCCESS':
      return 'completed';
    case 'FAILED':
    case 'ERROR':
      return 'failed';
    case 'PAUSED':
      return 'paused';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'created';
  }
}

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all tasks (agents) with pagination
  fastify.get<{
    Querystring: TaskQuerystring;
  }>('/', async (request, reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const pageSize = parseInt(request.query.pageSize || '20', 10);

    try {
      const [tasks, total] = await Promise.all([
        prisma.agent.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            steps: {
              include: {
                artifacts: true,
              },
            },
          },
        }),
        prisma.agent.count(),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        tasks: tasks.map(transformToTaskFormat),
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
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

  // Cancel task
  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
      });

      if (!agent) {
        reply.code(404);
        return { error: 'Task not found' };
      }

      // Update status to CANCELLED
      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Mark all running steps as failed
      await prisma.step.updateMany({
        where: {
          agentId: id,
          status: 'running',
        },
        data: {
          status: 'failed',
          completedAt: new Date(),
          output: JSON.stringify({ error: 'Task was cancelled' }),
        },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub) {
        wsHub.broadcast({
          type: 'task.cancelled',
          task_id: id,
          data: { status: 'cancelled' },
          timestamp: new Date().toISOString(),
        });
      }

      fastify.log.info(`Task cancelled: ${id}`);
      return { task_id: id, status: 'cancelled' };
    } catch (error: any) {
      fastify.log.error('Failed to cancel task:', error);
      reply.code(500);
      return { error: 'Failed to cancel task', details: error.message };
    }
  });

  // Pause task
  fastify.post('/:id/pause', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
      });

      if (!agent) {
        reply.code(404);
        return { error: 'Task not found' };
      }

      if (agent.status !== 'ACTIVE' && agent.status !== 'RUNNING') {
        reply.code(400);
        return { error: 'Task is not running and cannot be paused' };
      }

      // Update status to PAUSED
      await prisma.agent.update({
        where: { id },
        data: { status: 'PAUSED' },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub) {
        wsHub.broadcast({
          type: 'task.paused',
          task_id: id,
          data: { status: 'paused' },
          timestamp: new Date().toISOString(),
        });
      }

      fastify.log.info(`Task paused: ${id}`);
      return { task_id: id, status: 'paused' };
    } catch (error: any) {
      fastify.log.error('Failed to pause task:', error);
      reply.code(500);
      return { error: 'Failed to pause task', details: error.message };
    }
  });

  // Resume task
  fastify.post('/:id/resume', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
      });

      if (!agent) {
        reply.code(404);
        return { error: 'Task not found' };
      }

      if (agent.status !== 'PAUSED') {
        reply.code(400);
        return { error: 'Task is not paused and cannot be resumed' };
      }

      // Update status to ACTIVE
      await prisma.agent.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub) {
        wsHub.broadcast({
          type: 'task.resumed',
          task_id: id,
          data: { status: 'running' },
          timestamp: new Date().toISOString(),
        });
      }

      fastify.log.info(`Task resumed: ${id}`);
      return { task_id: id, status: 'running' };
    } catch (error: any) {
      fastify.log.error('Failed to resume task:', error);
      reply.code(500);
      return { error: 'Failed to resume task', details: error.message };
    }
  });
};
