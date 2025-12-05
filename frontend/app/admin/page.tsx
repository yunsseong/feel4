'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  BookOpen,
  Keyboard,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { getAuthFetchOptions } from '@/lib/mobile-auth';

interface DashboardStats {
  users: number;
  content: number;
  works: number;
  typingSessions: number;
  contentByType: Array<{ type: string; count: string }>;
}

const typeLabels: Record<string, string> = {
  bible: '성경',
  novel: '소설',
  poem: '시',
  essay: '수필',
};

const typeColors: Record<string, string> = {
  bible: 'bg-blue-500',
  novel: 'bg-green-500',
  poem: 'bg-purple-500',
  essay: 'bg-orange-500',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const fetchOptions = await getAuthFetchOptions();

        const res = await fetch(`${apiUrl}/admin/stats/overview`, fetchOptions);

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data = await res.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('통계를 불러오는데 실패했습니다');
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: '전체 사용자',
      value: stats?.users ?? 0,
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: '전체 콘텐츠',
      value: stats?.content ?? 0,
      icon: FileText,
      href: '/admin/content',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: '작품 수',
      value: stats?.works ?? 0,
      icon: BookOpen,
      href: '/admin/content',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: '타이핑 세션',
      value: stats?.typingSessions ?? 0,
      icon: Keyboard,
      href: '/admin/stats',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          사이트 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {card.value.toLocaleString()}
                  </div>
                )}
                <Link
                  href={card.href}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-2"
                >
                  자세히 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Distribution & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">콘텐츠 유형별 분포</CardTitle>
            <CardDescription>등록된 콘텐츠의 유형별 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats?.contentByType && stats.contentByType.length > 0 ? (
              <div className="space-y-4">
                {stats.contentByType.map((item) => {
                  const total = stats.contentByType.reduce(
                    (acc, cur) => acc + parseInt(cur.count),
                    0
                  );
                  const percentage = total > 0
                    ? Math.round((parseInt(item.count) / total) * 100)
                    : 0;

                  return (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {typeLabels[item.type] || item.type}
                        </span>
                        <span className="text-muted-foreground">
                          {parseInt(item.count).toLocaleString()}개 ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            typeColors[item.type] || 'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                등록된 콘텐츠가 없습니다
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 작업</CardTitle>
            <CardDescription>자주 사용하는 관리 기능</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/content/new">
                <FileText className="mr-3 h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">새 콘텐츠 추가</div>
                  <div className="text-xs text-muted-foreground">
                    새로운 타이핑 콘텐츠 등록
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/users">
                <Users className="mr-3 h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">사용자 관리</div>
                  <div className="text-xs text-muted-foreground">
                    사용자 목록 및 권한 관리
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/stats">
                <TrendingUp className="mr-3 h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">통계 확인</div>
                  <div className="text-xs text-muted-foreground">
                    타이핑 통계 및 인기 콘텐츠
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
