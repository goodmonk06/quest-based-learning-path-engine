import { prisma } from '../prisma-client';
import type { EnrollmentStatus, StepProgressStatus, StepEvidence } from '@quest-engine/shared';
import { eventBus } from '../lib/events/event-bus';
import type { MemberEnrolledEvent, StepCompletedEvent, QuestCompletedEvent } from '../lib/events/types';
import { logger } from '../lib/logger';
import { NotFoundError, BadRequestError } from '../lib/errors';

export class EnrollmentService {
  /**
   * Enroll a member in a quest
   */
  async enroll(memberId: string, questId: string) {
    // Check if already enrolled
    const existing = await prisma.memberQuestEnrollment.findUnique({
      where: {
        memberId_questId: { memberId, questId },
      },
    });

    if (existing) {
      throw new BadRequestError('Member already enrolled in this quest');
    }

    // Get quest steps
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        steps: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!quest) {
      throw new NotFoundError('Quest', questId);
    }

    // Create enrollment
    const enrollment = await prisma.memberQuestEnrollment.create({
      data: {
        memberId,
        questId,
        status: 'not_started',
      },
    });

    // Create progress records for each step
    // First step is 'available', rest are 'locked'
    await Promise.all(
      quest.steps.map((step, index) =>
        prisma.memberQuestStepProgress.create({
          data: {
            memberEnrollmentId: enrollment.id,
            stepId: step.id,
            status: index === 0 ? 'available' : 'locked',
          },
        })
      )
    );

    // Publish enrollment event
    const enrollmentEvent: MemberEnrolledEvent = {
      type: 'member.enrolled',
      timestamp: new Date(),
      aggregateId: enrollment.id,
      enrollmentId: enrollment.id,
      memberId,
      questId,
    };
    await eventBus.publish(enrollmentEvent);

    logger.info('Member enrolled in quest', {
      enrollmentId: enrollment.id,
      memberId,
      questId,
    });

    return this.getEnrollmentDetails(enrollment.id);
  }

  /**
   * Mark a step as completed and unlock the next step
   */
  async completeStep(
    memberId: string,
    questId: string,
    stepId: string,
    evidence?: Partial<StepEvidence>
  ) {
    const enrollment = await prisma.memberQuestEnrollment.findUnique({
      where: {
        memberId_questId: { memberId, questId },
      },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        stepProgress: {
          include: {
            step: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment');
    }

    const progressRecord = enrollment.stepProgress.find((p) => p.stepId === stepId);
    if (!progressRecord) {
      throw new NotFoundError('Step progress');
    }

    if (progressRecord.status === 'completed') {
      throw new BadRequestError('Step already completed');
    }

    if (progressRecord.status === 'locked') {
      throw new BadRequestError('Step is locked - complete previous steps first');
    }

    // Mark step as completed
    await prisma.memberQuestStepProgress.update({
      where: { id: progressRecord.id },
      data: {
        status: 'completed',
        evidenceJson: {
          completedAt: new Date().toISOString(),
          ...evidence,
        } as never,
      },
    });

    // Update enrollment status to in_progress if not started
    if (enrollment.status === 'not_started') {
      await prisma.memberQuestEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'in_progress' },
      });
    }

    // Find and unlock next step
    const currentStepIndex = enrollment.quest.steps.findIndex((s) => s.id === stepId);
    if (currentStepIndex < enrollment.quest.steps.length - 1) {
      const nextStep = enrollment.quest.steps[currentStepIndex + 1];
      const nextProgress = enrollment.stepProgress.find((p) => p.stepId === nextStep.id);

      if (nextProgress) {
        await prisma.memberQuestStepProgress.update({
          where: { id: nextProgress.id },
          data: { status: 'available' },
        });
      }

      // Publish step completed event
      const stepEvent: StepCompletedEvent = {
        type: 'step.completed',
        timestamp: new Date(),
        aggregateId: progressRecord.id,
        enrollmentId: enrollment.id,
        memberId,
        questId,
        stepId,
        stepType: progressRecord.step.stepType,
        evidence: evidence as Record<string, unknown>,
      };
      await eventBus.publish(stepEvent);
    } else {
      // All steps completed - mark quest as completed
      const completedAt = new Date();
      await prisma.memberQuestEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'completed',
          completedAt,
        },
      });

      // Publish quest completed event
      const questEvent: QuestCompletedEvent = {
        type: 'quest.completed',
        timestamp: completedAt,
        aggregateId: enrollment.id,
        enrollmentId: enrollment.id,
        memberId,
        questId,
        questTitle: enrollment.quest.title,
        completedAt,
        reward: enrollment.quest.rewardJson as unknown as QuestCompletedEvent['reward'],
        durationMinutes: enrollment.startedAt
          ? Math.round((completedAt.getTime() - enrollment.startedAt.getTime()) / 60000)
          : undefined,
      };
      await eventBus.publish(questEvent);

      logger.info('Quest completed', {
        enrollmentId: enrollment.id,
        memberId,
        questId,
        questTitle: enrollment.quest.title,
      });

      // Publish step completed event for the final step
      const stepEvent: StepCompletedEvent = {
        type: 'step.completed',
        timestamp: new Date(),
        aggregateId: progressRecord.id,
        enrollmentId: enrollment.id,
        memberId,
        questId,
        stepId,
        stepType: progressRecord.step.stepType,
        evidence: evidence as Record<string, unknown>,
      };
      await eventBus.publish(stepEvent);
    }

    return this.getEnrollmentDetails(enrollment.id);
  }

  /**
   * Get all quests for a member
   */
  async getMemberQuests(memberId: string, status?: EnrollmentStatus) {
    return prisma.memberQuestEnrollment.findMany({
      where: {
        memberId,
        ...(status && { status }),
      },
      include: {
        quest: {
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
              },
            },
          },
        },
        stepProgress: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Get detailed progress for a specific quest enrollment
   */
  async getMemberQuestDetails(memberId: string, questId: string) {
    const enrollment = await prisma.memberQuestEnrollment.findUnique({
      where: {
        memberId_questId: { memberId, questId },
      },
      include: {
        quest: {
          include: {
            questLine: true,
            steps: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        stepProgress: {
          include: {
            step: true,
          },
          orderBy: {
            step: {
              orderIndex: 'asc',
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    return enrollment;
  }

  /**
   * Update enrollment status (for abandoning quests)
   */
  async updateEnrollmentStatus(
    memberId: string,
    questId: string,
    status: EnrollmentStatus
  ) {
    return prisma.memberQuestEnrollment.update({
      where: {
        memberId_questId: { memberId, questId },
      },
      data: { status },
    });
  }

  private async getEnrollmentDetails(enrollmentId: string) {
    return prisma.memberQuestEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        stepProgress: {
          include: {
            step: true,
          },
        },
      },
    });
  }
}

export const enrollmentService = new EnrollmentService();
