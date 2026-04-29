import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from '@/providers/theme-provider';
import { ProtectedRoute } from '@/providers/protected-route';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/login-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { AccountsPage } from '@/pages/accounts-page';
import { ChannelsPage } from '@/pages/channels-page';
import { ChannelDetailPage } from '@/pages/channel-detail-page';
import { PlaceholderPage } from '@/pages/placeholder-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation('common');
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/channels/:id" element={<ChannelDetailPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route
            path="/reports"
            element={<PlaceholderPage title={t('nav.reports')} description="Phase 2." />}
          />
          <Route path="/settings/*" element={<PlaceholderPage title={t('nav.settings')} />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster
        position="top-right"
        richColors
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        closeButton
      />
    </>
  );
}
