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
  pdfUrl?: string;
}

interface SemanticScholarResponse {
  data: Paper[];
  total: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
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
        query
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

    // Detect query specificity
    const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const queryNormalized = normalizeText(query);
    const queryWords = queryNormalized.split(/\s+/).filter(w => w.length > 0);

    // Specific query: 4+ words, or contains quotes, or long string (likely paper title)
    const isSpecificQuery = queryWords.length >= 4 || query.includes('"') || query.length > 50;

    const sortedPapers = [...allPapers].sort((a, b) => {
      const aTitleNorm = normalizeText(a.title);
      const bTitleNorm = normalizeText(b.title);

      // Check for title matches
      const aExactMatch = aTitleNorm === queryNormalized;
      const aContainsQuery = aTitleNorm.includes(queryNormalized);
      const bExactMatch = bTitleNorm === queryNormalized;
      const bContainsQuery = bTitleNorm.includes(queryNormalized);

      if (isSpecificQuery) {
        // Specific query: prioritize exact match > contains query > citations
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        if (aContainsQuery && !bContainsQuery) return -1;
        if (!aContainsQuery && bContainsQuery) return 1;
        return (b.citationCount || 0) - (a.citationCount || 0);
      } else {
        // Simple query: sort by citations only
        return (b.citationCount || 0) - (a.citationCount || 0);
      }
    });

    return NextResponse.json({
      papers: sortedPapers.slice(0, 20),
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
