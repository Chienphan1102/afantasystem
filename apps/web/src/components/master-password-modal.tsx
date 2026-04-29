import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMasterPasswordStore } from '@/stores/master-password-store';

const MIN_LENGTH = 6; // Dev only — Phase 3 ≥ 12

export function MasterPasswordModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setMaster = useMasterPasswordStore((s) => s.set);

  const submit = (): void => {
    if (pw.length < MIN_LENGTH) {
      setError(`Master password phải ít nhất ${MIN_LENGTH} ký tự (Phase 1 dev)`);
      return;
    }
    setMaster(pw);
    setPw('');
    setError(null);
    onConfirm();
  };

  const cancel = (): void => {
    setPw('');
    setError(null);
    onCancel();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) cancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg duration-200">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold">Master Password</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Cần để mã hoá session bundle (zero-knowledge)
              </Dialog.Description>
            </div>
            <button
              onClick={cancel}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="master-pw">Mật khẩu</Label>
              <Input
                id="master-pw"
                type="password"
                placeholder="Nhập master password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                autoFocus
                autoComplete="off"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              ⚠️ <span className="font-semibold">Quan trọng:</span> Nếu quên master password, bạn sẽ{' '}
              <span className="font-semibold">mất toàn bộ session</span> đã lưu (Zero-Knowledge
              Architecture). Hãy lưu vào trình quản lý mật khẩu (1Password / Bitwarden).
            </p>
            <p className="text-xs text-muted-foreground">
              Mật khẩu được cache trong RAM 30 phút, KHÔNG lưu vào ổ cứng.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancel}>
              Huỷ
            </Button>
            <Button onClick={submit}>Xác nhận</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
