import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { questService } from '../services/quest.service';

const createQuestSchema = z.object({
  questLineId: z.string(),
  key: z.string(),
  title: z.string(),
  summaryMarkdown: z.string(),
  difficulty: z.number().min(1).max(5),
  estimatedMinutes: z.number().positive(),
  requiredTags: z.object({
    required: z.array(z.string()).optional(),
    preferred: z.array(z.string()).optional(),
  }),
  reward: z.object({
    currencyCode: z.string(),
    amount: z.number(),
    bonusMultiplier: z.number().optional(),
  }),
});

const updateQuestSchema = createQuestSchema.partial().omit({ questLineId: true, key: true });

const createStepSchema = z.object({
  orderIndex: z.number().nonnegative(),
  stepType: z.enum(['read', 'video', 'exercise', 'reflection', 'ritual']),
  title: z.string(),
  contentMarkdown: z.string(),
  meta: z.record(z.unknown()).optional(),
});

export async function questRoutes(fastify: FastifyInstance) {
  // Create quest
  fastify.post('/', async (request, reply) => {
    try {
      const data = createQuestSchema.parse(request.body);
      const quest = await questService.createQuest(data);
      reply.code(201).send(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get all quests
  fastify.get('/', async (request, reply) => {
    try {
      const { questLineId } = request.query as { questLineId?: string };
      const quests = await questService.findAll(questLineId);
      reply.send(quests);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get quest by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const quest = await questService.findById(id);

      if (!quest) {
        reply.code(404).send({ error: 'Quest not found' });
        return;
      }

      reply.send(quest);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get quest by key
  fastify.get('/key/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string };
      const quest = await questService.findByKey(key);

      if (!quest) {
        reply.code(404).send({ error: 'Quest not found' });
        return;
      }

      reply.send(quest);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update quest
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateQuestSchema.parse(request.body);
      const quest = await questService.updateQuest(id, data);
      reply.send(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Delete quest
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await questService.deleteQuest(id);
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Quest Steps endpoints

  // Add step to quest
  fastify.post('/:questId/steps', async (request, reply) => {
    try {
      const { questId } = request.params as { questId: string };
      const data = createStepSchema.parse(request.body);
      const step = await questService.createStep({ ...data, questId });
      reply.code(201).send(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Update step
  fastify.patch('/steps/:stepId', async (request, reply) => {
    try {
      const { stepId } = request.params as { stepId: string };
      const data = createStepSchema.partial().parse(request.body);
      const step = await questService.updateStep(stepId, data);
      reply.send(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Delete step
  fastify.delete('/steps/:stepId', async (request, reply) => {
    try {
      const { stepId } = request.params as { stepId: string };
      await questService.deleteStep(stepId);
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
