import { Capacitor } from '@capacitor/core';
import { saveToken, clearToken as clearMobileToken, getAuthFetchOptions } from './mobile-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: string;
}

const PROFILE_CACHE_KEY = "userProfile";
const PROFILE_COOKIE_KEY = "userProfileCache";

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    if (part) {
      return decodeURIComponent(part.split(";").shift() || "");
    }
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getCachedProfile(): UserProfile | null {
  if (typeof localStorage === "undefined") return null;

  // localStorage 먼저 확인
  const cached = localStorage.getItem(PROFILE_CACHE_KEY);
  if (cached) {
    try {
      const profile = JSON.parse(cached);
      // cookie도 동기화
      setCookie(PROFILE_COOKIE_KEY, cached);
      return profile;
    } catch {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  }
  return null;
}

export function getProfileFromCookie(): UserProfile | null {
  const cached = getCookie(PROFILE_COOKIE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      deleteCookie(PROFILE_COOKIE_KEY);
    }
  }
  return null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  // 캐시된 프로필이 있으면 반환
  const cached = getCachedProfile();
  if (cached) return cached;

  try {
    const authOptions = await getAuthFetchOptions();
    const response = await fetch(`${API_URL}/users/me`, authOptions);

    if (!response.ok) {
      if (response.status === 401) {
        clearProfileCache();
      }
      return null;
    }

    const profile = await response.json();
    const profileJson = JSON.stringify(profile);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PROFILE_CACHE_KEY, profileJson);
    }
    setCookie(PROFILE_COOKIE_KEY, profileJson);
    return profile;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export async function clearProfileCache() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  }
  deleteCookie(PROFILE_COOKIE_KEY);
  await clearMobileToken(); // Clear mobile token storage
}

export async function logout(): Promise<void> {
  try {
    const authOptions = await getAuthFetchOptions();
    await fetch(`${API_URL}/auth/logout`, {
      ...authOptions,
      method: "POST",
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
  await clearProfileCache();
}
