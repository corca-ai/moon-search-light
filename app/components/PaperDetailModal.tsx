'use client';

import type { Paper } from '../api/search/route';
import { styles } from './styles';

interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
}

interface PaperDetailModalProps {
  paper: Paper;
  analysis?: PaperAnalysis;
  translation?: string;
  isTranslating: boolean;
  onClose: () => void;
  onTranslate: (paperId: string, abstract: string) => void;
}

export function PaperDetailModal({
  paper,
  analysis,
  translation,
  isTranslating,
  onClose,
  onTranslate,
}: PaperDetailModalProps) {
  const paperLink = paper.externalIds?.ArXiv
    ? `https://www.themoonlight.io/file?url=${encodeURIComponent(`https://arxiv.org/pdf/${paper.externalIds.ArXiv}.pdf`)}`
    : paper.pdfUrl
    ? `https://www.themoonlight.io/file?url=${encodeURIComponent(paper.pdfUrl)}`
    : paper.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`sticky top-0 bg-white dark:bg-slate-900 border-b ${styles.divider} p-5 flex justify-between items-start gap-4`}>
          <h2 className={`text-lg font-semibold ${styles.text.primary} leading-relaxed flex-1`}>
            {paper.title}
          </h2>
          <button
            onClick={onClose}
            className={`${styles.button.icon} shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-80px)] scrollbar-thin">
          {/* 메타 정보 */}
          <div className={`flex items-center gap-3 text-sm ${styles.text.tertiary}`}>
            {paper.year && <span className="font-medium">{paper.year}</span>}
            {paper.year && <span className="text-slate-300 dark:text-slate-600">•</span>}
            <span>인용 {paper.citationCount?.toLocaleString()}</span>
            {paperLink && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <a href={paperLink} target="_blank" rel="noopener noreferrer" className={styles.text.link}>
                  논문 보기 →
                </a>
              </>
            )}
          </div>

          {/* 초록 */}
          {paper.abstract && (
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold ${styles.text.secondary}`}>초록</h3>
              <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>

              {/* 번역 */}
              <div className="pt-1">
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
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    번역 중...
                  </span>
                )}
                {translation && (
                  <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <div className={`text-xs ${styles.text.accent} font-medium mb-2`}>번역</div>
                    <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>{translation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI 분석 결과 */}
          {analysis ? (
            <div className={`space-y-4 pt-4 border-t ${styles.divider}`}>
              <h3 className={`text-sm font-semibold ${styles.text.secondary} flex items-center gap-2`}>
                <svg className={`w-4 h-4 ${styles.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 분석
              </h3>

              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
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
                <div className="flex flex-wrap gap-2 pt-2">
                  {analysis.keywords.map((kw, idx) => (
                    <span key={idx} className={styles.tag}>{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`text-sm ${styles.text.muted} pt-4 border-t ${styles.divider}`}>
              분석 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
