import { FastifyPluginAsync } from 'fastify';
import {
  createAgentMessage,
  listAgentMessages,
  AgentMessageType,
} from '../services/agent-messages.js';

export const agentMessageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { cursor } = request.query as { cursor?: string };

    try {
      const messages = await listAgentMessages(id, { cursor });
      return { messages };
    } catch (error) {
      fastify.log.error('Failed to list agent messages', { error, agentId: id });
      reply.code(500);
      return { error: 'Failed to fetch agent messages' };
    }
  });

  fastify.post('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { type, content } = request.body as {
      type: AgentMessageType | undefined;
      content?: unknown;
    };

    if (!type || (type !== 'feedback' && type !== 'system' && type !== 'info')) {
      reply.code(400);
      return { error: 'Invalid message type' };
    }

    let normalizedContent: Record<string, unknown>;
    if (!content || typeof content !== 'object') {
      normalizedContent = { text: String(content ?? '') };
    } else {
      normalizedContent = content as Record<string, unknown>;
    }

    try {
      const message = await createAgentMessage({
        agentId: id,
        role: type === 'feedback' ? 'user' : 'system',
        type,
        content: normalizedContent,
      });
      reply.code(201);
      return { message };
    } catch (error) {
      fastify.log.error('Failed to create agent message', { error, agentId: id });
      reply.code(500);
      return { error: 'Failed to send message' };
    }
  });
};

