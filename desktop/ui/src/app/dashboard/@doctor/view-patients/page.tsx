import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { PatientsSearchFilterBar } from '@/features/patient/components/patients-search-filter-bar';
import { PatientsSearchFilterBarSkeleton } from '@/features/patient/components/patients-search-filter-bar-skeleton';
import { TablePatientsReception } from '@/features/patient/components/table-patients-reception';
import { TablePatientsSkeleton } from '@/features/patient/components/table-patients-skeleton';
import { TablePatientsError } from '@/features/patient/components/table-patients-error';
import { GetPatientsParams } from '@/features/patient/apis/patient.api';
import { getServerLocaleInfo } from '@/i18n/server-locale';

interface PatientsPageProps {
  searchParams: Promise<GetPatientsParams>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('سجل المرضى | العيادة', 'Patients Registry | Clinic'),
    description: tr(
      'إدارة وبحث وسجلات المرضى في العيادة',
      'Manage, search, and view clinic patient records'
    ),
  };
}

export default async function DoctorViewPatientsPage({ searchParams }: PatientsPageProps) {
  const { dir } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* 1. شريط البحث والفلترة وزر إضافة مريض جديد داخل Suspense لدعم useSearchParams وتفادي بطء التحميل */}
      <Suspense fallback={<PatientsSearchFilterBarSkeleton />}>
        <PatientsSearchFilterBar />
      </Suspense>

      {/* 2. جدول المرضى كـ Server Component مع معالجة الأخطاء والـ Suspense وتمرير searchParams كـ Promise */}
      <ErrorBoundary errorComponent={TablePatientsError}>
        <Suspense fallback={<TablePatientsSkeleton />}>
          <TablePatientsReception searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
