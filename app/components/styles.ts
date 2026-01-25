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
};
