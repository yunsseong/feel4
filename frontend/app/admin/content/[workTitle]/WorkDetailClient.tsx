'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAuthFetchOptions } from '@/lib/mobile-auth';

interface Section {
  id: string;
  chapter: number;
  section: number;
  content: string;
  displayReference: string;
  workTitle: string;
  contentType: string;
  author?: string;
}

export default function WorkDetailClient() {
  const router = useRouter();
  const params = useParams();
  const workTitle = decodeURIComponent(params.workTitle as string);

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadSections();
  }, [workTitle, page]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions();
      const res = await fetch(
        `${apiUrl}/admin/content/list?workTitle=${encodeURIComponent(workTitle)}&page=${page}&limit=${limit}`,
        authOptions
      );

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();

      setSections(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load sections:', error);
      alert('섹션 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({ method: 'DELETE' });
      const res = await fetch(`${apiUrl}/admin/content/${sectionId}`, authOptions);

      if (res.ok) {
        setSections(sections.filter((s) => s.id !== sectionId));
        alert('삭제되었습니다');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('삭제 실패');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/content')}
          className="mb-4"
        >
          ← 목록으로
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{workTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              총 {sections.length}개 섹션
            </p>
          </div>
          <Button onClick={() => router.push('/admin/content/new')}>
            + 새 섹션 추가
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : sections.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          섹션이 없습니다
        </Card>
      ) : (
        <Card className="p-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-start gap-2 py-1 ${
                index !== sections.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Badge variant="secondary" className="flex-shrink-0 mt-0.5">
                {section.displayReference
                  ? section.displayReference.replace(workTitle, '').trim()
                  : `${section.chapter}:${section.section}`}
              </Badge>
              <div className="flex-1 text-sm leading-relaxed">
                {section.content}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/content/edit/${section.id}`)}
                >
                  편집
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(section.id)}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
