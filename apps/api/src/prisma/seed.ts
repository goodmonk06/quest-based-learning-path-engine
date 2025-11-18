import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.memberQuestStepProgress.deleteMany();
  await prisma.memberQuestEnrollment.deleteMany();
  await prisma.questStep.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.questLine.deleteMany();

  // Create Quest Line 1: Beginner Path
  const beginnerPath = await prisma.questLine.create({
    data: {
      communityId: 'default-community',
      key: 'beginner-path',
      title: 'Beginner Path: Foundation for Growth',
      descriptionMarkdown: `# Welcome to Your Journey

This quest line is designed for those taking their first steps into personal development and mindfulness. Through a series of gentle, approachable quests, you'll build a foundation for lifelong growth.

## What You'll Learn
- Basic mindfulness practices
- Self-reflection techniques
- Building sustainable habits
- Community connection

Perfect for newcomers ready to embark on their personal growth journey.`,
      themeTagsJson: {
        tags: ['beginner', 'mindfulness', 'foundation', 'personal-growth'],
        categories: ['introductory', 'wellness'],
      },
    },
  });

  // Quest 1.1: Introduction to Mindfulness
  const mindfulnessQuest = await prisma.quest.create({
    data: {
      questLineId: beginnerPath.id,
      key: 'intro-to-mindfulness',
      title: 'Introduction to Mindfulness',
      summaryMarkdown: `Begin your journey with the foundational practice of mindfulness. Learn to be present, observe your thoughts without judgment, and cultivate inner peace.

**What you'll gain:**
- Understanding of mindfulness basics
- Daily breathing practice
- Improved awareness
- Stress reduction techniques`,
      difficulty: 1,
      estimatedMinutes: 45,
      requiredTagsJson: {
        preferred: ['mindfulness', 'meditation', 'wellness'],
      },
      rewardJson: {
        currencyCode: 'KARMA',
        amount: 100,
        bonusMultiplier: 1.5,
      },
    },
  });

  await prisma.questStep.createMany({
    data: [
      {
        questId: mindfulnessQuest.id,
        orderIndex: 0,
        stepType: 'read',
        title: 'What is Mindfulness?',
        contentMarkdown: `# Understanding Mindfulness

Mindfulness is the practice of purposeful awareness in the present moment, without judgment.

## Core Principles
1. **Present Moment Awareness** - Focus on now, not past or future
2. **Non-Judgmental Observation** - Notice without labeling as good/bad
3. **Acceptance** - Allow experiences to be as they are
4. **Curiosity** - Approach each moment with fresh eyes

## Why Mindfulness Matters
- Reduces stress and anxiety
- Improves focus and concentration
- Enhances emotional regulation
- Builds resilience

Take a moment to reflect on what being "mindful" means to you.`,
        metaJson: {
          estimatedMinutes: 10,
          resources: [
            {
              title: 'The Science of Mindfulness',
              url: 'https://example.com/mindfulness-science',
              type: 'article',
            },
          ],
        },
      },
      {
        questId: mindfulnessQuest.id,
        orderIndex: 1,
        stepType: 'video',
        title: 'Guided Breathing Exercise',
        contentMarkdown: `# Your First Mindful Breath

Watch this guided breathing exercise to experience mindfulness firsthand.

## Preparation
- Find a quiet, comfortable space
- Sit in a relaxed but alert posture
- Have 5 uninterrupted minutes

## During the Exercise
- Follow the guide's instructions
- Don't worry if your mind wanders - that's normal
- Gently return focus to your breath each time

After completing the video, take a moment to notice how you feel.`,
        metaJson: {
          videoUrl: 'https://example.com/videos/breathing-exercise',
          estimatedMinutes: 10,
        },
      },
      {
        questId: mindfulnessQuest.id,
        orderIndex: 2,
        stepType: 'exercise',
        title: 'Practice: 3 Days of Mindful Breathing',
        contentMarkdown: `# Daily Practice Challenge

For the next 3 days, commit to 5 minutes of mindful breathing each morning.

## Instructions
1. Set a consistent time each morning
2. Use the breathing technique from the video
3. Notice any thoughts or sensations without judgment
4. Record your experience in a journal

## What to Track
- Time of day
- How you felt before
- Any observations during practice
- How you felt after

Submit a brief reflection on your 3-day experience.`,
        metaJson: {
          estimatedMinutes: 15,
        },
      },
      {
        questId: mindfulnessQuest.id,
        orderIndex: 3,
        stepType: 'reflection',
        title: 'Reflect on Your Experience',
        contentMarkdown: `# Mindfulness Reflection

Take time to deeply reflect on your mindfulness journey so far.

## Reflection Prompts
1. What surprised you most about practicing mindfulness?
2. What challenges did you encounter?
3. How has your awareness shifted, even slightly?
4. What insights did you gain about yourself?
5. How might you integrate mindfulness into daily life?

## Your Response
Write at least 200 words reflecting on these questions. Be honest and specific.

Remember: There are no right or wrong answers. This is your journey.`,
        metaJson: {
          estimatedMinutes: 15,
        },
      },
    ],
  });

  // Quest 1.2: Daily Journaling Practice
  const journalingQuest = await prisma.quest.create({
    data: {
      questLineId: beginnerPath.id,
      key: 'daily-journaling',
      title: 'Daily Journaling Practice',
      summaryMarkdown: `Discover the transformative power of journaling. Learn techniques to process emotions, gain clarity, and track your personal growth.

**What you'll gain:**
- Journaling fundamentals
- Self-reflection skills
- Emotional processing tools
- Personal growth tracking`,
      difficulty: 1,
      estimatedMinutes: 60,
      requiredTagsJson: {
        preferred: ['journaling', 'reflection', 'self-awareness'],
      },
      rewardJson: {
        currencyCode: 'KARMA',
        amount: 120,
      },
    },
  });

  await prisma.questStep.createMany({
    data: [
      {
        questId: journalingQuest.id,
        orderIndex: 0,
        stepType: 'read',
        title: 'The Power of Journaling',
        contentMarkdown: `# Why Journal?

Journaling is one of the most powerful tools for personal growth and self-discovery.

## Benefits
- **Clarity** - Untangle complex thoughts and emotions
- **Emotional Release** - Process difficult feelings safely
- **Self-Discovery** - Uncover patterns and insights
- **Growth Tracking** - Document your journey over time
- **Stress Relief** - Release mental burden onto paper

## Different Journaling Styles
- **Free Writing** - Stream of consciousness
- **Prompted Journaling** - Response to specific questions
- **Gratitude Journaling** - Focus on appreciation
- **Goal Tracking** - Monitor progress and intentions

There's no "right" way to journal. Experiment to find what resonates with you.`,
        metaJson: {
          estimatedMinutes: 10,
        },
      },
      {
        questId: journalingQuest.id,
        orderIndex: 1,
        stepType: 'exercise',
        title: 'Your First Journal Entry',
        contentMarkdown: `# Begin Your Journaling Practice

Create your first journal entry using these prompts.

## Today's Prompts
1. How am I feeling right now, in this moment?
2. What am I grateful for today?
3. What challenged me recently?
4. What do I need more of in my life?
5. What small step can I take tomorrow toward growth?

## Guidelines
- Write for at least 10 minutes
- Don't edit or judge your writing
- Be completely honest - no one else will read this
- Let your thoughts flow naturally

After writing, notice how you feel. Has anything shifted?`,
        metaJson: {
          estimatedMinutes: 20,
        },
      },
      {
        questId: journalingQuest.id,
        orderIndex: 2,
        stepType: 'ritual',
        title: 'Establish Your Journaling Ritual',
        contentMarkdown: `# Create Your Sacred Practice

Transform journaling into a meaningful ritual by establishing a consistent practice.

## Design Your Ritual
1. **Choose Your Time** - Morning clarity or evening reflection?
2. **Create Your Space** - Where will you journal?
3. **Set the Mood** - Music, candles, tea?
4. **Choose Your Medium** - Physical notebook or digital?
5. **Set a Duration** - Start with 10 minutes daily

## Commitment
For the next 7 days, commit to your journaling ritual.

## Track Your Practice
Note each day you complete your ritual and any insights that arise.`,
        metaJson: {
          estimatedMinutes: 15,
        },
      },
      {
        questId: journalingQuest.id,
        orderIndex: 3,
        stepType: 'reflection',
        title: 'Review Your Week',
        contentMarkdown: `# Weekly Reflection

Review your journaling practice from the past week.

## Reflection Questions
1. What patterns or themes emerged in your writing?
2. Did you notice any resistance to journaling? What was that about?
3. What insights surprised you?
4. How has journaling impacted your daily life?
5. What will you continue, change, or explore next?

Share your reflections and insights from this journey.`,
        metaJson: {
          estimatedMinutes: 15,
        },
      },
    ],
  });

  // Create Quest Line 2: Inner Exploration Path
  const innerExploration = await prisma.questLine.create({
    data: {
      communityId: 'default-community',
      key: 'inner-exploration-path',
      title: 'Inner Exploration Path: Depth & Discovery',
      descriptionMarkdown: `# Journey Into the Depths

This quest line is for those ready to explore the inner landscape with courage and curiosity. Through deeper practices and profound questions, you'll connect with your authentic self.

## What You'll Explore
- Core values and beliefs
- Shadow work and integration
- Authentic self-expression
- Spiritual practices

Best suited for those with some mindfulness experience and a desire to go deeper.`,
      themeTagsJson: {
        tags: ['advanced', 'depth', 'spirituality', 'self-discovery', 'inner-work'],
        categories: ['intermediate', 'spiritual', 'transformation'],
      },
    },
  });

  // Quest 2.1: Discovering Your Core Values
  const coreValuesQuest = await prisma.quest.create({
    data: {
      questLineId: innerExploration.id,
      key: 'core-values-discovery',
      title: 'Discovering Your Core Values',
      summaryMarkdown: `Embark on a journey to identify and clarify your deepest values. Understanding what truly matters to you provides a compass for authentic living.

**What you'll gain:**
- Clear understanding of your core values
- Alignment check with current life
- Decision-making framework
- Authentic life direction`,
      difficulty: 3,
      estimatedMinutes: 90,
      requiredTagsJson: {
        required: ['self-awareness'],
        preferred: ['values', 'purpose', 'authenticity', 'inner-work'],
      },
      rewardJson: {
        currencyCode: 'KARMA',
        amount: 200,
        bonusMultiplier: 2.0,
      },
    },
  });

  await prisma.questStep.createMany({
    data: [
      {
        questId: coreValuesQuest.id,
        orderIndex: 0,
        stepType: 'read',
        title: 'Understanding Core Values',
        contentMarkdown: `# What Are Core Values?

Core values are the fundamental beliefs and principles that guide your decisions, actions, and life direction.

## Why Values Matter
When you live in alignment with your values:
- Decisions become clearer
- You feel more authentic
- Life has more meaning
- Conflicts decrease
- Satisfaction increases

## Common Misconceptions
- Values aren't goals or aspirations
- They're not moral judgments about others
- They're deeply personal and unique to you
- They can evolve over time

## Your Values Journey
In this quest, you'll:
1. Identify your top values
2. Examine where you're aligned/misaligned
3. Create action steps for greater alignment

Approach this with honesty and curiosity.`,
        metaJson: {
          estimatedMinutes: 15,
        },
      },
      {
        questId: coreValuesQuest.id,
        orderIndex: 1,
        stepType: 'exercise',
        title: 'Values Clarification Exercise',
        contentMarkdown: `# Discover Your Core Values

Complete this multi-step exercise to identify your top 5 core values.

## Step 1: Browse the Values List
Review this list of common values (or add your own):
- Authenticity, Adventure, Compassion, Creativity, Community
- Freedom, Growth, Health, Honesty, Justice
- Love, Learning, Peace, Service, Spirituality
- Wisdom, Family, Nature, Excellence, Balance

## Step 2: First Pass (15-20 values)
Select all values that resonate with you.

## Step 3: Second Pass (10 values)
Narrow your list. Which are most essential?

## Step 4: Final Selection (5 values)
Choose your top 5. These should feel non-negotiable.

## Step 5: Define Each Value
For each of your top 5, write:
- What this value means to you specifically
- Why it matters to you
- An example of this value in action in your life

Submit your top 5 values with definitions.`,
        metaJson: {
          estimatedMinutes: 30,
        },
      },
      {
        questId: coreValuesQuest.id,
        orderIndex: 2,
        stepType: 'reflection',
        title: 'Values Alignment Assessment',
        contentMarkdown: `# Are You Living Your Values?

Now that you've identified your core values, assess your current alignment.

## For Each of Your 5 Values
Rate your alignment (1-10):
- 1 = Completely out of alignment
- 10 = Fully living this value

Then reflect:
1. **Where are you most aligned?** What's working?
2. **Where are you least aligned?** What's the gap?
3. **What specific barriers prevent alignment?**
4. **What small changes could increase alignment?**
5. **What would full alignment look like?**

## Overall Reflection
- What surprised you about this assessment?
- What patterns do you notice?
- What is one commitment you can make today?

Write a thorough reflection (300+ words) on your alignment.`,
        metaJson: {
          estimatedMinutes: 25,
        },
      },
      {
        questId: coreValuesQuest.id,
        orderIndex: 3,
        stepType: 'exercise',
        title: 'Create Your Values Action Plan',
        contentMarkdown: `# Living Your Values

Create a concrete action plan to increase alignment with your core values.

## For Each Value
Choose 1-2 specific, actionable steps you can take in the next 30 days.

## Action Plan Template
**Value:** [Name]
**Current Alignment:** [1-10]
**Desired Alignment:** [1-10]

**Actions:**
1. [Specific action with timeline]
2. [Specific action with timeline]

**Success Indicators:**
- How will you know you're making progress?
- What will be different?

## Make It Real
- Be specific (not "be more creative" but "spend 30 min drawing each Sunday")
- Start small (build momentum)
- Schedule it (when exactly will you do this?)

Submit your complete values action plan.`,
        metaJson: {
          estimatedMinutes: 20,
        },
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log(`Created ${2} quest lines`);
  console.log(`Created ${3} quests`);
  console.log(`Created ${11} quest steps`);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
