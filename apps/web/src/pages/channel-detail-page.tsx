import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type ChannelDetail = {
  id: string;
  name: string;
  externalId: string;
  url: string | null;
  thumbnailUrl: string | null;
  subscriberCount: string;
  totalViews: string;
  status: string;
  insights: Array<{
    id: string;
    subscriberCount: string;
    totalViews: string;
    capturedAt: string;
    rawData: {
      topVideos?: Array<{
        title: string;
        url: string;
        views?: number;
        thumbnailUrl?: string;
        externalId: string;
      }>;
    } | null;
  }>;
};

function formatBigint(s: string): string {
  return BigInt(s).toLocaleString('vi-VN');
}

export function ChannelDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<ChannelDetail>({
    queryKey: ['channel', id],
    queryFn: async () => {
      const res = await api.get<ChannelDetail>(`/api/channels/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
    refetchInterval: 5_000,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  if (error || !data)
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Không tải được kênh
        </CardContent>
      </Card>
    );

  const chartData = [...data.insights].reverse().map((i) => ({
    time: format(new Date(i.capturedAt), 'HH:mm dd/MM'),
    subs: Number(BigInt(i.subscriberCount)),
    views: Number(BigInt(i.totalViews)),
  }));

  const latest = data.insights[0];
  const topVideos = latest?.rawData?.topVideos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/channels">
            <ChevronLeft className="mr-1 h-4 w-4" /> Tất cả kênh
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-4">
        {data.thumbnailUrl && (
          <img
            src={data.thumbnailUrl}
            alt={data.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>ID: {data.externalId}</span>
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Mở YouTube <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBigint(data.subscriberCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBigint(data.totalViews)}</div>
          </CardContent>
        </Card>
      </div>

      {chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử subscribers ({chartData.length} điểm)</CardTitle>
            <CardDescription>30 lần scan gần nhất</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top {topVideos.length} videos</CardTitle>
          <CardDescription>Từ lần scan gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {topVideos.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có data video — bấm "Quét lại" trên trang Kênh
            </div>
          ) : (
            <div className="divide-y">
              {topVideos.map((v) => (
                <div key={v.externalId} className="flex items-center gap-3 py-3">
                  {v.thumbnailUrl && (
                    <img src={v.thumbnailUrl} alt="" className="h-12 w-20 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {v.title}
                    </a>
                    {v.views !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {v.views.toLocaleString('vi-VN')} lượt xem
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
