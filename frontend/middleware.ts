import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 경로 접근 시 권한 체크
  if (pathname.startsWith("/admin")) {
    // 쿠키에서 프로필 캐시 확인
    const profileCookie = request.cookies.get("userProfileCache");

    if (!profileCookie?.value) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const profile = JSON.parse(decodeURIComponent(profileCookie.value));

      if (profile.role !== "admin") {
        // admin 권한이 없는 경우 메인 페이지로 리다이렉트
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    } catch {
      // 쿠키 파싱 실패 시 로그인 페이지로
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
