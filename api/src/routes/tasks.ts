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
      });

      if (!task) {
        reply.code(404);
        return { error: 'Task not found' };
      }

      return { task };
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
