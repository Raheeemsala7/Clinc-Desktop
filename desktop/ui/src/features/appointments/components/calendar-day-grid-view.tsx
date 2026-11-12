'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Stethoscope,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DaySlotItem, DaySlotAppointment, WeekAppointmentItem } from '../types/calendar';
import { TodayQueueItem } from '../apis/appointment.api';

export interface CalendarDayGridViewProps {
  date: string;
  dayName?: string;
  dayNumber?: number;
  isToday?: boolean;
  slots: DaySlotItem[];
  appointments?: WeekAppointmentItem[];
  queueItems?: TodayQueueItem[];
  selectedDoctorId?: string;
  isDoctorView?: boolean;
  onAdmit?: (id: string) => void;
  isAdmitting?: boolean;
  admittingId?: string | null;
  onFinishExam?: (id: string) => void;
  isFinishingExam?: boolean;
  finishingExamId?: string | null;
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

const INTERVAL_MINUTES = ['00', '15', '30', '45'];

function formatTime12h(time24?: string): string {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1].padStart(2, '0');
  const period = hour >= 12 ? 'م' : 'ص';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
}

function getTypeLabel(type?: string): string {
  switch (type) {
    case 'FOLLOW_UP':
      return 'إعادة';
    case 'OPERATION_FOLLOWUP':
      return 'متابعة عملية';
    case 'ENDOSCOPY':
      return 'منظار';
    case 'SURGERY':
    case 'POST_OPERATIVE':
      return 'تدخل جراحي';
    case 'TEST_RESULTS_REVIEW':
      return 'مراجعة فحوصات';
    case 'CONSULTATION':
      return 'استشارة';
    case 'LAB_TESTS_IMAGING':
      return 'منظار';
    default:
      return 'كشف';
  }
}

function formatDoctorName(name?: string): string {
  if (!name || !name.trim()) return 'د. إسلام عبدالله';
  const clean = name.trim();
  if (clean.startsWith('د.') || clean.startsWith('Dr.') || clean.startsWith('د/')) {
    return clean;
  }
  return `د. ${clean}`;
}

export function CalendarDayGridView({
  date,
  dayName,
  dayNumber,
  isToday: initialIsToday,
  slots = [],
  appointments = [],
  queueItems = [],
  selectedDoctorId,
  isDoctorView,
  onAdmit,
  isAdmitting,
  admittingId,
  onFinishExam,
  isFinishingExam,
  finishingExamId,
}: CalendarDayGridViewProps) {
  const router = useRouter();

  // نمط العرض الداخلي: شبكة مربعات مرنة vs جدول تفصيلي بالساعات
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  // فلترة الحالات
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked_only' | 'waiting_only' | 'available_only'>('all');

  // حساب معلومات اليوم
  const dayInfo = useMemo(() => {
    try {
      const d = new Date(date + 'T12:00:00Z');
      const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const computedDayName = dayName || arabicDays[d.getUTCDay()];
      const computedDayNumber = dayNumber || d.getUTCDate();
      const monthName = arabicMonths[d.getUTCMonth()];
      const year = d.getUTCFullYear();

      const todayIso = new Date().toISOString().split('T')[0];
      const isToday = initialIsToday !== undefined ? initialIsToday : date === todayIso;

      return {
        dayName: computedDayName,
        dayNumber: computedDayNumber,
        monthName,
        year,
        fullFormattedDate: `${computedDayName} ${computedDayNumber} ${monthName} ${year}`,
        isToday,
      };
    } catch {
      return {
        dayName: dayName || 'اليوم',
        dayNumber: dayNumber || 1,
        monthName: '',
        year: 2026,
        fullFormattedDate: date,
        isToday: Boolean(initialIsToday),
      };
    }
  }, [date, dayName, dayNumber, initialIsToday]);

  // تجميع المواعيد لهذا اليوم من slots و appointments و queueItems
  const dayAppointments = useMemo(() => {
    const map = new Map<string, any>();

    // 1. من slots
    slots.forEach((s) => {
      const appts = s.appointments && s.appointments.length > 0 ? s.appointments : s.appointment ? [s.appointment] : [];
      appts.forEach((a) => {
        if (a && a.id) {
          map.set(a.id, {
            id: a.id,
            patientName: a.patientName,
            patientPhone: a.patientPhone,
            startTime: a.startTime || s.time,
            type: a.type,
            status: a.status,
            queueNumber: a.queueNumber,
            queueOrder: a.queueOrder,
            doctorName: a.doctorName,
            doctorId: a.doctorId,
          });
        }
      });
    });

    // 2. من appointments (WeekAppointmentItem)
    appointments.forEach((a) => {
      if (a.clinicDate === date && !map.has(a.id)) {
        map.set(a.id, {
          id: a.id,
          patientName: a.patientName,
          startTime: a.startTime,
          type: a.type,
          status: a.status,
          queueNumber: a.queueNumber,
          doctorName: a.doctorName,
          doctorId: a.doctorId,
        });
      }
    });

    // 3. من queueItems (TodayQueueItem)
    queueItems.forEach((q) => {
      if (!map.has(q.id)) {
        map.set(q.id, {
          id: q.id,
          patientName: q.patientName,
          patientPhone: q.patientPhone,
          startTime: q.startTime || '09:00',
          type: q.type,
          status: q.status,
          queueNumber: q.queueNumber,
          queueOrder: q.queueOrder,
          doctorName: '',
        });
      }
    });

    return Array.from(map.values());
  }, [slots, appointments, queueItems, date]);

  // خريطة لتسريع البحث عن المواعيد في وقت محدد
  const apptsByExactTime = useMemo(() => {
    const m = new Map<string, any[]>();
    dayAppointments.forEach((a) => {
      const t = (a.startTime || '09:00').trim();
      const list = m.get(t) || [];
      list.push(a);
      m.set(t, list);
    });
    return m;
  }, [dayAppointments]);

  // إحصائيات سريعة لليوم
  const stats = useMemo(() => {
    const totalBooked = dayAppointments.length;
    const completed = dayAppointments.filter((a) => a.status === 'COMPLETED' || a.status === 'DONE').length;
    const waiting = dayAppointments.filter((a) => a.status === 'WAITING' || a.status === 'IN_PROGRESS').length;
    const bookedOnly = dayAppointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length;
    const availableSlotsCount = slots.filter((s) => !s.isBooked).length;
    return {
      totalBooked,
      completed,
      waiting,
      bookedOnly,
      availableSlotsCount: Math.max(availableSlotsCount, 32 - totalBooked),
    };
  }, [dayAppointments, slots]);

  // التحقق من الوقت الحالي لمعرفة موقع الخط الأحمر
  const currentHourStr = useMemo(() => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    return `${h}:00`;
  }, []);

  // المواعيد المصفاة لشبكة المربعات (Grid)
  const unifiedSlotBoxes = useMemo(() => {
    // نضمن وجود جميع الفترات القياسية بنصف ساعة
    const standardTimes = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
      '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
      '23:00', '23:30',
    ];

    const allTimesSet = new Set(standardTimes);
    dayAppointments.forEach((a) => {
      if (a.startTime) allTimesSet.add(a.startTime);
    });

    const sortedTimes = Array.from(allTimesSet).sort();

    const boxes = sortedTimes.map((timeStr) => {
      const appts = apptsByExactTime.get(timeStr) || [];
      const isBooked = appts.length > 0;
      const primaryAppt = appts[0] || null;

      return {
        time: timeStr,
        isBooked,
        appointment: primaryAppt,
        appointments: appts,
      };
    });

    // تطبيق الفلتر المختار
    if (statusFilter === 'booked_only') {
      return boxes.filter((b) => b.isBooked);
    }
    if (statusFilter === 'waiting_only') {
      return boxes.filter(
        (b) =>
          b.isBooked &&
          b.appointments.some((a) => a.status === 'WAITING' || a.status === 'IN_PROGRESS')
      );
    }
    if (statusFilter === 'available_only') {
      return boxes.filter((b) => !b.isBooked);
    }
    return boxes;
  }, [dayAppointments, apptsByExactTime, statusFilter]);

  // التعامل مع فتح شاشة الحجز لموعد جديد
  const handleEmptySlotClick = (timeStr: string) => {
    if (!isDoctorView) {
      router.push(
        `/dashboard/appointments/new?date=${date}&time=${timeStr}${
          selectedDoctorId ? `&doctorId=${selectedDoctorId}` : ''
        }`
      );
    }
  };

  return (
    <div className="space-y-4 select-none" dir="rtl">
      {/* 1. ترويسة اليوم وشريط الإحصائيات وأزرار التبديل */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* عنوان اليوم والتاريخ */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#074C3A] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
              <span className="text-base leading-none">{dayInfo.dayNumber}</span>
              <span className="text-[10px] text-yellow-300 font-bold mt-0.5">
                {dayInfo.dayName.slice(0, 4)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#074C3A]">
                  جدول يوم {dayInfo.dayName}
                </h2>
                {dayInfo.isToday && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#074C3A] text-xs font-black border border-emerald-300">
                    اليوم
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400 font-sans">
                  ({dayInfo.fullFormattedDate})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {isDoctorView
                    ? 'جدول كشوفاتك اليومية مقسم في مربعات صغيرة بالساعة — اضغط على أي كشف لفتح الاستمارة'
                    : 'جدول المواعيد لليوم في مربعات صغيرة — انقر على أي فترة فارغة لحجز موعد جديد'}
                </span>
              </p>
            </div>
          </div>

          {/* تبديل طريقة العرض (شبكة مربعات vs جدول بالساعات) + فلتر الحالات */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* أزرار نمط العرض */}
            <div className="h-9 p-1 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'grid'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض في شبكة مربعات مدمجة"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>شبكة المربعات</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('table')}
                className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'table'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض في جدول ساعات تفصيلي"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>جدول الساعات</span>
              </button>
            </div>

            {/* فلتر الحالات */}
            <div className="h-9 p-1 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`h-7 px-2.5 rounded-lg cursor-pointer transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#074C3A] shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({stats.totalBooked})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('waiting_only')}
                className={`h-7 px-2.5 rounded-lg cursor-pointer transition-all ${
                  statusFilter === 'waiting_only'
                    ? 'bg-amber-500 text-white shadow-xs font-black'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                انتظار ({stats.waiting})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('booked_only')}
                className={`h-7 px-2.5 rounded-lg cursor-pointer transition-all ${
                  statusFilter === 'booked_only'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                محجوزة ({stats.totalBooked})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available_only')}
                className={`h-7 px-2.5 rounded-lg cursor-pointer transition-all ${
                  statusFilter === 'available_only'
                    ? 'bg-emerald-700 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                متاحة للحجز
              </button>
            </div>
          </div>
        </div>

        {/* دليل الألوان والإحصائيات السريعة */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-bold">
          {/* عدادات سريعة */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              مكتمل: <strong className="font-mono">{stats.completed}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              في الانتظار: <strong className="font-mono">{stats.waiting}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
              محجوز: <strong className="font-mono">{stats.bookedOnly}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              الفترات المتاحة: <strong className="font-mono">{stats.availableSlotsCount}</strong>
            </span>
          </div>

          {/* دليل الألوان (Legend) */}
          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              <span>مكتمل</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
              <span>في الانتظار</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B7B5E]" />
              <span>محجوز</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              <span>الخط الأحمر = الوقت الحالي</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. عرض المربعات بالنمط المختار */}
      {layoutMode === 'grid' ? (
        /* ================== النمط 1: شبكة المربعات المدمجة (Compact Boxes Grid) ================== */
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {unifiedSlotBoxes.map((slotBox) => {
              const { time, isBooked, appointment, appointments } = slotBox;
              const isCurrentHour = dayInfo.isToday && time.startsWith(currentHourStr.slice(0, 2));

              if (!isBooked) {
                /* مربع فترة شاغرة / متاح */
                return (
                  <div
                    key={time}
                    onClick={() => handleEmptySlotClick(time)}
                    className={`p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 hover:bg-emerald-50/50 hover:border-[#0B7B5E] transition-all flex flex-col justify-between min-h-[92px] group relative ${
                      isDoctorView ? 'cursor-default' : 'cursor-pointer hover:shadow-xs'
                    }`}
                  >
                    {isCurrentHour && (
                      <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500 rounded-t-xl" />
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-600 group-hover:text-[#074C3A]">
                        {formatTime12h(time)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">متاح</span>
                    </div>

                    <div className="text-center py-1">
                      {!isDoctorView ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B7B5E] opacity-70 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>حجز موعد</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300 font-bold">— فارغ —</span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono text-center">
                      {time}
                    </div>
                  </div>
                );
              }

              /* مربع موعد محجوز (مكتمل / انتظار / محجوز) */
              const isCompleted =
                appointment?.status === 'COMPLETED' || appointment?.status === 'DONE';
              const isWaiting =
                appointment?.status === 'WAITING' || appointment?.status === 'IN_PROGRESS';
              const isInProgress = appointment?.status === 'IN_PROGRESS';

              const boxStyle = isCompleted
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:border-emerald-400 hover:shadow-xs'
                : isWaiting
                ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:border-amber-400 hover:shadow-xs ring-1 ring-amber-400/40'
                : 'bg-sky-50/90 border-sky-300 text-[#074C3A] hover:border-sky-400 hover:shadow-xs';

              return (
                <div
                  key={time}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[96px] relative ${boxStyle}`}
                >
                  {/* خط المؤشر الأحمر للوقت الحالي */}
                  {isCurrentHour && (
                    <div className="absolute -top-1 right-2 left-2 h-1 bg-rose-500 rounded-full shadow-xs" />
                  )}

                  {/* السطر الأول: الوقت ورقم الانتظار ونوع الكشف */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-mono font-black">{formatTime12h(time)}</span>
                    <div className="flex items-center gap-1">
                      {appointment?.queueNumber && (
                        <span className="px-1.5 py-0.2 rounded-md bg-white font-mono font-black text-[10px] shadow-2xs">
                          #{appointment.queueNumber}
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded-md bg-white/90 font-black text-[10px] shadow-2xs">
                        {getTypeLabel(appointment?.type)}
                      </span>
                    </div>
                  </div>

                  {/* السطر الثاني: اسم المريض بخط بارز وواضح */}
                  <div className="my-1.5">
                    <div className="font-black text-xs truncate" title={appointment?.patientName}>
                      {appointment?.patientName || 'مريض مسجل'}
                    </div>
                    {appointments.length > 1 && (
                      <span className="text-[10px] font-bold text-slate-500">
                        +{appointments.length - 1} موعد إضافي
                      </span>
                    )}
                  </div>

                  {/* السطر الثالث: الإجراء المباشر */}
                  <div className="pt-1 border-t border-black/5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 font-bold">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-600'
                            : isWaiting
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-sky-600'
                        }`}
                      />
                      <span className="truncate">
                        {isInProgress
                          ? 'جاري الكشف'
                          : isWaiting
                          ? 'في الانتظار'
                          : isCompleted
                          ? 'مكتمل'
                          : 'محجوز'}
                      </span>
                    </div>

                    {isDoctorView ? (
                      <Link
                        href={`/dashboard/examination/${appointment?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 rounded-lg bg-[#074C3A] hover:bg-[#0B7B5E] text-white font-black text-[10px] transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                        title="فتح استمارة الكشف والروشتة 🩺"
                      >
                        <Stethoscope className="w-3 h-3" />
                        <span>{isInProgress ? 'متابعة' : isCompleted ? 'الروشتة' : 'كشف'}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/appointments?date=${date}${
                          selectedDoctorId ? `&doctorId=${selectedDoctorId}` : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded-md bg-white/80 hover:bg-white text-slate-700 font-bold text-[10px] transition-all cursor-pointer"
                      >
                        تفاصيل
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================== النمط 2: جدول الساعات التفصيلي (Hourly Grid Matrix) ================== */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* ترويسة الأعمدة: الوقت + الأرباع (:00, :15, :30, :45) */}
              <div className="grid grid-cols-5 border-b border-slate-200 text-center text-xs font-black bg-slate-50/80">
                <div className="py-3 px-2 border-l border-slate-200 text-slate-700">
                  الساعة / الفترة
                </div>
                {INTERVAL_MINUTES.map((min) => (
                  <div
                    key={min}
                    className="py-3 px-2 border-l border-slate-200 text-slate-700 font-mono"
                  >
                    :{min} دقيقة
                  </div>
                ))}
              </div>

              {/* صفوف الساعات من 08:00 إلى 23:00 */}
              <div className="divide-y divide-slate-100">
                {HOURS.map((hour) => {
                  const hourNumber = parseInt(hour.split(':')[0], 10);
                  const isCurrentHourRow = dayInfo.isToday && hour === currentHourStr;

                  return (
                    <div
                      key={hour}
                      className={`grid grid-cols-5 min-h-[78px] group transition-colors ${
                        isCurrentHourRow ? 'bg-rose-50/30' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      {/* عمود تسمية الساعة */}
                      <div className="p-2 border-l border-slate-100 flex flex-col items-center justify-center font-mono text-xs font-black text-slate-700 bg-slate-50/30">
                        <span>{formatTime12h(hour)}</span>
                        <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {hourNumber < 12
                            ? 'صباحاً'
                            : hourNumber < 17
                            ? 'ظهراً'
                            : 'مساءً'}
                        </span>
                      </div>

                      {/* خلايا الأرباع الأربعة لهذا اليوم والساعة */}
                      {INTERVAL_MINUTES.map((min) => {
                        const cellTime = `${hour.split(':')[0]}:${min}`;
                        const cellAppts = apptsByExactTime.get(cellTime) || [];
                        const primaryAppt = cellAppts[0];
                        const isBooked = cellAppts.length > 0;

                        if (!isBooked) {
                          return (
                            <div
                              key={cellTime}
                              onClick={() => handleEmptySlotClick(cellTime)}
                              className={`p-1.5 border-l border-slate-100 flex flex-col justify-center items-center text-center transition-colors ${
                                !isDoctorView
                                  ? 'hover:bg-emerald-50/50 cursor-pointer group/cell'
                                  : 'cursor-default'
                              }`}
                            >
                              <span className="text-[11px] font-mono text-slate-300 font-bold group-hover/cell:text-[#0B7B5E]">
                                {cellTime}
                              </span>
                              {!isDoctorView && (
                                <span className="text-[10px] text-slate-300 group-hover/cell:text-[#0B7B5E] font-bold">
                                  + متاح
                                </span>
                              )}
                            </div>
                          );
                        }

                        const isCompleted =
                          primaryAppt.status === 'COMPLETED' || primaryAppt.status === 'DONE';
                        const isWaiting =
                          primaryAppt.status === 'WAITING' || primaryAppt.status === 'IN_PROGRESS';

                        const cellStyle = isCompleted
                          ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                          : isWaiting
                          ? 'bg-amber-100/90 border-amber-300 text-amber-950'
                          : 'bg-sky-100/90 border-sky-300 text-[#074C3A]';

                        return (
                          <div
                            key={cellTime}
                            className="p-1.5 border-l border-slate-100 flex items-center justify-center"
                          >
                            <Link
                              href={
                                isDoctorView
                                  ? `/dashboard/examination/${primaryAppt.id}`
                                  : `/dashboard/appointments?date=${date}${
                                      selectedDoctorId ? `&doctorId=${selectedDoctorId}` : ''
                                    }`
                              }
                              onClick={(e) => e.stopPropagation()}
                              title={
                                isDoctorView
                                  ? 'اضغط لفتح استمارة الكشف والروشتة 🩺'
                                  : 'عرض تفاصيل الموعد'
                              }
                              className={`w-full h-full p-2 rounded-xl border text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${cellStyle}`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-black">
                                <span>{cellTime}</span>
                                <span className="px-1 py-0.2 rounded bg-white/80 font-black">
                                  {getTypeLabel(primaryAppt.type)}
                                </span>
                              </div>
                              <div className="font-black truncate text-xs mt-0.5">
                                {primaryAppt.patientName}
                              </div>
                              <div className="text-[10px] text-slate-600 font-bold truncate mt-0.5">
                                {primaryAppt.queueNumber ? `#${primaryAppt.queueNumber} • ` : ''}
                                {isWaiting ? 'انتظار' : isCompleted ? 'مكتمل' : 'محجوز'}
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
