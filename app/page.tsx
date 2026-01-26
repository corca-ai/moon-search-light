'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import posthog from 'posthog-js';
import type { Paper } from './api/search/route';
import { SelectedPapersSection } from './components/SelectedPapersSection';
import { SearchResultCard } from './components/SearchResultCard';
import { PaperDetailModal } from './components/PaperDetailModal';
import { NoteSidebar } from './components/NoteSidebar';
import { styles } from './components/styles';
import { useSessionManager } from './hooks/useSessionManager';
import { useResearchAssistant } from './hooks/useResearchAssistant';
import { useRelevanceScore } from './hooks/useRelevanceScore';
import type { PaperAnalysis, ChatMessage, ContextSummary } from './types/session';
import { SessionStorageError } from './lib/session-storage';

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [candidatePapers, setCandidatePapers] = useState<Paper[]>([]);
  const [excludedPapers, setExcludedPapers] = useState<Paper[]>([]);
  const [excludedExpanded, setExcludedExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [analyses, setAnalyses] = useState<Record<string, PaperAnalysis>>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'recommended' | 'year-desc' | 'year-asc' | 'citations'>('recommended');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());
  const [failedSummarizeIds, setFailedSummarizeIds] = useState<Set<string>>(new Set());
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [interestSummary, setInterestSummary] = useState('');
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [displayCount, setDisplayCount] = useState(20);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showResearchOverview, setShowResearchOverview] = useState(false);

  // Email identification
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Error toast state
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Error handler for session operations
  const handleSessionError = useCallback((error: SessionStorageError) => {
    setErrorToast(error.message);
    setTimeout(() => setErrorToast(null), 5000);
  }, []);

  // Session management (unified hook)
  const {
    session,
    isLoading: isSessionLoading,
    sessionList,
    createNewSession,
    renameSession,
    deleteSession: deleteSessionById,
    switchSession,
    refreshSessionList,
    recordSearch,
    recordPaperSelected,
    recordPaperExcluded,
    recordPaperRestored,
    recordAnalysisDone,
    recordTranslationDone,
    recordChatUser,
    recordChatAssistant,
    updateInterestSummary: updateSessionInterestSummary,
    updateContextSummary,
    updateAssistantActive: updateSessionAssistantActive,
    updateSortBy: updateSessionSortBy,
    updateSearchResults,
  } = useSessionManager({
    onError: handleSessionError,
    enableSync: true,
  });

  // Research Assistant
  const {
    isActive: assistantActive,
    isLoading: chatLoading,
    chatMessages,
    activate: activateAssistant,
    deactivate: deactivateAssistant,
    setChatMessages,
    setIsLoading: setChatLoading,
    reset: resetAssistant,
    restoreState: restoreAssistantState,
  } = useResearchAssistant({
    selectedPapers,
    interestSummary,
    onActiveChange: updateSessionAssistantActive,
  });

  // Relevance score calculation (vector similarity)
  const { relevanceScores, isCalculating: isCalculatingRelevance } = useRelevanceScore({
    selectedPapers,
    candidatePapers,
  });

  // Check localStorage for email on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      posthog.identify(storedEmail, { email: storedEmail });
    } else {
      setShowEmailModal(true);
    }
  }, []);

  // Restore state from session when loaded
  useEffect(() => {
    if (session && !isSessionLoading) {
      const state = session.state;
      setQuery(state.query);
      setSortBy(state.sortBy as typeof sortBy);
      setSelectedPapers(state.selectedPapers);
      setExcludedPapers(state.excludedPapers);
      setAnalyses(state.analyses);
      setTranslations(state.translations);
      setInterestSummary(state.interestSummary);
      setContextSummary(state.contextSummary);
      restoreAssistantState(state.assistantActive, state.chatMessages);
      // Restore search results
      const searchResults = state.searchResults || [];
      setAllPapers(searchResults);
      // Calculate candidate papers (not selected, not excluded)
      const selectedIds = new Set(state.selectedPapers.map(p => p.paperId));
      const excludedIds = new Set(state.excludedPapers.map(p => p.paperId));
      const candidates = searchResults.filter(p => !selectedIds.has(p.paperId) && !excludedIds.has(p.paperId));
      setCandidatePapers(candidates.slice(0, 20));
      setDisplayCount(20);
      refreshSessionList();
      // 세션 복원 완료
      setTimeout(() => setIsRestoringSession(false), 100);
    }
  }, [session?.id, isSessionLoading]);

  // Handle session switch
  const handleSessionSwitch = (id: string) => {
    const result = switchSession(id);
    if (result.success) {
      // Clear current state
      setCandidatePapers([]);
      setAllPapers([]);
      setDisplayCount(20);
      resetAssistant();

      posthog.capture('note_switched', {
        note_id: id,
        note_name: result.session.name,
      });
    }
  };

  // Handle create new session
  const handleCreateNewSession = () => {
    // Generate unique name with number suffix
    const baseName = '새 연구';
    const existingNames = new Set(sessionList.map(s => s.name));
    let newName = baseName;
    let counter = 2;

    while (existingNames.has(newName)) {
      newName = `${baseName} ${counter}`;
      counter++;
    }

    const result = createNewSession(newName);

    if (!result.success) {
      // Session limit reached
      setErrorToast(`연구 노트는 최대 ${result.max}개까지 저장할 수 있습니다. 기존 노트를 삭제한 후 다시 시도해주세요.`);
      setTimeout(() => setErrorToast(null), 5000);
      posthog.capture('note_creation_blocked', {
        reason: 'limit_reached',
        current_count: result.current,
        max_count: result.max,
      });
      return;
    }

    // Clear state for new session
    setQuery('');
    setSelectedPapers([]);
    setCandidatePapers([]);
    setExcludedPapers([]);
    setAllPapers([]);
    setAnalyses({});
    setTranslations({});
    setInterestSummary('');
    setDisplayCount(20);
    resetAssistant();

    posthog.capture('note_created', { note_name: result.session.name });
  };

  // Handle delete session
  const handleDeleteSession = (id: string) => {
    const isCurrentSession = session?.id === id;
    const result = deleteSessionById(id);

    if (result.success && isCurrentSession && result.newSession) {
      // Clear state for new session
      setQuery('');
      setSelectedPapers([]);
      setCandidatePapers([]);
      setExcludedPapers([]);
      setAllPapers([]);
      setAnalyses({});
      setTranslations({});
      setInterestSummary('');
      setDisplayCount(20);
      resetAssistant();
    }

    posthog.capture('note_deleted', { note_id: id });
  };

  // Handle rename session
  const handleRenameSession = (id: string, newName: string) => {
    renameSession(id, newName);
    posthog.capture('note_renamed', { note_id: id, new_name: newName });
  };

  // Handle title edit start
  const handleStartTitleEdit = () => {
    setEditingTitleValue(session?.name ?? '');
    setIsEditingTitle(true);
  };

  // Handle title edit save
  const handleSaveTitleEdit = () => {
    const trimmed = editingTitleValue.trim();
    if (trimmed && session?.id) {
      handleRenameSession(session.id, trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleEmailSubmit = () => {
    const email = emailInput.trim();
    if (!email || !email.includes('@')) return;

    localStorage.setItem('userEmail', email);
    setUserEmail(email);
    setShowEmailModal(false);

    // PostHog: Identify user
    posthog.identify(email, { email: email });
    posthog.capture('user_identified', { email: email });
  };

  const addSystemMessage = (message: string) => {
    if (assistantActive) {
      setChatMessages(prev => [...prev, { role: 'system', content: message, timestamp: Date.now() }]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setExcludedPapers([]);
    setDisplayCount(20); // 새 검색 시 초기화

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        headers: userEmail ? { 'x-user-email': userEmail } : {},
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch papers');

      const papers = [...(data.allPapers || data.papers || [])];

      if (papers.length > 0) {
        const titles = papers.map(p => p.title);
        const snapshotResponse = await fetch('/api/paper-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles }),
        });

        if (snapshotResponse.ok) {
          const snapshotData = await snapshotResponse.json();
          papers.forEach(paper => {
            if (snapshotData[paper.title]) {
              paper.snapshots = snapshotData[paper.title].snapshots;
                paper.pdfUrl = snapshotData[paper.title].pdfUrl;
            }
          });
        }
      }

      setAllPapers(papers);
      setCandidatePapers(papers.slice(0, 20));
      setTotal(data.total);
      addSystemMessage(`"${query}" 검색 → ${papers.length}개 결과`);

      // Record activity with search results
      recordSearch(query, papers.length, papers);

      // PostHog: Track paper search
      posthog.capture('paper_searched', {
        query: query,
        results_count: papers.length,
        total_available: data.total,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setAllPapers([]);
      setCandidatePapers([]);

      // PostHog: Capture search error
      posthog.captureException(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const moveToSelected = (paper: Paper) => {
    const newSelected = [...selectedPapers, paper];
    setSelectedPapers(newSelected);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`선택: ${paper.title.slice(0, 40)}...`);

    // Record activity
    recordPaperSelected(paper, newSelected);

    // PostHog: Track paper selection
    posthog.capture('paper_selected', {
      paper_id: paper.paperId,
      paper_title: paper.title,
      paper_year: paper.year,
      citation_count: paper.citationCount,
      selected_papers_count: newSelected.length,
    });
  };

  const moveToCandidate = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setSelectedPapers(selectedPapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`선택해제: ${paper.title.slice(0, 40)}...`);
  };

  const excludePaper = (paper: Paper) => {
    const newExcluded = [...excludedPapers, paper];
    setExcludedPapers(newExcluded);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`검토 완료: ${paper.title.slice(0, 40)}...`);

    // Record activity
    recordPaperExcluded(paper, newExcluded);

    // PostHog: Track paper exclusion
    posthog.capture('paper_excluded', {
      paper_id: paper.paperId,
      paper_title: paper.title,
      excluded_papers_count: newExcluded.length,
    });
  };

  const restorePaper = (paper: Paper) => {
    const newCandidates = [...candidatePapers, paper];
    const newExcluded = excludedPapers.filter(p => p.paperId !== paper.paperId);
    setCandidatePapers(newCandidates);
    setExcludedPapers(newExcluded);
    addSystemMessage(`다시 검토: ${paper.title.slice(0, 40)}...`);

    // Record activity
    recordPaperRestored(paper, selectedPapers, newExcluded);

    // PostHog: Track paper restoration
    posthog.capture('paper_restored', {
      paper_id: paper.paperId,
      paper_title: paper.title,
    });
  };

  const loadMorePapers = () => {
    const newCount = displayCount + 20;
    setDisplayCount(newCount);
    // 제외된 논문과 선택된 논문을 필터링
    const selectedIds = new Set(selectedPapers.map(p => p.paperId));
    const excludedIds = new Set(excludedPapers.map(p => p.paperId));
    const availablePapers = allPapers.filter(p => !selectedIds.has(p.paperId) && !excludedIds.has(p.paperId));
    setCandidatePapers(availablePapers.slice(0, newCount));

    // PostHog: Track load more papers
    posthog.capture('load_more_papers_clicked', {
      new_display_count: newCount,
      remaining_papers: allPapers.length - selectedPapers.length - excludedPapers.length - newCount,
    });
  };

  const sortPapers = (papers: Paper[], sortType: typeof sortBy): Paper[] => {
    const sorted = [...papers];
    const currentYear = new Date().getFullYear();

    switch (sortType) {
      case 'recommended':
        // 최근 연구 우선 + 인용수 높은 중요 연구 반영
        return sorted.sort((a, b) => {
          const yearA = a.year || 2000;
          const yearB = b.year || 2000;
          const citationsA = a.citationCount || 0;
          const citationsB = b.citationCount || 0;

          // 연도 점수: 구간별 가중치
          const getYearScore = (year: number) => {
            const age = currentYear - year;
            if (age <= 1) return 1.0;      // 0-1년: 최고 가중치
            if (age <= 5) return 0.8;      // 1-5년: 높은 가중치
            if (age <= 10) return 0.5;     // 5-10년: 중간 가중치
            if (age <= 15) return 0.25;    // 10-15년: 낮은 가중치
            return 0.1;                     // 15년+: 최소 가중치
          };

          const yearScoreA = getYearScore(yearA);
          const yearScoreB = getYearScore(yearB);

          // 인용수 점수: 로그 스케일로 정규화 (영향력 있는 논문)
          const citationScoreA = Math.log10(citationsA + 1) / 5;
          const citationScoreB = Math.log10(citationsB + 1) / 5;

          // 종합 점수: 연도 60% + 인용수 40%
          const scoreA = yearScoreA * 0.6 + citationScoreA * 0.4;
          const scoreB = yearScoreB * 0.6 + citationScoreB * 0.4;

          return scoreB - scoreA;
        });
      case 'year-desc': return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'year-asc': return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
      case 'citations': return sorted.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
      default: return sorted;
    }
  };

  const fetchAnalysis = async (paper: Paper) => {
    if (!paper.abstract || analyses[paper.paperId]) return;

    // 이미 요약 중이거나 실패한 논문은 건너뛰기
    if (summarizingIds.has(paper.paperId) || failedSummarizeIds.has(paper.paperId)) return;

    setSummarizingIds(prev => new Set(prev).add(paper.paperId));

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userEmail ? { 'x-user-email': userEmail } : {}),
        },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract }),
      });
      if (response.ok) {
        const analysis = await response.json();
        setAnalyses(prev => {
          const newAnalyses = { ...prev, [paper.paperId]: analysis };
          recordAnalysisDone(paper.paperId, analysis, newAnalyses);
          return newAnalyses;
        });
      } else {
        // API 오류 시 실패 목록에 추가
        setFailedSummarizeIds(prev => new Set(prev).add(paper.paperId));
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      // 네트워크 오류 시 실패 목록에 추가
      setFailedSummarizeIds(prev => new Set(prev).add(paper.paperId));
    } finally {
      setSummarizingIds(prev => {
        const next = new Set(prev);
        next.delete(paper.paperId);
        return next;
      });
    }
  };

  const processPapersInBatches = async (papers: Paper[]) => {
    // PostHog: Track batch summarize request
    posthog.capture('papers_summarize_requested', {
      papers_count: papers.length,
    });

    const batchSize = 3;
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      await Promise.all(batch.map(paper => fetchAnalysis(paper)));
    }
  };

  const translateAbstract = async (paperId: string, abstract: string) => {
    if (translations[paperId] || translatingIds.has(paperId)) return;

    setTranslatingIds(prev => new Set(prev).add(paperId));

    // PostHog: Track translation request
    posthog.capture('abstract_translation_requested', {
      paper_id: paperId,
    });

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: abstract }),
      });

      if (response.ok) {
        const { translation } = await response.json();
        setTranslations(prev => {
          const newTranslations = { ...prev, [paperId]: translation };
          recordTranslationDone(paperId, newTranslations);
          return newTranslations;
        });
      }
    } catch (err) {
      console.error('Failed to translate:', err);
    } finally {
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(paperId);
        return next;
      });
    }
  };

  useEffect(() => {
    // 세션 복원 중이거나 요약 중인 논문이 있으면 대기
    if (isRestoringSession || summarizingIds.size > 0) return;

    // 실패한 논문은 제외하는 필터 함수
    const canSummarize = (p: Paper) =>
      p.abstract && !analyses[p.paperId] && !summarizingIds.has(p.paperId) && !failedSummarizeIds.has(p.paperId);

    if (assistantActive) {
      // Assistant 활성 시: 선택된 논문만 요약
      const unsummarizedSelected = selectedPapers.filter(canSummarize);
      if (unsummarizedSelected.length > 0) {
        processPapersInBatches(unsummarizedSelected);
      }
    } else {
      // Assistant 비활성 시: 선택된 논문 전체 + 정렬 기준으로 상위 3개
      const unsummarizedSelected = selectedPapers.filter(canSummarize);
      const sortedCandidates = sortPapers(candidatePapers, sortBy);
      const unsummarizedCandidates = sortedCandidates.filter(canSummarize);
      const papersToSummarize = [...unsummarizedSelected, ...unsummarizedCandidates.slice(0, 3)];
      if (papersToSummarize.length > 0) {
        processPapersInBatches(papersToSummarize);
      }
    }
  }, [selectedPapers, candidatePapers, assistantActive, sortBy, analyses, summarizingIds, isRestoringSession, failedSummarizeIds]);

  const handleShowDetailPaper = (paper: Paper | null) => {
    setDetailPaper(paper);
    if (paper) {
      // PostHog: Track paper detail viewed
      posthog.capture('paper_detail_viewed', {
        paper_id: paper.paperId,
        paper_title: paper.title,
        paper_year: paper.year,
        citation_count: paper.citationCount,
      });
    }
  };

  // 관심사 요약 업데이트 (디바운스)
  useEffect(() => {
    // 세션 복원 중에는 API 호출 스킵 (이미 저장된 값 사용)
    if (isRestoringSession) return;

    if (selectedPapers.length === 0) {
      setInterestSummary('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/interest-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedTitles: selectedPapers.map(p => p.title),
          }),
        });
        if (response.ok) {
          const { summary } = await response.json();
          setInterestSummary(summary);
          updateSessionInterestSummary(summary);
        }
      } catch (err) {
        console.error('Failed to fetch interest summary:', err);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [selectedPapers, isRestoringSession]);

  // 통합 컨텍스트 분석
  const loadContextSummary = async () => {
    if (selectedPapers.length < 2) return;

    setIsLoadingContext(true);
    try {
      const response = await fetch('/api/context-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: selectedPapers }),
      });

      if (response.ok) {
        const summary = await response.json();
        setContextSummary(summary);
        updateContextSummary(summary);

        posthog.capture('context_summary_loaded', {
          papers_count: selectedPapers.length,
        });
      }
    } catch (err) {
      console.error('Failed to load context summary:', err);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    // Record activity
    recordChatUser(chatInput, newMessages);

    // PostHog: Track chat message sent
    posthog.capture('chat_message_sent', {
      message_length: chatInput.length,
      selected_papers_count: selectedPapers.length,
      chat_history_length: newMessages.length,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userEmail ? { 'x-user-email': userEmail } : {}),
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          context: { papers: selectedPapers, analyses, contextSummary },
        }),
      });

      if (!response.ok) throw new Error('Chat failed');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantContent += data.content;
              setChatMessages(prev => {
                const updatedMessages = [...prev];
                updatedMessages[updatedMessages.length - 1] = { role: 'assistant', content: assistantContent };
                return updatedMessages;
              });
            }
          }
        }
      }

      // Record assistant response
      setChatMessages(prev => {
        recordChatAssistant(assistantContent, prev);
        return prev;
      });
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateResearchOverviewMarkdown = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    let markdown = `# 후속 연구 개요\n\n`;
    markdown += `**생성일**: ${dateStr}\n\n`;
    markdown += `---\n\n`;

    // 선택된 논문 목록
    markdown += `## 분석 대상 논문 (${selectedPapers.length}개)\n\n`;
    selectedPapers.forEach((paper, idx) => {
      const analysis = analyses[paper.paperId];
      markdown += `### ${idx + 1}. ${paper.title}\n`;
      markdown += `- **연도**: ${paper.year || '미상'}\n`;
      markdown += `- **인용수**: ${paper.citationCount || 0}\n`;
      if (analysis) {
        markdown += `- **개요**: ${analysis.overview}\n`;
        markdown += `- **목표**: ${analysis.goals}\n`;
      }
      markdown += `\n`;
    });

    markdown += `---\n\n`;

    // 통합 컨텍스트 분석
    if (contextSummary) {
      markdown += `## 통합 컨텍스트 분석\n\n`;
      markdown += `### 공통 문제\n${contextSummary.commonProblem}\n\n`;
      markdown += `### 공통 방법론\n`;
      if (contextSummary.commonMethods?.length > 0) {
        contextSummary.commonMethods.forEach((m) => {
          markdown += `- ${m}\n`;
        });
      } else {
        markdown += `없음\n`;
      }
      markdown += `\n`;
      markdown += `### 주요 차이점\n`;
      if (contextSummary.differences?.length > 0) {
        contextSummary.differences.forEach((d) => {
          markdown += `- ${d}\n`;
        });
      } else {
        markdown += `없음\n`;
      }
      markdown += `\n`;
      markdown += `### 연구 지형\n${contextSummary.researchLandscape}\n\n`;
      markdown += `---\n\n`;
    }

    // 대화 내용
    markdown += `## 연구 논의 내용\n\n`;
    chatMessages.forEach((msg) => {
      if (msg.role === 'user') {
        markdown += `### 질문\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        markdown += `### AI 응답\n${msg.content}\n\n`;
      }
    });

    markdown += `---\n\n`;
    markdown += `*Moon Search Light에서 생성됨*\n`;

    return markdown;
  };

  const downloadResearchOverview = () => {
    // PostHog: Track research overview download
    posthog.capture('research_overview_downloaded', {
      selected_papers_count: selectedPapers.length,
      chat_messages_count: chatMessages.length,
    });

    const markdown = generateResearchOverviewMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-overview-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${styles.bg.primary} flex`}>
      {/* Left Sidebar */}
      <NoteSidebar
        currentSessionId={session?.id ?? null}
        currentSessionName={session?.name ?? null}
        sessionList={sessionList}
        onSelect={handleSessionSwitch}
        onCreate={handleCreateNewSession}
        onRename={handleRenameSession}
        onDelete={handleDeleteSession}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className={`${assistantActive && !sidebarCollapsed ? 'max-w-4xl' : 'max-w-6xl'} mx-auto px-6 py-6 h-screen overflow-y-auto transition-all duration-300`}>
          {/* 세션 타이틀 헤더 */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitleEdit();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  onBlur={handleSaveTitleEdit}
                  className={`text-xl font-semibold ${styles.text.primary} bg-transparent border-b-2 border-indigo-500 focus:outline-none px-1 py-0.5 min-w-[200px]`}
                  autoFocus
                />
              ) : (
                <h1
                  onClick={handleStartTitleEdit}
                  className={`text-xl font-semibold ${styles.text.primary} cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 group`}
                >
                  {session?.name ?? '새 연구'}
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 연구 개요 보기 버튼 */}
              {(contextSummary || chatMessages.filter(m => m.role !== 'system').length > 0) && (
                <button onClick={() => setShowResearchOverview(true)} className={styles.button.secondary}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    연구 개요 보기
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 선택됨 영역 (공통) */}
          <SelectedPapersSection
            selectedPapers={selectedPapers}
            excludedPapers={excludedPapers}
            excludedExpanded={excludedExpanded}
            onToggleExcluded={() => setExcludedExpanded(!excludedExpanded)}
            onMoveToCandidate={moveToCandidate}
            onRestorePaper={restorePaper}
            onShowDetail={handleShowDetailPaper}
            interestSummary={interestSummary}
          />

          {/* 검색 영역 */}
          <div className="mt-5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm p-5">
            <div className="space-y-5">
              {/* 검색 폼 */}
              <div className="space-y-3">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 ${styles.text.muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="논문 검색..."
                      className={`${styles.input.base} pl-12`}
                    />
                  </div>
                  <button type="submit" disabled={loading} className={styles.button.primary}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        검색 중
                      </span>
                    ) : '검색'}
                  </button>
                </form>
                <p className={`text-xs ${styles.text.muted}`}>
                  <a href="https://www.semanticscholar.org" target="_blank" rel="noopener noreferrer" className={styles.text.link}>Semantic Scholar</a> API 기반 검색 · 컴퓨터과학, 의학, 물리학 등 2억 건 이상의 학술 논문 데이터베이스
                </p>
              </div>

              {error && (
                <div className={`p-4 text-sm ${styles.text.secondary} ${styles.bg.tertiary} rounded-xl flex items-center gap-3`}>
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* 검색 결과 헤더 */}
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${styles.text.secondary}`}>
                  검색 결과 ({candidatePapers.length}개 표시{total > 0 && <span className={`${styles.text.muted} font-normal`}> / {total.toLocaleString()}개 중</span>})
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value as typeof sortBy;
                    setSortBy(newSort);
                    updateSessionSortBy(newSort);
                    const sortLabels: Record<string, string> = { relevance: '관련성', recommended: '추천순', 'year-desc': '최신순', citations: '인용순' };
                    addSystemMessage(`정렬 변경: ${sortLabels[newSort]}`);

                    // PostHog: Track sort order change
                    posthog.capture('sort_order_changed', {
                      sort_by: newSort,
                      sort_label: sortLabels[newSort],
                      candidate_papers_count: candidatePapers.length,
                    });
                  }}
                  className={`text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 ${styles.text.secondary} focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all`}
                >
                  <option value="recommended">추천순</option>
                  <option value="relevance">관련성</option>
                  <option value="year-desc">최신순</option>
                  <option value="citations">인용순</option>
                </select>
              </div>

              {/* 검색 결과 */}
              <div className={`space-y-4 overflow-y-auto scrollbar-thin pr-1 ${assistantActive ? 'max-h-[calc(100vh-480px)]' : 'max-h-[calc(100vh-420px)]'}`}>
                {sortPapers(candidatePapers, sortBy).map(paper => (
                  <SearchResultCard
                    key={paper.paperId}
                    paper={paper}
                    analysis={analyses[paper.paperId]}
                    translation={translations[paper.paperId]}
                    isTranslating={translatingIds.has(paper.paperId)}
                    relevanceScore={relevanceScores[paper.paperId]}
                    onSelect={moveToSelected}
                    onExclude={excludePaper}
                    onImageClick={(url) => setModalImage(url)}
                    onTranslate={translateAbstract}
                  />
                ))}
                {candidatePapers.length === 0 && !loading && (
                  <div className={`text-center ${styles.text.muted} py-16`}>
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-base">검색어를 입력하세요</p>
                  </div>
                )}
                {/* 더 보기 버튼 */}
                {candidatePapers.length > 0 && candidatePapers.length < allPapers.length - selectedPapers.length - excludedPapers.length && (
                  <div className="flex justify-center pt-4 pb-2">
                    <button
                      onClick={loadMorePapers}
                      className={`${styles.button.secondary} flex items-center gap-2`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                      더 보기 ({allPapers.length - selectedPapers.length - excludedPapers.length - candidatePapers.length}개 남음)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Research Assistant */}
      <div className={`${assistantActive ? 'w-[560px]' : 'w-14'} border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-screen transition-all duration-300`}>
        {assistantActive ? (
          <>
            {/* Header - Expanded */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${styles.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className={`text-base font-semibold ${styles.text.secondary}`}>Research Assistant</span>
              </div>
              <button
                onClick={deactivateAssistant}
                className={`${styles.button.iconSmall} hover:bg-slate-100 dark:hover:bg-slate-700`}
                title="패널 접기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

          {/* Context Summary */}
          <div className="border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => setIsContextExpanded(!isContextExpanded)}
                className={`flex items-center gap-2 text-sm font-medium ${styles.text.secondary} hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors`}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isContextExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                통합 컨텍스트 분석
                {contextSummary && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="분석 완료" />
                )}
              </button>
              <button
                onClick={loadContextSummary}
                disabled={isLoadingContext || selectedPapers.length < 2}
                className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isLoadingContext || selectedPapers.length < 2
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                }`}
                title={selectedPapers.length < 2 ? '논문 2개 이상 선택 필요' : '컨텍스트 분석 새로고침'}
              >
                <svg className={`w-3.5 h-3.5 ${isLoadingContext ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoadingContext ? '분석 중...' : '분석'}
              </button>
            </div>

            {isContextExpanded && (
              <div className="px-4 pb-4">
                {contextSummary ? (
                  <div className={`text-xs space-y-2 ${styles.text.secondary}`}>
                    <div>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">공통 문제:</span>
                      <p className="mt-0.5 leading-relaxed">{contextSummary.commonProblem}</p>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">공통 방법론:</span>
                      <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                        {contextSummary.commonMethods.map((method, i) => (
                          <li key={i}>{method}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">주요 차이점:</span>
                      <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                        {contextSummary.differences.map((diff, i) => (
                          <li key={i}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">연구 지형:</span>
                      <p className="mt-0.5 leading-relaxed">{contextSummary.researchLandscape}</p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${styles.text.muted}`}>
                    {selectedPapers.length < 2
                      ? '논문을 2개 이상 선택하고 분석 버튼을 클릭하세요'
                      : '분석 버튼을 클릭하여 선택된 논문들의 컨텍스트를 분석하세요'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-xl leading-relaxed animate-fade-in ${
                  msg.role === 'user'
                    ? `text-sm p-3 ${styles.bg.tertiary} ml-8 whitespace-pre-wrap`
                    : msg.role === 'system'
                    ? `text-xs px-3 py-2 ${styles.text.tertiary} text-center whitespace-pre-wrap`
                    : `text-sm p-3 ${styles.bg.secondary} mr-4 prose prose-sm dark:prose-invert prose-slate max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5`
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {chatLoading && (
              <div className={`text-sm ${styles.text.muted} p-4 flex items-center gap-3`}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                응답 중...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                placeholder="메시지를 입력하세요..."
                className={`${styles.input.base} text-sm`}
                disabled={chatLoading}
              />
              <button onClick={sendChatMessage} disabled={chatLoading} className={styles.button.primary}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          </>
        ) : (
          /* Collapsed State */
          <button
            onClick={() => activateAssistant()}
            className="flex flex-col items-center py-4 h-full w-full bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all cursor-pointer group"
            title="연구 패널 펼치기"
          >
            {/* 펼치기 화살표 */}
            <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-md group-hover:bg-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </div>

            {/* 아이콘 */}
            <div className="mt-4 p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            {/* 텍스트 */}
            <div className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400" style={{ writingMode: 'vertical-rl' }}>
              Research
            </div>

            {/* 메시지 배지 */}
            {chatMessages.filter(m => m.role !== 'system').length > 0 && (
              <div className="mt-3 w-6 h-6 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                {chatMessages.filter(m => m.role !== 'system').length}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Modal */}
      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalImage(null)}
        >
          <img src={modalImage} alt="" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Paper Detail Modal */}
      {detailPaper && (
        <PaperDetailModal
          paper={detailPaper}
          analysis={analyses[detailPaper.paperId]}
          translation={translations[detailPaper.paperId]}
          isTranslating={translatingIds.has(detailPaper.paperId)}
          onClose={() => setDetailPaper(null)}
          onTranslate={translateAbstract}
        />
      )}

      {/* Research Overview Modal */}
      {showResearchOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`${styles.card.base} max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className={`text-lg font-semibold ${styles.text.primary}`}>연구 개요</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadResearchOverview}
                  className={`${styles.button.primary} flex items-center gap-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드
                </button>
                <button
                  onClick={() => setShowResearchOverview(false)}
                  className={styles.button.iconSmall}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 prose prose-sm dark:prose-invert prose-slate max-w-none">
              <ReactMarkdown>{generateResearchOverviewMarkdown()}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${styles.card.withPaddingLarge} max-w-md w-full mx-4`}>
            <h2 className={`text-lg font-semibold ${styles.text.primary} mb-2`}>환영합니다</h2>
            <p className={`text-sm ${styles.text.secondary} mb-4`}>
              테스트 사용자의 이메일을 입력해주세요.
            </p>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              placeholder="your@email.com"
              className={`${styles.input.base} mb-4`}
              autoFocus
            />
            <button
              onClick={handleEmailSubmit}
              disabled={!emailInput.includes('@')}
              className={`${styles.button.primary} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              시작하기
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-lg">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{errorToast}</span>
            <button
              onClick={() => setErrorToast(null)}
              className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
