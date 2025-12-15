import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "필사 앱에 로그인하여 필사 진행 상황을 저장하세요. Google 계정으로 간편하게 로그인할 수 있습니다.",
  openGraph: {
    title: "로그인 | 필사",
    description: "필사 앱에 로그인하여 필사 진행 상황을 저장하세요.",
    url: "https://feel4.app/login",
  },
  alternates: {
    canonical: "https://feel4.app/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
