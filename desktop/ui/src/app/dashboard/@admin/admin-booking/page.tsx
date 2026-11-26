import React from 'react';
import type { Metadata } from 'next';
import { BookingForm } from '@/features/appointments';
import { getServerLocaleInfo } from '@/i18n/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getServerLocaleInfo();
  return {
    title: tr('حجز موعد جديد | المدير', 'New Booking | Admin'),
    description: tr(
      'تسجيل وحجز موعد جديد للمريض في العيادة من لوحة المدير',
      'Register and book a new patient appointment from the admin panel'
    ),
  };
}

export default async function AdminNewAppointmentPage() {
  const { dir, tr } = await getServerLocaleInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#074C3A] tracking-tight">
          {tr('تسجيل وحجز موعد جديد', 'Register & Book New Appointment')}
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400">
          {tr(
            'إضافة مريض وتحديد موعد الكشف وتفاصيل السداد والعربون',
            'Add a patient, select appointment time, and enter payment and deposit details'
          )}
        </p>
      </div>

      <BookingForm />
    </div>
  );
}
