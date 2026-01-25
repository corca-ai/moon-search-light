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
    <div className={`${styles.card.withPaddingLarge} flex gap-4`}>
      {/* 썸네일 */}
      {paper.snapshots && paper.snapshots.length > 0 && (
        <div className="shrink-0 w-32">
          <img
            src={paper.snapshots[0]}
            alt=""
            className="w-32 h-44 object-cover rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={() => onImageClick(paper.snapshots![0])}
          />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 헤더 */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className={`text-base font-semibold ${styles.text.primary} leading-relaxed flex-1`}>
            {paper.title}
          </h3>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onSelect(paper)} className={styles.button.icon}>☆</button>
            <button onClick={() => onExclude(paper)} className={styles.button.icon}>×</button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className={`flex items-center gap-2 text-sm ${styles.text.tertiary} mb-3`}>
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

        {/* 분석 중: 초록 표시 */}
        {!analysis && paper.abstract && (
          <div>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">분석 중...</div>
            <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>
          </div>
        )}

        {/* AI 분석 결과 */}
        {analysis && (
          <div className="space-y-3">
            {/* 접을 수 있는 초록 */}
            {paper.abstract && (
              <details className="group">
                <summary className={`text-xs ${styles.text.muted} cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 select-none`}>
                  <span className="group-open:hidden">▸ 초록 보기</span>
                  <span className="hidden group-open:inline">▾ 초록 접기</span>
                </summary>
                <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                  <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>{paper.abstract}</p>
                  {/* 번역 */}
                  <div className="mt-2">
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
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">번역</div>
                        <p className={`text-sm ${styles.text.secondary} leading-relaxed`}>{translation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* 분석 그리드 */}
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
