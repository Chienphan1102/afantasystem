import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, KeyRound, FileBarChart, Settings, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/channels', key: 'nav.channels', icon: Radio },
  { to: '/accounts', key: 'nav.accounts', icon: KeyRound },
  { to: '/reports', key: 'nav.reports', icon: FileBarChart },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation('common');
  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">{t('appName')}</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <span>v0.1.0 · Phase 1 MVP</span>
      </div>
    </aside>
  );
}
