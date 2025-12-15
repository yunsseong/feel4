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
  metadataBase: new URL("https://feel4.maesil.io"),
  title: {
    default: "필사 - 소설, 시, 수필, 성경 필사 앱",
    template: "%s | 필사",
  },
  description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동. 타이핑으로 문학 작품을 필사하고 마음의 평화를 찾아보세요.",
  keywords: ["필사", "타이핑", "문학", "소설", "시", "수필", "성경", "명상", "글쓰기", "한글 타이핑"],
  authors: [{ name: "필사" }],
  creator: "필사",
  publisher: "필사",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>",
    apple: "/icon-192x192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "필사 - 소설, 시, 수필, 성경 필사 앱",
    description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동. 타이핑으로 문학 작품을 필사하고 마음의 평화를 찾아보세요.",
    url: "https://feel4.maesil.io",
    siteName: "필사",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "필사 - 문학 작품 필사 앱",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "필사 - 소설, 시, 수필, 성경 필사 앱",
    description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동. 타이핑으로 문학 작품을 필사하고 마음의 평화를 찾아보세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://feel4.maesil.io",
  },
  verification: {
    // Google Search Console 및 네이버 웹마스터 도구 등록 후 아래 값 추가
    // google: "your-google-verification-code",
    // other: {
    //   "naver-site-verification": "your-naver-verification-code",
    // },
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

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-B1T696Y8KH" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-B1T696Y8KH');
            `,
          }}
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "필사",
              "alternateName": "Feel4",
              "description": "소설, 시, 수필, 성경을 필사하며 느끼는 감동. 타이핑으로 문학 작품을 필사하고 마음의 평화를 찾아보세요.",
              "url": "https://feel4.maesil.io",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web, iOS, Android",
              "inLanguage": "ko",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "1"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "필사",
              "url": "https://feel4.maesil.io",
              "logo": "https://feel4.maesil.io/icon-512x512.png",
              "sameAs": []
            })
          }}
        />
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
