import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Layers, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    email: z.string().min(1, t('validation.email_required')).email(t('validation.email_invalid')),
    password: z
      .string()
      .min(1, t('validation.password_required'))
      .min(8, t('validation.password_min')),
    remember: z.boolean().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'chienphan.jup@gmail.com',
      password: '',
      remember: true,
    },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    setSubmitting(true);
    try {
      const { data } = await authApi.login({
        email: values.email,
        password: values.password,
      });
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      toast.success(`${tc('welcome')}, ${data.user.fullName ?? data.user.email}!`);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? '/dashboard', { replace: true });
      if (data.user.mustChangePassword) {
        toast.warning(t('login.must_change_password'));
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          toast.error(t('login.error_invalid'));
        } else if (err.code === 'ERR_NETWORK') {
          toast.error(t('login.error_network'));
        } else {
          toast.error(err.response?.data?.message ?? err.message);
        }
      } else {
        toast.error(tc('error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Layers className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
        <CardDescription>{t('login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('login.email_placeholder')}
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.password_placeholder')}
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                {...register('remember')}
              />
              <span>{t('login.remember')}</span>
            </label>
            <Link to="#" className="text-primary hover:underline">
              {t('login.forgot')}
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('login.submitting')}
              </>
            ) : (
              t('login.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
