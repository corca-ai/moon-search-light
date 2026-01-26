import { useState, useEffect, useCallback, useRef } from 'react';
import type { Paper } from '../api/search/route';
import {
  cosineSimilarity,
  averageEmbedding,
  prepareTextForEmbedding
} from '../lib/vector-similarity';

interface UseRelevanceScoreProps {
  selectedPapers: Paper[];
  candidatePapers: Paper[];
}

interface UseRelevanceScoreReturn {
  relevanceScores: Record<string, number>;
  isCalculating: boolean;
}

// Cache embeddings to avoid recalculation
const embeddingCache = new Map<string, number[]>();

export function useRelevanceScore({
  selectedPapers,
  candidatePapers,
}: UseRelevanceScoreProps): UseRelevanceScoreReturn {
  const [relevanceScores, setRelevanceScores] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEmbeddings = useCallback(async (
    papers: Paper[],
    signal: AbortSignal
  ): Promise<Map<string, number[]>> => {
    const result = new Map<string, number[]>();
    const papersToFetch: Paper[] = [];

    // Check cache first
    for (const paper of papers) {
      const cached = embeddingCache.get(paper.paperId);
      if (cached) {
        result.set(paper.paperId, cached);
      } else {
        papersToFetch.push(paper);
      }
    }

    if (papersToFetch.length === 0) {
      return result;
    }

    // Prepare texts for embedding
    const texts = papersToFetch.map(p =>
      prepareTextForEmbedding(p.title, p.abstract)
    );

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch embeddings');
      }

      const { embeddings } = await response.json();

      // Store in cache and result
      papersToFetch.forEach((paper, idx) => {
        const embedding = embeddings[idx];
        embeddingCache.set(paper.paperId, embedding);
        result.set(paper.paperId, embedding);
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      console.error('Error fetching embeddings:', error);
    }

    return result;
  }, []);

  const calculateScores = useCallback(async () => {
    // Need at least 1 selected paper to calculate relevance
    if (selectedPapers.length === 0 || candidatePapers.length === 0) {
      setRelevanceScores({});
      return;
    }

    // Abort previous calculation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsCalculating(true);

    try {
      // Fetch embeddings for selected papers
      const selectedEmbeddings = await fetchEmbeddings(selectedPapers, signal);

      // Fetch embeddings for candidate papers (최대 20개로 제한하여 API 비용 절감)
      const limitedCandidates = candidatePapers.slice(0, 20);
      const candidateEmbeddings = await fetchEmbeddings(limitedCandidates, signal);

      if (signal.aborted) return;

      // Calculate average embedding of selected papers
      const selectedEmbeddingArray = Array.from(selectedEmbeddings.values());
      if (selectedEmbeddingArray.length === 0) {
        setRelevanceScores({});
        return;
      }

      const avgSelected = averageEmbedding(selectedEmbeddingArray);

      // Calculate relevance scores for each candidate
      const scores: Record<string, number> = {};
      for (const paper of candidatePapers) {
        const embedding = candidateEmbeddings.get(paper.paperId);
        if (embedding) {
          const similarity = cosineSimilarity(embedding, avgSelected);
          // Convert from [-1, 1] to [0, 100] percentage
          scores[paper.paperId] = Math.round(((similarity + 1) / 2) * 100);
        }
      }

      if (!signal.aborted) {
        setRelevanceScores(scores);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error calculating relevance scores:', error);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPapers, candidatePapers, fetchEmbeddings]);

  // Recalculate when selected papers change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateScores();
    }, 300); // Debounce

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [calculateScores]);

  return {
    relevanceScores,
    isCalculating,
  };
}
