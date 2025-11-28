'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Trophy, Calendar } from 'lucide-react';

interface TypingStats {
  date: string;
  sessions: string;
  avgCpm: string;
  avgAccuracy: string;
}

interface PopularContent {
  workTitle: string;
  contentType: string;
  sessionCount: string;
  avgCpm: string;
  avgAccuracy: string;
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

export default function AdminStatsPage() {
  const [typingStats, setTypingStats] = useState<TypingStats[]>([]);
  const [popularContent, setPopularContent] = useState<PopularContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const [typingRes, popularRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats/typing?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/admin/stats/content/popular?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (typingRes.ok) setTypingStats(await typingRes.json());
      if (popularRes.ok) setPopularContent(await popularRes.json());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSessions = typingStats.reduce((acc, cur) => acc + parseInt(cur.sessions), 0);
  const avgCpm = typingStats.length > 0
    ? Math.round(typingStats.reduce((acc, cur) => acc + parseFloat(cur.avgCpm), 0) / typingStats.length)
    : 0;
  const avgAccuracy = typingStats.length > 0
    ? (typingStats.reduce((acc, cur) => acc + parseFloat(cur.avgAccuracy), 0) / typingStats.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">통계</h1>
        <p className="text-muted-foreground">타이핑 통계와 인기 콘텐츠를 확인합니다</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 세션
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 CPM
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgCpm}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 정확도
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgAccuracy}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">일별 통계</TabsTrigger>
          <TabsTrigger value="popular">인기 콘텐츠</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">타이핑 통계</CardTitle>
                <CardDescription>일별 타이핑 세션 현황</CardDescription>
              </div>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-32">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">최근 7일</SelectItem>
                  <SelectItem value="14">최근 14일</SelectItem>
                  <SelectItem value="30">최근 30일</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : typingStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">데이터가 없습니다</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead className="text-right">세션 수</TableHead>
                      <TableHead className="text-right">평균 CPM</TableHead>
                      <TableHead className="text-right">평균 정확도</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typingStats.map((stat) => (
                      <TableRow key={stat.date}>
                        <TableCell className="font-medium">
                          {new Date(stat.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {parseInt(stat.sessions).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {parseFloat(stat.avgCpm).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {parseFloat(stat.avgAccuracy).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">인기 콘텐츠</CardTitle>
              <CardDescription>가장 많이 사용된 콘텐츠 TOP 10</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : popularContent.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">데이터가 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {popularContent.map((content, idx) => (
                    <div
                      key={content.workTitle}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{content.workTitle}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={typeColors[content.contentType]}>
                            {typeLabels[content.contentType] || content.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {parseInt(content.sessionCount).toLocaleString()} 세션
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{parseFloat(content.avgCpm).toFixed(0)} CPM</div>
                        <div>{parseFloat(content.avgAccuracy).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
