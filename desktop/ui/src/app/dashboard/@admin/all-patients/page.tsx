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

interface AllPatientsPageProps {
  searchParams: Promise<GetPatientsParams>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('سجل كافة المرضى | الإدارة', 'All Patients Registry | Admin'),
    description: tr(
      'إدارة وسجلات وبحث المرضى في العيادة للوحة الإدارة',
      'Manage, search, and view clinic patient records from the admin panel'
    ),
  };
}

export default async function AdminAllPatientsPage({ searchParams }: AllPatientsPageProps) {
  const { dir } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      <Suspense fallback={<PatientsSearchFilterBarSkeleton />}>
        <PatientsSearchFilterBar />
      </Suspense>

      <ErrorBoundary errorComponent={TablePatientsError}>
        <Suspense fallback={<TablePatientsSkeleton />}>
          <TablePatientsReception searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
