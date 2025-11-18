# Quest-Based Learning Path Engine

A comprehensive quest-based learning path engine with personalized recommendations, designed to guide members through structured learning journeys. Built with TypeScript, Node.js, Fastify, PostgreSQL, and Next.js.

## Overview

The Quest Engine enables communities to design, deliver, and track member progress through structured learning paths called "Quest Lines". Each quest line contains multiple quests, and each quest is broken down into sequential steps that guide learners through a complete journey.

### Key Features

- **Quest Line Management**: Create themed collections of related quests
- **Quest & Step Design**: Build multi-step learning experiences with various types (read, video, exercise, reflection, ritual)
- **Member Enrollment & Progression**: Track member progress through quests with sequential step unlocking
- **Personalized Recommendations**: AI-driven quest recommendations based on member profiles, values, and interests
- **Reward System**: Integration with community currency systems (e.g., KARMA points)
- **Admin UI**: Web-based interface for managing quest lines and quests
- **REST API**: Comprehensive API for integration with other systems

## Architecture

### Domain Model

```
QuestLine (themed collection)
  ├── Quest 1 (individual journey)
  │   ├── Step 1 (read)
  │   ├── Step 2 (video)
  │   ├── Step 3 (exercise)
  │   └── Step 4 (reflection)
  ├── Quest 2
  └── Quest 3

Member Enrollment
  ├── Quest Progress
  └── Step Progress (locked → available → completed)
```

### Core Entities

#### QuestLine
- Themed collection of related quests
- Tags and categories for organization
- Community-scoped

#### Quest
- Individual learning journey
- Difficulty rating (1-5)
- Estimated time commitment
- Required and preferred tags for matching
- Reward definition (currency + amount)

#### QuestStep
- Sequential steps within a quest
- Types: `read`, `video`, `exercise`, `reflection`, `ritual`
- Markdown content with metadata
- Order-based progression

#### MemberQuestEnrollment
- Tracks member participation
- Status: `not_started`, `in_progress`, `completed`, `abandoned`
- Timestamps for analytics

#### MemberQuestStepProgress
- Individual step progress
- Status: `locked`, `available`, `completed`
- Evidence/submission data

## Tech Stack

### Backend (apps/api)
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod

### Frontend (apps/web)
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Testing**: Jest
- **Package Manager**: npm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm 10+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd quest-based-learning-path-engine
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `.env` files with your configuration:
```env
DATABASE_URL="postgresql://quest_user:quest_password@localhost:5432/quest_engine?schema=public"
API_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start PostgreSQL** (if using Docker)
```bash
docker-compose up postgres -d
```

5. **Run database migrations**
```bash
npm run db:migrate
```

6. **Seed the database**
```bash
npm run db:seed
```

7. **Start development servers**
```bash
# Start API server (port 3000)
npm run dev:api

# In another terminal, start web UI (port 3001)
npm run dev:web
```

### Using Docker Compose

To run the entire stack with Docker:

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down
```

This will start:
- PostgreSQL on port 5432
- API server on port 3000
- Web UI on port 3001

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Quest Lines

#### List Quest Lines
```http
GET /api/quest-lines
GET /api/quest-lines?communityId=community-123
```

#### Get Quest Line
```http
GET /api/quest-lines/:id
GET /api/quest-lines/key/:key
```

#### Create Quest Line
```http
POST /api/quest-lines
Content-Type: application/json

{
  "communityId": "community-123",
  "key": "beginner-path",
  "title": "Beginner Path: Foundation for Growth",
  "descriptionMarkdown": "# Welcome to your journey...",
  "themeTags": {
    "tags": ["beginner", "mindfulness", "foundation"],
    "categories": ["introductory", "wellness"]
  }
}
```

#### Update Quest Line
```http
PATCH /api/quest-lines/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "descriptionMarkdown": "Updated description..."
}
```

#### Delete Quest Line
```http
DELETE /api/quest-lines/:id
```

### Quests

#### List Quests
```http
GET /api/quests
GET /api/quests?questLineId=quest-line-123
```

#### Get Quest
```http
GET /api/quests/:id
GET /api/quests/key/:key
```

#### Create Quest
```http
POST /api/quests
Content-Type: application/json

{
  "questLineId": "quest-line-123",
  "key": "intro-to-mindfulness",
  "title": "Introduction to Mindfulness",
  "summaryMarkdown": "Begin your mindfulness journey...",
  "difficulty": 1,
  "estimatedMinutes": 45,
  "requiredTags": {
    "required": ["beginner"],
    "preferred": ["mindfulness", "meditation"]
  },
  "reward": {
    "currencyCode": "KARMA",
    "amount": 100,
    "bonusMultiplier": 1.5
  }
}
```

#### Add Quest Step
```http
POST /api/quests/:questId/steps
Content-Type: application/json

{
  "orderIndex": 0,
  "stepType": "read",
  "title": "What is Mindfulness?",
  "contentMarkdown": "# Understanding Mindfulness...",
  "meta": {
    "estimatedMinutes": 10,
    "resources": [
      {
        "title": "The Science of Mindfulness",
        "url": "https://example.com/article",
        "type": "article"
      }
    ]
  }
}
```

### Member Enrollment & Progress

#### Enroll in Quest
```http
POST /api/members/:memberId/enroll/:questId
```

Response: Enrollment object with initial step progress (first step available, rest locked)

#### List Member Quests
```http
GET /api/members/:memberId/quests
GET /api/members/:memberId/quests?status=in_progress
```

Status options: `not_started`, `in_progress`, `completed`, `abandoned`

#### Get Quest Progress
```http
GET /api/members/:memberId/quests/:questId
```

Returns detailed progress including all steps and their status.

#### Complete Quest Step
```http
POST /api/members/:memberId/quests/:questId/progress/:stepId/complete
Content-Type: application/json

{
  "notes": "Completed the breathing exercise",
  "timeSpentMinutes": 15,
  "submittedContent": "My reflection on the practice..."
}
```

This will:
- Mark the current step as completed
- Unlock the next step (if any)
- Update enrollment status to `in_progress` (if was `not_started`)
- Mark quest as `completed` if this was the last step

#### Update Enrollment Status
```http
PATCH /api/members/:memberId/quests/:questId
Content-Type: application/json

{
  "status": "abandoned"
}
```

### Recommendations

#### Get Recommended Quests
```http
GET /api/members/:memberId/recommended-quests
GET /api/members/:memberId/recommended-quests?limit=5
```

Returns:
```json
[
  {
    "questId": "quest-123",
    "score": 85,
    "reasons": [
      "Perfect difficulty match",
      "Meets all required criteria",
      "Aligns with your interests"
    ],
    "quest": {
      "id": "quest-123",
      "title": "Introduction to Mindfulness",
      "difficulty": 2,
      ...
    }
  }
]
```

## Progression Rules

### Sequential Step Unlocking

1. **On Enrollment**: First step (orderIndex 0) is `available`, all others are `locked`
2. **On Step Completion**:
   - Current step becomes `completed`
   - Next step (orderIndex + 1) becomes `available`
   - If last step: Quest marked as `completed`

### Status Flow

```
Enrollment: not_started → in_progress → completed (or abandoned)
Steps: locked → available → completed
```

### Business Rules

- Cannot complete a `locked` step (must complete previous steps first)
- Cannot complete an already `completed` step
- Cannot skip steps in the sequence
- Enrollment status auto-updates based on progress

## Recommendation Engine

The recommendation engine scores quests based on multiple factors:

### Scoring Algorithm

| Factor | Max Points | Criteria |
|--------|-----------|----------|
| **Difficulty Match** | 30 | Alignment with member skill level |
| **Required Tags** | 40 | Match with member values/interests |
| **Preferred Tags** | 20 | Additional alignment bonus |
| **Theme Tags** | 10 | Quest line theme resonance |

**Total**: Up to 100 points per quest

### Matching Logic

```typescript
// Difficulty scoring
Same level: +30 points
1 level diff: +20 points
2 levels diff: +10 points
3+ levels: 0 points

// Required tags
All required tags met: +40 points
Some required tags met: +20 points
No required tags met: 0 points

// Preferred tags
Proportional to match percentage (max 20 points)

// Theme tags
Partial string matching (max 10 points)
```

### Exclusion Rules

- Already enrolled quests are filtered out
- Both `in_progress` and `completed` quests are excluded
- Only returns available quests for member

## Integration Examples

### Integration with Member Soul Profile Registry

The recommendation engine integrates with the Member Soul Profile Registry to fetch member values, interests, and skill levels.

```typescript
// In recommendation.service.ts
private async fetchMemberProfile(memberId: string): Promise<MemberProfile> {
  const response = await fetch(
    `${config.externalServices.soulProfileRegistryUrl}/members/${memberId}/profile`
  );
  return await response.json();
}
```

**Profile Structure:**
```json
{
  "memberId": "member-123",
  "values": ["growth", "mindfulness", "community"],
  "interests": ["meditation", "journaling", "inner-work"],
  "skillLevel": 2,
  "completedQuestCount": 5
}
```

**Configuration:**
```env
SOUL_PROFILE_REGISTRY_URL=http://localhost:3001
```

### Integration with Community Currency Economy Core

Quests define rewards that can be granted via the Currency Economy Core system.

```typescript
// Quest reward definition
{
  "reward": {
    "currencyCode": "KARMA",
    "amount": 100,
    "bonusMultiplier": 1.5
  }
}
```

**Integration Flow:**
1. Member completes final quest step
2. Quest Engine emits completion event
3. External system listens for completion
4. Calls Currency Economy Core to grant reward

**Example Integration:**
```typescript
// In your integration service
async function handleQuestCompletion(enrollment: MemberQuestEnrollment) {
  if (enrollment.status === 'completed') {
    const quest = await fetchQuest(enrollment.questId);
    const reward = quest.rewardJson;

    // Grant currency via Economy Core
    await fetch(`${CURRENCY_ECONOMY_CORE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        memberId: enrollment.memberId,
        currencyCode: reward.currencyCode,
        amount: reward.amount * (reward.bonusMultiplier || 1),
        reason: `Quest completed: ${quest.title}`,
        metadata: {
          questId: quest.id,
          questKey: quest.key
        }
      })
    });
  }
}
```

### Integration with Ritual Event Orchestrator

Quest steps can trigger ritual events when they are of type `ritual`.

```typescript
// Quest step with ritual type
{
  "stepType": "ritual",
  "title": "Establish Your Journaling Ritual",
  "contentMarkdown": "Create your sacred practice...",
  "meta": {
    "ritualType": "daily-journaling",
    "durationDays": 7,
    "reminderEnabled": true
  }
}
```

**Integration Flow:**
```typescript
// When member completes ritual step
async function handleRitualStepCompletion(step: QuestStep, memberId: string) {
  if (step.stepType === 'ritual') {
    // Register ritual with orchestrator
    await fetch(`${RITUAL_EVENT_ORCHESTRATOR_URL}/rituals`, {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        ritualType: step.metaJson.ritualType,
        schedule: {
          frequency: 'daily',
          durationDays: step.metaJson.durationDays,
          reminderEnabled: step.metaJson.reminderEnabled
        },
        sourceQuestStepId: step.id
      })
    });
  }
}
```

### Webhook Integration

Set up webhooks to notify external systems of quest events:

```typescript
// Example webhook payload for quest completion
POST https://your-system.com/webhooks/quest-completed
Content-Type: application/json

{
  "event": "quest.completed",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "memberId": "member-123",
    "questId": "quest-456",
    "questKey": "intro-to-mindfulness",
    "questTitle": "Introduction to Mindfulness",
    "completedAt": "2025-01-15T10:30:00Z",
    "reward": {
      "currencyCode": "KARMA",
      "amount": 100
    },
    "timeSpentMinutes": 52,
    "stepsCompleted": 4
  }
}
```

## Testing

### Run Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests in specific workspace
npm run test --workspace=apps/api
```

### Test Coverage

The test suite includes:
- **Enrollment & Progression Logic**: Sequential step unlocking, status transitions, error handling
- **Recommendation Engine**: Scoring algorithm, tag matching, difficulty alignment
- **API Endpoints**: Request validation, error responses

## Admin UI

Access the admin interface at `http://localhost:3001`

### Features

- **Quest Lines Dashboard**: View all quest lines with tags and quest counts
- **Quest Line Details**: View quests within a quest line
- **Quest Management**: Create and edit quests with steps
- **Responsive Design**: Works on desktop and mobile

### Screenshots

The admin UI provides:
- Card-based layout for quest lines
- Tag visualization
- Difficulty indicators
- Progress tracking (when implemented)

## Development

### Project Structure

```
quest-based-learning-path-engine/
├── apps/
│   ├── api/              # Fastify API server
│   │   ├── prisma/       # Database schema
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── services/ # Business logic
│   │   │   ├── __tests__/# Test files
│   │   │   └── server.ts # Entry point
│   │   └── Dockerfile
│   └── web/              # Next.js admin UI
│       ├── src/
│       │   ├── pages/    # Next.js pages
│       │   ├── lib/      # API client
│       │   └── styles/   # Global styles
│       └── Dockerfile
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml
└── package.json          # Workspace root
```

### Adding New Features

1. **Define data model** in `apps/api/prisma/schema.prisma`
2. **Generate Prisma client**: `npm run db:generate`
3. **Create migration**: `npm run db:migrate`
4. **Implement service** in `apps/api/src/services/`
5. **Add routes** in `apps/api/src/routes/`
6. **Update types** in `packages/shared/src/types.ts`
7. **Write tests** in `apps/api/src/__tests__/`

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed database
npm run db:seed

# Open Prisma Studio (DB GUI)
npm run db:studio
```

## Deployment

### Environment Variables

Production environment requires:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# API
API_PORT=3000
API_HOST=0.0.0.0
NODE_ENV=production

# External Services
SOUL_PROFILE_REGISTRY_URL=https://soul-profile-api.example.com
CURRENCY_ECONOMY_CORE_URL=https://currency-api.example.com
RITUAL_EVENT_ORCHESTRATOR_URL=https://ritual-api.example.com

# Web UI
NEXT_PUBLIC_API_URL=https://quest-api.example.com
```

### Docker Production Build

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Manual Deployment

```bash
# Build API
cd apps/api
npm run build
npm run db:migrate:deploy
npm start

# Build Web UI
cd apps/web
npm run build
npm start
```

## Roadmap

### Planned Features

- [ ] Quest prerequisites (quest must be completed before another)
- [ ] Branching quest paths (choose your own adventure)
- [ ] Group quests (complete with others)
- [ ] Quest templates for rapid creation
- [ ] Analytics dashboard
- [ ] Member achievements and badges
- [ ] Quest versioning and drafts
- [ ] A/B testing for quest variations
- [ ] Mobile app integration
- [ ] Gamification leaderboards

## Contributing

This is a production-ready template. Feel free to:
- Fork and adapt for your use case
- Add features and submit PRs
- Report issues and bugs
- Improve documentation

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Open a GitHub issue
- Check the API documentation
- Review test files for usage examples

---

**Built with ❤️ for learning communities**
