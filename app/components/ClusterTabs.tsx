'use client';

import type { Cluster } from '../features/research-guide';
import { styles } from './styles';

interface ClusterTabsProps {
  clusters: Cluster[];
  isClustering: boolean;
  activeClusterIndex: number | null;
  onSelect: (index: number | null) => void;
}

export function ClusterTabs({
  clusters,
  isClustering,
  activeClusterIndex,
  onSelect,
}: ClusterTabsProps) {
  if (isClustering) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
        <span className={`text-xs ${styles.text.muted}`}>클러스터링 중...</span>
      </div>
    );
  }

  if (clusters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {/* All tab */}
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
          activeClusterIndex === null
            ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        전체
      </button>

      {/* Cluster tabs */}
      {clusters.map((cluster, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            activeClusterIndex === idx
              ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={cluster.description}
        >
          {cluster.name} ({cluster.paperIndices.length})
        </button>
      ))}
    </div>
  );
}
