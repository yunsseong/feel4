import type { Metadata } from "next";
import { Inter, Gowun_Batang } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const gowunBatang = Gowun_Batang({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Feel4 - 필사의 감동",
  description: "소설, 시, 수필, 성경을 필사하며 느끼는 감동",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn(inter.variable, gowunBatang.variable, "font-sans antialiased bg-background text-foreground")}>
        {children}
      </body>
    </html>
  );
}
