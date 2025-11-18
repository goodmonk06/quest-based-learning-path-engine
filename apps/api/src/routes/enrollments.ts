import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { enrollmentService } from '../services/enrollment.service';

const completeStepSchema = z.object({
  notes: z.string().optional(),
  timeSpentMinutes: z.number().optional(),
  submittedContent: z.string().optional(),
});

const updateEnrollmentSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'abandoned']),
});

export async function enrollmentRoutes(fastify: FastifyInstance) {
  // Enroll member in quest
  fastify.post('/:memberId/enroll/:questId', async (request, reply) => {
    try {
      const { memberId, questId } = request.params as { memberId: string; questId: string };
      const enrollment = await enrollmentService.enroll(memberId, questId);
      reply.code(201).send(enrollment);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already enrolled')) {
        reply.code(409).send({ error: error.message });
      } else if (error instanceof Error && error.message.includes('not found')) {
        reply.code(404).send({ error: error.message });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get all quests for a member
  fastify.get('/:memberId/quests', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const { status } = request.query as { status?: string };

      const validStatus = status && ['not_started', 'in_progress', 'completed', 'abandoned'].includes(status)
        ? (status as 'not_started' | 'in_progress' | 'completed' | 'abandoned')
        : undefined;

      const quests = await enrollmentService.getMemberQuests(memberId, validStatus);
      reply.send(quests);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get detailed quest progress for a member
  fastify.get('/:memberId/quests/:questId', async (request, reply) => {
    try {
      const { memberId, questId } = request.params as { memberId: string; questId: string };
      const details = await enrollmentService.getMemberQuestDetails(memberId, questId);
      reply.send(details);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        reply.code(404).send({ error: error.message });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Complete a quest step
  fastify.post('/:memberId/quests/:questId/progress/:stepId/complete', async (request, reply) => {
    try {
      const { memberId, questId, stepId } = request.params as {
        memberId: string;
        questId: string;
        stepId: string;
      };

      const evidence = request.body ? completeStepSchema.parse(request.body) : undefined;

      const result = await enrollmentService.completeStep(memberId, questId, stepId, evidence);
      reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else if (error instanceof Error) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: error.message });
        } else if (error.message.includes('already completed') || error.message.includes('locked')) {
          reply.code(400).send({ error: error.message });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Update enrollment status (e.g., abandon quest)
  fastify.patch('/:memberId/quests/:questId', async (request, reply) => {
    try {
      const { memberId, questId } = request.params as { memberId: string; questId: string };
      const data = updateEnrollmentSchema.parse(request.body);
      const result = await enrollmentService.updateEnrollmentStatus(memberId, questId, data.status);
      reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });
}
