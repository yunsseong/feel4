'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getAuthFetchOptions } from '@/lib/mobile-auth';
import {
  ArrowLeft,
  Save,
  FileText,
  BookOpen,
  BookMarked,
  ScrollText,
  Scissors,
  AlertCircle,
} from 'lucide-react';

const contentTypeConfig = {
  bible: { label: '성경', icon: BookMarked },
  novel: { label: '소설', icon: BookOpen },
  poem: { label: '시', icon: ScrollText },
  essay: { label: '수필', icon: FileText },
};

function EditContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [formData, setFormData] = useState({
    contentType: 'novel' as 'bible' | 'novel' | 'poem' | 'essay',
    workTitle: '',
    author: '',
    chapter: 1,
    section: 1,
    content: '',
    displayReference: '',
    publicationYear: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const RECOMMENDED_LENGTH = 150;
  const WARNING_LENGTH = 200;

  useEffect(() => {
    if (id) {
      loadContent();
    } else {
      setError('콘텐츠 ID가 없습니다');
      setLoading(false);
    }
  }, [id]);

  const loadContent = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions();
      const res = await fetch(`${apiUrl}/admin/content/${id}`, authOptions);

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();
      setFormData(data);
    } catch (error) {
      console.error('Failed to load content:', error);
      setError('콘텐츠를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const res = await fetch(`${apiUrl}/admin/content/${id}`, authOptions);

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      alert('콘텐츠가 수정되었습니다');
      router.back();
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'chapter' || name === 'section' || name === 'publicationYear'
        ? value ? parseInt(value) : undefined
        : value,
    }));
  };

  const handleAutoSplit = async () => {
    if (!formData.content || formData.content.length <= WARNING_LENGTH || !id) {
      return;
    }

    if (!confirm('이 콘텐츠를 자동으로 분할하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setSplitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const authOptions = await getAuthFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: id,
          maxLength: RECOMMENDED_LENGTH,
        }),
      });
      const res = await fetch(`${apiUrl}/admin/content/split`, authOptions);

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();

      if (result.success) {
        alert(`분할 완료: ${result.segmentCount}개의 문단으로 분할되었습니다.`);
        router.back();
      } else {
        alert(`분할 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Split failed:', error);
      alert('분할 실패');
    } finally {
      setSplitting(false);
    }
  };

  const getLengthStatus = () => {
    const length = formData.content.length;
    if (length <= RECOMMENDED_LENGTH) {
      return { color: 'text-green-600', message: '적정 길이', bg: 'bg-green-500' };
    } else if (length <= WARNING_LENGTH) {
      return { color: 'text-yellow-600', message: '권장 길이 초과', bg: 'bg-yellow-500' };
    } else {
      return { color: 'text-destructive', message: '분할 권장', bg: 'bg-destructive' };
    }
  };

  const lengthPercentage = Math.min((formData.content.length / WARNING_LENGTH) * 100, 100);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">콘텐츠 편집</h1>
          <p className="text-muted-foreground">콘텐츠 정보를 수정합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">콘텐츠 정보</CardTitle>
              <CardDescription>타이핑에 사용될 텍스트를 수정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Work Title */}
              <div className="space-y-2">
                <Label htmlFor="workTitle">작품명 *</Label>
                <Input
                  id="workTitle"
                  name="workTitle"
                  value={formData.workTitle}
                  onChange={handleChange}
                  placeholder="작품 제목을 입력하세요"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">본문 내용 *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="타이핑할 텍스트를 입력하세요..."
                  required
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {formData.content.length}자
                      </span>
                      <span className={cn('font-medium', getLengthStatus().color)}>
                        ({getLengthStatus().message})
                      </span>
                    </div>
                    {formData.content.length > WARNING_LENGTH && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAutoSplit}
                        disabled={splitting}
                      >
                        <Scissors className="mr-2 h-4 w-4" />
                        {splitting ? '분할 중...' : '자동 분할'}
                      </Button>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', getLengthStatus().bg)}
                      style={{ width: `${lengthPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    권장: {RECOMMENDED_LENGTH}자 이하 | 경고: {WARNING_LENGTH}자 초과
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">메타데이터</CardTitle>
                <CardDescription>콘텐츠 분류 정보</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type */}
                <div className="space-y-2">
                  <Label>콘텐츠 유형 *</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contentTypeConfig).map(([key, { label, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author">저자</Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author || ''}
                    onChange={handleChange}
                    placeholder="저자명"
                  />
                </div>

                {/* Chapter and Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="chapter">장 *</Label>
                    <Input
                      id="chapter"
                      name="chapter"
                      type="number"
                      value={formData.chapter}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">절 *</Label>
                    <Input
                      id="section"
                      name="section"
                      type="number"
                      value={formData.section}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Display Reference */}
                <div className="space-y-2">
                  <Label htmlFor="displayReference">표시 레퍼런스</Label>
                  <Input
                    id="displayReference"
                    name="displayReference"
                    value={formData.displayReference || ''}
                    onChange={handleChange}
                    placeholder="예: 창세기 1:1"
                  />
                </div>

                {/* Publication Year */}
                <div className="space-y-2">
                  <Label htmlFor="publicationYear">출판년도</Label>
                  <Input
                    id="publicationYear"
                    name="publicationYear"
                    type="number"
                    value={formData.publicationYear || ''}
                    onChange={handleChange}
                    min="1000"
                    max="2100"
                    placeholder="예: 1925"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="w-full"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditContentPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    }>
      <EditContentForm />
    </Suspense>
  );
}
