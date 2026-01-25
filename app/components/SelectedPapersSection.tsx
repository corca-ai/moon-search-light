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
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${styles.text.secondary} shrink-0`}>
          선택됨 ({selectedPapers.length})
        </span>
      </div>

      {selectedPapers.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
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
        <div className={`text-center ${styles.text.muted} py-2 text-sm`}>
          검색 결과에서 ☆를 클릭하여 선택
        </div>
      )}

      {excludedPapers.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onToggleExcluded} className={`text-xs ${styles.text.muted} hover:text-gray-600`}>
            제외됨 {excludedPapers.length}개 {excludedExpanded ? '▼' : '▸'}
          </button>
          {excludedExpanded && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-2">
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
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className={`text-xs font-medium ${styles.text.muted}`}>관심 주제 요약</span>
          <p className={`text-sm ${styles.text.secondary} mt-1`}>
            {interestSummary}
          </p>
        </div>
      )}
    </div>
  );
}
