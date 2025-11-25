"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TypingArea } from "@/components/TypingArea";

interface ContentData {
    book: string;
    chapter: number;
    verse: number;
    content: string;
    cursorPos: number;
}

export default function TypingPage() {
    const router = useRouter();
    const [content, setContent] = useState<ContentData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const res = await fetch("http://localhost:3201/typing/content", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            setContent(data);
        } catch (err) {
            console.error("Failed to fetch content", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleComplete = async (stats: { cpm: number; accuracy: number }) => {
        if (!content) return;
        const token = localStorage.getItem("accessToken");

        try {
            await fetch("http://localhost:3201/typing/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    book: content.book,
                    chapter: content.chapter,
                    verse: content.verse,
                    cpm: stats.cpm,
                    accuracy: stats.accuracy,
                }),
            });
            // Fetch next content
            fetchContent();
        } catch (err) {
            console.error("Failed to submit", err);
        }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    if (!content) return <div className="flex min-h-screen items-center justify-center">No content available.</div>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 relative">
            <div className="absolute top-8 left-0 w-full text-center text-sm text-muted-foreground">
                {content.book} {content.chapter}:{content.verse}
            </div>

            <TypingArea initialContent={content.content} onComplete={handleComplete} />
        </main>
    );
}
