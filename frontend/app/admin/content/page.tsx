'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getAuthFetchOptions } from '@/lib/mobile-auth';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Scissors,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface Work {
  workTitle: string;
  author: string;
  contentType: string;
  publicationYear: number;
  sectionCount: string;
  isActive: boolean;
  longSectionCount?: number;
}

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

const typeLabels: Record<string, string> = {
  bible: '성경',
  novel: '소설',
  poem: '시',
  essay: '수필',
};

const typeColors: Record<string, string> = {
  bible: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  novel: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  poem: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  essay: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const WARNING_LENGTH = 200;

export default function AdminContentPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [splitting, setSplitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFilter = localStorage.getItem('adminContentFilter') || 'all';
    setFilter(savedFilter);
  }, []);

  useEffect(() => {
    if (mounted) loadWorks();
  }, [filter, mounted]);

  useEffect(() => {
    if (selectedWork) loadSections();
  }, [selectedWork, page]);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = filter && filter !== 'all'
        ? `${apiUrl}/admin/content/works?type=${filter}`
        : `${apiUrl}/admin/content/works`;

      const authOptions = await getAuthFetchOptions();
      const res = await fetch(url, authOptions);

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      setWorks(await res.json());
    } catch (err) {
      console.error('Failed to fetch works:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    if (!selectedWork) return;
    setSectionsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions();
      const res = await fetch(
        `${apiUrl}/admin/content/list?workTitle=${encodeURIComponent(selectedWork)}&page=${page}&limit=${limit}`,
        authOptions
      );

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();

      setSections(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleDelete = async (workTitle: string) => {
    if (!confirm(`"${workTitle}" 작품을 삭제하시겠습니까?`)) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({ method: 'DELETE' });
      const res = await fetch(`${apiUrl}/admin/content/work/${encodeURIComponent(workTitle)}`, authOptions);

      if (res.ok) {
        setWorks(works.filter(w => w.workTitle !== workTitle));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggle = async (workTitle: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({ method: 'PUT' });
      const res = await fetch(`${apiUrl}/admin/content/work/${encodeURIComponent(workTitle)}/toggle`, authOptions);

      if (res.ok) {
        const data = await res.json();
        setWorks(works.map(w =>
          w.workTitle === workTitle ? { ...w, isActive: data.isActive } : w
        ));
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({ method: 'DELETE' });
      const res = await fetch(`${apiUrl}/admin/content/${sectionId}`, authOptions);

      if (res.ok) {
        setSections(sections.filter(s => s.id !== sectionId));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAutoSplit = async (section: Section) => {
    if (section.content.length <= WARNING_LENGTH) return;
    if (!confirm('이 문단을 자동으로 분할하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;

    setSplitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId: section.id, maxLength: 150 }),
      });
      const res = await fetch(`${apiUrl}/admin/content/split`, authOptions);

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();
      if (result.success) {
        loadSections();
      }
    } catch (error) {
      console.error('Split failed:', error);
    } finally {
      setSplitting(false);
    }
  };

  // Section detail view
  if (selectedWork) {
    const longSections = sections.filter(s => s.content.length > WARNING_LENGTH);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            setSelectedWork(null);
            setSections([]);
            setPage(1);
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{selectedWork}</h1>
            <p className="text-muted-foreground">
              총 {total.toLocaleString()}개 섹션
              {longSections.length > 0 && (
                <span className="ml-2 text-destructive">
                  (분할 필요: {longSections.length}개)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {works.find(w => w.workTitle === selectedWork)?.longSectionCount ? (
              <Button
                variant="outline"
                onClick={async () => {
                  const work = works.find(w => w.workTitle === selectedWork);
                  const totalLong = work?.longSectionCount || 0;
                  if (!confirm(`${totalLong}개의 긴 섹션을 모두 분할하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
                  setSplitting(true);
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

                    // Fetch all sections to find all long ones
                    const listAuthOptions = await getAuthFetchOptions();
                    const allRes = await fetch(
                      `${apiUrl}/admin/content/list?workTitle=${encodeURIComponent(selectedWork)}&page=1&limit=10000`,
                      listAuthOptions
                    );
                    const allData = await allRes.json();
                    const allLongSections = allData.items.filter((s: Section) => s.content.length > WARNING_LENGTH);

                    for (const section of allLongSections) {
                      const splitAuthOptions = await getAuthFetchOptions({
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ contentId: section.id, maxLength: 150 }),
                      });
                      await fetch(`${apiUrl}/admin/content/split`, splitAuthOptions);
                    }
                    loadWorks();
                    loadSections();
                  } catch (error) {
                    console.error('Bulk split failed:', error);
                  } finally {
                    setSplitting(false);
                  }
                }}
                disabled={splitting}
              >
                <Scissors className="mr-2 h-4 w-4" />
                전체 분할 ({works.find(w => w.workTitle === selectedWork)?.longSectionCount})
              </Button>
            ) : null}
            <Button onClick={() => router.push('/admin/content/new')}>
              <Plus className="mr-2 h-4 w-4" />
              새 섹션
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {sectionsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 flex-1" />
                  </div>
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>섹션이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y">
                {sections.map((section) => {
                  const isLong = section.content.length > WARNING_LENGTH;
                  return (
                    <div key={section.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <Badge variant="secondary" className="mt-0.5 font-mono text-xs">
                        {section.displayReference
                          ? section.displayReference.replace(selectedWork, '').trim()
                          : `${section.chapter}:${section.section}`}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{section.content}</p>
                        {isLong && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {section.content.length}자 - 분할 권장
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isLong && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAutoSplit(section)}
                            disabled={splitting}
                          >
                            <Scissors className="mr-1 h-3 w-3" />
                            분할
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/content/edit/${section.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Works list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">콘텐츠 관리</h1>
          <p className="text-muted-foreground">작품과 섹션을 관리합니다</p>
        </div>
        <Button onClick={() => router.push('/admin/content/new')}>
          <Plus className="mr-2 h-4 w-4" />
          새 작품
        </Button>
      </div>

      {mounted && (
        <Tabs value={filter} onValueChange={(value) => {
          setFilter(value);
          localStorage.setItem('adminContentFilter', value);
        }}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            {Object.entries(typeLabels).map(([type, label]) => (
              <TabsTrigger key={type} value={type}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24 ml-auto" />
                </div>
              ))}
            </div>
          ) : works.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>등록된 작품이 없습니다</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/admin/content/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                작품 추가하기
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작품명</TableHead>
                  <TableHead>저자</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">섹션</TableHead>
                  <TableHead className="text-center">분할 필요</TableHead>
                  <TableHead className="text-center">활성화</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((work) => (
                  <TableRow key={work.workTitle} className="cursor-pointer" onClick={() => setSelectedWork(work.workTitle)}>
                    <TableCell className="font-medium">
                      {work.workTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {work.author || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', typeColors[work.contentType])}>
                        {typeLabels[work.contentType] || work.contentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {parseInt(work.sectionCount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {work.longSectionCount && work.longSectionCount > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {work.longSectionCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={work.isActive ?? true}
                        onCheckedChange={() => handleToggle(work.workTitle)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedWork(work.workTitle)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(work.workTitle)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
