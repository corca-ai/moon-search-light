'use client';

import type { Paper } from '../api/search/route';
import { styles } from './styles';

interface HorizontalPaperCardProps {
  paper: Paper;
  type: 'selected' | 'excluded';
  onAction: (paper: Paper) => void;
  onShowDetail?: (paper: Paper) => void;
}

export function HorizontalPaperCard({ paper, type, onAction, onShowDetail }: HorizontalPaperCardProps) {
  return (
    <div className={`shrink-0 w-72 ${styles.card.withPadding} ${type === 'excluded' ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start gap-2">
        <div
          className={`flex-1 min-w-0 ${onShowDetail ? 'cursor-pointer hover:opacity-70' : ''}`}
          onClick={() => onShowDetail?.(paper)}
        >
          <h3 className={`text-sm font-medium ${styles.text.primary} leading-snug`}>
            {paper.title}
          </h3>
          <div className={`flex items-center gap-2 text-xs ${styles.text.muted} mt-1`}>
            {paper.year && <span>{paper.year}</span>}
            {paper.year && type === 'selected' && <span>•</span>}
            {type === 'selected' && <span>인용 {paper.citationCount?.toLocaleString()}</span>}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAction(paper); }} className={styles.button.icon}>
          {type === 'selected' ? '★' : '복원'}
        </button>
      </div>
    </div>
  );
}
