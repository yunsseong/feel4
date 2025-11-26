import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// Gowun Batang은 CSS @font-face로 로드됨 (globals.css)

export const metadata: Metadata = {
  title: "필사",
  description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>",
  },
  openGraph: {
    title: "필사",
    description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동",
    siteName: "필사",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "필사",
    description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn(inter.variable, "font-sans antialiased bg-background text-foreground")}>
        {children}
      </body>
    </html>
  );
}
