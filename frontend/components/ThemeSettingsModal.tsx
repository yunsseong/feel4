"use client";

import React from 'react';
import { useTheme } from './ThemeProvider';
import {
  AVAILABLE_FONTS,
  FONT_SIZES,
  FONT_COLOR_PRESETS,
  BACKGROUND_COLOR_PRESETS,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettingsModal({ isOpen, onClose }: ThemeSettingsModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-xl mx-4"
        style={{ color: '#1F2937' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-6">테마 설정</h2>

        {/* 폰트 종류 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">폰트</h3>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_FONTS.map((font) => (
              <button
                key={font.name}
                onClick={() => setTheme({ fontFamily: font.name })}
                className={cn(
                  "text-left px-3 py-2 rounded-md border transition-all",
                  theme.fontFamily === font.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                style={{ fontFamily: font.name }}
              >
                <div className="text-sm font-medium">{font.label}</div>
                <div className="text-xs text-gray-500">{font.style}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 폰트 크기 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">글자 크기</h3>
          <div className="flex gap-2 flex-wrap">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setTheme({ fontSize: size })}
                className={cn(
                  "px-3 py-1.5 rounded-md border transition-all min-w-[48px]",
                  theme.fontSize === size
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 글자 색상 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">글자 색상</h3>
          <div className="flex gap-2 flex-wrap">
            {FONT_COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => setTheme({ fontColor: color.value })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all",
                  theme.fontColor === color.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-sm">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 배경 색상 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">배경 색상</h3>
          <div className="flex gap-2 flex-wrap">
            {BACKGROUND_COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => setTheme({ backgroundColor: color.value })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all",
                  theme.backgroundColor === color.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-sm">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">미리보기</h3>
          <div
            className="p-4 rounded-lg border"
            style={{
              fontFamily: theme.fontFamily,
              fontSize: `${Math.min(theme.fontSize, 20)}px`,
              color: theme.fontColor,
              backgroundColor: theme.backgroundColor,
            }}
          >
            죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
}
