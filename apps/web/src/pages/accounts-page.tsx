import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { AddAccountModal } from '@/components/add-account-modal';
import { cn } from '@/lib/utils';
import { useMasterPasswordStore } from '@/stores/master-password-store';
import { MasterPasswordModal } from '@/components/master-password-modal';

type PlatformAccount = {
  id: string;
  platform: 'YOUTUBE' | 'FACEBOOK_PAGE' | string;
  accountLabel: string;
  status: 'ACTIVE' | 'CHECKPOINT' | 'EXPIRED' | 'DISABLED' | 'REVOKED';
  channelName?: string;
  channelUrl?: string;
  channelThumbnailUrl?: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<PlatformAccount['status'], string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  CHECKPOINT: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  EXPIRED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  DISABLED: 'bg-muted text-muted-foreground border-muted',
  REVOKED: 'bg-muted text-muted-foreground border-muted',
};

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: 'YouTube',
  FACEBOOK_PAGE: 'Facebook Page',
};

export function AccountsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [showMasterPwForVerify, setShowMasterPwForVerify] = useState(false);
  const masterPwGet = useMasterPasswordStore((s) => s.get);

  const { data: accounts, isLoading } = useQuery<PlatformAccount[]>({
    queryKey: ['platform-accounts'],
    queryFn: async () => {
      const res = await api.get<PlatformAccount[]>('/api/platform-accounts');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/platform-accounts/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá tài khoản');
      void queryClient.invalidateQueries({ queryKey: ['platform-accounts'] });
    },
    onError: () => toast.error('Xoá thất bại'),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, masterPassword }: { id: string; masterPassword: string }) =>
      api.post(`/api/platform-accounts/${id}/verify`, { masterPassword }),
    onSuccess: () => {
      toast.success('Session vẫn hợp lệ ✓');
      void queryClient.invalidateQueries({ queryKey: ['platform-accounts'] });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data?.message as string | undefined) ?? 'Verify thất bại')
          : 'Verify thất bại';
      toast.error(message);
    },
    onSettled: () => setVerifyingId(null),
  });

  const startVerify = (id: string): void => {
    setVerifyingId(id);
    const pw = masterPwGet();
    if (!pw) {
      setShowMasterPwForVerify(true);
      return;
    }
    verifyMutation.mutate({ id, masterPassword: pw });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tài khoản đã login</h1>
          <p className="mt-1 text-muted-foreground">
            Mỗi tài khoản = 1 session bundle đã mã hoá Envelope (Argon2id + AES-256-GCM + AES-KW)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Đang tải...
          </CardContent>
        </Card>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-600">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {PLATFORM_LABEL[acc.platform] ?? acc.platform}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                      STATUS_STYLES[acc.status],
                    )}
                  >
                    {acc.status}
                  </span>
                </div>
                <CardTitle className="text-base">{acc.channelName ?? acc.accountLabel}</CardTitle>
                <CardDescription className="text-xs">
                  {acc.lastVerifiedAt
                    ? `Verified: ${format(new Date(acc.lastVerifiedAt), 'dd/MM/yyyy HH:mm')}`
                    : 'Chưa verify'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-2 pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={verifyingId === acc.id || verifyMutation.isPending}
                  onClick={() => startVerify(acc.id)}
                >
                  {verifyingId === acc.id ? (
                    <AlertCircle className="mr-1 h-3 w-3 animate-pulse" />
                  ) : (
                    <ShieldCheck className="mr-1 h-3 w-3" />
                  )}
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Xoá tài khoản ${acc.accountLabel}?`)) {
                      deleteMutation.mutate(acc.id);
                    }
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Video className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium">Chưa có tài khoản nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bấm "+ Thêm tài khoản" để bắt đầu — mở Chromium thật, bạn tự đăng nhập Google.
              </p>
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm tài khoản đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      <AddAccountModal open={showAdd} onClose={() => setShowAdd(false)} />

      <MasterPasswordModal
        open={showMasterPwForVerify}
        onConfirm={() => {
          setShowMasterPwForVerify(false);
          const pw = masterPwGet();
          if (pw && verifyingId) {
            verifyMutation.mutate({ id: verifyingId, masterPassword: pw });
          }
        }}
        onCancel={() => {
          setShowMasterPwForVerify(false);
          setVerifyingId(null);
        }}
      />
    </div>
  );
}
