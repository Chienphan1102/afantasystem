import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { AddChannelModal } from '@/components/add-channel-modal';
import { MasterPasswordModal } from '@/components/master-password-modal';
import { useMasterPasswordStore } from '@/stores/master-password-store';

type Channel = {
  id: string;
  externalId: string;
  name: string;
  url: string | null;
  thumbnailUrl: string | null;
  subscriberCount: string; // bigint serialized as string
  totalViews: string;
  status: string;
  updatedAt: string;
  platformAccount: { id: string; platform: string; accountLabel: string; status: string };
  insights: Array<{ subscriberCount: string; totalViews: string; capturedAt: string }>;
};

function formatBigint(s: string): string {
  const n = BigInt(s);
  return n.toLocaleString('vi-VN');
}

export function ChannelsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [pendingRescanId, setPendingRescanId] = useState<string | null>(null);
  const [showMasterPw, setShowMasterPw] = useState(false);
  const masterPwGet = useMasterPasswordStore((s) => s.get);

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get<Channel[]>('/api/channels');
      return res.data;
    },
    refetchInterval: 10_000, // Auto refresh để thấy scan job hoàn tất
  });

  const rescanMutation = useMutation({
    mutationFn: ({ id, masterPassword }: { id: string; masterPassword: string }) =>
      api.post<{ jobId: string }>(`/api/channels/${id}/rescan`, { masterPassword }),
    onSuccess: () => {
      toast.success('Đã đưa vào hàng đợi quét — kết quả sẽ tự refresh');
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data?.message as string | undefined) ?? 'Rescan thất bại')
          : 'Rescan thất bại';
      toast.error(message);
    },
    onSettled: () => setPendingRescanId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/channels/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá kênh');
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const startRescan = (id: string): void => {
    setPendingRescanId(id);
    const pw = masterPwGet();
    if (!pw) {
      setShowMasterPw(true);
      return;
    }
    rescanMutation.mutate({ id, masterPassword: pw });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kênh</h1>
          <p className="mt-1 text-muted-foreground">
            Subscribers, views, top videos — quét bằng session đã mã hoá
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm kênh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Đang tải...
          </CardContent>
        </Card>
      ) : channels && channels.length > 0 ? (
        <div className="grid gap-3">
          {channels.map((c) => {
            const lastInsight = c.insights[0];
            const subs = lastInsight?.subscriberCount ?? c.subscriberCount;
            const views = lastInsight?.totalViews ?? c.totalViews;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-4">
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                        ▶
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{c.name}</h3>
                        <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase">
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {c.platformAccount.accountLabel}
                        {' · '}
                        Cập nhật:{' '}
                        {lastInsight
                          ? format(new Date(lastInsight.capturedAt), 'dd/MM/yyyy HH:mm')
                          : 'chưa quét'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 md:gap-8 md:px-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Subscribers
                      </div>
                      <div className="text-lg font-bold">{formatBigint(subs)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Total views
                      </div>
                      <div className="text-lg font-bold">{formatBigint(views)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/channels/${c.id}`}>
                        <Eye className="mr-1 h-3 w-3" /> Chi tiết
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => startRescan(c.id)}
                      disabled={pendingRescanId === c.id || rescanMutation.isPending}
                    >
                      {pendingRescanId === c.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1 h-3 w-3" />
                      )}
                      Quét lại
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Xoá kênh ${c.name}?`)) deleteMutation.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="text-5xl">📺</div>
            <div>
              <p className="font-medium">Chưa có kênh nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bấm "+ Thêm kênh" để bind kênh YouTube đầu tiên (cần PlatformAccount ACTIVE).
              </p>
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" /> Thêm kênh đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      <AddChannelModal open={showAdd} onClose={() => setShowAdd(false)} />

      <MasterPasswordModal
        open={showMasterPw}
        onConfirm={() => {
          setShowMasterPw(false);
          const pw = masterPwGet();
          if (pw && pendingRescanId) {
            rescanMutation.mutate({ id: pendingRescanId, masterPassword: pw });
          }
        }}
        onCancel={() => {
          setShowMasterPw(false);
          setPendingRescanId(null);
        }}
      />
    </div>
  );
}
