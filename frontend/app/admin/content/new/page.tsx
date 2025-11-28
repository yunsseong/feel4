'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, FileText, BookOpen, BookMarked, ScrollText, Scissors, Eye } from 'lucide-react';

const contentTypeConfig = {
  bible: { label: '성경', icon: BookMarked },
  novel: { label: '소설', icon: BookOpen },
  poem: { label: '시', icon: ScrollText },
  essay: { label: '수필', icon: FileText },
};

interface SplitPreview {
  originalLength: number;
  segmentCount: number;
  segments: Array<{
    index: number;
    length: number;
    preview: string;
  }>;
}

export default function NewContentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contentType: 'novel' as 'bible' | 'novel' | 'poem' | 'essay',
    workTitle: '',
    author: '',
    chapter: 1,
    content: '',
    publicationYear: undefined as number | undefined,
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<SplitPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);

  const RECOMMENDED_LENGTH = 150;

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // 텍스트가 변경될 때 미리보기 초기화
  useEffect(() => {
    setPreview(null);
    setShowPreview(false);
  }, [formData.content]);

  const handlePreview = async () => {
    if (!formData.content.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${apiUrl}/admin/content/preview-split`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: formData.content,
          maxLength: RECOMMENDED_LENGTH,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();
      setPreview(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('미리보기 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // 대량 등록 API 호출
      const res = await fetch(`${apiUrl}/admin/content/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: formData.contentType,
          workTitle: formData.workTitle,
          author: formData.author,
          chapter: formData.chapter,
          content: formData.content,
          publicationYear: formData.publicationYear,
          maxLength: RECOMMENDED_LENGTH,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();
      alert(`${result.createdCount}개의 문단이 등록되었습니다`);
      router.push('/admin/content');
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
      [name]: name === 'chapter' || name === 'publicationYear'
        ? value ? parseInt(value) : undefined
        : value,
    }));
  };

  // 줄바꿈 기반 예상 문단 수 계산
  const estimatedSegments = (() => {
    if (formData.content.length === 0) return 0;

    // 줄바꿈으로 먼저 분리
    const paragraphs = formData.content
      .split(/\n\s*\n|\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length === 0) return 1;

    // 각 문단이 150자 초과하면 추가 분할 예상
    let count = 0;
    for (const p of paragraphs) {
      if (p.length <= RECOMMENDED_LENGTH) {
        count += 1;
      } else {
        count += Math.ceil(p.length / RECOMMENDED_LENGTH);
      }
    }
    return count;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">새 콘텐츠 추가</h1>
          <p className="text-muted-foreground">전체 텍스트를 입력하면 자동으로 문단 분할됩니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">콘텐츠 정보</CardTitle>
              <CardDescription>
                전체 텍스트를 붙여넣으면 {RECOMMENDED_LENGTH}자 단위로 자동 분할됩니다
              </CardDescription>
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
                  rows={16}
                  className="font-mono text-sm"
                  placeholder="전체 텍스트를 붙여넣으세요..."
                  required
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {formData.content.length.toLocaleString()}자
                    </span>
                    {formData.content.length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Scissors className="h-3 w-3" />
                        예상 {estimatedSegments}개 문단
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={!formData.content.trim()}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    분할 미리보기
                  </Button>
                </div>
              </div>

              {/* Split Preview */}
              {showPreview && preview && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">분할 미리보기</h4>
                    <Badge>{preview.segmentCount}개 문단</Badge>
                  </div>
                  <Separator />
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {preview.segments.map((seg) => (
                      <div
                        key={seg.index}
                        className="flex items-start gap-3 rounded-md bg-background p-3"
                      >
                        <Badge variant="outline" className="shrink-0">
                          {seg.index}문단
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {seg.preview}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {seg.length}자
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  {mounted ? (
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
                  ) : (
                    <div className="h-9 w-full rounded-md border bg-background" />
                  )}
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author">저자</Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="저자명"
                  />
                </div>

                {/* Chapter */}
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
              <Button type="submit" disabled={saving || !formData.content.trim()} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? '저장 중...' : `저장 (${estimatedSegments}개 문단)`}
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
