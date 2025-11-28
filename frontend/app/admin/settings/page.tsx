'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Server,
  Database,
  HardDrive,
  Clock,
  Cpu,
  Download,
  RefreshCcw,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface SystemInfo {
  database: {
    size: string;
    tables: Array<{
      tablename: string;
      size: string;
      row_count: number;
    }>;
  };
  version: string;
  nodeVersion: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
  };
}

export default function AdminSettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${apiUrl}/admin/system/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      setSystemInfo(await res.json());
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setError('시스템 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}일 ${hours}시간 ${mins}분`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const systemStats = [
    {
      label: '앱 버전',
      value: systemInfo?.version,
      icon: Server,
    },
    {
      label: 'Node.js',
      value: systemInfo?.nodeVersion,
      icon: Cpu,
    },
    {
      label: '가동 시간',
      value: systemInfo?.uptime ? formatUptime(systemInfo.uptime) : null,
      icon: Clock,
    },
    {
      label: '메모리 사용',
      value: systemInfo?.memory ? formatBytes(systemInfo.memory.heapUsed) : null,
      icon: HardDrive,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadSystemInfo}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground">시스템 상태와 관리 기능</p>
      </div>

      {/* System Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <div className="text-lg font-semibold">{stat.value || '-'}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터베이스
            </CardTitle>
            <CardDescription>
              전체 크기: {loading ? '로딩 중...' : systemInfo?.database.size || '-'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadSystemInfo}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>테이블</TableHead>
                  <TableHead className="text-right">크기</TableHead>
                  <TableHead className="text-right">행 수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemInfo?.database.tables.map((table) => (
                  <TableRow key={table.tablename}>
                    <TableCell className="font-mono text-sm">{table.tablename}</TableCell>
                    <TableCell className="text-right">{table.size}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {table.row_count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시스템 작업</CardTitle>
          <CardDescription>데이터베이스 관리 및 시스템 작업</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Download className="h-5 w-5" />
            <span>데이터베이스 백업</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <RefreshCcw className="h-5 w-5" />
            <span>캐시 초기화</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <FileText className="h-5 w-5" />
            <span>시스템 로그</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
