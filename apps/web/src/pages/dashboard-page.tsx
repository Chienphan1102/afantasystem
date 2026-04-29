import { useTranslation } from 'react-i18next';
import { Radio, Users, Activity, Bell } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

const fakeChart = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  followers: 10000 + Math.round(Math.sin(i / 3) * 800 + i * 30),
}));

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const user = useAuthStore((s) => s.user);

  const stats = [
    { key: 'total_channels', value: 0, icon: Radio },
    { key: 'total_followers', value: 0, icon: Users },
    { key: 'scans_today', value: 0, icon: Activity },
    { key: 'unread_alerts', value: 0, icon: Bell },
  ] as const;

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
        {stats.map(({ key, value, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(`stats.${key}`)}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value.toLocaleString('vi-VN')}</div>
              <p className="text-xs text-muted-foreground">Phase 1 placeholder</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('growth_chart')}</CardTitle>
          <CardDescription>Sample data — replaced when channels are scanned</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fakeChart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
                dataKey="followers"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('top_channels')}</CardTitle>
          <CardDescription>{t('no_channels_yet')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <Radio className="h-10 w-10" />
            <p className="text-sm">{tc('empty_state.no_data')}</p>
            <p className="text-xs">{t('no_channels_yet')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
