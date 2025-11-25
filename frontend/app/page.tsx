"use client";

import { useEffect, useState } from "react";
import { TypingArea } from "@/components/TypingArea";
import Link from "next/link";
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

export default function Home() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType>("bible");
  const [works, setWorks] = useState<Work[]>([]);
  const [showWorkSelector, setShowWorkSelector] = useState(false);

  const fetchContent = async (contentType?: ContentType) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = contentType
        ? `${apiUrl}/typing/content?type=${contentType}`
        : `${apiUrl}/typing/content`;
      const res = await fetch(url);
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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/typing/content/list?type=${contentType}`);
      const data = await res.json();
      setWorks(data);
    } catch (err) {
      console.error("Failed to fetch works", err);
    }
  };

  const selectWork = async (work: Work) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/typing/content/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

  const handleComplete = async () => {
    // 다음 콘텐츠 가져오기
    fetchContent(selectedType);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 헤더 */}
      <div className="z-10 w-full items-center justify-between font-mono text-sm flex absolute top-8 left-0 right-0 px-8">
        <div className="font-bold text-2xl tracking-tighter">필사</div>
        <Link
          className="font-medium hover:underline underline-offset-4"
          href="/login"
        >
          로그인
        </Link>
      </div>

      {/* 콘텐츠 타입 선택 탭 */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 bg-muted rounded-lg p-1">
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
      {content && (
        <div className="absolute top-32 left-0 w-full text-center">
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
      )}

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
                    content && work.workTitle === content.workTitle && "bg-muted"
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

      {/* 타이핑 영역 */}
      <div className="relative flex place-items-center z-20 mt-16">
        {loading ? (
          <div className="text-muted-foreground">불러오는 중...</div>
        ) : content ? (
          <TypingArea key={content.displayReference} initialContent={content.content} onComplete={handleComplete} />
        ) : (
          <div className="text-muted-foreground">콘텐츠를 불러올 수 없습니다.</div>
        )}
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground">
        필사의 감동을 느껴보세요.
      </div>
    </main>
  );
}
