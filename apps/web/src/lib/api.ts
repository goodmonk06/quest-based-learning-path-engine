const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface QuestLine {
  id: string;
  key: string;
  title: string;
  descriptionMarkdown: string;
  themeTagsJson: {
    tags: string[];
    categories?: string[];
  };
  quests?: Quest[];
}

export interface Quest {
  id: string;
  questLineId: string;
  key: string;
  title: string;
  summaryMarkdown: string;
  difficulty: number;
  estimatedMinutes: number;
  requiredTagsJson: {
    required?: string[];
    preferred?: string[];
  };
  rewardJson: {
    currencyCode: string;
    amount: number;
    bonusMultiplier?: number;
  };
  steps?: QuestStep[];
  questLine?: {
    id: string;
    key: string;
    title: string;
  };
}

export interface QuestStep {
  id: string;
  questId: string;
  orderIndex: number;
  stepType: string;
  title: string;
  contentMarkdown: string;
  metaJson: Record<string, unknown>;
}

// Quest Lines API
export async function fetchQuestLines(): Promise<QuestLine[]> {
  const response = await fetch(`${API_URL}/api/quest-lines`);
  if (!response.ok) throw new Error('Failed to fetch quest lines');
  return response.json();
}

export async function fetchQuestLine(id: string): Promise<QuestLine> {
  const response = await fetch(`${API_URL}/api/quest-lines/${id}`);
  if (!response.ok) throw new Error('Failed to fetch quest line');
  return response.json();
}

export async function createQuestLine(data: {
  communityId: string;
  key: string;
  title: string;
  descriptionMarkdown: string;
  themeTags: { tags: string[]; categories?: string[] };
}): Promise<QuestLine> {
  const response = await fetch(`${API_URL}/api/quest-lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quest line');
  return response.json();
}

export async function updateQuestLine(
  id: string,
  data: Partial<Omit<QuestLine, 'id' | 'key' | 'communityId'>>
): Promise<QuestLine> {
  const response = await fetch(`${API_URL}/api/quest-lines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update quest line');
  return response.json();
}

export async function deleteQuestLine(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/quest-lines/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete quest line');
}

// Quests API
export async function fetchQuests(questLineId?: string): Promise<Quest[]> {
  const url = questLineId
    ? `${API_URL}/api/quests?questLineId=${questLineId}`
    : `${API_URL}/api/quests`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch quests');
  return response.json();
}

export async function fetchQuest(id: string): Promise<Quest> {
  const response = await fetch(`${API_URL}/api/quests/${id}`);
  if (!response.ok) throw new Error('Failed to fetch quest');
  return response.json();
}

export async function createQuest(data: Omit<Quest, 'id'>): Promise<Quest> {
  const response = await fetch(`${API_URL}/api/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quest');
  return response.json();
}

export async function updateQuest(
  id: string,
  data: Partial<Omit<Quest, 'id' | 'key' | 'questLineId'>>
): Promise<Quest> {
  const response = await fetch(`${API_URL}/api/quests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update quest');
  return response.json();
}

export async function deleteQuest(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/quests/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete quest');
}

// Quest Steps API
export async function createQuestStep(
  questId: string,
  data: Omit<QuestStep, 'id' | 'questId'>
): Promise<QuestStep> {
  const response = await fetch(`${API_URL}/api/quests/${questId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quest step');
  return response.json();
}
