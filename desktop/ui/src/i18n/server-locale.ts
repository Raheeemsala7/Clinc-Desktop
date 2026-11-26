import { getLocale } from 'next-intl/server';

export async function getServerLocaleInfo() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const dir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => (isAr ? ar : en);

  return { locale, isAr, dir, tr };
}
