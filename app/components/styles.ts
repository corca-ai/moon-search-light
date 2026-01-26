// 공통 스타일 상수 - 학술적 디자인

export const styles = {
  // 버튼
  button: {
    primary: 'px-5 py-2.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors duration-150 disabled:opacity-50',
    primarySmall: 'px-4 py-2 text-sm bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors duration-150',
    secondary: 'px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 font-medium',
    ghost: 'px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors font-medium',
    icon: 'p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
    iconSmall: 'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
  },

  // 탭 (일체화 스타일)
  tab: {
    container: 'flex border-b border-slate-200 dark:border-slate-700',
    active: 'px-5 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 border-b-2 border-slate-800 dark:border-slate-200 -mb-px transition-all duration-150',
    inactive: 'px-5 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-150',
    disabled: 'px-5 py-3 text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed',
  },

  // 카드
  card: {
    base: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm',
    hover: 'hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150',
    withPadding: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm p-4',
    withPaddingLarge: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm p-5',
  },

  // 배경
  bg: {
    primary: 'bg-slate-50 dark:bg-slate-900',
    secondary: 'bg-slate-100 dark:bg-slate-800',
    tertiary: 'bg-slate-200 dark:bg-slate-700',
  },

  // 텍스트
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-700 dark:text-slate-300',
    tertiary: 'text-slate-600 dark:text-slate-400',
    muted: 'text-slate-500 dark:text-slate-500',
    link: 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 transition-colors',
    accent: 'text-slate-800 dark:text-slate-200 font-semibold',
  },

  // 입력
  input: {
    base: 'w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-slate-400 transition-all duration-150 placeholder:text-slate-400 text-slate-900 dark:text-white',
  },

  // 키워드 태그
  tag: 'px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-300 dark:border-slate-600',

  // 구분선
  divider: 'border-slate-300 dark:border-slate-700',

  // 사이드바
  sidebar: {
    container: 'h-screen flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
    containerCollapsed: 'w-14 items-center',
    containerExpanded: 'w-60 relative z-10',
    header: 'h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800',
    section: 'px-3 py-3 flex items-center justify-between',
    sectionLabel: 'text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider',
    list: 'flex-1 overflow-y-auto px-2',
    item: 'relative group rounded-lg transition-colors',
    itemActive: 'bg-slate-200 dark:bg-slate-800',
    itemInactive: 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
    itemText: 'text-sm truncate',
    itemTextActive: 'text-slate-800 dark:text-slate-100 font-medium',
    itemTextInactive: 'text-slate-600 dark:text-slate-300',
    itemMeta: 'text-xs text-slate-400 dark:text-slate-500',
    footer: 'px-4 py-3 border-t border-slate-200 dark:border-slate-800',
  },

  // 드롭다운 메뉴
  dropdown: {
    menu: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1',
    item: 'w-full px-3 py-1.5 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
    itemDanger: 'w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700',
  },
};
