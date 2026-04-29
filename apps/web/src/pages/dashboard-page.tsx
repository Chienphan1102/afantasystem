import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Radio, Users, Activity, Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

type DashboardStats = {
  totalChannels: number;
  totalSubscribers: string;
  scansLast24h: number;
  unreadAlerts: number;
};

type RecentActivity = {
  id: string;
  type: 'scrape_success' | 'scrape_failed';
  channelId: string;
  channelName: string;
  occurredAt: string;
  detail: string;
};

type TrendPoint = { day: string; subscribers: string };

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => (await api.get<DashboardStats>('/api/dashboard/stats')).data,
    refetchInterval: 30_000,
  });

  const { data: trend } = useQuery<TrendPoint[]>({
    queryKey: ['dashboard', 'trend'],
    queryFn: async () => (await api.get<TrendPoint[]>('/api/dashboard/trend')).data,
    refetchInterval: 60_000,
  });

  const { data: activity } = useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => (await api.get<RecentActivity[]>('/api/dashboard/activity')).data,
    refetchInterval: 10_000,
  });

  const totalSubsNum = stats?.totalSubscribers ? Number(BigInt(stats.totalSubscribers)) : 0;
  const fmt = (n: number): string => n.toLocaleString('vi-VN');

  const statCards = [
    {
      key: 'total_channels',
      value: stats?.totalChannels ?? 0,
      icon: Radio,
      color: 'text-blue-600',
    },
    { key: 'total_followers', value: totalSubsNum, icon: Users, color: 'text-green-600' },
    {
      key: 'scans_today',
      value: stats?.scansLast24h ?? 0,
      icon: Activity,
      color: 'text-amber-600',
    },
    { key: 'unread_alerts', value: stats?.unreadAlerts ?? 0, icon: Bell, color: 'text-rose-600' },
  ] as const;

  const chartData = (trend ?? []).map((p) => ({
    day: format(new Date(p.day), 'dd/MM'),
    subs: Number(BigInt(p.subscribers)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {tc('welcome')}, <span className="font-medium">{user?.fullName ?? user?.email}</span>.{' '}
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, value, icon: Icon, color }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(`stats.${key}`)}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('growth_chart')}</CardTitle>
          <CardDescription>
            {chartData.length === 0
              ? 'Chưa có dữ liệu — quét vài kênh để bắt đầu thấy biểu đồ'
              : `Tổng subscribers theo ngày (${chartData.length} điểm)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              📊 Cần ít nhất 2 lần scan để vẽ chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="subs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>10 scan jobs gần nhất — auto refresh 10 giây</CardDescription>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8" />
              <p className="text-sm">Chưa có scan nào — bind kênh đầu tiên ở trang Kênh</p>
            </div>
          ) : (
            <div className="-mx-6 divide-y">
              {activity.map((a) => (
                <Link
                  key={a.id}
                  to={`/channels/${a.channelId}`}
                  className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-accent/40"
                >
                  {a.type === 'scrape_success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{a.channelName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(a.occurredAt), 'HH:mm dd/MM')}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
