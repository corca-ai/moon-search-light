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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-start gap-4">
          <h2 className={`text-lg font-semibold ${styles.text.primary} leading-relaxed flex-1`}>
            {paper.title}
          </h2>
          <button onClick={onClose} className={`${styles.button.icon} text-lg`}>×</button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4 space-y-4">
          {/* 메타 정보 */}
          <div className={`flex items-center gap-3 text-sm ${styles.text.tertiary}`}>
            {paper.year && <span className="font-medium">{paper.year}</span>}
            {paper.year && <span className="text-gray-300 dark:text-gray-600">•</span>}
            <span>인용 {paper.citationCount?.toLocaleString()}</span>
            {paperLink && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <a href={paperLink} target="_blank" rel="noopener noreferrer" className={styles.text.link}>
                  논문 보기 →
                </a>
              </>
            )}
          </div>

          {/* 초록 */}
          {paper.abstract && (
            <div className="space-y-2">
              <h3 className={`text-sm font-medium ${styles.text.secondary}`}>초록</h3>
              <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>

              {/* 번역 */}
              <div className="pt-1">
                {!translation && !isTranslating && (
                  <button
                    onClick={() => onTranslate(paper.paperId, paper.abstract!)}
                    className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    한국어로 번역
                  </button>
                )}
                {isTranslating && (
                  <span className={`text-xs ${styles.text.muted}`}>번역 중...</span>
                )}
                {translation && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">번역</div>
                    <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>{translation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI 분석 결과 */}
          {analysis ? (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <h3 className={`text-sm font-medium ${styles.text.secondary}`}>AI 분석</h3>

              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm">
                <span className={styles.text.muted}>개요</span>
                <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.overview}</span>

                <span className={styles.text.muted}>목표</span>
                <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.goals}</span>

                <span className={styles.text.muted}>방법론</span>
                <span className={`${styles.text.secondary} leading-relaxed`}>{analysis.method}</span>

                <span className={styles.text.muted}>결과</span>
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
            <div className={`text-sm ${styles.text.muted} pt-2 border-t border-gray-200 dark:border-gray-700`}>
              분석 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
