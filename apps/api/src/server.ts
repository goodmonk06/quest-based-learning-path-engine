import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import { prisma } from './prisma-client';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';
import { AppError, formatErrorResponse } from './lib/errors';
import { ZodError } from 'zod';
import { registerEventHandlers } from './lib/events/handlers';

// Route imports
import { questLineRoutes } from './routes/quest-lines';
import { questRoutes } from './routes/quests';
import { enrollmentRoutes } from './routes/enrollments';
import { recommendationRoutes } from './routes/recommendations';

const server = Fastify({
  logger: false, // We'll use our own logger
  disableRequestLogging: true,
});

// Request timing and logging middleware
server.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
  logger.info(`${request.method} ${request.url}`, {
    method: request.method,
    url: request.url,
    ip: request.ip,
  });
});

server.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request.startTime || Date.now());
  metrics.recordRequestDuration(
    request.url,
    request.method,
    duration,
    reply.statusCode
  );

  logger.info(`${request.method} ${request.url} - ${reply.statusCode}`, {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    durationMs: duration,
  });
});

// Centralized error handler
server.setErrorHandler((error, request, reply) => {
  logger.error('Request error', error, {
    method: request.method,
    url: request.url,
  });

  metrics.incrementCounter('http_errors_total', {
    method: request.method,
    path: request.url,
    status: error instanceof AppError ? error.statusCode : 500,
  });

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  const errorResponse = formatErrorResponse(error, request.url);
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  return reply.status(statusCode).send(errorResponse);
});

// Register plugins
server.register(cors, {
  origin: true,
});

server.register(helmet, {
  contentSecurityPolicy: false,
});

// Health check with database connectivity
server.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };
  } catch (error) {
    logger.error('Health check failed', error as Error);
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    };
  }
});

// Readiness check
server.get('/ready', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ready: true };
  } catch (error) {
    throw new AppError('Service not ready', 503);
  }
});

// Metrics endpoint
server.get('/metrics', async () => {
  return metrics.getMetrics();
});

// Register routes
server.register(questLineRoutes, { prefix: '/api/quest-lines' });
server.register(questRoutes, { prefix: '/api/quests' });
server.register(enrollmentRoutes, { prefix: '/api/members' });
server.register(recommendationRoutes, { prefix: '/api/members' });

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  logger.info(`Received ${signal}, closing server gracefully...`);
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    // Register event handlers
    registerEventHandlers();
    logger.info('Event handlers registered');

    await server.listen({
      host: config.api.host,
      port: config.api.port,
    });
    logger.info(`Server listening on ${config.api.host}:${config.api.port}`, {
      host: config.api.host,
      port: config.api.port,
      env: config.api.env,
    });
  } catch (err) {
    logger.error('Failed to start server', err as Error);
    process.exit(1);
  }
};

start();
