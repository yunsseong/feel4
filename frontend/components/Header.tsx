"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="h-16 w-full flex items-center justify-between px-8 shrink-0">
      <div className="font-bold text-2xl tracking-tighter font-mono">필사</div>
      <Link
        className="font-medium font-mono text-sm hover:underline underline-offset-4"
        href="/login"
      >
        로그인
      </Link>
    </header>
  );
}
