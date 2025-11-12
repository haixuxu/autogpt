import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import type WebSocket from 'ws';
import { agentRoutes } from './routes/agents.js';
import { taskRoutes } from './routes/tasks.js';
import { agentMessageRoutes } from './routes/agent-messages.js';
import { agentRunRoutes } from './routes/agent-run.js';
import stepsRoutes from './routes/steps.js';
import artifactsRoutes from './routes/artifacts.js';
import { subscribeAgent, unsubscribeSocket, wsHub } from './services/ws-hub.js';

const fastify = Fastify({
  logger: true,
});

// Attach wsHub to fastify instance for access in routes
(fastify as any).wsHub = wsHub;

// CORS
await fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});

// WebSocket
await fastify.register(websocket);

// Multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
fastify.register(agentRoutes, { prefix: '/api/agents' });
fastify.register(agentMessageRoutes, { prefix: '/api/agents' });
fastify.register(agentRunRoutes, { prefix: '/api/agents' });
fastify.register(taskRoutes, { prefix: '/api/tasks' });
fastify.register(stepsRoutes, { prefix: '/api/tasks' });
fastify.register(artifactsRoutes, { prefix: '/api/tasks' });

// WebSocket endpoint
fastify.register(async (instance) => {
  instance.get('/ws', { websocket: true }, (connection) => {
    const { socket } = connection;
    const ws = socket as unknown as WebSocket;

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data?.type === 'subscribe' && data.agentId) {
          subscribeAgent(ws, data.agentId);
          ws.send(
            JSON.stringify({
              type: 'subscribed',
              agentId: data.agentId,
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message payload',
          })
        );
      }
    });

    ws.on('close', () => {
      unsubscribeSocket(ws);
    });

    ws.send(
      JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
      })
    );
  });
});

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



