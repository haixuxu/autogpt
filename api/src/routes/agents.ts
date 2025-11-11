import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all agents
  fastify.get('/', async (request, reply) => {
    try {
      const agents = await prisma.agent.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          task: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              cycles: true,
              memories: true,
            },
          },
        },
      });

      return { agents };
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
      });

      if (!agent) {
        reply.code(404);
        return { error: 'Agent not found' };
      }

      const cyclesCount = await prisma.agentCycle.count({
        where: { agentId: id },
      });

      const memoriesCount = await prisma.memoryRecord.count({
        where: { agentId: id },
      });

      return {
        agent: {
          ...agent,
          profile: JSON.parse(agent.profile),
          directives: JSON.parse(agent.directives),
          config: JSON.parse(agent.config),
          cyclesCount,
          memoriesCount,
        },
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch agent' };
    }
  });
};
