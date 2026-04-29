import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, User as UserIcon, Shield, Users as TeamIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/providers/theme-provider';
import { useMasterPasswordStore } from '@/stores/master-password-store';
import { toast } from 'sonner';

export function SettingsPage() {
  const { t, i18n } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const clearMasterPw = useMasterPasswordStore((s) => s.clear);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="mt-1 text-muted-foreground">
          Cá nhân hoá AFANTA. Phase 2 sẽ thêm Team management, Billing, 2FA setup.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" /> Hồ sơ
          </CardTitle>
          <CardDescription>Thông tin cơ bản của tài khoản</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input value={user?.fullName ?? ''} disabled placeholder="Chưa đặt" />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Input value={user?.roles.join(', ') ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={user?.tenantId ?? ''} disabled className="font-mono text-xs" />
            </div>
          </div>
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            ✏️ Chỉnh sửa hồ sơ sẽ có ở Phase 2 — hiện tại chỉ xem.
          </p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Tuỳ chỉnh giao diện</CardTitle>
          <CardDescription>Lựa chọn lưu vào trình duyệt — đồng bộ Phase 2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('language')}</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={i18n.resolvedLanguage === 'vi' ? 'default' : 'outline'}
                onClick={() => void i18n.changeLanguage('vi')}
              >
                🇻🇳 Tiếng Việt
              </Button>
              <Button
                size="sm"
                variant={i18n.resolvedLanguage === 'en' ? 'default' : 'outline'}
                onClick={() => void i18n.changeLanguage('en')}
              >
                🇬🇧 English
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('theme')}</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-1 h-3 w-3" /> {t('theme_light')}
              </Button>
              <Button
                size="sm"
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-1 h-3 w-3" /> {t('theme_dark')}
              </Button>
              <Button
                size="sm"
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-1 h-3 w-3" /> {t('theme_system')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Bảo mật
          </CardTitle>
          <CardDescription>Master password, 2FA, session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">
              ⚠️ Master Password (Zero-Knowledge)
            </p>
            <p className="mt-1 text-muted-foreground">
              Hiện cache trong RAM ~30 phút từ lần dùng gần nhất. <strong>Quên là mất hết</strong>{' '}
              session đã lưu. Hãy backup vào trình quản lý mật khẩu.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                clearMasterPw();
                toast.success('Đã xoá master password khỏi RAM');
              }}
            >
              Xoá khỏi RAM ngay
            </Button>
          </div>

          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            🔐 Đổi mật khẩu, 2FA TOTP, IP Whitelist sẽ có ở Phase 2.
          </p>
        </CardContent>
      </Card>

      {/* Team — placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TeamIcon className="h-5 w-5" /> Team
          </CardTitle>
          <CardDescription>Quản lý user, role assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            👥 Phase 2: invite user, đổi role, RBAC chi tiết theo Phần E.2 của Master Plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
