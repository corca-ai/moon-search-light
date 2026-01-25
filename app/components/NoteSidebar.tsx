'use client';

import { useState } from 'react';
import { SessionListItem } from '../types/session';
import { styles } from './styles';

interface NoteSidebarProps {
  currentSessionId: string | null;
  currentSessionName: string | null;
  sessionList: SessionListItem[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export function NoteSidebar({
  currentSessionId,
  currentSessionName,
  sessionList,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: NoteSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleStartEdit = (item: SessionListItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setMenuOpenId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('이 연구 노트를 삭제하시겠습니까?')) {
      onDelete(id);
    }
    setMenuOpenId(null);
  };

  // Icons
  const LogoIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  const FolderIcon = ({ active }: { active?: boolean }) => (
    <svg className={`w-4 h-4 ${active ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  const MoreIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className="w-14 h-screen flex flex-col items-center bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 w-full">
          <div className="text-slate-700 dark:text-slate-300">
            <LogoIcon />
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="mt-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="사이드바 펼치기"
        >
          <ChevronRightIcon />
        </button>

        {/* Current Session Indicator */}
        {currentSessionName && (
          <div className="mt-4" title={currentSessionName}>
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <FolderIcon active />
            </div>
          </div>
        )}

        {/* New Note Button */}
        <button
          onClick={onCreate}
          className="mt-auto mb-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="새 연구 노트"
        >
          <PlusIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 h-screen flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="text-slate-700 dark:text-slate-300">
            <LogoIcon />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Moon Search Light</h1>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          title="사이드바 접기"
        >
          <ChevronLeftIcon />
        </button>
      </div>

      {/* Notes Section */}
      <div className="px-3 py-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Research Notes
        </span>
        <button
          onClick={onCreate}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="새 연구 노트"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2">
        {sessionList.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <div className="text-slate-400 dark:text-slate-500 mb-2">
              <FolderIcon />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              연구 노트가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessionList.map((item) => (
              <div
                key={item.id}
                className={`relative group rounded-lg transition-colors ${
                  currentSessionId === item.id
                    ? 'bg-slate-200 dark:bg-slate-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {editingId === item.id ? (
                  <div className="p-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleSaveEdit(item.id)}
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelect(item.id)}
                    className="w-full px-2.5 py-2 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderIcon active={currentSessionId === item.id} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          currentSessionId === item.id
                            ? 'text-slate-800 dark:text-slate-100 font-medium'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {item.paperCount} papers · {formatDate(item.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Context Menu */}
                {editingId !== item.id && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === item.id ? null : item.id);
                      }}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
                    >
                      <MoreIcon />
                    </button>

                    {menuOpenId === item.id && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {sessionList.length} notes
        </p>
      </div>
    </div>
  );
}
