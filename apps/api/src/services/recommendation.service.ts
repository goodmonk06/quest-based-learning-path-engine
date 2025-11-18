import { prisma } from '../prisma-client';
import { config } from '../config';
import type {
  MemberProfile,
  QuestRecommendation,
  RequiredTags,
  QuestThemeTags,
} from '@quest-engine/shared';

export class RecommendationService {
  /**
   * Fetch member profile from soul profile registry
   * In production, this would make an HTTP request to the actual service
   */
  private async fetchMemberProfile(memberId: string): Promise<MemberProfile> {
    // TODO: Replace with actual HTTP call to soul profile registry
    // For now, return a mock profile
    try {
      // Example of what the actual implementation would look like:
      // const response = await fetch(
      //   `${config.externalServices.soulProfileRegistryUrl}/members/${memberId}/profile`
      // );
      // return await response.json();

      // Mock implementation
      return {
        memberId,
        values: ['growth', 'mindfulness', 'community', 'creativity'],
        interests: ['meditation', 'journaling', 'inner-work', 'spirituality'],
        skillLevel: 2,
        completedQuestCount: 0,
      };
    } catch (error) {
      console.error('Failed to fetch member profile:', error);
      // Return basic profile if service is unavailable
      return {
        memberId,
        values: [],
        interests: [],
        skillLevel: 1,
        completedQuestCount: 0,
      };
    }
  }

  /**
   * Calculate match score between member profile and quest
   */
  private calculateMatchScore(
    profile: MemberProfile,
    quest: {
      difficulty: number;
      requiredTagsJson: RequiredTags;
      questLine: { themeTagsJson: QuestThemeTags };
    }
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Cast JSON fields to proper types
    const requiredTags = quest.requiredTagsJson as unknown as RequiredTags;
    const themeTags = quest.questLine.themeTagsJson as unknown as QuestThemeTags;

    // 1. Difficulty match (max 30 points)
    const difficultyDiff = Math.abs(quest.difficulty - (profile.skillLevel || 1));
    if (difficultyDiff === 0) {
      score += 30;
      reasons.push('Perfect difficulty match');
    } else if (difficultyDiff === 1) {
      score += 20;
      reasons.push('Good difficulty level');
    } else if (difficultyDiff === 2) {
      score += 10;
    }

    // 2. Required tags match (max 40 points)
    if (requiredTags.required && requiredTags.required.length > 0) {
      const memberTags = [...(profile.values || []), ...(profile.interests || [])];
      const requiredMatches = requiredTags.required.filter((tag) =>
        memberTags.includes(tag)
      ).length;

      if (requiredMatches === requiredTags.required.length) {
        score += 40;
        reasons.push('Meets all required criteria');
      } else if (requiredMatches > 0) {
        score += 20;
        reasons.push('Meets some required criteria');
      }
    } else {
      score += 20; // No required tags, give partial score
    }

    // 3. Preferred tags match (max 20 points)
    if (requiredTags.preferred && requiredTags.preferred.length > 0) {
      const memberTags = [...(profile.values || []), ...(profile.interests || [])];
      const preferredMatches = requiredTags.preferred.filter((tag) =>
        memberTags.includes(tag)
      ).length;
      const preferredScore = Math.min(
        20,
        (preferredMatches / requiredTags.preferred.length) * 20
      );
      score += preferredScore;

      if (preferredScore > 10) {
        reasons.push('Aligns with your interests');
      }
    }

    // 4. Theme alignment (max 10 points)
    if (themeTags.tags && themeTags.tags.length > 0) {
      const memberTags = [...(profile.values || []), ...(profile.interests || [])];
      const themeMatches = themeTags.tags.filter((tag) =>
        memberTags.some((memberTag) =>
          memberTag.toLowerCase().includes(tag.toLowerCase())
        )
      ).length;

      if (themeMatches > 0) {
        score += Math.min(10, themeMatches * 5);
        reasons.push('Matches your theme preferences');
      }
    }

    return { score, reasons };
  }

  /**
   * Get recommended quests for a member
   */
  async recommendQuestsForMember(
    memberId: string,
    limit: number = 10
  ): Promise<QuestRecommendation[]> {
    // Fetch member profile
    const profile = await this.fetchMemberProfile(memberId);

    // Get member's current enrollments to exclude completed/in-progress quests
    const enrollments = await prisma.memberQuestEnrollment.findMany({
      where: {
        memberId,
        status: { in: ['in_progress', 'completed'] },
      },
      select: { questId: true },
    });

    const enrolledQuestIds = enrollments.map((e) => e.questId);

    // Fetch all available quests (excluding already enrolled)
    const quests = await prisma.quest.findMany({
      where: {
        id: { notIn: enrolledQuestIds },
      },
      include: {
        questLine: {
          select: {
            themeTagsJson: true,
          },
        },
      },
    });

    // Calculate scores for each quest
    const recommendations: QuestRecommendation[] = quests
      .map((quest) => {
        const { score, reasons } = this.calculateMatchScore(profile, quest);
        return {
          questId: quest.id,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Get recommended quests with full quest details
   */
  async getRecommendedQuestsWithDetails(memberId: string, limit: number = 10) {
    const recommendations = await this.recommendQuestsForMember(memberId, limit);

    // Fetch full quest details
    const questIds = recommendations.map((r) => r.questId);
    const quests = await prisma.quest.findMany({
      where: { id: { in: questIds } },
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
            title: true,
            stepType: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    // Combine quest details with recommendation scores
    return recommendations.map((rec) => {
      const quest = quests.find((q) => q.id === rec.questId);
      return {
        ...rec,
        quest,
      };
    });
  }
}

export const recommendationService = new RecommendationService();
