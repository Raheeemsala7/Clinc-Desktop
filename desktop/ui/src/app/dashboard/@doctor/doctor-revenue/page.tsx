import React from 'react';
import { Metadata } from 'next';
import { DoctorRevenueView } from '@/features/reports/components/doctor-revenue-view';
import { getServerLocaleInfo } from '@/i18n/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('تقرير الكشوفات والإيرادات | العيادة', 'Consultations & Revenue Report | Clinic'),
    description: tr(
      'متابعة عدد كشوفات وحالات الطبيب والإيرادات والمدفوعات والمتبقي',
      'Track doctor consultations, revenue, collected payments, and remaining balances'
    ),
  };
}

export default async function DoctorRevenuePage() {
  const { dir } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      <DoctorRevenueView />
    </div>
  );
}
