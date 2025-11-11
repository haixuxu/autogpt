import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { agentRoutes } from './routes/agents.js';
import { taskRoutes } from './routes/tasks.js';

const fastify = Fastify({
  logger: true,
});

// CORS
await fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});

// WebSocket
await fastify.register(websocket);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
fastify.register(agentRoutes, { prefix: '/api/agents' });
fastify.register(taskRoutes, { prefix: '/api/tasks' });

// WebSocket endpoint
fastify.register(async (instance) => {
  instance.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe') {
        connection.socket.send(JSON.stringify({
          type: 'subscribed',
          taskId: data.taskId,
        }));
      }
    });

    connection.socket.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
    }));
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



