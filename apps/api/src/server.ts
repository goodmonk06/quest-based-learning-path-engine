import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import { prisma } from './prisma-client';

// Route imports
import { questLineRoutes } from './routes/quest-lines';
import { questRoutes } from './routes/quests';
import { enrollmentRoutes } from './routes/enrollments';
import { recommendationRoutes } from './routes/recommendations';

const server = Fastify({
  logger: {
    level: config.api.env === 'development' ? 'info' : 'warn',
  },
});

// Register plugins
server.register(cors, {
  origin: true,
});

server.register(helmet, {
  contentSecurityPolicy: false,
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
server.register(questLineRoutes, { prefix: '/api/quest-lines' });
server.register(questRoutes, { prefix: '/api/quests' });
server.register(enrollmentRoutes, { prefix: '/api/members' });
server.register(recommendationRoutes, { prefix: '/api/members' });

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  server.log.info(`Received ${signal}, closing server gracefully...`);
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    await server.listen({
      host: config.api.host,
      port: config.api.port,
    });
    server.log.info(`Server listening on ${config.api.host}:${config.api.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
