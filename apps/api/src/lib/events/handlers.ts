import { eventBus } from './event-bus';
import type { QuestCompletedEvent, StepCompletedEvent, MemberEnrolledEvent } from './types';
import { notificationAdapter } from '../adapters/notification-adapter';
import { currencyAdapter } from '../adapters/currency-adapter';
import { webhookAdapter } from '../adapters/webhook-adapter';
import { logger } from '../logger';
import { metrics } from '../metrics';

/**
 * Handler for quest completion - grants rewards and sends notifications
 */
async function handleQuestCompleted(event: QuestCompletedEvent): Promise<void> {
  logger.info('Handling quest completed event', {
    questId: event.questId,
    memberId: event.memberId,
  });

  // Grant currency reward
  if (event.reward) {
    const finalAmount = event.reward.amount * (event.reward.bonusMultiplier || 1);

    await currencyAdapter.grantCurrency({
      memberId: event.memberId,
      currencyCode: event.reward.currencyCode,
      amount: finalAmount,
      reason: `Quest completed: ${event.questTitle}`,
      metadata: {
        questId: event.questId,
        enrollmentId: event.enrollmentId,
        bonusMultiplier: event.reward.bonusMultiplier,
      },
    });

    logger.info('Currency granted for quest completion', {
      memberId: event.memberId,
      currencyCode: event.reward.currencyCode,
      amount: finalAmount,
    });
  }

  // Send notification
  await notificationAdapter.send({
    recipientId: event.memberId,
    title: 'Quest Completed!',
    body: `Congratulations! You completed "${event.questTitle}"${
      event.reward ? ` and earned ${event.reward.amount} ${event.reward.currencyCode}` : ''
    }`,
    data: {
      questId: event.questId,
      enrollmentId: event.enrollmentId,
      reward: event.reward,
    },
    channels: ['email', 'push'],
  });

  // Send webhook
  await webhookAdapter.sendWebhook({
    event: 'quest.completed',
    timestamp: event.timestamp.toISOString(),
    data: {
      memberId: event.memberId,
      questId: event.questId,
      questTitle: event.questTitle,
      completedAt: event.completedAt.toISOString(),
      reward: event.reward,
      durationMinutes: event.durationMinutes,
    },
  });

  // Track metrics
  metrics.incrementCounter('quests_completed_total', {
    questId: event.questId,
  });
}

/**
 * Handler for step completion
 */
async function handleStepCompleted(event: StepCompletedEvent): Promise<void> {
  logger.info('Handling step completed event', {
    stepId: event.stepId,
    stepType: event.stepType,
    memberId: event.memberId,
  });

  // Track metrics
  metrics.incrementCounter('steps_completed_total', {
    stepType: event.stepType,
    questId: event.questId,
  });

  // For ritual steps, could integrate with ritual orchestrator here
  if (event.stepType === 'ritual') {
    logger.info('Ritual step completed - integration point for ritual orchestrator', {
      stepId: event.stepId,
      memberId: event.memberId,
    });
    // await ritualOrchestrator.scheduleRitual({ ... });
  }
}

/**
 * Handler for member enrollment
 */
async function handleMemberEnrolled(event: MemberEnrolledEvent): Promise<void> {
  logger.info('Handling member enrolled event', {
    memberId: event.memberId,
    questId: event.questId,
  });

  // Track metrics
  metrics.incrementCounter('enrollments_total', {
    questId: event.questId,
  });

  // Could send welcome notification here
  // await notificationAdapter.send({ ... });
}

/**
 * Register all event handlers
 */
export function registerEventHandlers(): void {
  logger.info('Registering event handlers');

  eventBus.subscribe<QuestCompletedEvent>('quest.completed', handleQuestCompleted);
  eventBus.subscribe<StepCompletedEvent>('step.completed', handleStepCompleted);
  eventBus.subscribe<MemberEnrolledEvent>('member.enrolled', handleMemberEnrolled);

  logger.info('Event handlers registered successfully', {
    handlers: [
      'quest.completed',
      'step.completed',
      'member.enrolled',
    ],
  });
}
