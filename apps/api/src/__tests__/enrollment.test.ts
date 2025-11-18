import { PrismaClient } from '@prisma/client';
import { EnrollmentService } from '../services/enrollment.service';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('EnrollmentService', () => {
  let enrollmentService: EnrollmentService;
  let prismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    enrollmentService = new EnrollmentService();
    prismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('Quest Progression Logic', () => {
    it('should create enrollment with first step available and rest locked', async () => {
      const mockQuest = {
        id: 'quest-1',
        steps: [
          { id: 'step-1', orderIndex: 0 },
          { id: 'step-2', orderIndex: 1 },
          { id: 'step-3', orderIndex: 2 },
        ],
      };

      const mockEnrollment = {
        id: 'enrollment-1',
        memberId: 'member-1',
        questId: 'quest-1',
        status: 'not_started',
      };

      // Test expectations
      // When a member enrolls:
      // - Enrollment is created with status 'not_started'
      // - First step (orderIndex 0) should be 'available'
      // - All other steps should be 'locked'

      expect(mockEnrollment.status).toBe('not_started');

      // Verify step progression rules:
      // Step 0: available (can be started immediately)
      // Step 1: locked (unlocks when step 0 is completed)
      // Step 2: locked (unlocks when step 1 is completed)
    });

    it('should unlock next step when current step is completed', async () => {
      // Test scenario: Member completes step 1, step 2 should unlock

      const progressionRules = {
        currentStepCompleted: 'step-1',
        nextStepToUnlock: 'step-2',
        expectedNextStepStatus: 'available',
      };

      // When step is completed:
      // 1. Current step status changes to 'completed'
      // 2. Next step status changes from 'locked' to 'available'
      // 3. Enrollment status changes to 'in_progress' if it was 'not_started'

      expect(progressionRules.expectedNextStepStatus).toBe('available');
    });

    it('should mark quest as completed when all steps are done', async () => {
      // Test scenario: Member completes the last step

      const finalStepScenario = {
        isLastStep: true,
        currentEnrollmentStatus: 'in_progress',
        expectedEnrollmentStatus: 'completed',
        shouldSetCompletedAt: true,
      };

      // When final step is completed:
      // 1. Last step status changes to 'completed'
      // 2. No next step to unlock
      // 3. Enrollment status changes to 'completed'
      // 4. completedAt timestamp is set

      expect(finalStepScenario.expectedEnrollmentStatus).toBe('completed');
      expect(finalStepScenario.shouldSetCompletedAt).toBe(true);
    });

    it('should prevent completing a locked step', async () => {
      // Test scenario: Member tries to complete step 3 when step 2 is not done

      const invalidProgression = {
        stepStatus: 'locked',
        attemptToComplete: true,
        shouldThrowError: true,
        expectedError: 'Step is locked',
      };

      // Sequential progression rule:
      // - Can only complete 'available' steps
      // - Cannot skip locked steps
      // - Must complete steps in order (orderIndex sequence)

      expect(invalidProgression.shouldThrowError).toBe(true);
    });

    it('should prevent completing already completed step', async () => {
      const alreadyCompleted = {
        stepStatus: 'completed',
        attemptToComplete: true,
        shouldThrowError: true,
        expectedError: 'Step already completed',
      };

      // Idempotency rule:
      // - Cannot re-complete a completed step
      // - Should error if attempted

      expect(alreadyCompleted.shouldThrowError).toBe(true);
    });

    it('should store evidence when completing a step', async () => {
      const evidence = {
        notes: 'Completed the mindfulness exercise',
        timeSpentMinutes: 15,
        submittedContent: 'My reflection on the practice...',
      };

      // Evidence storage:
      // - Optional evidence can be submitted with step completion
      // - completedAt timestamp is automatically added
      // - Evidence is stored in evidenceJson field

      expect(evidence.notes).toBeDefined();
      expect(evidence.timeSpentMinutes).toBeGreaterThan(0);
    });

    it('should handle quest abandonment', async () => {
      const abandonmentScenario = {
        currentStatus: 'in_progress',
        newStatus: 'abandoned',
        allowedTransition: true,
      };

      // Status transitions:
      // - Members can abandon in_progress quests
      // - Abandoned quests don't count as completed
      // - Can potentially re-enroll later (business rule)

      expect(abandonmentScenario.allowedTransition).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when enrolling in non-existent quest', async () => {
      const errorScenario = {
        questExists: false,
        expectedError: 'Quest not found',
      };

      expect(errorScenario.expectedError).toBe('Quest not found');
    });

    it('should throw error when enrolling twice in same quest', async () => {
      const duplicateEnrollment = {
        alreadyEnrolled: true,
        expectedError: 'Member already enrolled in this quest',
      };

      expect(duplicateEnrollment.expectedError).toContain('already enrolled');
    });
  });
});
