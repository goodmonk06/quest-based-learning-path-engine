// Base domain event interface
export interface DomainEvent {
  type: string;
  timestamp: Date;
  aggregateId: string;
  metadata?: Record<string, unknown>;
}

// Quest events
export interface QuestCreatedEvent extends DomainEvent {
  type: 'quest.created';
  questId: string;
  questLineId: string;
  title: string;
}

export interface QuestUpdatedEvent extends DomainEvent {
  type: 'quest.updated';
  questId: string;
  changes: Record<string, unknown>;
}

export interface QuestDeletedEvent extends DomainEvent {
  type: 'quest.deleted';
  questId: string;
}

// Enrollment events
export interface MemberEnrolledEvent extends DomainEvent {
  type: 'member.enrolled';
  enrollmentId: string;
  memberId: string;
  questId: string;
}

export interface StepCompletedEvent extends DomainEvent {
  type: 'step.completed';
  enrollmentId: string;
  memberId: string;
  questId: string;
  stepId: string;
  stepType: string;
  evidence?: Record<string, unknown>;
}

export interface QuestCompletedEvent extends DomainEvent {
  type: 'quest.completed';
  enrollmentId: string;
  memberId: string;
  questId: string;
  questTitle: string;
  completedAt: Date;
  reward?: {
    currencyCode: string;
    amount: number;
    bonusMultiplier?: number;
  };
  durationMinutes?: number;
}

export interface QuestAbandonedEvent extends DomainEvent {
  type: 'quest.abandoned';
  enrollmentId: string;
  memberId: string;
  questId: string;
  reason?: string;
}

// Union type of all events
export type AllDomainEvents =
  | QuestCreatedEvent
  | QuestUpdatedEvent
  | QuestDeletedEvent
  | MemberEnrolledEvent
  | StepCompletedEvent
  | QuestCompletedEvent
  | QuestAbandonedEvent;
