// Shared types for Quest Engine

export type QuestDifficulty = 1 | 2 | 3 | 4 | 5;

export type QuestStepType = 'read' | 'video' | 'exercise' | 'reflection' | 'ritual';

export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export type StepProgressStatus = 'locked' | 'available' | 'completed';

export interface QuestReward {
  currencyCode: string;
  amount: number;
  bonusMultiplier?: number;
}

export interface QuestThemeTags {
  tags: string[];
  categories?: string[];
}

export interface RequiredTags {
  required?: string[];
  preferred?: string[];
}

export interface StepMeta {
  videoUrl?: string;
  readingUrl?: string;
  estimatedMinutes?: number;
  resources?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
}

export interface StepEvidence {
  completedAt: string;
  notes?: string;
  timeSpentMinutes?: number;
  submittedContent?: string;
}

export interface MemberProfile {
  memberId: string;
  values?: string[];
  interests?: string[];
  skillLevel?: number;
  completedQuestCount?: number;
}

export interface QuestRecommendation {
  questId: string;
  score: number;
  reasons: string[];
}
