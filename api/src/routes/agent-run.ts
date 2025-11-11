import { FastifyPluginAsync } from 'fastify';
import { isAgentRunning, startAgentRun } from '../services/agent-runner.js';

export const agentRunRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (isAgentRunning(id)) {
      reply.code(409);
      return { error: 'Agent is already running' };
    }

    try {
      await startAgentRun(id, fastify.log);
      reply.code(202);
      return { status: 'started' };
    } catch (error: any) {
      fastify.log.error('Failed to start agent run', { error, agentId: id });
      reply.code(500);
      return { error: 'Failed to start agent run', details: error?.message };
    }
  });
};

