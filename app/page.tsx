'use client';

import { useState, useEffect } from 'react';
import type { Paper } from './api/search/route';

interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
}

export default function Home() {
  const [positiveQuery, setPositiveQuery] = useState('');
  const [negativeQuery, setNegativeQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [candidatePapers, setCandidatePapers] = useState<Paper[]>([]);
  const [rightPapers, setRightPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [analyses, setAnalyses] = useState<Record<string, PaperAnalysis>>({});
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [paperEmbeddings, setPaperEmbeddings] = useState<Record<string, number[]>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positiveQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/search?positive=${encodeURIComponent(positiveQuery)}&negative=${encodeURIComponent(negativeQuery)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch papers');
      }

      setCandidatePapers(data.papers);
      setRightPapers(data.excludedPapers || []);
      setTotal(data.total);

      // Store all 300 papers (included + excluded)
      const all300Papers = [...(data.allPapers || [])];
      setAllPapers(all300Papers);

      // Create embeddings for all 300 papers
      if (all300Papers.length > 0) {
        const embedResponse = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ papers: all300Papers }),
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          const embeddingsMap: Record<string, number[]> = {};
          all300Papers.forEach((paper, idx) => {
            embeddingsMap[paper.paperId] = embedData.embeddings[idx];
          });
          setPaperEmbeddings(embeddingsMap);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCandidatePapers([]);
      setRightPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const moveToSelected = (paper: Paper) => {
    setSelectedPapers([...selectedPapers, paper]);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
  };

  const moveToCandidate = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setSelectedPapers(selectedPapers.filter(p => p.paperId !== paper.paperId));
  };

  const addKeywordToSearch = (keyword: string) => {
    const currentKeywords = positiveQuery.trim();
    const keywordLower = keyword.toLowerCase();

    // Check if keyword already exists (case-insensitive)
    const existingKeywords = currentKeywords.split(/\s+/).map(k => k.toLowerCase());
    if (existingKeywords.includes(keywordLower)) {
      return; // Don't add duplicate
    }

    if (currentKeywords) {
      setPositiveQuery(`${currentKeywords} ${keyword}`);
    } else {
      setPositiveQuery(keyword);
    }
  };

  // Calculate cosine similarity between two vectors
  const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  // Re-rank papers based on similarity to selected papers and citation count
  useEffect(() => {
    if (selectedPapers.length === 0 || Object.keys(paperEmbeddings).length === 0) {
      return;
    }

    // Calculate average embedding of selected papers
    const selectedEmbeddings = selectedPapers
      .map(p => paperEmbeddings[p.paperId])
      .filter(e => e);

    if (selectedEmbeddings.length === 0) return;

    const avgEmbedding = selectedEmbeddings[0].map((_, i) =>
      selectedEmbeddings.reduce((sum, emb) => sum + emb[i], 0) / selectedEmbeddings.length
    );

    // Calculate combined score for all papers
    const allPapersWithScore = allPapers.map(paper => {
      const embedding = paperEmbeddings[paper.paperId];
      if (!embedding) return { paper, score: 0 };

      // Semantic similarity score (0-1)
      const similarity = cosineSimilarity(avgEmbedding, embedding);

      // Citation score (normalized using log scale)
      const maxCitations = Math.max(...allPapers.map(p => p.citationCount));
      const citationScore = maxCitations > 0
        ? Math.log(paper.citationCount + 1) / Math.log(maxCitations + 1)
        : 0;

      // Combined score: 60% similarity, 40% citations
      const combinedScore = similarity * 0.6 + citationScore * 0.4;

      return { paper, score: combinedScore };
    });

    // Sort by score and update candidate papers (exclude already selected)
    const selectedIds = new Set(selectedPapers.map(p => p.paperId));
    const reranked = allPapersWithScore
      .filter(({ paper }) => !selectedIds.has(paper.paperId))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ paper }) => paper);

    setCandidatePapers(reranked);
  }, [selectedPapers, paperEmbeddings]);

  const fetchAnalysis = async (paper: Paper) => {
    if (!paper.abstract || analyses[paper.paperId]) return;

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAnalyses(prev => ({
          ...prev,
          [paper.paperId]: analysis,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    }
  };

  const processPapersInBatches = async (papers: Paper[]) => {
    const batchSize = 3;
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      await Promise.all(batch.map(paper => fetchAnalysis(paper)));
    }
  };

  useEffect(() => {
    const leftPapers = [...selectedPapers, ...candidatePapers];
    if (leftPapers.length > 0) {
      processPapersInBatches(leftPapers);
    }
  }, [selectedPapers, candidatePapers]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Paper Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by Semantic Scholar
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Positive Keywords
              </label>
              <input
                type="text"
                value={positiveQuery}
                onChange={(e) => setPositiveQuery(e.target.value)}
                placeholder="포함할 키워드..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Negative Keywords
              </label>
              <input
                type="text"
                value={negativeQuery}
                onChange={(e) => setNegativeQuery(e.target.value)}
                placeholder="제외할 키워드..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Split into Selected and Candidate */}
          <div className="space-y-6">
            {/* Top: Selected Papers */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Selected Papers
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  읽기로 확정한 논문 ({selectedPapers.length}개)
                </p>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedPapers.map((paper) => (
                  <div
                    key={paper.paperId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                        {paper.title}
                      </h3>
                      <button
                        onClick={() => moveToCandidate(paper)}
                        className="ml-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm"
                        title="아래로 내리기"
                      >
                        ↓
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {paper.year && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {paper.year}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        인용: {paper.citationCount}
                      </span>
                    </div>

                    {paper.authors && paper.authors.length > 0 && (
                      <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                        <strong>저자:</strong> {paper.authors.map((a) => a.name).join(', ')}
                      </div>
                    )}

                    {analyses[paper.paperId] ? (
                      <>
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded space-y-2">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            분석 (AI)
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              개요
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].overview}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              연구 목표
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].goals}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              방법론
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].method}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              결과
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].results}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            키워드
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {analyses[paper.paperId].keywords.map((keyword, idx) => (
                              <button
                                key={idx}
                                onClick={() => addKeywordToSearch(keyword)}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
                                title="클릭하여 검색에 추가"
                              >
                                {keyword}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : paper.abstract ? (
                      <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic">
                        분석 중...
                      </div>
                    ) : null}

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        논문 보기 →
                      </a>
                    )}
                  </div>
                ))}
                {selectedPapers.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    후보 논문에서 위로 올려 선택하세요.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Candidate Papers */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Candidate Papers
                </h2>
                {total > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    총 {total.toLocaleString()}개 중 필터링된 결과 ({candidatePapers.length}개)
                  </p>
                )}
              </div>
              <div className="space-y-4">
                {candidatePapers.map((paper) => (
                  <div
                    key={paper.paperId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                        {paper.title}
                      </h3>
                      <button
                        onClick={() => moveToSelected(paper)}
                        className="ml-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                        title="위로 올리기"
                      >
                        ↑
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {paper.year && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {paper.year}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        인용: {paper.citationCount}
                      </span>
                    </div>

                    {paper.authors && paper.authors.length > 0 && (
                      <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                        <strong>저자:</strong> {paper.authors.map((a) => a.name).join(', ')}
                      </div>
                    )}

                    {analyses[paper.paperId] ? (
                      <>
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded space-y-2">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            분석 (AI)
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              개요
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].overview}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              연구 목표
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].goals}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              방법론
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].method}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              결과
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {analyses[paper.paperId].results}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            키워드
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {analyses[paper.paperId].keywords.map((keyword, idx) => (
                              <button
                                key={idx}
                                onClick={() => addKeywordToSearch(keyword)}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
                                title="클릭하여 검색에 추가"
                              >
                                {keyword}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : paper.abstract ? (
                      <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic">
                        분석 중...
                      </div>
                    ) : null}

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        논문 보기 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {candidatePapers.length === 0 && !loading && !error && (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
                  Positive 키워드를 입력하여 논문을 찾아보세요.
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Excluded Results */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Excluded Results
              </h2>
              {rightPapers.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Negative 키워드로 제외된 논문 ({rightPapers.length}개)
                </p>
              )}
            </div>
            <div className="space-y-4">
              {rightPapers.map((paper) => (
                <div
                  key={paper.paperId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow opacity-75"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {paper.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    {paper.year && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {paper.year}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      인용: {paper.citationCount}
                    </span>
                  </div>

                  {paper.authors && paper.authors.length > 0 && (
                    <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                      <strong>저자:</strong> {paper.authors.map((a) => a.name).join(', ')}
                    </div>
                  )}

                  {paper.abstract && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}

                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      논문 보기 →
                    </a>
                  )}
                </div>
              ))}
            </div>
            {rightPapers.length === 0 && !loading && !error && negativeQuery && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
                제외된 논문이 없습니다.
              </div>
            )}
            {rightPapers.length === 0 && !loading && !error && !negativeQuery && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
                Negative 키워드를 입력하면 제외된 논문이 여기에 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
