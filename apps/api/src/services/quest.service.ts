import { prisma } from '../prisma-client';
import type { QuestReward, RequiredTags, QuestDifficulty } from '@quest-engine/shared';

export interface CreateQuestDto {
  questLineId: string;
  key: string;
  title: string;
  summaryMarkdown: string;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  requiredTags: RequiredTags;
  reward: QuestReward;
}

export interface UpdateQuestDto {
  title?: string;
  summaryMarkdown?: string;
  difficulty?: QuestDifficulty;
  estimatedMinutes?: number;
  requiredTags?: RequiredTags;
  reward?: QuestReward;
}

export interface CreateQuestStepDto {
  questId: string;
  orderIndex: number;
  stepType: 'read' | 'video' | 'exercise' | 'reflection' | 'ritual';
  title: string;
  contentMarkdown: string;
  meta?: Record<string, unknown>;
}

export class QuestService {
  async createQuest(data: CreateQuestDto) {
    return prisma.quest.create({
      data: {
        questLineId: data.questLineId,
        key: data.key,
        title: data.title,
        summaryMarkdown: data.summaryMarkdown,
        difficulty: data.difficulty,
        estimatedMinutes: data.estimatedMinutes,
        requiredTagsJson: data.requiredTags as never,
        rewardJson: data.reward as never,
      },
      include: {
        steps: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async findAll(questLineId?: string) {
    return prisma.quest.findMany({
      where: questLineId ? { questLineId } : undefined,
      include: {
        questLine: {
          select: {
            id: true,
            key: true,
            title: true,
          },
        },
        steps: {
          select: {
            id: true,
            orderIndex: true,
            stepType: true,
            title: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return prisma.quest.findUnique({
      where: { id },
      include: {
        questLine: true,
        steps: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async findByKey(key: string) {
    return prisma.quest.findUnique({
      where: { key },
      include: {
        questLine: true,
        steps: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async updateQuest(id: string, data: UpdateQuestDto) {
    return prisma.quest.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.summaryMarkdown && { summaryMarkdown: data.summaryMarkdown }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.estimatedMinutes && { estimatedMinutes: data.estimatedMinutes }),
        ...(data.requiredTags && { requiredTagsJson: data.requiredTags as never }),
        ...(data.reward && { rewardJson: data.reward as never }),
      },
      include: {
        steps: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async deleteQuest(id: string) {
    return prisma.quest.delete({
      where: { id },
    });
  }

  // Quest Steps
  async createStep(data: CreateQuestStepDto) {
    return prisma.questStep.create({
      data: {
        questId: data.questId,
        orderIndex: data.orderIndex,
        stepType: data.stepType,
        title: data.title,
        contentMarkdown: data.contentMarkdown,
        metaJson: data.meta || {},
      },
    });
  }

  async updateStep(id: string, data: Partial<CreateQuestStepDto>) {
    return prisma.questStep.update({
      where: { id },
      data: {
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.stepType && { stepType: data.stepType }),
        ...(data.title && { title: data.title }),
        ...(data.contentMarkdown && { contentMarkdown: data.contentMarkdown }),
        ...(data.meta && { metaJson: data.meta as never }),
      },
    });
  }

  async deleteStep(id: string) {
    return prisma.questStep.delete({
      where: { id },
    });
  }
}

export const questService = new QuestService();
