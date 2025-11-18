import { prisma } from '../prisma-client';
import type { EnrollmentStatus, StepProgressStatus, StepEvidence } from '@quest-engine/shared';

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
      throw new Error('Member already enrolled in this quest');
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
      throw new Error('Quest not found');
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
      throw new Error('Enrollment not found');
    }

    const progressRecord = enrollment.stepProgress.find((p) => p.stepId === stepId);
    if (!progressRecord) {
      throw new Error('Step progress not found');
    }

    if (progressRecord.status === 'completed') {
      throw new Error('Step already completed');
    }

    if (progressRecord.status === 'locked') {
      throw new Error('Step is locked');
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
    } else {
      // All steps completed - mark quest as completed
      await prisma.memberQuestEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
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
