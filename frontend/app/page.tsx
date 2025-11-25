import { TypingArea } from "@/components/TypingArea";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 relative overflow-hidden">
      <div className="z-10 w-full items-center justify-between font-mono text-sm flex absolute top-8 left-0 right-0 px-8">
        <div className="font-bold text-2xl tracking-tighter">Feel4</div>
        <Link
          className="font-medium hover:underline underline-offset-4"
          href="/login"
        >
          Login
        </Link>
      </div>

      <div className="relative flex place-items-center z-20">
        <TypingArea />
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground">
        필사의 감동을 느껴보세요.
      </div>
    </main>
  );
}
