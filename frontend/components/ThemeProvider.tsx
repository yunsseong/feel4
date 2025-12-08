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

  // 초기 테마 로드
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      try {
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
  }, [user]);

  const setTheme = useCallback(async (settings: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...settings };
    setThemeState(newTheme);

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
  }, [theme, user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading, isThemeModalOpen, setThemeModalOpen }}>
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
