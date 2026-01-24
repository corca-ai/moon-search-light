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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ActivityLog {
  id: number;
  time: Date;
  type: 'search' | 'select' | 'deselect' | 'exclude' | 'restore' | 'sort';
  message: string;
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [analyzedPaperIds, setAnalyzedPaperIds] = useState<string[]>([]);
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());

  const addLog = (type: ActivityLog['type'], message: string) => {
    const now = Date.now();
    setActivityLogs(prev => [{
      id: logIdCounter,
      time: new Date(),
      type,
      message,
    }, ...prev].slice(0, 50)); // 최대 50개 유지
    setLogIdCounter(prev => prev + 1);

    // Assistant 활성 시 채팅에도 시스템 메시지로 추가
    if (assistantActive) {
      setChatMessages(prev => [...prev, { role: 'system', content: message, timestamp: now }]);
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
              paper.slug = snapshotData[paper.title].slug;
              paper.pdfUrl = snapshotData[paper.title].pdfUrl;
            }
          });
        }
      }

      setCandidatePapers(papers);
      setTotal(data.total);
      addLog('search', `"${query}" 검색 → ${papers.length}개 결과`);
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
    addLog('select', `선택: ${paper.title.slice(0, 40)}...`);
  };

  const moveToCandidate = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setSelectedPapers(selectedPapers.filter(p => p.paperId !== paper.paperId));
    addLog('deselect', `선택해제: ${paper.title.slice(0, 40)}...`);
  };

  const excludePaper = (paper: Paper) => {
    setExcludedPapers([...excludedPapers, paper]);
    setCandidatePapers(candidatePapers.filter(p => p.paperId !== paper.paperId));
    addLog('exclude', `제외: ${paper.title.slice(0, 40)}...`);
  };

  const restorePaper = (paper: Paper) => {
    setCandidatePapers([...candidatePapers, paper]);
    setExcludedPapers(excludedPapers.filter(p => p.paperId !== paper.paperId));
    addLog('restore', `복원: ${paper.title.slice(0, 40)}...`);
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

  const addKeywordToSearch = (keyword: string) => {
    const currentKeywords = query.trim();
    const keywordLower = keyword.toLowerCase();
    const existingKeywords = currentKeywords.split(/\s+/).map(k => k.toLowerCase());
    if (existingKeywords.includes(keywordLower)) return;
    setQuery(currentKeywords ? `${currentKeywords} ${keyword}` : keyword);
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

  const canActivateAssistant = selectedPapers.length >= 3;

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

    setChatLoading(true);

    // 선택된 논문 목록 표시
    const paperList = selectedPapers.map((p, i) => `${i + 1}. ${p.title} (${p.year || '연도 미상'})`).join('\n');
    setChatMessages([{
      role: 'assistant',
      content: `**선택된 논문 ${selectedPapers.length}개를 분석 중입니다...**\n\n${paperList}`,
    }]);

    try {
      // 통합 컨텍스트 생성
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
    if (selectedPapers.length < 3 && assistantActive) {
      deactivateAssistant();
      setChatMessages([]);
      setAnalyzedPaperIds([]);
    }
  }, [selectedPapers.length]);

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

  const renderPaperCard = (paper: Paper, type: 'selected' | 'candidate' | 'excluded') => (
    <div
      key={paper.paperId}
      className={`border border-gray-200 dark:border-gray-700 rounded p-4 ${type === 'excluded' ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-base font-medium text-gray-900 dark:text-white leading-snug flex-1">
          {paper.title}
        </h3>
        <div className="flex gap-1 shrink-0">
          {type === 'selected' && (
            <button onClick={() => moveToCandidate(paper)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">★</button>
          )}
          {type === 'candidate' && (
            <>
              <button onClick={() => moveToSelected(paper)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">☆</button>
              <button onClick={() => excludePaper(paper)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">×</button>
            </>
          )}
          {type === 'excluded' && (
            <button onClick={() => restorePaper(paper)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">복원</button>
          )}
        </div>
      </div>

      {paper.snapshots && paper.snapshots.length > 0 && type !== 'excluded' && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {paper.snapshots.slice(0, 3).map((snapshot, idx) => (
            <img key={idx} src={snapshot} alt="" className="h-24 w-auto rounded border border-gray-200 dark:border-gray-700 cursor-pointer" onClick={() => setModalImage(snapshot)} />
          ))}
        </div>
      )}

      <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
        {paper.year && <span>{paper.year}</span>}
        <span>인용 {paper.citationCount}</span>
      </div>

      {type !== 'excluded' && analyses[paper.paperId] && (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-2">
          <div><span className="font-medium">개요:</span> {analyses[paper.paperId].overview}</div>
          <div><span className="font-medium">목표:</span> {analyses[paper.paperId].goals}</div>
          <div><span className="font-medium">방법론:</span> {analyses[paper.paperId].method}</div>
          <div><span className="font-medium">결과:</span> {analyses[paper.paperId].results}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {analyses[paper.paperId].keywords.map((kw, idx) => (
              <button key={idx} onClick={() => addKeywordToSearch(kw)} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600">{kw}</button>
            ))}
          </div>
        </div>
      )}

      {type !== 'excluded' && !analyses[paper.paperId] && paper.abstract && (
        <div className="text-sm text-gray-400 italic">분석 중...</div>
      )}

      {(paper.pdfUrl || paper.url) && (
        <a href={paper.pdfUrl ? `https://www.themoonlight.io/file?url=${encodeURIComponent(paper.pdfUrl)}` : paper.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
          논문 보기
        </a>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">moon-search-light</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">논문 탐색 도구</p>
          </div>
          {assistantActive && chatMessages.length > 1 && (
            <button onClick={downloadResearchOverview} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              연구 개요 다운로드
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {/* Collapsed Search Indicator (Assistant 활성시) */}
          {assistantActive && (
            <button
              onClick={deactivateAssistant}
              className="w-10 shrink-0 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="검색으로 돌아가기"
            >
              <span className="text-sm" style={{ writingMode: 'vertical-rl' }}>검색</span>
              <span className="text-xl">›</span>
            </button>
          )}

          {/* Left Column - 검색 결과 (Assistant 비활성시) 또는 선택됨/제외됨 (Assistant 활성시) */}
          <div className="flex-1 space-y-3">
            {!assistantActive ? (
              <>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="논문 검색..."
                    className="flex-1 px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button type="submit" disabled={loading} className="px-5 py-3 text-base bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50">
                    {loading ? '...' : '검색'}
                  </button>
                </form>

                {error && <div className="p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">{error}</div>}

                <div className="flex justify-between items-center text-base">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    검색 결과 ({candidatePapers.length}개 표시{total > 0 && <span className="text-gray-400 font-normal"> / {total.toLocaleString()}개 중</span>})
                  </span>
                  <select value={sortBy} onChange={(e) => {
                      const newSort = e.target.value as typeof sortBy;
                      setSortBy(newSort);
                      addLog('sort', `정렬 변경: ${newSort === 'relevance' ? '관련성' : newSort === 'year-desc' ? '최신순' : '인용순'}`);
                    }} className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800">
                    <option value="relevance">관련성</option>
                    <option value="year-desc">최신순</option>
                    <option value="citations">인용순</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                  {sortPapers(candidatePapers, sortBy).map(paper => renderPaperCard(paper, 'candidate'))}
                  {candidatePapers.length === 0 && !loading && <div className="text-center text-gray-400 py-8 text-base">검색어를 입력하세요</div>}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-[calc(100vh-140px)]">
                {/* Assistant 활성시: 선택됨/제외됨을 왼쪽에 표시 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    선택됨 ({selectedPapers.length})
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1">
                    {selectedPapers.map(paper => renderPaperCard(paper, 'selected'))}
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded p-4 mt-3 shrink-0">
                  <button onClick={() => setExcludedExpanded(!excludedExpanded)} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full text-left">
                    {excludedExpanded ? '▼' : '▸'} 제외됨 ({excludedPapers.length})
                  </button>
                  {excludedExpanded && (
                    <div className="mt-3 space-y-3 max-h-[25vh] overflow-y-auto">
                      {excludedPapers.map(paper => renderPaperCard(paper, 'excluded'))}
                      {excludedPapers.length === 0 && <div className="text-center text-gray-400 py-2 text-sm">없음</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - 선택됨/제외됨 (Assistant 비활성시) 또는 Assistant (활성시) */}
          <div className="flex-1">
            {!assistantActive ? (
              <div className="flex flex-col h-[calc(100vh-140px)]">
                {/* Assistant 비활성시: 선택됨/제외됨을 오른쪽에 표시 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    선택됨 ({selectedPapers.length})
                    {selectedPapers.length > 0 && selectedPapers.length < 3 && <span className="text-sm text-gray-400 ml-2">{3 - selectedPapers.length}개 더 필요</span>}
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1">
                    {selectedPapers.map(paper => renderPaperCard(paper, 'selected'))}
                    {selectedPapers.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">← 검색 결과에서 선택</div>}
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded p-4 mt-3 shrink-0">
                  <button onClick={() => setExcludedExpanded(!excludedExpanded)} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full text-left">
                    {excludedExpanded ? '▼' : '▸'} 제외됨 ({excludedPapers.length})
                  </button>
                  {excludedExpanded && (
                    <div className="mt-3 space-y-3 max-h-[25vh] overflow-y-auto">
                      {excludedPapers.map(paper => renderPaperCard(paper, 'excluded'))}
                      {excludedPapers.length === 0 && <div className="text-center text-gray-400 py-2 text-sm">없음</div>}
                    </div>
                  )}
                </div>

                {/* 분석 시작 버튼 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded p-5 text-center mt-3 shrink-0">
                  <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Research Assistant</div>
                  {canActivateAssistant ? (
                    <button onClick={activateAssistant} className="px-5 py-2.5 text-base bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300">
                      분석 시작
                    </button>
                  ) : (
                    <div className="text-sm text-gray-400">{3 - selectedPapers.length}개 더 선택 필요</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col h-[calc(100vh-140px)]">
                {/* Assistant Panel Header */}
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <span className="text-base font-medium text-gray-700 dark:text-gray-300">Research Assistant</span>
                  <button onClick={deactivateAssistant} className="text-sm text-gray-400 hover:text-gray-600">← 검색으로</button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`rounded whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-base p-4 bg-gray-100 dark:bg-gray-800 ml-8'
                        : msg.role === 'system'
                        ? 'text-sm p-2 text-gray-500 dark:text-gray-400 text-center'
                        : 'text-base p-4 bg-gray-50 dark:bg-gray-700 mr-8'
                    }`}>
                      {msg.content}
                    </div>
                  ))}
                  {chatLoading && <div className="text-base text-gray-400 p-4">응답 중...</div>}
                </div>

                  {/* Chat Input */}
                  <div className="flex gap-2 mt-auto pt-4 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      disabled={chatLoading}
                    />
                    <button onClick={sendChatMessage} disabled={chatLoading} className="px-5 py-3 text-base bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded disabled:opacity-50">
                      전송
                    </button>
                  </div>
                </div>
            )}
          </div>

          {/* Collapsed Assistant Indicator (Assistant 비활성시) */}
          {!assistantActive && (
            <div
              className={`w-10 shrink-0 border border-gray-200 dark:border-gray-700 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                canActivateAssistant
                  ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 cursor-pointer'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
              }`}
              onClick={canActivateAssistant ? activateAssistant : undefined}
              title={canActivateAssistant ? '분석 시작' : `${3 - selectedPapers.length}개 더 선택 필요`}
            >
              <span className="text-xl">‹</span>
              <span className="text-sm" style={{ writingMode: 'vertical-rl' }}>Assistant</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="" className="max-w-full max-h-[90vh] rounded" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
