'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Paper } from '../api/search/route';
import type {
  ResearchKeyword,
  Cluster,
  ResearchGuideSessionState,
} from '../features/research-guide';
import {
  EXTRACT_KEYWORDS_API_PATH,
  CLUSTER_API_PATH,
  canCluster,
} from '../features/research-guide';

interface UseResearchGuideProps {
  candidatePapers: Paper[];
  onSearch: (query: string) => void;
}

interface UseResearchGuideReturn {
  seedPaper: Paper | null;
  seedDescription: string;
  setSeedPaper: (paper: Paper) => void;
  clearSeedPaper: () => void;
  keywords: ResearchKeyword[];
  isExtractingKeywords: boolean;
  searchByKeyword: (keyword: ResearchKeyword) => void;
  clusters: Cluster[];
  isClustering: boolean;
  activeClusterIndex: number | null;
  setActiveCluster: (index: number | null) => void;
  searchedViaKeyword: boolean;
  getFilteredPapers: (papers: Paper[]) => Paper[];
  getSessionState: () => ResearchGuideSessionState;
  restoreState: (state: ResearchGuideSessionState, allPapers: Paper[]) => void;
  reset: () => void;
}

export function useResearchGuide({
  candidatePapers,
  onSearch,
}: UseResearchGuideProps): UseResearchGuideReturn {
  const [seedPaper, setSeedPaperState] = useState<Paper | null>(null);
  const [seedDescription, setSeedDescription] = useState('');
  const [keywords, setKeywords] = useState<ResearchKeyword[]>([]);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isClustering, setIsClustering] = useState(false);
  const [activeClusterIndex, setActiveClusterIndex] = useState<number | null>(null);
  const [searchedViaKeyword, setSearchedViaKeyword] = useState(false);

  const extractAbortRef = useRef<AbortController | null>(null);
  const clusterAbortRef = useRef<AbortController | null>(null);
  const prevCandidateLengthRef = useRef(0);

  // Seed paper setting + keyword extraction
  const setSeedPaper = useCallback((paper: Paper) => {
    // Abort previous extraction
    extractAbortRef.current?.abort();

    setSeedPaperState(paper);
    setSeedDescription('');
    setKeywords([]);
    setClusters([]);
    setActiveClusterIndex(null);
    setSearchedViaKeyword(false);

    if (!paper.abstract) return;

    const controller = new AbortController();
    extractAbortRef.current = controller;
    setIsExtractingKeywords(true);

    fetch(EXTRACT_KEYWORDS_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: paper.title, abstract: paper.abstract }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Extract keywords failed');
        return res.json();
      })
      .then(data => {
        if (!controller.signal.aborted) {
          setSeedDescription(data.seedDescription || '');
          setKeywords(data.keywords || []);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to extract keywords:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsExtractingKeywords(false);
        }
      });
  }, []);

  const clearSeedPaper = useCallback(() => {
    extractAbortRef.current?.abort();
    clusterAbortRef.current?.abort();
    setSeedPaperState(null);
    setSeedDescription('');
    setKeywords([]);
    setClusters([]);
    setActiveClusterIndex(null);
    setSearchedViaKeyword(false);
  }, []);

  // Keyword search
  const searchByKeyword = useCallback((keyword: ResearchKeyword) => {
    setSearchedViaKeyword(true);
    setClusters([]);
    setActiveClusterIndex(null);
    onSearch(keyword.keyword);
  }, [onSearch]);

  // Auto-cluster when candidatePapers change after keyword search
  useEffect(() => {
    if (!searchedViaKeyword) return;
    if (candidatePapers.length === prevCandidateLengthRef.current) return;
    prevCandidateLengthRef.current = candidatePapers.length;

    if (!canCluster(candidatePapers.length)) return;

    // Abort previous clustering
    clusterAbortRef.current?.abort();
    const controller = new AbortController();
    clusterAbortRef.current = controller;
    setIsClustering(true);

    const papers = candidatePapers.map(p => ({
      title: p.title,
      abstract: p.abstract,
    }));

    fetch(CLUSTER_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papers }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Clustering failed');
        return res.json();
      })
      .then(data => {
        if (!controller.signal.aborted) {
          setClusters(data.clusters || []);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to cluster papers:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsClustering(false);
        }
      });
  }, [candidatePapers, searchedViaKeyword]);

  // Filter papers by active cluster
  const getFilteredPapers = useCallback((papers: Paper[]): Paper[] => {
    if (activeClusterIndex === null || !clusters[activeClusterIndex]) {
      return papers;
    }
    const indices = new Set(clusters[activeClusterIndex].paperIndices);
    return papers.filter((_, i) => indices.has(i));
  }, [activeClusterIndex, clusters]);

  // Session state getter
  const getSessionState = useCallback((): ResearchGuideSessionState => ({
    seedPaperId: seedPaper?.paperId ?? null,
    seedDescription,
    keywords,
    clusters,
    activeClusterIndex,
    searchedViaKeyword,
  }), [seedPaper, seedDescription, keywords, clusters, activeClusterIndex, searchedViaKeyword]);

  // Restore from session
  const restoreState = useCallback((state: ResearchGuideSessionState, allPapers: Paper[]) => {
    if (state.seedPaperId) {
      const seed = allPapers.find(p => p.paperId === state.seedPaperId);
      if (seed) setSeedPaperState(seed);
    } else {
      setSeedPaperState(null);
    }
    setSeedDescription(state.seedDescription || '');
    setKeywords(state.keywords || []);
    setClusters(state.clusters || []);
    setActiveClusterIndex(state.activeClusterIndex ?? null);
    setSearchedViaKeyword(state.searchedViaKeyword || false);
  }, []);

  // Reset
  const reset = useCallback(() => {
    extractAbortRef.current?.abort();
    clusterAbortRef.current?.abort();
    setSeedPaperState(null);
    setSeedDescription('');
    setKeywords([]);
    setClusters([]);
    setActiveClusterIndex(null);
    setSearchedViaKeyword(false);
    setIsExtractingKeywords(false);
    setIsClustering(false);
    prevCandidateLengthRef.current = 0;
  }, []);

  return {
    seedPaper,
    seedDescription,
    setSeedPaper,
    clearSeedPaper,
    keywords,
    isExtractingKeywords,
    searchByKeyword,
    clusters,
    isClustering,
    activeClusterIndex,
    setActiveCluster: setActiveClusterIndex,
    searchedViaKeyword,
    getFilteredPapers,
    getSessionState,
    restoreState,
    reset,
  };
}
