'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Controller, useForm } from 'react-hook-form';
import { LoginFormType } from '../types/auth';
import { loginSchema } from '../schemas/login.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError, FieldLabel, Field } from '@/shared/components/ui/field';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';


/**
 * نموذج تسجيل الدخول المطابق للتصميم تماماً مع التحقق البصري ودعم اللغتين
 */
export function LoginForm() {
  const t = useTranslations('Auth.login');

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormType) => {
    try {
      const loginResponse = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (!loginResponse?.ok) {
        if (
          loginResponse?.error === 'Invalid credentials' ||
          loginResponse?.error === 'CredentialsSignin'
        ) {
          toast.error(t('invalidCredentials'));
        } else {
          toast.error(loginResponse?.error ?? t('unknownError'));
        }
        return;
      }

      toast.success(t('login-success'));
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(t('unknownError'));
    }
  };

  const onError = (errors: typeof form.formState.errors) => {
    console.log('❌ Form validation failed with errors:', errors);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      {/* رأس النموذج */}
      <div className="text-center sm:text-start mb-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#0B241D] tracking-tight">
          {t('title')}
        </h2>
        <p className="text-sm text-[#4A635B] mt-2 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* حقول الإدخال */}
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5" noValidate>
        {/* اسم المستخدم */}
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel className="block text-xs font-bold text-[#0B241D] mb-2 text-start">
                {t('usernameLabel')}
              </FieldLabel>

              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder={t('usernamePlaceholder')}
                className={cn(
                  'w-full h-12 px-4 rounded-xl border border-[#D0E5DC] bg-white text-[#0B241D] text-sm placeholder:text-[#8D9D97] transition-all duration-150',
                  'focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  fieldState.invalid && 'border-destructive focus:border-destructive focus:ring-destructive/10'
                )}
                {...field}
              />

              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* كلمة المرور */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel className="block text-xs font-bold text-[#0B241D] mb-2 text-start">
                {t('passwordLabel')}
              </FieldLabel>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                className={cn(
                  'w-full h-12 px-4 rounded-xl border border-[#D0E5DC] bg-white text-[#0B241D] text-sm placeholder:text-[#8D9D97] transition-all duration-150',
                  'focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  fieldState.invalid && 'border-destructive focus:border-destructive focus:ring-destructive/10'
                )}
                {...field}
              />

              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* زر الدخول الزمردي */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className={cn(
            'w-full h-12 bg-[#0B7B5E] hover:bg-[#09634C] active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center cursor-pointer select-none mt-7',
            form.formState.isSubmitting && 'opacity-70 pointer-events-none'
          )}
        >
          {form.formState.isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('submitting')}</span>
            </span>
          ) : (
            <span>{t('submitBtn')}</span>
          )}
        </Button>
      </form>
    </div>
  );
}
