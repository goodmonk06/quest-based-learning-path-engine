import { prisma } from '../prisma-client';
import type { QuestThemeTags } from '@quest-engine/shared';

export interface CreateQuestLineDto {
  communityId: string;
  key: string;
  title: string;
  descriptionMarkdown: string;
  themeTags: QuestThemeTags;
}

export interface UpdateQuestLineDto {
  title?: string;
  descriptionMarkdown?: string;
  themeTags?: QuestThemeTags;
}

export class QuestLineService {
  async create(data: CreateQuestLineDto) {
    return prisma.questLine.create({
      data: {
        communityId: data.communityId,
        key: data.key,
        title: data.title,
        descriptionMarkdown: data.descriptionMarkdown,
        themeTagsJson: data.themeTags as never,
      },
      include: {
        quests: true,
      },
    });
  }

  async findAll(communityId?: string) {
    return prisma.questLine.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        quests: {
          select: {
            id: true,
            key: true,
            title: true,
            difficulty: true,
            estimatedMinutes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return prisma.questLine.findUnique({
      where: { id },
      include: {
        quests: {
          include: {
            steps: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async findByKey(key: string) {
    return prisma.questLine.findUnique({
      where: { key },
      include: {
        quests: true,
      },
    });
  }

  async update(id: string, data: UpdateQuestLineDto) {
    return prisma.questLine.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.descriptionMarkdown && { descriptionMarkdown: data.descriptionMarkdown }),
        ...(data.themeTags && { themeTagsJson: data.themeTags as never }),
      },
      include: {
        quests: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.questLine.delete({
      where: { id },
    });
  }
}

export const questLineService = new QuestLineService();
