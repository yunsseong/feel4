/**
 * 텍스트 자동 분할 유틸리티
 * 긴 텍스트를 자연스러운 문장 단위로 분할합니다.
 */

export interface SplitOptions {
  /** 권장 최대 길이 (기본값: 150) */
  maxLength?: number;
  /** 최소 분할 단위 길이 (너무 짧은 분할 방지, 기본값: 30) */
  minLength?: number;
}

/**
 * 한국어 문장 종결 부호 정규식
 * . ! ? … 등과 따옴표, 괄호 조합 포함
 */
const SENTENCE_ENDERS = /[.!?…]["')」』]?(?:\s|$)/g;

/**
 * 문장 경계 찾기 헬퍼
 */
function findSentenceBoundaries(text: string): number[] {
  const boundaries: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = SENTENCE_ENDERS.exec(text)) !== null) {
    boundaries.push(match.index + match[0].length);
  }

  return boundaries;
}

/**
 * 텍스트를 자연스러운 문단/문장 단위로 분할
 *
 * 분할 우선순위:
 * 1. 줄바꿈(빈 줄)을 기준으로 먼저 분할
 * 2. 각 문단이 maxLength 초과시 문장 단위로 추가 분할
 *
 * @param text 분할할 텍스트
 * @param options 분할 옵션
 * @returns 분할된 텍스트 배열
 */
export function splitText(text: string, options: SplitOptions = {}): string[] {
  const { maxLength = 150, minLength = 30 } = options;

  // 1단계: 줄바꿈을 기준으로 문단 분리
  // 빈 줄(\n\n) 또는 단일 줄바꿈(\n)을 기준으로 분리
  const paragraphs = text
    .split(/\n\s*\n|\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // 문단이 없으면 전체 텍스트를 하나의 문단으로 처리
  if (paragraphs.length === 0) {
    return [text.trim()];
  }

  // 2단계: 각 문단을 maxLength 기준으로 추가 분할
  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      // 문단이 충분히 짧으면 그대로 사용
      segments.push(paragraph);
    } else {
      // 문단이 길면 문장 단위로 분할
      const splitParagraph = splitBysentences(paragraph, maxLength, minLength);
      segments.push(...splitParagraph);
    }
  }

  return segments.filter(s => s.length > 0);
}

/**
 * 긴 문단을 문장 단위로 분할
 */
function splitBysentences(text: string, maxLength: number, minLength: number): string[] {
  const boundaries = findSentenceBoundaries(text);

  // 문장 경계가 없으면 강제 분할
  if (boundaries.length === 0) {
    return forceSplit(text, maxLength);
  }

  const segments: string[] = [];
  let currentStart = 0;
  let currentEnd = 0;

  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    const segmentLength = boundary - currentStart;

    // 현재 세그먼트가 maxLength를 초과하는 경우
    if (segmentLength > maxLength) {
      // 이전 경계가 있고, 그것이 minLength 이상이면 거기서 끊기
      if (currentEnd > currentStart && (currentEnd - currentStart) >= minLength) {
        segments.push(text.substring(currentStart, currentEnd).trim());
        currentStart = currentEnd;
      }

      // 현재 문장이 너무 길면 (단일 문장이 maxLength 초과)
      if (boundary - currentStart > maxLength) {
        // 현재까지 누적된 것이 있으면 먼저 저장
        if (currentEnd > currentStart) {
          segments.push(text.substring(currentStart, currentEnd).trim());
          currentStart = currentEnd;
        }

        // 단일 문장이 너무 긴 경우 강제 분할
        const longSentence = text.substring(currentStart, boundary);
        const splitResult = splitLongSentence(longSentence, maxLength);
        segments.push(...splitResult);
        currentStart = boundary;
        currentEnd = boundary;
        continue;
      }
    }

    currentEnd = boundary;

    // 마지막 경계이거나, 다음 추가 시 maxLength를 초과할 것 같으면 저장
    const isLast = i === boundaries.length - 1;
    const nextBoundary = isLast ? text.length : boundaries[i + 1];
    const wouldExceed = (nextBoundary - currentStart) > maxLength;

    if (isLast || wouldExceed) {
      if (currentEnd > currentStart) {
        segments.push(text.substring(currentStart, currentEnd).trim());
        currentStart = currentEnd;
      }
    }
  }

  // 남은 텍스트 처리
  if (currentStart < text.length) {
    const remaining = text.substring(currentStart).trim();
    if (remaining.length > 0) {
      if (remaining.length > maxLength) {
        segments.push(...forceSplit(remaining, maxLength));
      } else {
        segments.push(remaining);
      }
    }
  }

  return segments.filter(s => s.length > 0);
}

/**
 * 단일 긴 문장을 쉼표나 접속사 단위로 균등 분할
 */
function splitLongSentence(sentence: string, maxLength: number): string[] {
  // 쉼표, 세미콜론 등으로 분할 시도
  const SOFT_BREAKS = /[,;、]\s*/g;
  let match: RegExpExecArray | null;

  const softBreaks: number[] = [];
  while ((match = SOFT_BREAKS.exec(sentence)) !== null) {
    softBreaks.push(match.index + match[0].length);
  }

  if (softBreaks.length === 0) {
    // 쉼표도 없으면 강제 분할
    return forceSplit(sentence, maxLength);
  }

  // 필요한 분할 수 계산
  const numParts = Math.ceil(sentence.length / maxLength);
  const targetLength = Math.ceil(sentence.length / numParts);

  const parts: string[] = [];
  let currentStart = 0;

  for (let i = 0; i < numParts; i++) {
    const targetEnd = currentStart + targetLength;

    // 마지막 파트는 끝까지
    if (i === numParts - 1) {
      parts.push(sentence.substring(currentStart).trim());
      break;
    }

    // targetEnd에 가장 가까운 soft break 찾기
    let bestBreak = -1;
    let bestDistance = Infinity;

    for (const breakPos of softBreaks) {
      if (breakPos <= currentStart) continue;
      const distance = Math.abs(breakPos - targetEnd);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestBreak = breakPos;
      }
    }

    if (bestBreak !== -1 && bestDistance <= targetLength * 0.5) {
      parts.push(sentence.substring(currentStart, bestBreak).trim());
      currentStart = bestBreak;
    } else {
      // 적절한 break point가 없으면 targetEnd에서 자르기
      parts.push(sentence.substring(currentStart, targetEnd).trim());
      currentStart = targetEnd;
    }
  }

  return parts.filter(p => p.length > 0);
}

/**
 * 균등 분할 (문장 부호가 전혀 없는 경우)
 * 전체 길이를 maxLength로 나눈 몫+1 개로 균등하게 분배
 * 예: 154자 → 2등분(77자씩), 310자 → 3등분(103자씩)
 */
function forceSplit(text: string, maxLength: number): string[] {
  // maxLength 이하면 분할 불필요
  if (text.length <= maxLength) {
    return [text.trim()];
  }

  // 필요한 분할 수 계산: ceil(length / maxLength)
  const numParts = Math.ceil(text.length / maxLength);
  // 각 파트의 목표 길이
  const targetLength = Math.ceil(text.length / numParts);

  const segments: string[] = [];
  let start = 0;

  for (let i = 0; i < numParts; i++) {
    let end = start + targetLength;

    // 마지막 파트는 끝까지
    if (i === numParts - 1) {
      end = text.length;
    } else if (end < text.length) {
      // 단어 중간에서 끊기지 않도록 공백 찾기
      const spaceIndexAfter = text.indexOf(' ', end);
      const spaceIndexBefore = text.lastIndexOf(' ', end);

      // 가까운 공백 선택 (목표 길이에서 크게 벗어나지 않도록)
      if (spaceIndexBefore > start && (end - spaceIndexBefore) <= 20) {
        end = spaceIndexBefore + 1;
      } else if (spaceIndexAfter !== -1 && (spaceIndexAfter - end) <= 20) {
        end = spaceIndexAfter + 1;
      }
    }

    const segment = text.substring(start, end).trim();
    if (segment.length > 0) {
      segments.push(segment);
    }
    start = end;
  }

  return segments.filter(s => s.length > 0);
}

/**
 * 분할된 텍스트에 대한 displayReference 생성
 */
export function generateDisplayReferences(
  baseReference: string,
  segmentCount: number,
  contentType: string
): string[] {
  const references: string[] = [];

  for (let i = 0; i < segmentCount; i++) {
    if (segmentCount === 1) {
      references.push(baseReference);
    } else {
      // "작품명 1장 3문단" → "작품명 1장 3-1문단", "작품명 1장 3-2문단"
      const suffix = contentType === 'poem' ? '연' : '문단';
      references.push(`${baseReference}-${i + 1}`);
    }
  }

  return references;
}

/**
 * 분할 미리보기 (실제 저장 전 확인용)
 */
export interface SplitPreview {
  originalLength: number;
  segmentCount: number;
  segments: Array<{
    index: number;
    length: number;
    preview: string; // 첫 50자
  }>;
}

export function previewSplit(text: string, options: SplitOptions = {}): SplitPreview {
  const segments = splitText(text, options);

  return {
    originalLength: text.length,
    segmentCount: segments.length,
    segments: segments.map((seg, idx) => ({
      index: idx + 1,
      length: seg.length,
      preview: seg.substring(0, 50) + (seg.length > 50 ? '...' : ''),
    })),
  };
}
