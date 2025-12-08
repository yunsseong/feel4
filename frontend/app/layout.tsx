import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CapacitorProvider } from "@/components/CapacitorProvider";
import { KeyboardDismiss } from "@/components/KeyboardDismiss";
import { FontReadyProvider } from "@/components/FontReadyProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  preload: true,
});

// Google Fonts URL for Korean fonts
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gowun+Dodum:wght@400;700&family=Hahmlet:wght@400;700&family=Maruburi:wght@400;700&family=Nanum+Pen+Script:wght@400;700&family=Gamja+Flower:wght@400;700&display=swap";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // iOS safe area 지원
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Preload Korean fonts from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      </head>
      <body className={cn(inter.variable, "font-sans antialiased bg-background text-foreground")}>
        <CapacitorProvider>
          <KeyboardDismiss />
          {children}
        </CapacitorProvider>
      </body>
    </html>
  );
}
