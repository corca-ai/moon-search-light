'use client';

import posthog from 'posthog-js';
import type { Paper } from '../api/search/route';
import { styles } from './styles';

interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
}

interface SearchResultCardProps {
  paper: Paper;
  analysis?: PaperAnalysis;
  translation?: string;
  isTranslating: boolean;
  onSelect: (paper: Paper) => void;
  onExclude: (paper: Paper) => void;
  onImageClick: (url: string) => void;
  onTranslate: (paperId: string, abstract: string) => void;
}

export function SearchResultCard({
  paper,
  analysis,
  translation,
  isTranslating,
  onSelect,
  onExclude,
  onImageClick,
  onTranslate,
}: SearchResultCardProps) {
  const paperLink = paper.externalIds?.ArXiv
    ? `https://www.themoonlight.io/file?url=${encodeURIComponent(`https://arxiv.org/pdf/${paper.externalIds.ArXiv}.pdf`)}`
    : paper.pdfUrl
    ? `https://www.themoonlight.io/file?url=${encodeURIComponent(paper.pdfUrl)}`
    : paper.url;

  return (
    <div className={`${styles.card.withPaddingLarge} ${styles.card.hover} flex gap-5 animate-fade-in`}>
      {/* 썸네일 */}
      {paper.snapshots && paper.snapshots.length > 0 && (
        <div className="shrink-0 w-32">
          <img
            src={paper.snapshots[0]}
            alt=""
            className="w-32 h-44 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onImageClick(paper.snapshots![0])}
          />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 헤더 */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className={`text-base font-semibold ${styles.text.primary} leading-relaxed flex-1`}>
            {paper.title}
          </h3>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onSelect(paper)}
              className={`${styles.button.iconSmall} hover:text-amber-500 dark:hover:text-amber-400`}
              title="선택"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={() => onExclude(paper)}
              className={`${styles.button.iconSmall} hover:text-red-500 dark:hover:text-red-400`}
              title="제외"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className={`flex items-center gap-2 text-sm ${styles.text.tertiary} mb-4`}>
          {paper.year && <span className="font-medium">{paper.year}</span>}
          {paper.year && <span className="text-slate-300 dark:text-slate-600">•</span>}
          <span>인용 {paper.citationCount?.toLocaleString()}</span>
          {paperLink && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href={paperLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.text.link}
                onClick={() => {
                  // PostHog: Track paper link click
                  posthog.capture('paper_link_clicked', {
                    paper_id: paper.paperId,
                    paper_title: paper.title,
                    link_type: paper.externalIds?.ArXiv ? 'arxiv' : paper.pdfUrl ? 'pdf' : 'url',
                  });
                }}
              >
                논문 보기 →
              </a>
            </>
          )}
        </div>

        {/* 분석 중: 초록 표시 */}
        {!analysis && paper.abstract && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
              <span className={`text-xs ${styles.text.accent} font-medium`}>분석 중...</span>
            </div>
            <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>
          </div>
        )}

        {/* AI 분석 결과 */}
        {analysis && (
          <div className="space-y-4">
            {/* 접을 수 있는 초록 */}
            {paper.abstract && (
              <details className="group">
                <summary className={`text-xs ${styles.text.muted} cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 select-none flex items-center gap-1`}>
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>초록 보기</span>
                </summary>
                <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>
                  {/* 번역 */}
                  <div className="mt-3">
                    {!translation && !isTranslating && (
                      <button
                        onClick={() => onTranslate(paper.paperId, paper.abstract!)}
                        className={`text-xs ${styles.text.link}`}
                      >
                        한국어로 번역
                      </button>
                    )}
                    {isTranslating && (
                      <span className={`text-xs ${styles.text.muted} flex items-center gap-2`}>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></span>
                        번역 중...
                      </span>
                    )}
                    {translation && (
                      <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className={`text-xs ${styles.text.accent} font-medium mb-2`}>번역</div>
                        <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>{translation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* 분석 그리드 */}
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2.5 text-sm">
              <span className={`${styles.text.muted} font-medium`}>개요</span>
              <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.overview}</span>

              <span className={`${styles.text.muted} font-medium`}>목표</span>
              <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.goals}</span>

              <span className={`${styles.text.muted} font-medium`}>방법론</span>
              <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.method}</span>

              <span className={`${styles.text.muted} font-medium`}>결과</span>
              <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.results}</span>
            </div>

            {/* 키워드 */}
            {analysis.keywords && analysis.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.keywords.map((kw, idx) => (
                  <span key={idx} className={styles.tag}>{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
