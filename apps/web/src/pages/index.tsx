import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchQuestLines, QuestLine } from '../lib/api';

export default function Home() {
  const [questLines, setQuestLines] = useState<QuestLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestLines();
  }, []);

  const loadQuestLines = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestLines();
      setQuestLines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quest lines');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Quest Engine Admin</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Quest Lines</h2>
            <Link
              href="/quest-lines/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Create Quest Line
            </Link>
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading quest lines...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && questLines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No quest lines found. Create your first one!</p>
            </div>
          )}

          {!loading && !error && questLines.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {questLines.map((questLine) => (
                <Link
                  key={questLine.id}
                  href={`/quest-lines/${questLine.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {questLine.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Key: {questLine.key}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {questLine.themeTagsJson.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {questLine.quests && (
                    <p className="text-sm text-gray-600">
                      {questLine.quests.length} quest{questLine.quests.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
