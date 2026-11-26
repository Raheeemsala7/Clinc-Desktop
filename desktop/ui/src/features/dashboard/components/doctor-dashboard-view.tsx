'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Clock,
  CheckCircle2,
  Users,
  FileText,
  LogIn,
  RefreshCw,
  Phone,
  User,
  Stethoscope,
  Calendar,
  AlertTriangle,
  Search,
  Check,
  CalendarDays,
  ListOrdered,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { TodayQueueItem } from '@/features/appointments/apis/appointment.api';
import { AppointmentsCalendarData } from '@/features/appointments/types/calendar';
import { CalendarDayTimelineView } from '@/features/appointments/components/calendar-day-timeline-view';
import { CalendarDayGridView } from '@/features/appointments/components/calendar-day-grid-view';
import { CalendarWeekGridView } from '@/features/appointments/components/calendar-week-grid-view';
import {
  useTodayQueueQuery,
  useDoctorStatusQuery,
  useUpdateDoctorStatusMutation,
  useAdmitAppointmentMutation,
  useFinishExamAppointmentMutation,
} from '@/features/appointments/hooks/appointments.hook';

export interface DoctorDashboardViewProps {
  initialQueue?: TodayQueueItem[];
  initialCalendarData?: AppointmentsCalendarData | null;
  initialView?: 'queue' | 'calendar';
  selectedDate?: string;
}

type TranslateFn = (ar: string, en: string) => string;

/**
 * دالة مساعدة لتنسيق مدة الانتظار بالاستقبال بصيغة مقروءة وواضحة للطبيب
 */
function formatWaitingTime(mins: number | null | undefined, tr: TranslateFn) {
  if (mins === null || mins === undefined) return tr('في الاستقبال حالياً', 'Currently at reception');
  if (mins <= 1) return tr('وصل للتو (أقل من دقيقة)', 'Just arrived (< 1 min)');
  if (mins < 60) return tr(`في الاستقبال منذ ${mins} دقيقة`, `Waiting for ${mins} mins`);
  const hours = Math.floor(mins / 60);
  const remMinutes = mins % 60;
  return remMinutes > 0
    ? tr(`في الاستقبال منذ ${hours} س و ${remMinutes} د`, `Waiting for ${hours}h ${remMinutes}m`)
    : tr(`في الاستقبال منذ ${hours} ساعة`, `Waiting for ${hours}h`);
}

function getAppointmentTypeLabel(type: string | undefined, tr: TranslateFn) {
  switch (type) {
    case 'EXAMINATION':
      return tr('كشف', 'Examination');
    case 'FOLLOW_UP':
      return tr('إعادة', 'Follow-up');
    case 'OPERATION_FOLLOWUP':
      return tr('متابعة عملية', 'Post-Op Follow-up');
    case 'ENDOSCOPY':
      return tr('منظار', 'Endoscopy');
    case 'SURGERY':
    case 'POST_OPERATIVE':
      return tr('تدخل جراحي', 'Surgery');
    case 'CONSULTATION':
      return tr('استشارة', 'Consultation');
    case 'TEST_RESULTS_REVIEW':
      return tr('مراجعة فحوصات', 'Test Review');
    case 'LAB_TESTS_IMAGING':
      return tr('منظار', 'Endoscopy');
    default:
      return type || tr('كشف', 'Examination');
  }
}

/**
 * شاشة كشف اليوم للطبيب (Doctor Dashboard)
 * مربوطة مباشرة بـ GET /api/v1/queue/today وبـ React Query مع Auto-polling
 */
export const DoctorDashboardView = ({
  initialQueue = [],
  initialCalendarData = null,
  initialView = 'queue',
  selectedDate,
}: DoctorDashboardViewProps) => {
  const { dir, tr } = useAppLocale();
  const router = useRouter();
  const t = useTranslations('Dashboard.doctor');
  const tDoctorStatus = useTranslations('Dashboard.doctorStatus');

  const [dashboardView, setDashboardView] = useState<'queue' | 'calendar'>(initialView || 'calendar');
  const [currentDate, setCurrentDate] = useState<string>(
    selectedDate || initialCalendarData?.date || new Date().toLocaleDateString('en-CA')
  );
  const [calendarData, setCalendarData] = useState<AppointmentsCalendarData | null>(initialCalendarData || null);
  const [calendarDisplayMode, setCalendarDisplayMode] = useState<'day-grid' | 'grid' | 'timeline'>('day-grid');
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'in_progress' | 'done' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // استعلامات React Query
  const {
    data: queue = initialQueue,
    isFetching,
    refetch,
  } = useTodayQueueQuery(initialQueue);

  const fetchCalendarForDate = async (newDate: string) => {
    setIsCalendarLoading(true);
    setCurrentDate(newDate);
    try {
      const res = await fetch(`/api/calendar?date=${newDate}&view=week`);
      if (res.ok) {
        const json = await res.json();
        if (json.status && json.payload) {
          setCalendarData(json.payload);
        }
      }
    } catch (e) {
      console.error('Failed to fetch calendar for date:', e);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().slice(0, 10);
    fetchCalendarForDate(dateStr);
  };

  const handleResetToToday = () => {
    const today = new Date().toLocaleDateString('en-CA');
    fetchCalendarForDate(today);
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetch(), fetchCalendarForDate(currentDate)]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const calendarBookedSlots = calendarData?.daySlots?.filter((s) => s.isBooked) || [];
  const calendarBookedCount = calendarBookedSlots.reduce(
    (acc, s) => acc + (s.appointments?.length || (s.appointment ? 1 : 0)),
    0
  );

  const { data: doctorStatusData, isFetching: isStatusFetching } = useDoctorStatusQuery();
  const updateStatusMutation = useUpdateDoctorStatusMutation();
  const admitMutation = useAdmitAppointmentMutation();
  const finishExamMutation = useFinishExamAppointmentMutation();

  // إدخال المريض للكشف ثم فتح استمارة الفحص مباشرة في نفس الشاشة
  const handleAdmitAndOpenExam = (appointmentId: string) => {
    admitMutation.mutate(appointmentId, {
      onSuccess: () => {
        router.push(`/dashboard/examination/${appointmentId}`);
      },
    });
  };

  const isAvailable = (doctorStatusData?.status || 'AVAILABLE') === 'AVAILABLE';

  // تصنيف المرضى
  const waitingPatients = queue.filter(
    (p) => p.status === 'WAITING' || p.status === 'BOOKED'
  );
  const inProgressPatient = queue.find((p) => p.status === 'IN_PROGRESS');
  const inProgressPatients = queue.filter((p) => p.status === 'IN_PROGRESS');
  const completedPatients = queue.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'PENDING_CHECKOUT'
  );
  const pastPatients = queue.filter((p) => Boolean(p.isPastAppointment));

  const totalCount = queue.length;
  const waitingCount = waitingPatients.length;
  const completedCount = completedPatients.length;
  const pastCount = pastPatients.length;
  const inProgressCount = inProgressPatients.length;

  // القائمة المفلترة حسب التبويب والبحث
  const filteredPatients = useMemo(() => {
    let list = queue;
    if (activeTab === 'waiting') {
      list = waitingPatients;
    } else if (activeTab === 'in_progress') {
      list = inProgressPatients;
    } else if (activeTab === 'past') {
      list = pastPatients;
    } else if (activeTab === 'done') {
      list = completedPatients;
    } else if (activeTab === 'all') {
      // إبقاء المرضى النشطين في الأعلى أولاً، ثم الحالات المكتملة
      list = [...queue].sort((a, b) => {
        const aCompleted = a.status === 'COMPLETED' ? 1 : 0;
        const bCompleted = b.status === 'COMPLETED' ? 1 : 0;
        return aCompleted - bCompleted;
      });
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.filter((p) => {
      const nameMatch = p.patientName?.toLowerCase().includes(query);
      const phoneMatch = p.patientPhone?.toLowerCase().includes(query);
      const queueMatch = String(p.queueNumber).includes(query);
      const fileMatch = (p.fileNumber || p.patientFileNumber)?.toLowerCase().includes(query);
      return nameMatch || phoneMatch || queueMatch || Boolean(fileMatch);
    });
  }, [queue, activeTab, waitingPatients, inProgressPatients, pastPatients, completedPatients, searchQuery]);

  return (
    <div className="space-y-4 select-none" dir={dir}>
      {/* 1. رأس الصفحة الموحد والمريح للعين (Clean & Zen Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* عنوان الشاشة والتاريخ */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#074C3A] text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Stethoscope className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-start">
            <h2 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight flex items-center gap-2">
              <span>
                {dashboardView === 'calendar' && calendarDisplayMode === 'day-grid'
                  ? tr('جدول كشوفات اليوم', "Today's Schedule")
                  : t('title')}
              </span>
              <span
                dir="ltr"
                className="text-xs px-2.5 py-0.5 rounded-full bg-[#E3F5EE] text-[#0B7B5E] font-mono font-bold border border-[#D0E5DC]"
              >
                {currentDate}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {dashboardView === 'calendar' && calendarDisplayMode === 'day-grid'
                ? tr(
                    'مواعيد وكشوفات اليوم مقسمة بالساعة — تبدأ تلقائياً من الساعة الحالية',
                    "Today's hourly appointments — starting automatically from the current hour"
                  )
                : tr(
                    'متابعة قائمة المرضى اليوم، فحص الحالات، والاطلاع على جدول مواعيد اليوم',
                    "Monitor today's patient queue, examine cases, and view today's schedule"
                  )}
            </p>
          </div>
        </div>

        {/* أزرار التبديل الثلاثية + حالة الطبيب وزر التحديث */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* تبديل العرض بين: مربعات اليوم | قائمة المرضى | تقويم الأسبوع */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setDashboardView('calendar');
                setCalendarDisplayMode('day-grid');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer',
                dashboardView === 'calendar' && calendarDisplayMode === 'day-grid'
                  ? 'bg-white text-[#074C3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <LayoutGrid className="w-4 h-4 text-[#0B7B5E]" />
              <span>{tr('مربعات اليوم ▦', 'Day Grid ▦')}</span>
              {waitingCount > 0 && (
                <span className="bg-amber-500 text-white px-2 py-0.2 rounded-full text-[10px] font-mono font-black">
                  {waitingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setDashboardView('queue')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer',
                dashboardView === 'queue'
                  ? 'bg-white text-[#074C3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <ListOrdered className="w-4 h-4 text-[#0B7B5E]" />
              <span>{tr(`قائمة المرضى (${totalCount})`, `Patient Queue (${totalCount})`)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDashboardView('calendar');
                setCalendarDisplayMode('grid');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer',
                dashboardView === 'calendar' && calendarDisplayMode === 'grid'
                  ? 'bg-white text-[#074C3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <CalendarDays className="w-4 h-4 text-[#0B7B5E]" />
              <span>{tr('الأسبوع 🗓️', 'Week 🗓️')}</span>
            </button>
          </div>

          {/* تبديل حالة الطبيب (متاح / استراحة) */}
          <button
            type="button"
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate(isAvailable ? 'BREAK' : 'AVAILABLE')}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border',
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            )}
            title={tr('الضغط للتبديل بين متاح وأخذ استراحة', 'Click to toggle between Available and On Break')}
          >
            <span className={cn('w-2 h-2 rounded-full', isAvailable ? 'bg-emerald-600' : 'bg-amber-500')} />
            <span>{isAvailable ? tr('طبيب متاح', 'Available') : tr('في استراحة', 'On Break')}</span>
          </button>

          {/* زر التحديث السريع */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isManualRefreshing}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer text-slate-600 disabled:opacity-60"
            title={tr('تحديث البيانات', 'Refresh Data')}
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 text-slate-500',
                isManualRefreshing && 'animate-spin'
              )}
            />
          </button>
        </div>
      </div>

      {/* تنبيه وجود كشوفات سابقة غير مكتملة من أيام ماضية */}
      {pastCount > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-black text-amber-950 text-sm">
                {tr(
                  `تنبيه: يوجد ${pastCount} كشوفات سابقة غير مكتملة من أيام ماضية`,
                  `Alert: ${pastCount} unfinished appointments from previous days`
                )}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                {tr(
                  'هذه الحالات سُجلت بتواريخ سابقة ولم يتم إنهاء كشفها، وتم إدراجها هنا لمتابعتها وإتمامها مع المرضى.',
                  'These cases were scheduled on earlier dates and have not been completed yet; they are listed here for follow-up.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDashboardView('queue');
              setActiveTab('past');
            }}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto',
              activeTab === 'past' && dashboardView === 'queue'
                ? 'bg-amber-950 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            )}
          >
            {tr(`عرض الحجوزات السابقة (${pastCount})`, `View Past Bookings (${pastCount})`)}
          </button>
        </div>
      )}

      {/* 2. في وضع قائمة المرضى فقط: نعرض بطاقات الإحصائيات الأربعة لتفاصيل الاستقبال */}
      {dashboardView === 'queue' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* بطاقة حالة الطبيب */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">
                {tDoctorStatus('title')}
              </span>
              {isStatusFetching && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E3F5EE]0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate('AVAILABLE')}
                className={cn(
                  'flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60',
                  isAvailable
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>{tDoctorStatus('available')}</span>
              </button>

              <button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate('BREAK')}
                className={cn(
                  'flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer disabled:opacity-60',
                  !isAvailable
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {tDoctorStatus('takeBreak')}
              </button>
            </div>
          </div>

          {/* بطاقة في الانتظار */}
          <div className="bg-[#FFFDF0] rounded-2xl p-5 shadow-xs border-2 border-brand-yellow flex flex-col justify-between text-center">
            <span className="text-xs font-semibold text-slate-500">
              {t('waitingStatus')}
            </span>
            <div className="flex items-baseline justify-center gap-2 my-1">
              <span className="text-3xl font-black text-[#074C3A]">{waitingCount}</span>
              <span className="text-xs font-bold text-slate-500">{t('remainingCases')}</span>
            </div>
          </div>

          {/* بطاقة تم الكشف */}
          <div className="bg-[#F0F5FF] rounded-2xl p-5 shadow-xs border border-[#D0E5DC] flex flex-col justify-between text-center">
            <span className="text-xs font-semibold text-slate-500">
              {t('completedCheckup')}
            </span>
            <div className="flex items-baseline justify-center gap-2 my-1">
              <span className="text-3xl font-black text-[#074C3A]">{completedCount}</span>
              <span className="text-xs font-bold text-slate-500">{t('doneCheckup')}</span>
            </div>
          </div>

          {/* بطاقة إجمالي الحالات اليوم */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between text-center">
            <span className="text-xs font-semibold text-slate-400">
              {t('totalCases')}
            </span>
            <div className="flex items-baseline justify-center gap-2 my-1">
              <span className="text-3xl font-black text-[#074C3A]">{totalCount}</span>
              <span className="text-xs font-bold text-slate-500">{t('registeredAppointments')}</span>
            </div>
          </div>
        </div>
      )}

      {dashboardView === 'calendar' ? (
        calendarDisplayMode === 'day-grid' ? (
          /* ================== وضع مربعات اليوم (Zen Day Grid - يبدأ مباشرة في أعلى الشاشة) ================== */
          isCalendarLoading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#0B7B5E] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">
                {tr('جاري تحميل جدول مواعيد اليوم...', "Loading today's appointment schedule...")}
              </p>
            </div>
          ) : (
            <CalendarDayGridView
              date={currentDate}
              slots={calendarData?.daySlots || []}
              appointments={calendarData?.weekAppointments || []}
              queueItems={queue || []}
              isDoctorView={true}
              compactHeader={true}
              onAdmit={(id) => admitMutation.mutate(id)}
              isAdmitting={admitMutation.isPending}
              admittingId={admitMutation.variables as string}
              onFinishExam={(id) => finishExamMutation.mutate(id)}
              isFinishingExam={finishExamMutation.isPending}
              finishingExamId={finishExamMutation.variables as string}
            />
          )
        ) : (
          /* ================== وضع التقويم الأسبوعي أو قائمة الفترات ================== */
          <div className="space-y-4">
            {/* شريط التحكم والتنقل الأسبوعي */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E] flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="text-start">
                  <h3 className="font-black text-base text-[#074C3A] flex items-center gap-2">
                    <span>{tr('تقويم المواعيد بالساعات', 'Hourly Appointments Calendar')}</span>
                    <span
                      dir="ltr"
                      className="text-xs px-2.5 py-0.5 rounded-full bg-[#E3F5EE] text-[#0B7B5E] font-mono font-bold"
                    >
                      {currentDate}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-bold">
                    {tr(
                      'استعراض المواعيد الأسبوعية بالساعات مع ألوان مميزة لكل حالة',
                      'View weekly hourly appointments with color-coded statuses'
                    )}
                  </p>
                </div>
              </div>

              {/* أزرار التنقل الأسبوعي */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-7)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {tr('الأسبوع السابق →', '← Previous Week')}
                </button>
                <button
                  type="button"
                  onClick={handleResetToToday}
                  className="px-4 py-2 rounded-xl bg-[#E3F5EE] hover:bg-[#E3F5EE] text-[#0B7B5E] text-xs font-black transition-all shadow-2xs cursor-pointer border border-[#D0E5DC]/60"
                >
                  {tr('اليوم', 'Today')}
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftDate(7)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {tr('← الأسبوع التالي', 'Next Week →')}
                </button>
              </div>
            </div>

            {isCalendarLoading ? (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center shadow-xs">
                <RefreshCw className="w-8 h-8 text-[#0B7B5E] animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">
                  {tr('جاري تحميل جدول المواعيد بالساعات...', 'Loading hourly appointment schedule...')}
                </p>
              </div>
            ) : calendarDisplayMode === 'grid' ? (
              <CalendarWeekGridView
                days={calendarData?.weekRange?.days || []}
                appointments={calendarData?.weekAppointments || []}
                isDoctorView={true}
              />
            ) : (
              <CalendarDayTimelineView
                slots={calendarData?.daySlots || []}
                selectedDate={currentDate}
                isDoctorView={true}
                onAdmit={handleAdmitAndOpenExam}
                isAdmitting={admitMutation.isPending}
                admittingId={admitMutation.variables as string}
                onFinishExam={(id) => finishExamMutation.mutate(id)}
                isFinishingExam={finishExamMutation.isPending}
                finishingExamId={finishExamMutation.variables as string}
              />
            )}
          </div>
        )
      ) : (
        /* ================== وضع قائمة المرضى الموجودين (Full-Width Patient List) ================== */
        <div className="space-y-4">
          {/* شريط المريض النشط في غرفة الكشف (Hero Banner) - يظهر بأناقة في الأعلى دون حجز نصف الشاشة */}
          {inProgressPatient && (
            <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/70 border-2 border-emerald-500 rounded-3xl p-5 shadow-sm relative overflow-hidden text-start">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* بيانات المريض الجاري كشفه */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                    #{String(inProgressPatient.queueNumber).padStart(2, '0')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span>{tr('كشف جاري الآن في الغرفة 🩺', 'Exam in Progress 🩺')}</span>
                      </span>

                      <h3 className="text-lg sm:text-xl font-black text-[#074C3A]">
                        {inProgressPatient.patientName}
                      </h3>

                      {inProgressPatient.isPastAppointment && (
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                          {tr(`حجز سابق (${inProgressPatient.clinicDate})`, `Past Booking (${inProgressPatient.clinicDate})`)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                      <span dir="ltr" className="font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {inProgressPatient.patientPhone || '—'}
                      </span>
                      {inProgressPatient.patientAge && (
                        <span>• {inProgressPatient.patientAge} {tr('سنة', 'yrs')}</span>
                      )}
                      <span>• {getAppointmentTypeLabel(inProgressPatient.type, tr)}</span>
                      <span className="inline-flex items-center gap-1 text-[#0B7B5E] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {formatWaitingTime(inProgressPatient.waitingMinutes, tr)}
                      </span>
                      <span className={cn('font-bold', inProgressPatient.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                        • {inProgressPatient.remainingAmount > 0
                          ? tr(`متبقي ${inProgressPatient.remainingAmount} ج.م`, `Remaining ${inProgressPatient.remainingAmount} EGP`)
                          : tr('مدفوع بالكامل', 'Paid in full')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات السريعة للمريض الجاري كشفه */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <Link
                    href={`/dashboard/examination/${inProgressPatient.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Stethoscope className="w-4 h-4 stroke-[2.2]" />
                    <span>{tr('فحص المريض والروشتة (Rx)', 'Examine & Rx')}</span>
                  </Link>

                  <button
                    type="button"
                    disabled={finishExamMutation.isPending}
                    onClick={() => finishExamMutation.mutate(inProgressPatient.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                    <span>
                      {finishExamMutation.isPending && finishExamMutation.variables === inProgressPatient.id
                        ? tr('جاري الإنهاء...', 'Finishing...')
                        : tr('إنهاء الكشف وتسليم للاستقبال ✓', 'Finish Exam & Send to Reception ✓')}
                    </span>
                  </button>

                  <Link
                    href={`/dashboard/view-patients/${inProgressPatient.patientId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tr('فتح الملف الطبي للمريض', 'Open patient medical file')}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-[#0B7B5E]" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* شريط دعوة المريض التالي عند عدم وجود مريض في الغرفة */}
          {!inProgressPatient && waitingPatients.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/70 border-2 border-amber-400 rounded-3xl p-5 shadow-sm text-start flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                  #{String(waitingPatients[0].queueNumber).padStart(2, '0')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      {tr('الدور التالي جاهز في الانتظار 🚪', 'Next in Queue Ready 🚪')}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#074C3A] mt-0.5">
                    {waitingPatients[0].patientName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {getAppointmentTypeLabel(waitingPatients[0].type, tr)} • {formatWaitingTime(waitingPatients[0].waitingMinutes, tr)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdmitAndOpenExam(waitingPatients[0].id)}
                  disabled={admitMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  <LogIn className={`w-4 h-4 ${admitMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>
                    {admitMutation.isPending && admitMutation.variables === waitingPatients[0].id
                      ? tr('جاري الإدخال...', 'Admitting...')
                      : tr('إدخال المريض للعيادة 🚪', 'Admit Patient 🚪')}
                  </span>
                </button>
                <Link
                  href={`/dashboard/examination/${waitingPatients[0].id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                >
                  <Stethoscope className="w-4 h-4 text-[#0B7B5E]" />
                  <span>{tr('فتح الكشف مباشرة', 'Open Exam Directly')}</span>
                </Link>
              </div>
            </div>
          )}

          {/* بطاقة قائمة المرضى الرئيسية بكامل العرض */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100">
            {/* شريط البحث وتصفية التبويبات */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              {/* التبويبات */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
                    activeTab === 'all'
                      ? 'bg-[#074C3A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tr(`جميع المرضى (${totalCount})`, `All Patients (${totalCount})`)}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('waiting')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                    activeTab === 'waiting'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:bg-amber-100/60'
                  )}
                >
                  <span>{tr('في الانتظار', 'Waiting')}</span>
                  <span className={cn('px-2 py-0.2 rounded-full text-xs font-mono font-bold', activeTab === 'waiting' ? 'bg-white text-amber-600' : 'bg-amber-200 text-amber-900')}>
                    {waitingCount}
                  </span>
                </button>

                {inProgressCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('in_progress')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                      activeTab === 'in_progress'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:bg-emerald-100/60'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{tr(`كشف جاري (${inProgressCount})`, `In Progress (${inProgressCount})`)}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('done')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
                    activeTab === 'done'
                      ? 'bg-[#074C3A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tr(`تم الكشف (${completedCount})`, `Completed (${completedCount})`)}
                </button>

                {pastCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('past')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                      activeTab === 'past'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                    )}
                  >
                    <span>{tr('سابقة معلقة', 'Pending Past')}</span>
                    <span className="bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full text-xs font-mono font-bold">
                      {pastCount}
                    </span>
                  </button>
                )}
              </div>

              {/* حقل البحث السريع بالاسم أو التليفون */}
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr('ابحث بالاسم أو رقم الهاتف...', 'Search by name or phone...')}
                  className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B7B5E]/20 focus:border-[#0B7B5E] transition-all"
                />
              </div>
            </div>

            {/* قائمة المرضى المفصلة */}
            <div className="mt-5 space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm font-semibold flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="font-bold text-slate-600 text-base">
                    {tr('لا يوجد مرضى مطابقون في هذه القائمة حالياً', 'No matching patients in this list')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tr('يمكنك تغيير فلتر التصفية أو البحث باسم آخر', 'Try changing the filter or searching another name')}
                  </p>
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const isInProgress = patient.status === 'IN_PROGRESS';
                  const isWaiting = patient.status === 'WAITING';
                  const isBooked = patient.status === 'BOOKED';
                  const isCompleted = patient.status === 'COMPLETED';
                  const isPendingCheckout = patient.status === 'PENDING_CHECKOUT';
                  const queueNo = String(patient.queueNumber).padStart(2, '0');

                  // تحديد نمط الإطار والخلفية للبطاقة
                  let cardStyle = 'bg-white border-slate-200/90 hover:border-slate-300';
                  let queueBadgeStyle = 'bg-[#E3F5EE] text-[#0B7B5E]';

                  if (isInProgress) {
                    cardStyle = 'bg-emerald-50/70 border-2 border-emerald-500 shadow-sm ring-1 ring-emerald-300';
                    queueBadgeStyle = 'bg-emerald-600 text-white shadow-2xs';
                  } else if (isWaiting) {
                    cardStyle = 'bg-amber-50/50 border-2 border-amber-300 hover:border-amber-400';
                    queueBadgeStyle = 'bg-amber-500 text-white';
                  } else if (patient.isPastAppointment) {
                    cardStyle = 'bg-amber-50/30 border-amber-200 hover:border-amber-300';
                    queueBadgeStyle = 'bg-amber-100 text-amber-900 border border-amber-200';
                  } else if (isCompleted || isPendingCheckout) {
                    cardStyle = 'bg-slate-50/70 border-slate-200/90 opacity-60 hover:opacity-95 transition-opacity';
                    queueBadgeStyle = 'bg-slate-200 text-slate-700 opacity-80';
                  }

                  return (
                    <div
                      key={patient.id}
                      className={cn(
                        'rounded-2xl border p-4 sm:p-5 transition-all text-start flex flex-col md:flex-row md:items-center justify-between gap-4',
                        cardStyle
                      )}
                    >
                      {/* الجانب الأيمن: رقم الدور + بيانات المريض */}
                      <div className="flex items-center gap-4 flex-1">
                        <span
                          className={cn(
                            'w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center shrink-0 shadow-2xs',
                            queueBadgeStyle
                          )}
                        >
                          #{queueNo}
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="font-black text-[#074C3A] text-base sm:text-lg">
                              {patient.patientName}
                            </h4>

                            {(patient.fileNumber || patient.patientFileNumber) && (
                              <span
                                dir="ltr"
                                className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 text-[11px] font-mono font-black border border-emerald-300/60 shadow-2xs"
                              >
                                #{patient.fileNumber || patient.patientFileNumber}
                              </span>
                            )}

                            {isInProgress && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                <span>{tr('كشف جاري الآن', 'Exam in Progress')}</span>
                              </span>
                            )}

                            {isWaiting && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>{tr('في الانتظار', 'Waiting')}</span>
                              </span>
                            )}

                            {isBooked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E3F5EE] text-[#074C3A] border border-[#D0E5DC]">
                                <span>{tr('حجز مسبق', 'Booked')}</span>
                              </span>
                            )}

                            {isPendingCheckout && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <span>{tr('بانتظار المحاسبة', 'Pending Checkout')}</span>
                              </span>
                            )}

                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                                <Check className="w-3 h-3" />
                                <span>{tr('تم الكشف', 'Completed')}</span>
                              </span>
                            )}

                            {patient.isPastAppointment && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Calendar className="w-3 h-3 text-amber-700" />
                                <span>{tr(`حجز سابق (${patient.clinicDate})`, `Past Booking (${patient.clinicDate})`)}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                            <span dir="ltr" className="font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {patient.patientPhone || '—'}
                            </span>
                            {patient.patientAge && (
                              <span>• {patient.patientAge} {tr('سنة', 'yrs')}</span>
                            )}
                            {patient.patientGender && (
                              <span>• {patient.patientGender === 'MALE' ? tr('ذكر', 'Male') : tr('أنثى', 'Female')}</span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-md bg-[#E3F5EE] text-[#0B7B5E] font-black text-xs opacity-100 shadow-2xs border border-[#D0E5DC]">
                              {getAppointmentTypeLabel(patient.type, tr)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatWaitingTime(patient.waitingMinutes, tr)}</span>
                            </span>
                            <span
                              className={cn(
                                'font-bold px-2 py-0.5 rounded-md text-[11px]',
                                patient.remainingAmount > 0
                                  ? 'bg-amber-100/70 text-amber-900'
                                  : 'bg-emerald-100/70 text-emerald-800'
                              )}
                            >
                              {patient.remainingAmount > 0
                                ? tr(`متبقي ${patient.remainingAmount} ج.م`, `Remaining ${patient.remainingAmount} EGP`)
                                : tr('مدفوع', 'Paid')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* الجانب الأيسر: أزرار الإجراءات الفورية */}
                      <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end shrink-0">
                        {/* زر فتح الكشف والروشتة */}
                        <Link
                          href={`/dashboard/examination/${patient.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <Stethoscope className="w-4 h-4 stroke-[2.2]" />
                          <span>{tr('كشف وروشتة 📋', 'Exam & Rx 📋')}</span>
                        </Link>

                        {/* زر إدخال للكشف إذا كان المريض في الانتظار */}
                        {(isWaiting || isBooked) && (
                          <button
                            type="button"
                            onClick={() => handleAdmitAndOpenExam(patient.id)}
                            disabled={admitMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-60 whitespace-nowrap"
                          >
                            <LogIn className="w-4 h-4 stroke-[2.2]" />
                            <span>
                              {admitMutation.isPending && admitMutation.variables === patient.id
                                ? tr('جاري الإدخال...', 'Admitting...')
                                : tr('إدخال للكشف 🚪', 'Admit to Exam 🚪')}
                            </span>
                          </button>
                        )}

                        {/* زر إنهاء الكشف إذا كان كشف جاري الآن */}
                        {isInProgress && (
                          <button
                            type="button"
                            disabled={finishExamMutation.isPending}
                            onClick={() => finishExamMutation.mutate(patient.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {finishExamMutation.isPending && finishExamMutation.variables === patient.id
                                ? tr('جاري الإنهاء...', 'Finishing...')
                                : tr('إنهاء الكشف ✓', 'Finish Exam ✓')}
                            </span>
                          </button>
                        )}

                        {/* زر فتح الملف الطبي للمريض */}
                        <Link
                          href={`/dashboard/view-patients/${patient.patientId}`}
                          title={tr('فتح الملف الطبي للمريض', 'Open patient medical file')}
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-[#0B7B5E]" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ذيل بطاقة القائمة */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>{tr('تحديث تلقائي مستمر لقائمة الانتظار كل 10 ثوانٍ', 'Queue auto-refreshes every 10 seconds')}</span>
              <span className="font-bold text-slate-600">
                {tr(
                  `إجمالي المعروض: ${filteredPatients.length} من ${totalCount} مريض`,
                  `Showing ${filteredPatients.length} of ${totalCount} patients`
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
