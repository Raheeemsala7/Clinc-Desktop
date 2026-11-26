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
    title: tr('تقويم مواعيدي | العيادة', 'My Schedule Calendar | Clinic'),
    description: tr(
      'عرض الفترات الزمنية الشاغرة والمحجوزة الخاصة بالطبيب',
      "View doctor's available and booked appointment time slots"
    ),
  };
}

interface DoctorCalendarPageProps {
  searchParams: Promise<{
    date?: string;
    doctorId?: string;
    view?: CalendarViewMode;
  }>;
}

export default async function DoctorCalendarPage({
  searchParams,
}: DoctorCalendarPageProps) {
  const { dir, tr } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* ترويسة صفحة جدول مواعيد الطبيب */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#074C3A] tracking-tight">
          {tr('تقويم المواعيد والحجوزات', 'Appointments & Bookings Calendar')}
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400">
          {tr(
            'جدول مواعيدك الخاصة والفترات الزمنية المتاحة للكشوفات والمراجعات',
            'Your appointment schedule and available time slots for examinations and follow-ups'
          )}
        </p>
      </div>

      {/* التقويم وجدول الفترات والمواعيد الخاصة بالطبيب */}
      <ErrorBoundary errorComponent={AppointmentsCalendarError}>
        <Suspense fallback={<AppointmentsCalendarSkeleton />}>
          <AppointmentsCalendarServer searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
