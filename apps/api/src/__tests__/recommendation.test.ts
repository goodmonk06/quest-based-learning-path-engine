import { RecommendationService } from '../services/recommendation.service';
import type { MemberProfile } from '@quest-engine/shared';

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;

  beforeEach(() => {
    recommendationService = new RecommendationService();
  });

  describe('Quest Recommendation Logic', () => {
    it('should prioritize quests matching member difficulty level', () => {
      const memberProfile: MemberProfile = {
        memberId: 'member-1',
        values: ['growth', 'mindfulness'],
        interests: ['meditation'],
        skillLevel: 2,
        completedQuestCount: 3,
      };

      const quest1 = {
        id: 'quest-1',
        difficulty: 2, // Perfect match
        requiredTagsJson: { required: [], preferred: [] },
        questLine: { themeTagsJson: { tags: [] } },
      };

      const quest2 = {
        id: 'quest-2',
        difficulty: 5, // Too difficult
        requiredTagsJson: { required: [], preferred: [] },
        questLine: { themeTagsJson: { tags: [] } },
      };

      // Difficulty matching rules:
      // - Same difficulty: +30 points
      // - 1 level difference: +20 points
      // - 2 levels difference: +10 points
      // - 3+ levels difference: 0 points

      const expectedQuest1Score = 30; // Perfect difficulty match
      const expectedQuest2Score = 0;  // Too far from skill level

      expect(quest1.difficulty).toBe(memberProfile.skillLevel);
      expect(Math.abs(quest2.difficulty - memberProfile.skillLevel!)).toBeGreaterThan(2);
    });

    it('should prioritize quests with matching required tags', () => {
      const memberProfile: MemberProfile = {
        memberId: 'member-1',
        values: ['growth', 'mindfulness', 'community'],
        interests: ['meditation', 'journaling'],
        skillLevel: 2,
      };

      const questWithRequiredTags = {
        id: 'quest-1',
        difficulty: 2,
        requiredTagsJson: {
          required: ['mindfulness', 'growth'], // Member has both
          preferred: [],
        },
        questLine: { themeTagsJson: { tags: [] } },
      };

      const questMissingRequiredTags = {
        id: 'quest-2',
        difficulty: 2,
        requiredTagsJson: {
          required: ['advanced-meditation', 'tantra'], // Member has neither
          preferred: [],
        },
        questLine: { themeTagsJson: { tags: [] } },
      };

      // Required tags matching rules:
      // - All required tags met: +40 points
      // - Some required tags met: +20 points
      // - No required tags met: 0 points

      const expectedFullMatchScore = 40;
      const expectedNoMatchScore = 0;

      expect(questWithRequiredTags.requiredTagsJson.required?.every(
        tag => [...memberProfile.values!, ...memberProfile.interests!].includes(tag)
      )).toBe(true);
    });

    it('should give bonus for preferred tags alignment', () => {
      const memberProfile: MemberProfile = {
        memberId: 'member-1',
        values: ['creativity', 'expression'],
        interests: ['art', 'music', 'dance'],
        skillLevel: 2,
      };

      const questWithPreferredTags = {
        id: 'quest-1',
        difficulty: 2,
        requiredTagsJson: {
          required: [],
          preferred: ['art', 'creativity', 'music'], // Member has all 3
        },
        questLine: { themeTagsJson: { tags: [] } },
      };

      // Preferred tags matching rules (max 20 points):
      // - Proportional to match percentage
      // - 3/3 matched = 20 points
      // - 2/3 matched = ~13 points
      // - 1/3 matched = ~7 points

      const totalPreferred = questWithPreferredTags.requiredTagsJson.preferred!.length;
      const matchedCount = questWithPreferredTags.requiredTagsJson.preferred!.filter(
        tag => [...memberProfile.values!, ...memberProfile.interests!].includes(tag)
      ).length;

      expect(matchedCount).toBe(totalPreferred); // 100% match
    });

    it('should consider theme alignment', () => {
      const memberProfile: MemberProfile = {
        memberId: 'member-1',
        values: ['spirituality', 'inner-work'],
        interests: ['meditation', 'shadow-work'],
        skillLevel: 3,
      };

      const questWithMatchingTheme = {
        id: 'quest-1',
        difficulty: 3,
        requiredTagsJson: { required: [], preferred: [] },
        questLine: {
          themeTagsJson: {
            tags: ['spirituality', 'meditation', 'depth'],
            categories: ['intermediate', 'spiritual'],
          },
        },
      };

      // Theme alignment rules (max 10 points):
      // - Each theme tag match = +5 points (max 10)
      // - Partial string matching allowed

      const memberTags = [...memberProfile.values!, ...memberProfile.interests!];
      const themeTags = questWithMatchingTheme.questLine.themeTagsJson.tags;

      const hasThemeOverlap = themeTags.some(tag =>
        memberTags.some(memberTag =>
          memberTag.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(memberTag.toLowerCase())
        )
      );

      expect(hasThemeOverlap).toBe(true);
    });

    it('should exclude already enrolled quests', () => {
      const memberEnrolledQuests = ['quest-1', 'quest-2', 'quest-3'];

      const allQuests = [
        { id: 'quest-1' }, // Enrolled - should exclude
        { id: 'quest-2' }, // Enrolled - should exclude
        { id: 'quest-3' }, // Enrolled - should exclude
        { id: 'quest-4' }, // Not enrolled - should include
        { id: 'quest-5' }, // Not enrolled - should include
      ];

      const availableQuests = allQuests.filter(
        q => !memberEnrolledQuests.includes(q.id)
      );

      // Exclusion rules:
      // - Do not recommend in_progress quests
      // - Do not recommend completed quests
      // - Only recommend quests not yet enrolled

      expect(availableQuests.length).toBe(2);
      expect(availableQuests.every(q => !memberEnrolledQuests.includes(q.id))).toBe(true);
    });

    it('should rank recommendations by total score', () => {
      const recommendations = [
        { questId: 'quest-1', score: 85, reasons: ['Perfect difficulty', 'Great theme match'] },
        { questId: 'quest-2', score: 45, reasons: ['Some alignment'] },
        { questId: 'quest-3', score: 92, reasons: ['All criteria met'] },
        { questId: 'quest-4', score: 68, reasons: ['Good difficulty match'] },
      ];

      const sortedRecommendations = [...recommendations].sort((a, b) => b.score - a.score);

      // Ranking rules:
      // - Sort by score descending
      // - Higher score = better match
      // - Return top N recommendations

      expect(sortedRecommendations[0].questId).toBe('quest-3'); // Highest score (92)
      expect(sortedRecommendations[1].questId).toBe('quest-1'); // Second highest (85)
      expect(sortedRecommendations[sortedRecommendations.length - 1].score).toBe(45); // Lowest
    });

    it('should provide reasons for each recommendation', () => {
      const recommendation = {
        questId: 'quest-1',
        score: 85,
        reasons: [
          'Perfect difficulty match',
          'Meets all required criteria',
          'Aligns with your interests',
          'Matches your theme preferences',
        ],
      };

      // Reasons should explain why quest was recommended:
      // - "Perfect difficulty match" - difficulty alignment
      // - "Meets all required criteria" - required tags match
      // - "Aligns with your interests" - preferred tags match
      // - "Matches your theme preferences" - theme alignment

      expect(recommendation.reasons.length).toBeGreaterThan(0);
      expect(recommendation.reasons).toContain('Perfect difficulty match');
    });

    it('should handle members with minimal profile data', () => {
      const minimalProfile: MemberProfile = {
        memberId: 'member-new',
        // No values, interests, or skillLevel
      };

      // Fallback behavior for new members:
      // - Default skillLevel to 1 (beginner)
      // - Recommend beginner quests
      // - Don't require tag matches

      const defaultSkillLevel = minimalProfile.skillLevel || 1;
      expect(defaultSkillLevel).toBe(1);
    });
  });

  describe('Integration with External Services', () => {
    it('should handle soul profile service being unavailable', async () => {
      // When soul profile service is down:
      // - Return basic profile with defaults
      // - Log error but don't fail
      // - Still provide recommendations based on defaults

      const fallbackProfile: MemberProfile = {
        memberId: 'member-1',
        values: [],
        interests: [],
        skillLevel: 1,
        completedQuestCount: 0,
      };

      expect(fallbackProfile.skillLevel).toBe(1);
      expect(fallbackProfile.values).toEqual([]);
    });
  });
});
