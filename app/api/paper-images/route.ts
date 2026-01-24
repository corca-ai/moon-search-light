import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// URL prefix 상수
const SNAPSHOT_PREFIX = 'https://moonlight-paper-snapshot.s3.ap-northeast-2.amazonaws.com/arxiv/';
const PDF_PREFIX = 'http://arxiv.org/pdf/';

interface PaperImageData {
  title: string;
  pdfUrl: string;
  snapshots: string[];
}

// CSV 파일을 읽고 파싱하는 함수 (최적화된 형식: title,pdf_url,snapshots)
function parseCSV(csvContent: string): Map<string, { pdfUrl: string; snapshots: string[] }> {
  // CRLF를 LF로 변환
  const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n');
  const paperImages = new Map<string, { pdfUrl: string; snapshots: string[] }>();

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
        // CSV 라인 파싱: title,pdf_url,snapshots
        let title = '';
        let pdfUrl = '';
        let snapshotsStr = '';

        // 패턴 1: 따옴표로 감싸진 제목 "title",pdf_url,"snapshots"
        let match = currentLine.match(/^"([^"]*(?:""[^"]*)*)","?([^,]*)"?,("?\{[^}]*\}"?)$/);
        if (match) {
          title = match[1].replace(/""/g, '"').replace(/\s+/g, ' ').trim();
          pdfUrl = match[2].replace(/^"|"$/g, '').trim();
          snapshotsStr = match[3].replace(/^"|"$/g, '');
        } else {
          // 패턴 2: 따옴표 없는 제목 title,pdf_url,snapshots
          match = currentLine.match(/^([^,]+),([^,]*),("?\{[^}]*\}"?)$/);
          if (match) {
            title = match[1].replace(/\s+/g, ' ').trim();
            pdfUrl = match[2].trim();
            snapshotsStr = match[3].replace(/^"|"$/g, '');
          }
        }

        if (title && snapshotsStr) {
          // snapshots 배열 파싱 및 전체 URL 복원
          const snapshots = snapshotsStr
            .slice(1, -1) // { } 제거
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .map(url => url.startsWith('http') ? url : SNAPSHOT_PREFIX + url);

          // pdf_url 전체 URL 복원
          const fullPdfUrl = pdfUrl.startsWith('http') ? pdfUrl : (pdfUrl ? PDF_PREFIX + pdfUrl : '');

          if (snapshots.length > 0 || fullPdfUrl) {
            // 제목을 정규화하여 키로 사용
            const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            paperImages.set(normalizedTitle, { pdfUrl: fullPdfUrl, snapshots });
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
let cachedPaperImages: Map<string, { pdfUrl: string; snapshots: string[] }> | null = null;

function loadPaperImages(): Map<string, { pdfUrl: string; snapshots: string[] }> {
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
    const result: Record<string, { pdfUrl: string; snapshots: string[] }> = {};

    // 각 제목에 대해 스냅샷, PDF URL 찾기
    for (const title of titles) {
      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const imageData = paperImages.get(normalizedTitle);

      if (imageData && (imageData.snapshots.length > 0 || imageData.pdfUrl)) {
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
