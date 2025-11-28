"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getUserProfile, clearProfileCache, type UserProfile } from "@/lib/api";
import Image from "next/image";

interface HeaderProps {
  initialProfile?: UserProfile | null;
}

export function Header({ initialProfile = null }: HeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(initialProfile);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    clearProfileCache();
    setUser(null);
    setShowMenu(false);
    router.push("/");
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-8 shrink-0">
      <div className="font-bold text-2xl tracking-tighter font-mono">필사</div>
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
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {(user.nickname || user.email)[0].toUpperCase()}
                </span>
              </div>
            )}
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium truncate">
                  {user.nickname || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          className="font-medium font-mono text-sm hover:underline underline-offset-4"
          href="/login"
        >
          로그인
        </Link>
      )}
    </header>
  );
}
