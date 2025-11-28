"use client";

import { cn } from "@/lib/utils";

export type ContentType = "bible" | "novel" | "poem" | "essay";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  bible: "성경",
  novel: "소설",
  poem: "시",
  essay: "수필",
};

interface ContentTypeTabsProps {
  selectedType: ContentType | null;
  onTypeChange: (type: ContentType) => void;
}

export function ContentTypeTabs({ selectedType, onTypeChange }: ContentTypeTabsProps) {
  return (
    <div className="h-14 flex items-center justify-center shrink-0">
      <div className="inline-flex bg-muted rounded-lg p-1">
        {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              "px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap",
              selectedType === type
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {CONTENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

export { CONTENT_TYPE_LABELS };
