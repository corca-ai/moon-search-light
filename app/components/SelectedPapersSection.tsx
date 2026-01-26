'use client';

import type { Paper } from '../api/search/route';
import { HorizontalPaperCard } from './HorizontalPaperCard';
import { styles } from './styles';

interface SelectedPapersSectionProps {
  selectedPapers: Paper[];
  excludedPapers: Paper[];
  excludedExpanded: boolean;
  onToggleExcluded: () => void;
  onMoveToCandidate: (paper: Paper) => void;
  onRestorePaper: (paper: Paper) => void;
  onShowDetail?: (paper: Paper) => void;
  interestSummary?: string;
}

export function SelectedPapersSection({
  selectedPapers,
  excludedPapers,
  excludedExpanded,
  onToggleExcluded,
  onMoveToCandidate,
  onRestorePaper,
  onShowDetail,
  interestSummary,
}: SelectedPapersSectionProps) {
  return (
    <div className={styles.card.withPadding}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${styles.text.secondary}`}>
            선택됨
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedPapers.length > 0 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {selectedPapers.length}
          </span>
        </div>
      </div>

      {selectedPapers.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {selectedPapers.map(paper => (
            <HorizontalPaperCard
              key={paper.paperId}
              paper={paper}
              type="selected"
              onAction={onMoveToCandidate}
              onShowDetail={onShowDetail}
            />
          ))}
        </div>
      ) : (
        <div className={`text-center ${styles.text.muted} py-4 text-sm`}>
          <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          탐색할 연구들 ⭐를 클릭하여 선택
        </div>
      )}

      {excludedPapers.length > 0 && (
        <div className={`mt-3 pt-3 border-t ${styles.divider}`}>
          <button
            onClick={onToggleExcluded}
            className={`text-xs ${styles.text.muted} hover:text-slate-600 dark:hover:text-slate-400 flex items-center gap-1.5 transition-colors`}
          >
            <svg className={`w-3 h-3 transition-transform ${excludedExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            검토 완료 {excludedPapers.length}개
          </button>
          {excludedExpanded && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-3 scrollbar-thin">
              {excludedPapers.map(paper => (
                <HorizontalPaperCard
                  key={paper.paperId}
                  paper={paper}
                  type="excluded"
                  onAction={onRestorePaper}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {interestSummary && (
        <div className={`mt-3 pt-3 border-t ${styles.divider}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-4 h-4 ${styles.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className={`text-xs font-semibold ${styles.text.accent}`}>관심 주제 요약</span>
          </div>
          <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>
            {interestSummary}
          </p>
        </div>
      )}
    </div>
  );
}
