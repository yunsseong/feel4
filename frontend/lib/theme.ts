// Theme settings types and constants

export interface ThemeSettings {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  fontFamily: 'Nanum Myeongjo',
  fontSize: 36,
  fontColor: '#374151',
  backgroundColor: '#FFFFFF',
};

// 상업적 무료 사용 가능한 예쁜 한글 폰트 (Google Fonts)
export const AVAILABLE_FONTS = [
  { name: 'Noto Serif KR', label: '노토 세리프', style: '명조', preview: '가나다라' },
  { name: 'Nanum Myeongjo', label: '나눔 명조', style: '명조', preview: '가나다라' },
  { name: 'Gowun Batang', label: '고운 바탕', style: '바탕', preview: '가나다라' },
  { name: 'Gowun Dodum', label: '고운 돋움', style: '돋움', preview: '가나다라' },
  { name: 'Hahmlet', label: '함렛', style: '세리프', preview: '가나다라' },
  { name: 'Maruburi', label: '마루부리', style: '바탕', preview: '가나다라' },
  { name: 'Nanum Pen Script', label: '나눔 펜', style: '손글씨', preview: '가나다라' },
  { name: 'Gamja Flower', label: '감자꽃', style: '손글씨', preview: '가나다라' },
] as const;

export const FONT_SIZES = [16, 18, 20, 24, 28, 32, 36] as const;

// 프리셋 색상
export const FONT_COLOR_PRESETS = [
  // 어두운 계열
  { name: '기본', value: '#374151' },
  { name: '검정', value: '#1F2937' },
  { name: '갈색', value: '#78350F' },
  { name: '남색', value: '#1E3A5F' },
  { name: '녹색', value: '#14532D' },
  // 밝은 계열
  { name: '코랄', value: '#F97316' },
  { name: '핑크', value: '#EC4899' },
  { name: '퍼플', value: '#8B5CF6' },
  { name: '스카이', value: '#0EA5E9' },
  { name: '민트', value: '#14B8A6' },
  { name: '레드', value: '#EF4444' },
  // 흰색 계열
  { name: '흰색', value: '#FFFFFF' },
  { name: '아이보리', value: '#FFFEF5' },
  { name: '연회색', value: '#E5E7EB' },
  { name: '실버', value: '#D1D5DB' },
] as const;

export const BACKGROUND_COLOR_PRESETS = [
  // 밝은 계열
  { name: '크림', value: '#FFFEF5' },
  { name: '흰색', value: '#FFFFFF' },
  { name: '세피아', value: '#F5F0E1' },
  { name: '연녹색', value: '#F0FDF4' },
  { name: '연파랑', value: '#EFF6FF' },
  // 어두운 계열
  { name: '다크', value: '#1F2937' },
  { name: '차콜', value: '#111827' },
  { name: '네이비', value: '#0F172A' },
  { name: '다크그린', value: '#052E16' },
  { name: '다크퍼플', value: '#2E1065' },
  { name: '다크레드', value: '#450A0A' },
] as const;

// HEX 색상의 밝기 계산 (0-255)
export function getColorBrightness(hex: string): number {
  const color = hex.replace('#', '');
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  // 상대적 밝기 계산 (YIQ 공식)
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// 배경색에 따른 muted 색상 계산
export function getMutedForeground(backgroundColor: string): string {
  const brightness = getColorBrightness(backgroundColor);
  // 밝은 배경이면 어두운 muted, 어두운 배경이면 밝은 muted
  return brightness > 128 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
}

// 배경색에 따른 muted 배경 색상 계산
export function getMutedBackground(backgroundColor: string): string {
  const brightness = getColorBrightness(backgroundColor);
  return brightness > 128 ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)';
}

// 배경색에 따른 border 색상 계산
export function getBorderColor(backgroundColor: string): string {
  const brightness = getColorBrightness(backgroundColor);
  return brightness > 128 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
}

// Google Fonts URL 생성
export function getGoogleFontsUrl(fonts: string[]): string {
  const families = fonts
    .map(font => font.replace(/ /g, '+'))
    .map(font => `family=${font}:wght@400;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// 모든 폰트 로드 URL
export const GOOGLE_FONTS_URL = getGoogleFontsUrl(
  AVAILABLE_FONTS
    .filter(f => f.name !== 'Gowun Batang') // 로컬 폰트 제외
    .map(f => f.name)
);
