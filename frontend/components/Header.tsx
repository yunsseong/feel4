"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getUserProfile, logout, type UserProfile } from "@/lib/api";
import Image from "next/image";
import { ThemeSettingsModal } from "./ThemeSettingsModal";
import { useTheme } from "./ThemeProvider";
import { getColorBrightness } from "@/lib/theme";

interface HeaderProps {
  initialProfile?: UserProfile | null;
  onThemeClick?: () => void;
}

export function Header({ initialProfile = null, onThemeClick }: HeaderProps) {
  const { theme, isThemeModalOpen, setThemeModalOpen } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(initialProfile);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 배경색 밝기에 따른 메뉴 스타일 결정
  const isDarkBg = getColorBrightness(theme.backgroundColor) < 128;

  useEffect(() => {
    // 서버에서 프로필을 받지 못한 경우에만 클라이언트에서 로드
    if (!user) {
      getUserProfile().then(setUser);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowMenu(false);
    router.push("/");
  };

  const handleThemeClick = () => {
    setShowMenu(false);
    if (onThemeClick) {
      onThemeClick();
    } else {
      setThemeModalOpen(true);
    }
  };

  return (
    <>
      <header className="h-16 w-full flex items-center justify-between px-8 shrink-0">
        <div className="font-bold text-2xl tracking-tighter font-mono" style={{ color: theme.fontColor }}>필사</div>
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.nickname || user.email}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    color: theme.fontColor,
                  }}
                >
                  <span className="text-sm font-medium">
                    {(user.nickname || user.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </button>
            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50"
                style={{
                  backgroundColor: isDarkBg ? '#374151' : '#FFFFFF',
                  borderColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderWidth: 1,
                  color: isDarkBg ? '#FFFFFF' : '#1F2937',
                }}
              >
                <div
                  className="px-4 py-2"
                  style={{ borderBottomColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderBottomWidth: 1 }}
                >
                  <p className="text-sm font-medium truncate">
                    {user.nickname || user.email}
                  </p>
                  <p className="text-xs truncate" style={{ opacity: 0.6 }}>{user.email}</p>
                </div>
                <button
                  onClick={handleThemeClick}
                  className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  테마 설정
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setThemeModalOpen(true)}
              className="hover:opacity-80 transition-opacity"
              title="테마 설정"
              style={{ color: theme.fontColor }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </button>
            <Link
              className="font-medium font-mono text-sm hover:underline underline-offset-4"
              href="/login"
              style={{ color: theme.fontColor }}
            >
              로그인
            </Link>
          </div>
        )}
      </header>
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </>
  );
}
