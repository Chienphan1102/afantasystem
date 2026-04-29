import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Monitor, Moon, Search, Sun, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const { t, i18n } = useTranslation('common');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { user, refreshToken, clear } = useAuthStore((s) => ({
    user: s.user,
    refreshToken: s.refreshToken,
    clear: s.clear,
  }));

  const initials = (user?.fullName ?? user?.email ?? 'AF')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const switchLang = (next: 'vi' | 'en'): void => {
    void i18n.changeLanguage(next);
  };

  const onLogout = async (): Promise<void> => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // server may be down — clear locally regardless
    }
    clear();
    toast.success(t('signOut'));
    navigate('/login', { replace: true });
  };

  const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={t('search_placeholder')} disabled />
      </div>
      <div className="flex-1 md:hidden" />

      {/* Language toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="font-mono uppercase">
            {i18n.resolvedLanguage ?? 'vi'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[8rem]">
          <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => switchLang('vi')}>Tiếng Việt</DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchLang('en')}>English</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('theme')}>
            <ThemeIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuLabel>{t('theme')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" /> {t('theme_light')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" /> {t('theme_dark')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" /> {t('theme_system')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification bell — placeholder */}
      <Button variant="ghost" size="icon" aria-label="Notifications" disabled>
        <Bell className="h-4 w-4" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold">{initials || 'AF'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem]">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.fullName ?? user?.email}</span>
              {user?.fullName && (
                <span className="text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" /> {t('user_menu.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            {t('user_menu.settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> {t('user_menu.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
