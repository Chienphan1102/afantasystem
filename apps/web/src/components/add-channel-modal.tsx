import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, X, Link as LinkIcon, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useMasterPasswordStore } from '@/stores/master-password-store';
import { MasterPasswordModal } from './master-password-modal';

type PlatformAccountSummary = { id: string; accountLabel: string; status: string };

export function AddChannelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [showMasterPw, setShowMasterPw] = useState(false);
  const masterPwGet = useMasterPasswordStore((s) => s.get);

  const reset = (): void => {
    setAccountId('');
    setChannelUrl('');
    onClose();
  };

  const { data: accounts } = useQuery<PlatformAccountSummary[]>({
    queryKey: ['platform-accounts'],
    queryFn: async () => {
      const res = await api.get<PlatformAccountSummary[]>('/api/platform-accounts');
      return res.data;
    },
    enabled: open,
  });

  const activeAccounts = accounts?.filter((a) => a.status === 'ACTIVE') ?? [];

  const addMutation = useMutation({
    mutationFn: async (input: { masterPassword: string }) => {
      const res = await api.post<{ id: string; name: string }>('/api/channels', {
        platformAccountId: accountId,
        channelUrl: channelUrl.trim(),
        masterPassword: input.masterPassword,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã bind kênh "${data.name}" — đang scan lần đầu...`);
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
      reset();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data?.message as string | undefined) ?? err.message)
          : 'Lỗi không xác định';
      toast.error(`Bind kênh thất bại: ${message}`);
    },
  });

  const submit = (): void => {
    if (!accountId || !channelUrl.trim()) {
      toast.error('Chọn account và nhập URL kênh');
      return;
    }
    const pw = masterPwGet();
    if (!pw) {
      setShowMasterPw(true);
      return;
    }
    addMutation.mutate({ masterPassword: pw });
  };

  const onMasterPwConfirmed = (): void => {
    setShowMasterPw(false);
    const pw = masterPwGet();
    if (pw) addMutation.mutate({ masterPassword: pw });
  };

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(o) => {
          if (!o) reset();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">Thêm kênh mới</Dialog.Title>
              <button
                onClick={reset}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tài khoản đã login</Label>
                {activeAccounts.length === 0 ? (
                  <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-400">
                    Bạn chưa có PlatformAccount ACTIVE nào. Vào{' '}
                    <span className="font-semibold">Tài khoản đã login</span> để add trước.
                  </div>
                ) : (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— chọn account —</option>
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountLabel}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-url">URL kênh YouTube</Label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="channel-url"
                    placeholder="https://www.youtube.com/@MrBeast"
                    className="pl-9"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ: <code>/channel/UC...</code>, <code>/@handle</code>, <code>/c/name</code>,{' '}
                  <code>/user/legacy</code>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={reset}>
                  Huỷ
                </Button>
                <Button onClick={submit} disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang bind + scan...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Bind + scan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <MasterPasswordModal
        open={showMasterPw}
        onConfirm={onMasterPwConfirmed}
        onCancel={() => setShowMasterPw(false)}
      />
    </>
  );
}
