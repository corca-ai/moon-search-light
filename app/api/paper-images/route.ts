import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface PaperImageData {
  title: string;
  authors: string[];
  slug: string;
  pdfUrl: string;
  snapshots: string[];
}

// CSV 파일을 읽고 파싱하는 함수
function parseCSV(csvContent: string): Map<string, { slug: string; pdfUrl: string; snapshots: string[] }> {
  const lines = csvContent.split('\n');
  const paperImages = new Map<string, { slug: string; pdfUrl: string; snapshots: string[] }>();

  // 헤더 제외하고 시작
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // 빈 줄 스킵
    if (!line.trim() && !insideQuotes) continue;

    currentLine += line;

    // 따옴표 카운트로 멀티라인 처리
    const quoteCount = (currentLine.match(/"/g) || []).length;
    insideQuotes = quoteCount % 2 !== 0;

    if (!insideQuotes) {
      try {
        // CSV 라인 파싱: title,authors,slug,pdf_url,snapshots
        let title = '';
        let slug = '';
        let pdfUrl = '';
        let snapshotsStr = '';

        // 패턴 1: 따옴표로 감싸진 제목 "title","authors","slug","pdf_url","snapshots"
        let match = currentLine.match(/^"([^"]*(?:""[^"]*)*)","(\{[^}]*\})","?([^,]*)"?,("?[^,]*"?),("?\{[^}]*\}"?)$/);
        if (match) {
          title = match[1].replace(/""/g, '"').replace(/\s+/g, ' ').trim();
          slug = match[3].replace(/^"|"$/g, '').trim();
          pdfUrl = match[4].replace(/^"|"$/g, '').trim();
          snapshotsStr = match[5].replace(/^"|"$/g, ''); // 앞뒤 따옴표 제거
        } else {
          // 패턴 2: 따옴표 없는 제목 title,"authors","slug","pdf_url","snapshots"
          match = currentLine.match(/^([^,]+),"(\{[^}]*\})","?([^,]*)"?,("?[^,]*"?),("?\{[^}]*\}"?)$/);
          if (match) {
            title = match[1].replace(/\s+/g, ' ').trim();
            slug = match[3].replace(/^"|"$/g, '').trim();
            pdfUrl = match[4].replace(/^"|"$/g, '').trim();
            snapshotsStr = match[5].replace(/^"|"$/g, '');
          }
        }

        if (title && snapshotsStr) {
          // snapshots 배열 파싱
          const snapshots = snapshotsStr
            .slice(1, -1) // { } 제거
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);

          if (snapshots.length > 0 || pdfUrl || slug) {
            // 제목을 정규화하여 키로 사용
            const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            paperImages.set(normalizedTitle, { slug, pdfUrl, snapshots });
          }
        }
      } catch (e) {
        // 파싱 오류 무시하고 계속
      }
      currentLine = '';
    } else {
      currentLine += '\n';
    }
  }

  return paperImages;
}

// 전역 캐시
let cachedPaperImages: Map<string, { slug: string; pdfUrl: string; snapshots: string[] }> | null = null;

function loadPaperImages(): Map<string, { slug: string; pdfUrl: string; snapshots: string[] }> {
  if (cachedPaperImages) {
    return cachedPaperImages;
  }

  const csvPath = path.join(process.cwd(), 'data', 'arxiv_papers_images.csv');

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    cachedPaperImages = parseCSV(csvContent);
    console.log(`Loaded ${cachedPaperImages.size} paper images from CSV`);
    return cachedPaperImages;
  } catch (error) {
    console.error('Error loading paper images:', error);
    return new Map();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { titles } = await request.json();

    if (!Array.isArray(titles)) {
      return NextResponse.json(
        { error: 'titles must be an array' },
        { status: 400 }
      );
    }

    const paperImages = loadPaperImages();
    const result: Record<string, { slug: string; pdfUrl: string; snapshots: string[] }> = {};

    // 각 제목에 대해 스냅샷, PDF URL, slug 찾기
    for (const title of titles) {
      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const imageData = paperImages.get(normalizedTitle);

      if (imageData && (imageData.snapshots.length > 0 || imageData.pdfUrl || imageData.slug)) {
        result[title] = imageData;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching paper images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper images' },
      { status: 500 }
    );
  }
}
