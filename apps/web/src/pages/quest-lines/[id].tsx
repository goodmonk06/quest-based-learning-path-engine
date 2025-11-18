import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchQuestLine, QuestLine } from '../../lib/api';
import ReactMarkdown from 'react-markdown';

export default function QuestLineDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [questLine, setQuestLine] = useState<QuestLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadQuestLine(id);
    }
  }, [id]);

  const loadQuestLine = async (questLineId: string) => {
    try {
      setLoading(true);
      const data = await fetchQuestLine(questLineId);
      setQuestLine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quest line');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !questLine) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error || 'Quest line not found'}</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Quest Lines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Quest Line Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{questLine.title}</h2>
            <p className="text-sm text-gray-500 mb-4">Key: {questLine.key}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {questLine.themeTagsJson.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose max-w-none">
              <ReactMarkdown>{questLine.descriptionMarkdown}</ReactMarkdown>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Quests</h3>
            <Link
              href={`/quests/new?questLineId=${questLine.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Quest
            </Link>
          </div>

          {questLine.quests && questLine.quests.length > 0 ? (
            <div className="space-y-4">
              {questLine.quests.map((quest) => (
                <Link
                  key={quest.id}
                  href={`/quests/${quest.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{quest.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">Key: {quest.key}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Difficulty: {quest.difficulty}/5</span>
                        <span>•</span>
                        <span>~{quest.estimatedMinutes} minutes</span>
                        {quest.steps && (
                          <>
                            <span>•</span>
                            <span>{quest.steps.length} steps</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No quests yet. Add your first quest!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
