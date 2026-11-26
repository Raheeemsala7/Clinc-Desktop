'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { WeekDayItem, WeekAppointmentItem } from '../types/calendar';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { formatDoctorName, getAppointmentTypeLabel } from '../constants/booking.constant';

interface CalendarWeekGridViewProps {
  days: WeekDayItem[];
  appointments: WeekAppointmentItem[];
  selectedDoctorId?: string;
  isDoctorView?: boolean;
}

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

export function CalendarWeekGridView({
  days,
  appointments,
  selectedDoctorId,
  isDoctorView,
}: CalendarWeekGridViewProps) {
  const { isAr, dir, tr } = useAppLocale();
  const router = useRouter();

  // خريطة لتحديد المواعيد حسب اليوم والساعة
  const getApptsForCell = (dateStr: string, hourStr: string) => {
    const targetHour = parseInt(hourStr.split(':')[0], 10);
    return appointments.filter((a) => {
      if (a.clinicDate !== dateStr) return false;
      const apptHour = parseInt((a.startTime || '09:00').split(':')[0], 10);
      return apptHour === targetHour;
    });
  };

  const getLocalizedDayName = (day: WeekDayItem) => {
    if (isAr) return day.dayName;
    try {
      return new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      });
    } catch {
      return day.dayName;
    }
  };

  return (
    <div className="space-y-4 select-none" dir={dir}>
      {/* 1. الشريط الفرعي التوضيحي ودليل الألوان (Legend) مع الإشارة للخط الأحمر مطابقة للصورة 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs px-1">
        {/* ملاحظة النقر */}
        <div className="text-slate-500 font-bold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            {isDoctorView
              ? tr(
                  'جدول مواعيدك الأسبوعية — اضغط على أي موعد لعرض تفاصيل المريض',
                  'Your weekly schedule — click any appointment to view patient details'
                )
              : tr(
                  'اضغط على أي فترة فارغة لحجز موعد جديد',
                  'Click any empty slot to book a new appointment'
                )}
          </span>
        </div>

        {/* دليل الألوان (Legend) */}
        <div className="flex items-center gap-4 font-bold text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span>{tr('مكتمل', 'Completed')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            <span>{tr('في الانتظار', 'Waiting')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B7B5E]" />
            <span>{tr('محجوز', 'Booked')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500">
            <span className="w-3 h-0.5 bg-rose-500 inline-block" />
            <span>{tr('الخط الأحمر = الوقت الحالي', 'Red line = Current time')}</span>
          </div>
        </div>
      </div>

      {/* 2. شبكة التقويم الأسبوعية (Weekly Grid) مطابقة للصورة 2 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* صف رؤوس الأيام (7 أعمدة للأيام + عمود الوقت) */}
            <div className="grid grid-cols-8 border-b border-slate-200 text-center text-xs font-bold bg-slate-50/50">
              {/* رؤوس الأيام السبعة */}
              {days.map((day) => (
                <div
                  key={day.date}
                  className={`py-3.5 px-2 border-e border-slate-200 transition-colors ${
                    day.isToday
                      ? 'bg-[#074C3A] text-white shadow-sm'
                      : day.isOffDay
                      ? 'bg-slate-100/70 text-slate-400'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="text-sm font-black">
                    {getLocalizedDayName(day)} {day.dayNumber}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      day.isToday
                        ? 'text-yellow-400 font-black'
                        : day.isOffDay
                        ? 'text-slate-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.isToday ? tr('اليوم', 'Today') : day.isOffDay ? tr('إجازة', 'Off') : ''}
                  </div>
                </div>
              ))}

              {/* عمود الساعات في نهاية الصف */}
              <div className="py-3.5 px-2 text-slate-400 font-mono text-center flex items-center justify-center">
                {tr('الوقت', 'Time')}
              </div>
            </div>

            {/* صفوف الساعات */}
            <div className="divide-y divide-slate-100">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[85px] group">
                  {/* خلايا الأيام لهذا الوقت */}
                  {days.map((day) => {
                    const cellAppts = getApptsForCell(day.date, hour);
                    const isOff = day.isOffDay;

                    return (
                      <div
                        key={`${day.date}-${hour}`}
                        className={`p-1.5 border-e border-slate-100 relative transition-colors ${
                          isOff
                            ? 'bg-slate-50/50 cursor-not-allowed'
                            : isDoctorView
                            ? 'hover:bg-slate-50/60'
                            : 'hover:bg-[#E3F5EE]/30 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isDoctorView && !isOff && cellAppts.length === 0) {
                            router.push(
                              `/dashboard/appointments/new?date=${day.date}&time=${hour}${
                                selectedDoctorId ? `&doctorId=${selectedDoctorId}` : ''
                              }`
                            );
                          }
                        }}
                      >
                        {/* خط المؤشر الأحمر للوقت الحالي (على عمود اليوم الحالي) */}
                        {day.isToday && hour === '11:00' && (
                          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 z-10 shadow-xs pointer-events-none" />
                        )}

                        {/* بطاقات المواعيد المحجوزة في هذه الخلية */}
                        <div className="space-y-1.5">
                          {cellAppts.map((appt) => {
                            const isCompleted = appt.status === 'COMPLETED';
                            const isWaiting = appt.status === 'WAITING';

                            const cardStyle = isCompleted
                              ? 'bg-[#DCFCE7] border-[#86EFAC] text-emerald-900'
                              : isWaiting
                              ? 'bg-[#FEF08A] border-[#FDE047] text-amber-950'
                              : 'bg-[#DBEAFE] border-[#BFDBFE] text-[#0B241D]';

                            return (
                              <Link
                                key={appt.id}
                                target={isDoctorView ? '_blank' : undefined}
                                rel={isDoctorView ? 'noopener noreferrer' : undefined}
                                href={
                                  isDoctorView
                                    ? `/dashboard/examination/${appt.id}`
                                    : `/dashboard/appointments?date=${day.date}${
                                        selectedDoctorId ? `&doctorId=${selectedDoctorId}` : ''
                                      }`
                                }
                                title={
                                  isDoctorView
                                    ? tr('اضغط لفتح استمارة الكشف والروشتة 🩺', 'Click to open examination & prescription 🩺')
                                    : tr('عرض تفاصيل الموعد', 'View appointment details')
                                }
                                onClick={(e) => e.stopPropagation()}
                                className={`block p-2 rounded-xl border text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all ${cardStyle}`}
                              >
                                {/* السطر الأول: الوقت ونوع الكشف */}
                                <div className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="font-bold">{appt.startTime}</span>
                                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-md bg-white/80 font-black shadow-2xs">
                                    {getAppointmentTypeLabel(appt.type, isAr)}
                                  </span>
                                </div>

                                {/* السطر الثاني: اسم المريض */}
                                <div className="mt-1 font-black truncate text-xs">
                                  {appt.patientName}
                                </div>

                                {/* السطر الثالث: اسم الطبيب المعالج بشكل بارز وواضح */}
                                <div className="mt-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/95 text-[#074C3A] border border-[#0B7B5E]/20 text-[10px] font-black shadow-2xs truncate">
                                  <span className="text-[11px] shrink-0">👨‍⚕️</span>
                                  <span className="truncate">{formatDoctorName(appt.doctorName, isAr)}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* عمود الساعة في نهاية الصف */}
                  <div className="p-2 text-center text-xs font-mono text-slate-400 font-bold flex items-center justify-center">
                    {hour}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
