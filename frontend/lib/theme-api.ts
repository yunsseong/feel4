// Theme API functions
import { apiFetchJson } from './api-config';
import { ThemeSettings, DEFAULT_THEME } from './theme';

const LOCAL_STORAGE_KEY = 'theme-settings';

// 모바일 기기 감지 및 기본 테마 반환
export function getDeviceDefaultTheme(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const isMobile = window.innerWidth < 768;
  return {
    ...DEFAULT_THEME,
    fontSize: isMobile ? 16 : DEFAULT_THEME.fontSize,
  };
}

// 로컬 스토리지에서 테마 설정 가져오기 (비로그인 시 사용)
export function getLocalThemeSettings(): ThemeSettings {
  const deviceDefault = getDeviceDefaultTheme();
  if (typeof localStorage === 'undefined') return deviceDefault;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return { ...deviceDefault, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return deviceDefault;
}

// 로컬 스토리지에 테마 설정 저장 (비로그인 시 사용)
export function setLocalThemeSettings(settings: Partial<ThemeSettings>): void {
  if (typeof localStorage === 'undefined') return;

  const current = getLocalThemeSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

// 서버에서 테마 설정 가져오기
export async function fetchThemeSettings(): Promise<ThemeSettings> {
  try {
    const response = await apiFetchJson<ThemeSettings>('/users/settings/theme');
    return response;
  } catch {
    return getDeviceDefaultTheme();
  }
}

// 서버에 테마 설정 저장
export async function updateThemeSettings(settings: Partial<ThemeSettings>): Promise<ThemeSettings> {
  const response = await apiFetchJson<ThemeSettings>('/users/settings/theme', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return response;
}
