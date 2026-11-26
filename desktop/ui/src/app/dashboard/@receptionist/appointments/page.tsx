import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { AppointmentsCalendarServer } from '@/features/appointments/components/appointments-calendar-server';
import { AppointmentsCalendarSkeleton } from '@/features/appointments/components/appointments-calendar-skeleton';
import { AppointmentsCalendarError } from '@/features/appointments/components/appointments-calendar-error';
import { CalendarViewMode } from '@/features/appointments/types/calendar';
import { getServerLocaleInfo } from '@/i18n/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('تقويم المواعيد والحجوزات | العيادة', 'Appointments & Bookings Calendar | Clinic'),
    description: tr(
      'عرض الفترات الزمنية الشاغرة والمحجوزة بالساعة لكل طبيب وإدارة حجوزات العيادة',
      'View hourly available and booked slots for each doctor and manage clinic bookings'
    ),
  };
}

interface ReceptionistAppointmentsPageProps {
  searchParams: Promise<{
    date?: string;
    doctorId?: string;
    view?: CalendarViewMode;
  }>;
}

export default async function ReceptionistAppointmentsPage({
  searchParams,
}: ReceptionistAppointmentsPageProps) {
  const { dir, tr } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* 1. ترويسة الصفحة مطابقة للتصميم */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#074C3A] tracking-tight">
          {tr('تقويم المواعيد والحجوزات', 'Appointments & Bookings Calendar')}
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400">
          {tr(
            'عرض الفترات الزمنية الشاغرة والمحجوزة بالساعة لكل طبيب وإدارة حجوزات العيادة',
            'View hourly available and booked slots for each doctor and manage clinic bookings'
          )}
        </p>
      </div>

      {/* 2. التقويم وجدول الفترات والمواعيد كـ Server Component مع معالجة الأخطاء والتخزين المؤقت والـ Suspense */}
      <ErrorBoundary errorComponent={AppointmentsCalendarError}>
        <Suspense fallback={<AppointmentsCalendarSkeleton />}>
          <AppointmentsCalendarServer searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
