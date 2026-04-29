import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, X, Video, Share2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useMasterPasswordStore } from '@/stores/master-password-store';
import { MasterPasswordModal } from './master-password-modal';

type Step = 'choose' | 'master-pw' | 'label' | 'launching' | 'done';

export function AddAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('choose');
  const [platform, setPlatform] = useState<'YOUTUBE' | 'FACEBOOK_PAGE' | null>(null);
  const [accountLabel, setAccountLabel] = useState('');
  const [showMasterPw, setShowMasterPw] = useState(false);
  const masterPwGet = useMasterPasswordStore((s) => s.get);

  const reset = (): void => {
    setStep('choose');
    setPlatform(null);
    setAccountLabel('');
    onClose();
  };

  const addMutation = useMutation({
    mutationFn: async (input: { masterPassword: string }) => {
      const res = await api.post<{ id: string; accountLabel: string; channelName?: string }>(
        '/api/platform-accounts',
        {
          platform,
          masterPassword: input.masterPassword,
          accountLabel: accountLabel || undefined,
        },
        { timeout: 6 * 60 * 1000 }, // 6 min — đủ thời gian user login
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Thêm tài khoản thành công: ${data.channelName ?? data.accountLabel}`);
      void queryClient.invalidateQueries({ queryKey: ['platform-accounts'] });
      setStep('done');
      setTimeout(reset, 1500);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data?.message as string | undefined) ?? err.message)
          : 'Lỗi không xác định';
      toast.error(`Thêm tài khoản thất bại: ${message}`);
      setStep('choose');
    },
  });

  const startAddFlow = (): void => {
    const masterPw = masterPwGet();
    if (!masterPw) {
      setShowMasterPw(true);
      return;
    }
    setStep('launching');
    addMutation.mutate({ masterPassword: masterPw });
  };

  const handleMasterPwConfirmed = (): void => {
    setShowMasterPw(false);
    const pw = masterPwGet();
    if (!pw) return;
    setStep('launching');
    addMutation.mutate({ masterPassword: pw });
  };

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(o) => {
          if (!o && step !== 'launching') reset();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">Thêm tài khoản mới</Dialog.Title>
              {step !== 'launching' && (
                <button
                  onClick={reset}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {step === 'choose' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Chọn nền tảng:</p>
                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setPlatform('YOUTUBE');
                      setStep('label');
                    }}
                    className="flex items-center gap-3 rounded-md border p-4 text-left transition-colors hover:bg-accent"
                  >
                    <Video className="h-6 w-6 text-red-600" />
                    <div className="flex-1">
                      <div className="font-medium">YouTube</div>
                      <div className="text-xs text-muted-foreground">
                        Channel Studio + Analytics
                      </div>
                    </div>
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-3 rounded-md border p-4 text-left opacity-50"
                    title="Phase 1 cuối"
                  >
                    <Share2 className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">Facebook Page</div>
                      <div className="text-xs text-muted-foreground">Sẽ có ở Phase 1 cuối</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 'label' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">
                    Nhãn cho tài khoản{' '}
                    <span className="text-xs text-muted-foreground">(không bắt buộc)</span>
                  </Label>
                  <Input
                    id="label"
                    placeholder='Vd: "Kênh chính của Bếp Bà Liêu"'
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                  />
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Tiếp theo, một <span className="font-semibold">cửa sổ trình duyệt thật</span> sẽ
                  mở. Bạn sẽ <span className="font-semibold">tự đăng nhập Google</span> trên giao
                  diện gốc — hệ thống KHÔNG biết password của bạn.
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep('choose')}>
                    Quay lại
                  </Button>
                  <Button onClick={startAddFlow}>
                    <Lock className="mr-2 h-4 w-4" />
                    Tiếp tục
                  </Button>
                </div>
              </div>
            )}

            {step === 'launching' && (
              <div className="space-y-4 py-6 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">Đang chờ bạn đăng nhập Google...</p>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng đăng nhập trong cửa sổ Chrome vừa mở. Sau khi vào được YouTube
                    homepage, hệ thống sẽ tự động hoàn tất.
                  </p>
                  <p className="text-xs text-muted-foreground">Timeout: 5 phút.</p>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                  ✓
                </div>
                <p className="font-medium">Thêm tài khoản thành công!</p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <MasterPasswordModal
        open={showMasterPw}
        onConfirm={handleMasterPwConfirmed}
        onCancel={() => {
          setShowMasterPw(false);
        }}
      />
    </>
  );
}
