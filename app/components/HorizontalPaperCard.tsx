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
    <div className={`shrink-0 w-72 ${styles.card.withPadding} ${styles.card.hover} ${type === 'excluded' ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start gap-3">
        <div
          className={`flex-1 min-w-0 ${onShowDetail ? 'cursor-pointer group' : ''}`}
          onClick={() => onShowDetail?.(paper)}
        >
          <h3 className={`text-sm font-medium ${styles.text.primary} leading-snug line-clamp-2 ${onShowDetail ? 'group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors' : ''}`}>
            {paper.title}
          </h3>
          <div className={`flex items-center gap-2 text-xs ${styles.text.muted} mt-2`}>
            {paper.year && <span className="font-medium">{paper.year}</span>}
            {paper.year && type === 'selected' && <span className="text-slate-300 dark:text-slate-600">•</span>}
            {type === 'selected' && <span>인용 {paper.citationCount?.toLocaleString()}</span>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAction(paper); }}
          className={type === 'selected'
            ? `${styles.button.iconSmall} text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300`
            : `${styles.button.secondary} text-xs px-2.5 py-1`
          }
          title={type === 'selected' ? '선택 해제' : '다시 검토'}
        >
          {type === 'selected' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ) : '다시 검토'}
        </button>
      </div>
    </div>
  );
}
