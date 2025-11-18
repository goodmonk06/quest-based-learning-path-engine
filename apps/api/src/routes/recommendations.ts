import { FastifyInstance } from 'fastify';
import { recommendationService } from '../services/recommendation.service';

export async function recommendationRoutes(fastify: FastifyInstance) {
  // Get recommended quests for a member
  fastify.get('/:memberId/recommended-quests', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const { limit } = request.query as { limit?: string };

      const limitNum = limit ? parseInt(limit, 10) : 10;

      const recommendations = await recommendationService.getRecommendedQuestsWithDetails(
        memberId,
        limitNum
      );

      reply.send(recommendations);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
