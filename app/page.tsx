'use client';

import { useState, useEffect } from 'react';
import type { Paper } from './api/search/route';
import { SelectedPapersSection } from './components/SelectedPapersSection';
import { SearchResultCard } from './components/SearchResultCard';
import { PaperDetailModal } from './components/PaperDetailModal';
import { styles } from './components/styles';

interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

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
  const [sortBy, setSortBy] = useState<'relevance' | 'year-desc' | 'year-asc' | 'citations'>('relevance');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);
  const [analyzedPaperIds, setAnalyzedPaperIds] = useState<string[]>([]);
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [interestSummary, setInterestSummary] = useState('');

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

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch papers');

      const papers = [...(data.papers || [])];

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

      setCandidatePapers(papers);
      setTotal(data.total);
      addSystemMessage(`"${query}" 검색 → ${papers.length}개 결과`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCandidatePapers([]);
    } finally {
      setLoading(false);
    }
  };

  const moveToSelected = (paper: Paper) => {
    setSelectedPapers([...selectedPapers, paper]);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`선택: ${paper.title.slice(0, 40)}...`);
  };

  const moveToCandidate = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setSelectedPapers(selectedPapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`선택해제: ${paper.title.slice(0, 40)}...`);
  };

  const excludePaper = (paper: Paper) => {
    setExcludedPapers([...excludedPapers, paper]);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`제외: ${paper.title.slice(0, 40)}...`);
  };

  const restorePaper = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setExcludedPapers(excludedPapers.filter(p => p.paperId !== paper.paperId));
    addSystemMessage(`복원: ${paper.title.slice(0, 40)}...`);
  };

  const sortPapers = (papers: Paper[], sortType: typeof sortBy): Paper[] => {
    const sorted = [...papers];
    switch (sortType) {
      case 'year-desc': return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'year-asc': return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
      case 'citations': return sorted.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
      default: return sorted;
    }
  };

  const fetchAnalysis = async (paper: Paper) => {
    if (!paper.abstract || analyses[paper.paperId]) return;

    // 이미 요약 중인 논문은 건너뛰기
    if (summarizingIds.has(paper.paperId)) return;

    setSummarizingIds(prev => new Set(prev).add(paper.paperId));

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract }),
      });
      if (response.ok) {
        const analysis = await response.json();
        setAnalyses(prev => ({ ...prev, [paper.paperId]: analysis }));
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    } finally {
      setSummarizingIds(prev => {
        const next = new Set(prev);
        next.delete(paper.paperId);
        return next;
      });
    }
  };

  const processPapersInBatches = async (papers: Paper[]) => {
    const batchSize = 3;
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      await Promise.all(batch.map(paper => fetchAnalysis(paper)));
    }
  };

  const translateAbstract = async (paperId: string, abstract: string) => {
    if (translations[paperId] || translatingIds.has(paperId)) return;

    setTranslatingIds(prev => new Set(prev).add(paperId));

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: abstract }),
      });

      if (response.ok) {
        const { translation } = await response.json();
        setTranslations(prev => ({ ...prev, [paperId]: translation }));
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
    // 요약 중인 논문이 있으면 대기
    if (summarizingIds.size > 0) return;

    if (assistantActive) {
      // Assistant 활성 시: 선택된 논문만 요약
      const unsummarizedSelected = selectedPapers.filter(
        p => p.abstract && !analyses[p.paperId] && !summarizingIds.has(p.paperId)
      );
      if (unsummarizedSelected.length > 0) {
        processPapersInBatches(unsummarizedSelected);
      }
    } else {
      // Assistant 비활성 시: 선택된 논문 전체 + 정렬 기준으로 상위 5개
      const unsummarizedSelected = selectedPapers.filter(
        p => p.abstract && !analyses[p.paperId] && !summarizingIds.has(p.paperId)
      );
      const sortedCandidates = sortPapers(candidatePapers, sortBy);
      const unsummarizedCandidates = sortedCandidates.filter(
        p => p.abstract && !analyses[p.paperId] && !summarizingIds.has(p.paperId)
      );
      const papersToSummarize = [...unsummarizedSelected, ...unsummarizedCandidates.slice(0, 3)];
      if (papersToSummarize.length > 0) {
        processPapersInBatches(papersToSummarize);
      }
    }
  }, [selectedPapers, candidatePapers, assistantActive, sortBy, analyses, summarizingIds]);

  const canActivateAssistant = selectedPapers.length >= 1;

  const activateAssistant = async () => {
    if (!canActivateAssistant) return;
    setAssistantActive(true);

    // 이미 분석된 논문들과 동일한지 확인
    const currentPaperIds = selectedPapers.map(p => p.paperId).sort().join(',');
    const previousPaperIds = analyzedPaperIds.sort().join(',');

    // 동일한 논문이면 기존 대화 유지
    if (currentPaperIds === previousPaperIds && chatMessages.length > 0) {
      return;
    }

    const paperList = selectedPapers.map((p, i) => `${i + 1}. ${p.title} (${p.year || '연도 미상'})`).join('\n');

    // 논문 1개: 통합 분석 없이 바로 시작
    if (selectedPapers.length === 1) {
      setChatMessages([{
        role: 'assistant',
        content: `**선택된 논문:**\n${paperList}\n\n무엇을 도와드릴까요?\n\n💡 2개 이상의 논문을 선택하면 통합 분석을 제공합니다.`,
      }]);
      setAnalyzedPaperIds(selectedPapers.map(p => p.paperId));
      return;
    }

    // 논문 2개 이상: 통합 분석 수행
    setChatLoading(true);
    setChatMessages([{
      role: 'assistant',
      content: `**선택된 논문 ${selectedPapers.length}개를 통합 분석 중입니다...**\n\n${paperList}`,
    }]);

    try {
      const response = await fetch('/api/context-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: selectedPapers }),
      });

      if (response.ok) {
        const summary = await response.json();
        const contextMessage = `## 📋 통합 컨텍스트 분석

**선택된 논문:** ${selectedPapers.length}개
${paperList}

---

### 공통 문제
${summary.commonProblem}

### 공통 방법론
${summary.commonMethods.map((m: string) => `- ${m}`).join('\n')}

### 주요 차이점
${summary.differences.map((d: string) => `- ${d}`).join('\n')}

### 연구 지형
${summary.researchLandscape}

---

무엇을 도와드릴까요? 예시:
- "후속 연구 아이디어를 제안해줘"
- "Research Gap을 찾아줘"
- "연구 계획서 초안을 작성해줘"`;

        setChatMessages([{ role: 'assistant', content: contextMessage }]);
        setAnalyzedPaperIds(selectedPapers.map(p => p.paperId));
      } else {
        setChatMessages([{
          role: 'assistant',
          content: `선택하신 ${selectedPapers.length}개의 논문을 분석할 준비가 되었습니다.\n\n${paperList}\n\n무엇을 도와드릴까요?`,
        }]);
        setAnalyzedPaperIds(selectedPapers.map(p => p.paperId));
      }
    } catch (err) {
      console.error('Failed to generate context:', err);
      setChatMessages([{
        role: 'assistant',
        content: `선택하신 ${selectedPapers.length}개의 논문을 분석할 준비가 되었습니다.\n\n${paperList}\n\n무엇을 도와드릴까요?`,
      }]);
      setAnalyzedPaperIds(selectedPapers.map(p => p.paperId));
    } finally {
      setChatLoading(false);
    }
  };

  const deactivateAssistant = () => {
    setAssistantActive(false);
    // 대화 내용 유지 (재활성화 시 기억)
  };

  useEffect(() => {
    if (selectedPapers.length < 1 && assistantActive) {
      deactivateAssistant();
      setChatMessages([]);
      setAnalyzedPaperIds([]);
    }
  }, [selectedPapers.length]);

  // 관심사 요약 업데이트 (디바운스)
  useEffect(() => {
    if (selectedPapers.length === 0 && excludedPapers.length === 0) {
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
            excludedTitles: excludedPapers.map(p => p.title),
          }),
        });
        if (response.ok) {
          const { summary } = await response.json();
          setInterestSummary(summary);
        }
      } catch (err) {
        console.error('Failed to fetch interest summary:', err);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [selectedPapers, excludedPapers]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          context: { papers: selectedPapers, analyses },
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
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                return newMessages;
              });
            }
          }
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadResearchOverview = () => {
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

    // 대화 내용
    markdown += `## 연구 논의 내용\n\n`;
    chatMessages.forEach((msg) => {
      if (msg.role === 'user') {
        markdown += `### 질문\n${msg.content}\n\n`;
      } else {
        markdown += `### AI 응답\n${msg.content}\n\n`;
      }
    });

    markdown += `---\n\n`;
    markdown += `*Moon Search Light에서 생성됨*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-overview-${now.getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className={`text-base font-medium ${styles.text.primary}`}>moon-search-light</h1>
            <span className={`text-xs ${styles.text.muted}`}>논문 탐색 도구</span>
          </div>
          <div className="flex items-center gap-2">
            {assistantActive && chatMessages.length > 1 && (
              <button onClick={downloadResearchOverview} className={styles.button.secondary}>
                연구 개요 다운로드
              </button>
            )}
            {assistantActive ? (
              <button onClick={deactivateAssistant} className={styles.button.secondary}>
                ← 검색으로
              </button>
            ) : (
              canActivateAssistant && (
                <button onClick={activateAssistant} className={styles.button.primarySmall}>
                  연구 시작
                </button>
              )
            )}
          </div>
        </div>
        {!assistantActive ? (
          /* ===== Assistant 비활성: 상하 레이아웃 ===== */
          <div className="space-y-4">
            {/* 상단: 선택됨 (수평 스크롤) */}
            <SelectedPapersSection
              selectedPapers={selectedPapers}
              excludedPapers={excludedPapers}
              excludedExpanded={excludedExpanded}
              onToggleExcluded={() => setExcludedExpanded(!excludedExpanded)}
              onMoveToCandidate={moveToCandidate}
              onRestorePaper={restorePaper}
              onShowDetail={setDetailPaper}
              interestSummary={interestSummary}
            />

            {/* 검색 영역 */}
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="논문 검색..."
                  className={`flex-1 ${styles.input.base}`}
                />
                <button type="submit" disabled={loading} className={styles.button.primary}>
                  {loading ? '...' : '검색'}
                </button>
              </form>
              <p className={`text-xs ${styles.text.muted}`}>
                <a href="https://www.semanticscholar.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">Semantic Scholar</a> API 기반 검색 · 컴퓨터과학, 의학, 물리학 등 2억 건 이상의 학술 논문 데이터베이스
              </p>
            </div>

            {error && <div className="p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">{error}</div>}

            {/* 검색 결과 헤더 */}
            <div className="flex justify-between items-center text-base">
              <span className={`font-medium ${styles.text.secondary}`}>
                검색 결과 ({candidatePapers.length}개 표시{total > 0 && <span className={`${styles.text.muted} font-normal`}> / {total.toLocaleString()}개 중</span>})
              </span>
              <select value={sortBy} onChange={(e) => {
                  const newSort = e.target.value as typeof sortBy;
                  setSortBy(newSort);
                  addSystemMessage(`정렬 변경: ${newSort === 'relevance' ? '관련성' : newSort === 'year-desc' ? '최신순' : '인용순'}`);
                }} className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800">
                <option value="relevance">관련성</option>
                <option value="year-desc">최신순</option>
                <option value="citations">인용순</option>
              </select>
            </div>

            {/* 검색 결과 (전체 너비) */}
            <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
              {sortPapers(candidatePapers, sortBy).map(paper => (
                <SearchResultCard
                  key={paper.paperId}
                  paper={paper}
                  analysis={analyses[paper.paperId]}
                  translation={translations[paper.paperId]}
                  isTranslating={translatingIds.has(paper.paperId)}
                  onSelect={moveToSelected}
                  onExclude={excludePaper}
                  onImageClick={(url) => setModalImage(url)}
                  onTranslate={translateAbstract}
                />
              ))}
              {candidatePapers.length === 0 && !loading && <div className={`text-center ${styles.text.muted} py-8 text-base`}>검색어를 입력하세요</div>}
            </div>
          </div>
        ) : (
          /* ===== Assistant 활성: 상하 레이아웃 ===== */
          <div className="space-y-4">
            {/* 상단: 선택됨 (수평 스크롤) */}
            <SelectedPapersSection
              selectedPapers={selectedPapers}
              excludedPapers={excludedPapers}
              excludedExpanded={excludedExpanded}
              onToggleExcluded={() => setExcludedExpanded(!excludedExpanded)}
              onMoveToCandidate={moveToCandidate}
              onRestorePaper={restorePaper}
              onShowDetail={setDetailPaper}
              interestSummary={interestSummary}
            />

            {/* Research Assistant (전체 너비) */}
            <div className={`${styles.card.withPaddingLarge} flex flex-col h-[calc(100vh-280px)]`}>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <span className={`text-base font-medium ${styles.text.secondary}`}>Research Assistant</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`rounded whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-base p-4 bg-gray-100 dark:bg-gray-800 ml-12'
                      : msg.role === 'system'
                      ? `text-sm p-2 ${styles.text.tertiary} text-center`
                      : 'text-base p-4 bg-gray-50 dark:bg-gray-700 mr-12'
                  }`}>
                    {msg.content}
                  </div>
                ))}
                {chatLoading && <div className={`text-base ${styles.text.muted} p-4`}>응답 중...</div>}
              </div>

              <div className="flex gap-2 mt-auto pt-4 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="메시지를 입력하세요..."
                  className={`flex-1 ${styles.input.base}`}
                  disabled={chatLoading}
                />
                <button onClick={sendChatMessage} disabled={chatLoading} className={styles.button.primary}>
                  전송
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="" className="max-w-full max-h-[90vh] rounded" onClick={(e) => e.stopPropagation()} />
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
    </div>
  );
}
