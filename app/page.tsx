'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Track page view
  useEffect(() => {
    posthog.capture('landing_page_viewed');
  }, []);

  const handleSearch = (e: React.FormEvent, location: 'hero' | 'cta') => {
    e.preventDefault();
    if (query.trim()) {
      posthog.capture('landing_search_submitted', {
        query: query.trim(),
        location,
      });
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleRecommendedClick = (term: string) => {
    posthog.capture('landing_recommended_clicked', { term });
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleCtaClick = () => {
    posthog.capture('landing_cta_clicked', { location: 'header' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <span className="text-xl font-bold">Moon Search Light</span>
          </div>
          <Link
            href="/search"
            onClick={handleCtaClick}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            시작하기
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-400 font-medium mb-4">AI 연구 어시스턴트</p>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            연구 주제를 검색하세요
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            AI가 논문을 분석하고, 핵심을 요약하고,<br />
            후속 연구 아이디어까지 제안합니다.
          </p>

          {/* Search Box */}
          <form onSubmit={(e) => handleSearch(e, 'hero')} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: transformer attention mechanism"
                className="w-full px-6 py-4 pr-32 bg-slate-800 border border-slate-600 rounded-2xl text-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
              >
                검색
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-slate-500 text-sm">추천:</span>
            {['LLM fine-tuning', 'RAG retrieval', 'multimodal learning'].map((term) => (
              <button
                key={term}
                onClick={() => handleRecommendedClick(term)}
                className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          <p className="text-slate-500 text-sm mt-8">
            Semantic Scholar 2억+ 논문 | 로그인 없이 무료
          </p>
        </div>
      </section>

      {/* Scenario 1 */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">SCENARIO 1</p>
              <h2 className="text-3xl font-bold mb-4">
                &ldquo;처음 보는 분야인데<br />
                핵심 논문이 뭐지?&rdquo;
              </h2>
              <p className="text-slate-300 mb-6">
                새로운 연구 주제를 맡았을 때, 어디서부터 읽어야 할지 막막하셨나요?
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p className="text-slate-400">
                    키워드 검색하면 <span className="text-white">2억 건 논문</span>에서 추천순 정렬
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p className="text-slate-400">
                    AI가 각 논문을 <span className="text-white">개요, 목표, 방법론, 결과</span>로 요약
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p className="text-slate-400">
                    초록 읽을 필요 없이 <span className="text-white">빠르게 핵심 파악</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="text-sm text-slate-500 mb-3">AI 분석 결과</div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-blue-400 font-medium">개요</span>
                  <p className="text-slate-300">트랜스포머 기반 언어 모델의 효율적 학습 방법 제안</p>
                </div>
                <div>
                  <span className="text-green-400 font-medium">목표</span>
                  <p className="text-slate-300">기존 대비 메모리 사용량 40% 감소하며 성능 유지</p>
                </div>
                <div>
                  <span className="text-purple-400 font-medium">방법론</span>
                  <p className="text-slate-300">그래디언트 체크포인팅과 혼합 정밀도 훈련 결합</p>
                </div>
                <div>
                  <span className="text-yellow-400 font-medium">결과</span>
                  <p className="text-slate-300">BERT, GPT-2에서 검증, 벤치마크 성능 동등</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario 2 */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="text-sm text-slate-500 mb-3">관심 주제 분석</div>
              <p className="text-slate-300 text-sm mb-4">
                &ldquo;효율적인 트랜스포머 학습, 메모리 최적화, 대규모 언어 모델&rdquo;
              </p>
              <div className="border-t border-slate-700 pt-4">
                <div className="text-sm text-slate-500 mb-2">검색 결과 관련도</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-slate-300">92% - FlashAttention 논문</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-300">78% - LoRA 논문</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">45% - BERT 원논문</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-slate-400 text-sm font-medium mb-2">SCENARIO 2</p>
              <h2 className="text-3xl font-bold mb-4">
                &ldquo;비슷한 논문이 너무 많은데<br />
                뭘 읽어야 하지?&rdquo;
              </h2>
              <p className="text-slate-300 mb-6">
                검색 결과가 수십 개인데, 내 연구와 관련 있는 논문을 하나하나 확인하기 힘드셨나요?
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p className="text-slate-400">
                    관심 논문을 <span className="text-white">⭐ 선택</span>하면 연구 관심사 자동 분석
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p className="text-slate-400">
                    다른 논문들과 <span className="text-white">관련도 자동 계산</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p className="text-slate-400">
                    <span className="text-white">높은 관련도 논문</span>부터 우선 검토
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario 3 */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">SCENARIO 3</p>
              <h2 className="text-3xl font-bold mb-4">
                &ldquo;기존 연구들 읽었는데<br />
                내 연구 뭘 해야 하지?&rdquo;
              </h2>
              <p className="text-slate-300 mb-6">
                논문은 많이 읽었는데, 정작 후속 연구 주제를 못 잡아서 고민이셨나요?
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p className="text-slate-400">
                    선택한 논문들의 <span className="text-white">공통점, 차이점, 연구 지형</span> 자동 분석
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p className="text-slate-400">
                    AI와 대화하며 <span className="text-white">Research Gap 발견</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p className="text-slate-400">
                    구체적인 <span className="text-white">후속 연구 아이디어</span> 제안
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="text-sm text-slate-500 mb-3">Research Assistant</div>
              <div className="space-y-4 text-sm">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400">선택한 3개 논문에서 Research Gap을 찾아줘</p>
                </div>
                <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-600/30">
                  <p className="text-slate-200">
                    분석 결과, 기존 연구들은 모두 영어 데이터셋에서만 검증되었습니다.
                    <span className="text-blue-400 font-medium"> 다국어 환경에서의 성능 검증</span>이
                    아직 부족한 상황입니다. 특히 한국어와 같은 교착어에서의 적용 가능성을 연구해볼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Summary */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            이런 고민, 있으셨나요?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-4xl mb-4">😵</p>
              <p className="text-slate-300">
                &ldquo;논문 초록 하나하나<br />읽기 너무 오래 걸려&rdquo;
              </p>
            </div>
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-4xl mb-4">🤔</p>
              <p className="text-slate-300">
                &ldquo;내 연구랑 관련 있는<br />논문인지 모르겠어&rdquo;
              </p>
            </div>
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-4xl mb-4">😫</p>
              <p className="text-slate-300">
                &ldquo;읽긴 읽었는데<br />뭘 연구해야 할지...&rdquo;
              </p>
            </div>
          </div>
          <p className="text-xl text-slate-300 mt-12">
            Moon Search Light가 해결해드립니다.
          </p>
        </div>
      </section>

      {/* Who is this for */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            이런 분들께 추천합니다
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">대학원생</h3>
              <p className="text-slate-400 text-sm">
                새 연구 주제를 찾거나<br />
                문헌 조사를 시작하는 분
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👨‍🔬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">연구원</h3>
              <p className="text-slate-400 text-sm">
                새로운 분야의 동향을<br />
                빠르게 파악해야 하는 분
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">연구 기획자</h3>
              <p className="text-slate-400 text-sm">
                후속 연구 방향을<br />
                기획하고 있는 분
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 검색해보세요
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            로그인 없이, 무료로 사용할 수 있습니다.
          </p>

          <form onSubmit={(e) => handleSearch(e, 'cta')} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="연구 주제를 입력하세요"
                className="w-full px-6 py-4 pr-32 bg-slate-800 border border-slate-600 rounded-2xl text-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <span className="font-medium">Moon Search Light</span>
          </div>
          <p className="text-slate-400 text-sm">
            Powered by Semantic Scholar API & OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}
