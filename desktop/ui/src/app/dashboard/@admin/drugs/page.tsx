import React from 'react';
import type { Metadata } from 'next';
import { DrugsManagementView } from '@/features/drugs/components/drugs-management-view';
import { getServerLocaleInfo } from '@/i18n/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('دليل أدوية العيادة | الإدارة', 'Clinic Medications Catalog | Admin'),
    description: tr(
      'إدارة أدوية العيادة، الجرعات الافتراضية، ومتابعة إحصائيات الأدوية الأكثر استخداماً',
      'Manage clinic medications, default dosages, and top prescribed medication statistics'
    ),
  };
}

export default async function AdminDrugsPage() {
  const { dir } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      <DrugsManagementView />
    </div>
  );
}
