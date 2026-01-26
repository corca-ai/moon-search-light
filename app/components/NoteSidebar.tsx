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
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function NoteSidebar({
  currentSessionId,
  currentSessionName,
  sessionList,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  isCollapsed,
  onCollapsedChange,
}: NoteSidebarProps) {
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
    <img src="/favicon.ico" alt="Moon Search Light" className="w-7 h-7" />
  );

  const FolderIcon = ({ active }: { active?: boolean }) => (
    <svg className={`w-4 h-4 ${active ? 'text-slate-700 dark:text-slate-200' : styles.text.muted}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
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
      <div className={`${styles.sidebar.container} ${styles.sidebar.containerCollapsed}`}>
        <button
          onClick={() => onCollapsedChange(false)}
          className={`${styles.sidebar.header} w-full justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer`}
          title="사이드바 펼치기"
        >
          <LogoIcon />
        </button>

        {currentSessionName && (
          <div className="mt-4" title={currentSessionName}>
            <div className={`w-8 h-8 rounded-lg ${styles.bg.tertiary} flex items-center justify-center`}>
              <FolderIcon active />
            </div>
          </div>
        )}

        <button
          onClick={onCreate}
          className={`mt-auto mb-4 ${styles.button.icon}`}
          title="새 연구 노트"
        >
          <PlusIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.sidebar.container} ${styles.sidebar.containerExpanded}`}>
      {/* Header */}
      <div className={styles.sidebar.header}>
        <div className="flex items-center gap-2.5">
          <LogoIcon />
          <h1 className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
            Moon Search Light
          </h1>
        </div>
        <button
          onClick={() => onCollapsedChange(true)}
          className={styles.button.iconSmall}
          title="사이드바 접기"
        >
          <ChevronLeftIcon />
        </button>
      </div>

      {/* Notes Section */}
      <div className={styles.sidebar.section}>
        <span className={styles.sidebar.sectionLabel}>Research Notes</span>
        <button
          onClick={onCreate}
          className={styles.button.iconSmall}
          title="새 연구 노트"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Session List */}
      <div className={styles.sidebar.list}>
        {sessionList.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <div className={`${styles.text.muted} mb-2`}>
              <FolderIcon />
            </div>
            <p className={`text-xs ${styles.text.muted}`}>연구 노트가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessionList.map((item) => {
              const isActive = currentSessionId === item.id;
              const isMenuOpen = menuOpenId === item.id;

              return (
                <div
                  key={item.id}
                  className={`${styles.sidebar.item} ${isMenuOpen ? 'z-[100]' : ''} ${
                    isActive ? styles.sidebar.itemActive : styles.sidebar.itemInactive
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
                        className={`${styles.input.base} !px-2 !py-1 text-sm`}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelect(item.id)}
                      className="w-full px-2.5 py-2 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderIcon active={isActive} />
                        <div className="flex-1 min-w-0">
                          <p className={`${styles.sidebar.itemText} ${
                            isActive ? styles.sidebar.itemTextActive : styles.sidebar.itemTextInactive
                          }`}>
                            {item.name}
                          </p>
                          <p className={styles.sidebar.itemMeta}>
                            {item.paperCount} papers · {formatDate(item.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Context Menu */}
                  {editingId !== item.id && (
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : item.id);
                        }}
                        className={styles.button.iconSmall}
                      >
                        <MoreIcon />
                      </button>

                      {isMenuOpen && (
                        <div className={`absolute right-0 top-full mt-1 w-28 z-[100] ${styles.dropdown.menu}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item);
                            }}
                            className={styles.dropdown.item}
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className={styles.dropdown.itemDanger}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.sidebar.footer}>
        <p className={`text-xs ${styles.text.muted}`}>{sessionList.length} notes</p>
      </div>
    </div>
  );
}
