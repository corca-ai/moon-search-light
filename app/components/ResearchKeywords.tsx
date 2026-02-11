'use client';

import type { Paper } from '../api/search/route';
import type { ResearchKeyword } from '../features/research-guide';
import { styles } from './styles';

interface ResearchKeywordsProps {
  seedPaper: Paper;
  seedDescription: string;
  keywords: ResearchKeyword[];
  isExtractingKeywords: boolean;
  onKeywordClick: (keyword: ResearchKeyword) => void;
  onClear: () => void;
}

export function ResearchKeywords({
  seedPaper,
  seedDescription,
  keywords,
  isExtractingKeywords,
  onKeywordClick,
  onClear,
}: ResearchKeywordsProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
      {/* Seed paper header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className={`text-sm font-semibold ${styles.text.primary} truncate`}>
            {seedPaper.title}
          </span>
        </div>
        <button
          onClick={onClear}
          className={`${styles.button.iconSmall} shrink-0`}
          title="시드 해제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {isExtractingKeywords ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
            <span className={`text-xs ${styles.text.muted}`}>분석 중...</span>
          </div>
        ) : (
          <>
            {/* Seed description */}
            {seedDescription && (
              <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>
                {seedDescription}
              </p>
            )}

            {/* Keywords with descriptions */}
            {keywords.length > 0 && (
              <div className="space-y-1.5">
                {keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => onKeywordClick(kw)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                        {kw.keyword}
                      </span>
                      <span className={`text-xs ${styles.text.muted} truncate`}>
                        {kw.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
