'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';

export function useAppLocale() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const dir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';
  const tr = useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr]);

  return { locale, isAr, dir, tr };
}
