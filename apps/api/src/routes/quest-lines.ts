import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { questLineService } from '../services/quest-line.service';

const createQuestLineSchema = z.object({
  communityId: z.string(),
  key: z.string(),
  title: z.string(),
  descriptionMarkdown: z.string(),
  themeTags: z.object({
    tags: z.array(z.string()),
    categories: z.array(z.string()).optional(),
  }),
});

const updateQuestLineSchema = z.object({
  title: z.string().optional(),
  descriptionMarkdown: z.string().optional(),
  themeTags: z
    .object({
      tags: z.array(z.string()),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function questLineRoutes(fastify: FastifyInstance) {
  // Create quest line
  fastify.post('/', async (request, reply) => {
    try {
      const data = createQuestLineSchema.parse(request.body);
      const questLine = await questLineService.create(data);
      reply.code(201).send(questLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get all quest lines
  fastify.get('/', async (request, reply) => {
    try {
      const { communityId } = request.query as { communityId?: string };
      const questLines = await questLineService.findAll(communityId);
      reply.send(questLines);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get quest line by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const questLine = await questLineService.findById(id);

      if (!questLine) {
        reply.code(404).send({ error: 'Quest line not found' });
        return;
      }

      reply.send(questLine);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get quest line by key
  fastify.get('/key/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string };
      const questLine = await questLineService.findByKey(key);

      if (!questLine) {
        reply.code(404).send({ error: 'Quest line not found' });
        return;
      }

      reply.send(questLine);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update quest line
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateQuestLineSchema.parse(request.body);
      const questLine = await questLineService.update(id, data);
      reply.send(questLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Delete quest line
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await questLineService.delete(id);
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
