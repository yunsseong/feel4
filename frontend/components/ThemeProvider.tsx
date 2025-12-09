"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeSettings, DEFAULT_THEME } from '@/lib/theme';
import { fetchThemeSettings, updateThemeSettings, getLocalThemeSettings, setLocalThemeSettings, getDeviceDefaultTheme } from '@/lib/theme-api';
import { UserProfile } from '@/lib/api';

interface ThemeContextValue {
  theme: ThemeSettings;
  setTheme: (settings: Partial<ThemeSettings>) => Promise<void>;
  isLoading: boolean;
  isThemeModalOpen: boolean;
  setThemeModalOpen: (open: boolean) => void;
  isEmbedded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  user: UserProfile | null;
}

export function ThemeProvider({ children, user }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // iframe 임베딩 감지
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  // 초기 테마 로드
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      try {
        // iframe 임베딩 시 데모 모드: 기본 테마만 사용
        if (isEmbedded) {
          setThemeState(getDeviceDefaultTheme());
          setIsLoading(false);
          return;
        }

        if (user) {
          // 로그인 사용자: 서버에서 로드
          const serverTheme = await fetchThemeSettings();
          setThemeState(serverTheme);
        } else {
          // 비로그인: 로컬 스토리지에서 로드
          const localTheme = getLocalThemeSettings();
          setThemeState(localTheme);
        }
      } catch {
        setThemeState(getDeviceDefaultTheme());
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [user, isEmbedded]);

  const setTheme = useCallback(async (settings: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...settings };
    setThemeState(newTheme);

    // iframe 임베딩 시 데모 모드: 저장하지 않음
    if (isEmbedded) return;

    if (user) {
      // 로그인 사용자: 서버에 저장
      try {
        await updateThemeSettings(settings);
      } catch (error) {
        console.error('Failed to save theme settings:', error);
      }
    } else {
      // 비로그인: 로컬 스토리지에 저장
      setLocalThemeSettings(settings);
    }
  }, [theme, user, isEmbedded]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading, isThemeModalOpen, setThemeModalOpen, isEmbedded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
