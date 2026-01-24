import { NextRequest, NextResponse } from 'next/server';

export interface Paper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: Array<{ name: string }>;
  citationCount: number;
  url: string;
  snapshots?: string[];
  slug?: string;
  pdfUrl?: string;
}

interface SemanticScholarResponse {
  data: Paper[];
  total: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const positiveQuery = searchParams.get('positive');
  const negativeQuery = searchParams.get('negative');

  if (!positiveQuery) {
    return NextResponse.json(
      { error: 'Positive query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    const apiKey = process.env.S2_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        positiveQuery
      )}&limit=100&fields=title,abstract,year,authors,citationCount,url`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Semantic Scholar API error:', response.status, errorText);
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const data: SemanticScholarResponse = await response.json();

    const allPapers = data.data || [];
    let includedPapers = allPapers;
    let excludedPapers: Paper[] = [];

    // Split papers into included and excluded based on negative keywords
    if (negativeQuery && negativeQuery.trim()) {
      const negativeKeywords = negativeQuery.toLowerCase().split(/\s+/).filter(k => k);

      includedPapers = [];
      excludedPapers = [];

      allPapers.forEach(paper => {
        const searchText = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
        const hasNegativeKeyword = negativeKeywords.some(keyword => searchText.includes(keyword));

        if (hasNegativeKeyword) {
          excludedPapers.push(paper);
        } else {
          includedPapers.push(paper);
        }
      });
    }

    // Smart sorting: prioritize exact/close title matches, then relevance with citation boost
    const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const queryNormalized = normalizeText(positiveQuery);

    const sortedIncluded = [...includedPapers].sort((a, b) => {
      const aTitleNorm = normalizeText(a.title);
      const bTitleNorm = normalizeText(b.title);

      // Exact match or contains exact query: boost to top
      const aExactMatch = aTitleNorm === queryNormalized || aTitleNorm.includes(queryNormalized);
      const bExactMatch = bTitleNorm === queryNormalized || bTitleNorm.includes(queryNormalized);

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // If both match or both don't match, maintain original relevance order from API
      // (Semantic Scholar already ranks by relevance)
      return 0;
    });

    const sortedExcluded = [...excludedPapers].sort((a, b) => b.citationCount - a.citationCount);

    // Return top 20 for display, but all papers for embedding
    return NextResponse.json({
      papers: sortedIncluded.slice(0, 20),
      excludedPapers: sortedExcluded.slice(0, 20),
      allPapers: allPapers,
      total: data.total || 0,
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
