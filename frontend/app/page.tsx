import { cookies } from "next/headers";
import { HomeContent } from "./HomeContent";
import { UserProfile } from "@/lib/api";

export const runtime = "edge";

export default async function Home() {
  const cookieStore = await cookies();
  const profileCookie = cookieStore.get("userProfileCache");

  let initialProfile: UserProfile | null = null;
  if (profileCookie?.value) {
    try {
      initialProfile = JSON.parse(decodeURIComponent(profileCookie.value));
    } catch {
      // 파싱 실패 시 무시
    }
  }

  return <HomeContent initialProfile={initialProfile} />;
}
