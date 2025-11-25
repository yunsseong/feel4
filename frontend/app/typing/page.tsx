"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TypingArea } from "@/components/TypingArea";
import { cn } from "@/lib/utils";

type ContentType = "bible" | "novel" | "poem" | "essay";

interface ContentData {
    contentType: ContentType;
    workTitle: string;
    chapter: number;
    section: number;
    content: string;
    displayReference: string;
    author: string | null;
    cursorPos: number;
}

interface Work {
    workTitle: string;
    author: string | null;
    publicationYear: number | null;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    bible: "성경",
    novel: "소설",
    poem: "시",
    essay: "수필",
};

export default function TypingPage() {
    const router = useRouter();
    const [content, setContent] = useState<ContentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<ContentType>("bible");
    const [works, setWorks] = useState<Work[]>([]);
    const [showWorkSelector, setShowWorkSelector] = useState(false);

    const fetchContent = async (contentType?: ContentType) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const url = contentType
                ? `http://localhost:3201/typing/content?type=${contentType}`
                : "http://localhost:3201/typing/content";
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            setContent(data);
            setSelectedType(data.contentType);
        } catch (err) {
            console.error("Failed to fetch content", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorks = async (contentType: ContentType) => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await fetch(`http://localhost:3201/typing/content/list?type=${contentType}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setWorks(data);
        } catch (err) {
            console.error("Failed to fetch works", err);
        }
    };

    const selectWork = async (work: Work) => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await fetch("http://localhost:3201/typing/content/set", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentType: selectedType,
                    workTitle: work.workTitle,
                }),
            });
            const data = await res.json();
            setContent(data);
            setShowWorkSelector(false);
        } catch (err) {
            console.error("Failed to set content", err);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleTypeChange = async (type: ContentType) => {
        setSelectedType(type);
        setLoading(true);
        await fetchContent(type);
        await fetchWorks(type);
    };

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
                    contentType: content.contentType,
                    workTitle: content.workTitle,
                    chapter: content.chapter,
                    section: content.section,
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
            {/* 콘텐츠 타입 선택 탭 */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-muted rounded-lg p-1">
                {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => handleTypeChange(type)}
                        className={cn(
                            "px-4 py-2 text-sm rounded-md transition-colors",
                            selectedType === type
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {CONTENT_TYPE_LABELS[type]}
                    </button>
                ))}
            </div>

            {/* 현재 작품 정보 및 선택 버튼 */}
            <div className="absolute top-16 left-0 w-full text-center">
                <button
                    onClick={() => {
                        fetchWorks(selectedType);
                        setShowWorkSelector(true);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    {content.author && <span className="mr-2">{content.author}</span>}
                    <span className="font-medium">{content.displayReference}</span>
                    <span className="ml-2 text-xs">▼</span>
                </button>
            </div>

            {/* 작품 선택 모달 */}
            {showWorkSelector && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowWorkSelector(false)}
                >
                    <div
                        className="bg-background rounded-lg p-6 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-4">
                            {CONTENT_TYPE_LABELS[selectedType]} 선택
                        </h2>
                        <div className="space-y-2">
                            {works.map((work) => (
                                <button
                                    key={work.workTitle}
                                    onClick={() => selectWork(work)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-md transition-colors",
                                        "hover:bg-muted",
                                        work.workTitle === content.workTitle && "bg-muted"
                                    )}
                                >
                                    <div className="font-medium">{work.workTitle}</div>
                                    {work.author && (
                                        <div className="text-sm text-muted-foreground">
                                            {work.author}
                                            {work.publicationYear && ` (${work.publicationYear})`}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowWorkSelector(false)}
                            className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            <TypingArea key={content.displayReference} initialContent={content.content} onComplete={handleComplete} />
        </main>
    );
}
