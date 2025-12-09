"use client";

import { useEffect, useState } from "react";
import { TypingArea } from "@/components/TypingArea";
import { Header } from "@/components/Header";
import { ContentTypeTabs, ContentType, CONTENT_TYPE_LABELS } from "@/components/ContentTypeTabs";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/api";
import { apiFetchJson } from "@/lib/api-config";
import { getMutedForeground, getMutedBackground, getBorderColor, getColorBrightness } from "@/lib/theme";

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

interface HomeContentProps {
  initialProfile: UserProfile | null;
}

function HomeContentInner({ initialProfile }: HomeContentProps) {
  const { theme, isEmbedded } = useTheme();

  // iframe 임베딩 시 데모 모드: 사용자 정보 숨김
  const profile = isEmbedded ? null : initialProfile;
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [showWorkSelector, setShowWorkSelector] = useState(false);

  const fetchContent = async (contentType?: ContentType) => {
    try {
      const path = contentType
        ? `/typing/content?type=${contentType}`
        : `/typing/content`;
      const data = await apiFetchJson<ContentData>(path);
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
      const data = await apiFetchJson<Work[]>(`/typing/content/list?type=${contentType}`);
      setWorks(data);
    } catch (err) {
      console.error("Failed to fetch works", err);
    }
  };

  const selectWork = async (work: Work) => {
    if (!selectedType) return;
    try {
      const data = await apiFetchJson<ContentData>(`/typing/content/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: selectedType,
          workTitle: work.workTitle,
        }),
      });
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
    if (!content) return;

    try {
      const data = await apiFetchJson<ContentData>(`/typing/content/next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: content.contentType,
          workTitle: content.workTitle,
          chapter: content.chapter,
          section: content.section,
        }),
      });
      setContent(data);
    } catch (err) {
      console.error("Failed to fetch next content", err);
    }
  };

  // 테마 기반 CSS 변수 계산
  const isDarkBg = getColorBrightness(theme.backgroundColor) < 128;
  const themeStyles = {
    backgroundColor: theme.backgroundColor,
    color: theme.fontColor,
    '--foreground': theme.fontColor,
    '--background': theme.backgroundColor,
    '--muted-foreground': getMutedForeground(theme.backgroundColor),
    '--muted': getMutedBackground(theme.backgroundColor),
    '--border': getBorderColor(theme.backgroundColor),
  } as React.CSSProperties;

  return (
    <main
      className="h-screen flex flex-col overflow-hidden pt-safe transition-colors duration-200"
      style={themeStyles}
    >
      {/* 헤더 영역 - 고정 높이 */}
      <Header initialProfile={profile} />

      {/* 콘텐츠 타입 탭 영역 - 고정 높이 */}
      <ContentTypeTabs selectedType={selectedType} onTypeChange={handleTypeChange} />

      {/* 작품 정보 영역 - 고정 높이 */}
      <div className="h-10 flex items-center justify-center shrink-0">
        {content && selectedType && (
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
        )}
      </div>

      {/* 타이핑 영역 - 남은 공간 전체 사용 */}
      {/* 모바일: 키보드가 올라오므로 상단 1/4 지점에 배치, 데스크톱: 중앙 */}
      <div className="flex-1 flex items-start md:items-center justify-center min-h-0 px-4 pt-[12vh] md:pt-0">
        {loading ? (
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        ) : content ? (
          <TypingArea
            key={content.displayReference}
            initialContent={content.content}
            onComplete={handleComplete}
            fontFamily={theme.fontFamily}
            fontSize={theme.fontSize}
            fontColor={theme.fontColor}
          />
        ) : (
          <div className="text-muted-foreground">콘텐츠를 불러올 수 없습니다.</div>
        )}
      </div>

      {/* 푸터 영역 - 고정 높이 */}
      <footer className="h-12 shrink-0" />

      {/* 작품 선택 모달 */}
      {showWorkSelector && selectedType && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowWorkSelector(false)}
        >
          <div
            className="rounded-lg p-6 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-xl mx-4"
            style={{
              backgroundColor: isDarkBg ? '#374151' : '#FFFFFF',
              color: theme.fontColor,
            }}
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
                  className="w-full text-left px-4 py-3 rounded-md transition-colors"
                  style={{
                    backgroundColor: content && work.workTitle === content.workTitle
                      ? (isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!(content && work.workTitle === content.workTitle)) {
                      e.currentTarget.style.backgroundColor = isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(content && work.workTitle === content.workTitle)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="font-medium">{work.workTitle}</div>
                  {work.author && (
                    <div className="text-sm" style={{ opacity: 0.6 }}>
                      {work.author}
                      {work.publicationYear && ` (${work.publicationYear})`}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWorkSelector(false)}
              className="mt-4 w-full py-2 text-sm transition-colors"
              style={{ opacity: 0.6 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ThemeProvider로 감싸는 wrapper 컴포넌트
export function HomeContent({ initialProfile }: HomeContentProps) {
  return (
    <ThemeProvider user={initialProfile}>
      <HomeContentInner initialProfile={initialProfile} />
    </ThemeProvider>
  );
}
