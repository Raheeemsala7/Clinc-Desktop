'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Save,
  Coffee,
  ToggleLeft,
  ToggleRight,
  Loader2,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface DayConfig {
  id: string;
  dayOfWeek: number;
  nameAr: string;
  nameEn: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

const INITIAL_DAYS: DayConfig[] = [
  { id: 'saturday', dayOfWeek: 6, nameAr: 'السبت', nameEn: 'Saturday', enabled: true, startTime: '10:00', endTime: '18:00', hasBreak: false, breakStart: '14:00', breakEnd: '15:00' },
  { id: 'sunday', dayOfWeek: 0, nameAr: 'الأحد', nameEn: 'Sunday', enabled: true, startTime: '10:00', endTime: '18:00', hasBreak: false, breakStart: '14:00', breakEnd: '15:00' },
  { id: 'monday', dayOfWeek: 1, nameAr: 'الاثنين', nameEn: 'Monday', enabled: true, startTime: '10:00', endTime: '18:00', hasBreak: false, breakStart: '14:00', breakEnd: '15:00' },
  { id: 'tuesday', dayOfWeek: 2, nameAr: 'الثلاثاء', nameEn: 'Tuesday', enabled: true, startTime: '10:00', endTime: '18:00', hasBreak: false, breakStart: '14:00', breakEnd: '15:00' },
  { id: 'wednesday', dayOfWeek: 3, nameAr: 'الأربعاء', nameEn: 'Wednesday', enabled: true, startTime: '10:00', endTime: '18:00', hasBreak: false, breakStart: '14:00', breakEnd: '15:00' },
  { id: 'thursday', dayOfWeek: 4, nameAr: 'الخميس', nameEn: 'Thursday', enabled: true, startTime: '10:00', endTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '13:30' },
  { id: 'friday', dayOfWeek: 5, nameAr: 'الجمعة', nameEn: 'Friday', enabled: false, startTime: '14:00', endTime: '18:00', hasBreak: false, breakStart: '', breakEnd: '' },
];

export default function DoctorSchedulePage() {
  const { isAr, dir, tr } = useAppLocale();
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<DayConfig[]>(INITIAL_DAYS);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [doctorsList, setDoctorsList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // 1. جلب قائمة أطباء العيادة
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await fetch('/api/doctors');
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json?.payload) ? json.payload : [];
        setDoctorsList(list);
        if (list.length > 0 && !selectedDoctorId) {
          const myId = (session?.user as any)?.id;
          const found = list.find((d: any) => d.id === myId);
          setSelectedDoctorId(found ? found.id : list[0].id);
        }
      } catch (err) {
        console.warn('Failed to load doctors list:', err);
      }
    }
    loadDoctors();
  }, [session, selectedDoctorId]);

  // 2. جلب الجدول الفعلي المحفوظ في قاعدة البيانات عند فتح الصفحة
  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      try {
        setIsLoading(true);
        const url = selectedDoctorId
          ? `/api/doctor-schedule?doctorId=${encodeURIComponent(selectedDoctorId)}`
          : '/api/doctor-schedule';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch schedule');
        const json = await res.json();
        const payload = json?.data || json?.payload;

        if (payload && Array.isArray(payload.weeklySchedule) && payload.weeklySchedule.length > 0 && isMounted) {
          if (payload.slotDurationMinutes) {
            setSlotDurationMinutes(payload.slotDurationMinutes);
          }

          setSchedule((prevDays) =>
            prevDays.map((day) => {
              const savedDay = payload.weeklySchedule.find((d: any) => d.dayOfWeek === day.dayOfWeek);
              if (!savedDay) return day;

              const isAvailable = Boolean(savedDay.isAvailable);
              const shifts = savedDay.shifts || [];

              if (shifts.length === 1) {
                return {
                  ...day,
                  enabled: isAvailable,
                  startTime: shifts[0].startTime || day.startTime,
                  endTime: shifts[0].endTime || day.endTime,
                  hasBreak: false,
                };
              } else if (shifts.length >= 2) {
                return {
                  ...day,
                  enabled: isAvailable,
                  startTime: shifts[0].startTime || day.startTime,
                  breakStart: shifts[0].endTime || '14:00',
                  breakEnd: shifts[1].startTime || '15:00',
                  endTime: shifts[1].endTime || day.endTime,
                  hasBreak: true,
                };
              }

              return {
                ...day,
                enabled: isAvailable,
              };
            })
          );
        }
      } catch (err) {
        console.warn('Using default schedule setup:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId]);

  const toggleDay = (id: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.id === id ? { ...day, enabled: !day.enabled } : day))
    );
  };

  const updateDayTime = (id: string, field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd', value: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.id === id ? { ...day, [field]: value } : day))
    );
  };

  const toggleBreak = (id: string) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id !== id) return day;
        const nextBreak = !day.hasBreak;
        return {
          ...day,
          hasBreak: nextBreak,
          breakStart: nextBreak ? day.breakStart || '14:00' : '',
          breakEnd: nextBreak ? day.breakEnd || '15:00' : '',
        };
      })
    );
  };

  // حفظ الجدول وإرساله لقاعدة بيانات العيادة لتسميعه فوراً عند الاستقبال
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const weeklySchedule = schedule.map((day) => {
        if (!day.enabled) {
          return {
            dayOfWeek: day.dayOfWeek,
            isAvailable: false,
            shifts: [],
          };
        }

        let shifts: Array<{ startTime: string; endTime: string }> = [];

        if (day.hasBreak && day.breakStart && day.breakEnd) {
          if (
            day.startTime < day.breakStart &&
            day.breakStart < day.breakEnd &&
            day.breakEnd < day.endTime
          ) {
            shifts = [
              { startTime: day.startTime, endTime: day.breakStart },
              { startTime: day.breakEnd, endTime: day.endTime },
            ];
          } else {
            shifts = [{ startTime: day.startTime, endTime: day.endTime }];
          }
        } else {
          shifts = [{ startTime: day.startTime, endTime: day.endTime }];
        }

        return {
          dayOfWeek: day.dayOfWeek,
          isAvailable: true,
          shifts,
        };
      });

      const response = await fetch('/api/doctor-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId || (session?.user as any)?.id,
          slotDurationMinutes,
          weeklySchedule,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            tr('فشل حفظ جدول المواعيد في الخادم', 'Failed to save schedule on the server')
        );
      }

      toast.success(
        tr(
          'تم حفظ جدول أوقات العمل في قاعدة البيانات وتحديث مواعيد الاستقبال بنجاح ✅',
          'Weekly schedule saved and reception slots updated successfully ✅'
        )
      );
    } catch (err: any) {
      toast.error(err?.message || tr('حدث خطأ أثناء حفظ الجدول', 'An error occurred while saving the schedule'));
    } finally {
      setIsSaving(false);
    }
  };

  const activeDaysCount = schedule.filter((d) => d.enabled).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* 1. الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E]">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight">
              {tr('أوقات العمل الأسبوعية والورديات', 'Weekly Working Hours & Shifts')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {tr(
              'تحديد مواعيد الحضور وساعات الكشف اليومية لتظهر تلقائياً للاستقبال لحجز المرضى',
              'Set clinic attendance days and hours so available booking slots appear automatically for reception'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {doctorsList.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
              <UserIcon className="w-4 h-4 text-[#0B7B5E]" />
              <span className="text-xs font-bold text-slate-500">{tr('الطبيب:', 'Doctor:')}</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-transparent text-xs font-black text-[#074C3A] focus:outline-none cursor-pointer"
              >
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B7B5E]" />
              <span>{tr('جاري تحميل المواعيد...', 'Loading schedule...')}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-black text-sm transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>
              {isSaving
                ? tr('جاري الحفظ بالسيرفر...', 'Saving to server...')
                : tr('حفظ الجدول وتحديث الاستقبال', 'Save Schedule & Update Reception')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. كروت الإحصائيات السريعة وتحديد مدة الكشف */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 block">
            {tr('أيام العمل المتاحة', 'Active Working Days')}
          </span>
          <span className="text-2xl font-black text-[#074C3A]">
            {activeDaysCount} {tr('أيام / أسبوع', 'days / week')}
          </span>
          <span className="text-[11px] text-emerald-600 font-bold block">
            {7 - activeDaysCount} {tr('أيام عطلة أسبوعية', 'days off / week')}
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 block">
              {tr('مدة الكشف لكل مريض', 'Slot Duration per Patient')}
            </span>
            <select
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-emerald-50 text-[#074C3A] font-black text-xs focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
            >
              <option value={15}>{tr('15 دقيقة', '15 min')}</option>
              <option value={20}>{tr('20 دقيقة', '20 min')}</option>
              <option value={30}>{tr('30 دقيقة', '30 min')}</option>
              <option value={45}>{tr('45 دقيقة', '45 min')}</option>
              <option value={60}>{tr('60 دقيقة (ساعة)', '60 min (1 hour)')}</option>
            </select>
          </div>
          <span className="text-2xl font-black text-[#0B7B5E]">
            {slotDurationMinutes} {tr('دقيقة', 'min')}
          </span>
          <span className="text-[11px] text-slate-500 font-bold block">
            {tr(
              'يتم تقسيم ساعات الحضور تلقائياً إلى فترات بهذه المدة',
              'Working hours are automatically split into slots of this duration'
            )}
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 block">
            {tr('حالة المزامنة مع الاستقبال', 'Reception Sync Status')}
          </span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{tr('مربوط مباشرة بقاعدة البيانات', 'Live Database Sync')}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-bold block">
            {tr(
              'أي تعديل يحفظ هنا يظهر فوراً في شاشة حجز الاستقبال',
              'Any saved change reflects immediately in reception booking'
            )}
          </span>
        </div>
      </div>

      {/* 3. جدول أيام الأسبوع التفصيلي */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0B7B5E]" />
            <h2 className="text-base font-black text-[#074C3A]">
              {tr('جدول الحضور اليومي وساعات العمل', 'Daily Attendance & Working Hours')}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {tr(
              'فعّل الأيام التي تعمل بها وحدد ساعات الحضور وموعد الاستراحة إن وجد',
              'Enable your working days and set shift hours and optional break times'
            )}
          </span>
        </div>

        <div className="space-y-3">
          {schedule.map((day) => (
            <div
              key={day.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                day.enabled
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'bg-slate-100/40 border-slate-200/50 opacity-60'
              }`}
            >
              {/* اسم اليوم ومفتاح التفعيل */}
              <div className="flex items-center gap-3 min-w-[150px]">
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`p-1 rounded-xl transition-all cursor-pointer ${
                    day.enabled ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                  title={
                    day.enabled
                      ? tr('اضغط للتعطيل', 'Click to disable')
                      : tr('اضغط للتفعيل', 'Click to enable')
                  }
                >
                  {day.enabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>

                <div>
                  <span className="font-black text-sm text-[#074C3A] block">
                    {isAr ? day.nameAr : day.nameEn}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 block" dir={isAr ? 'ltr' : 'rtl'}>
                    {isAr ? day.nameEn : day.nameAr}
                  </span>
                </div>
              </div>

              {/* ساعات العمل وتفاصيل الفترات */}
              {day.enabled ? (
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{tr('وقت البدء:', 'Start:')}</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateDayTime(day.id, 'startTime', e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-black text-xs text-[#074C3A] focus:outline-none focus:border-[#0B7B5E]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{tr('وقت الانتهاء:', 'End:')}</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateDayTime(day.id, 'endTime', e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-black text-xs text-[#074C3A] focus:outline-none focus:border-[#0B7B5E]"
                    />
                  </div>

                  {/* زر ومجال الاستراحة */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBreak(day.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        day.hasBreak
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {day.hasBreak
                          ? tr('استراحة مفعّلة', 'Break Enabled')
                          : tr('+ إضافة استراحة', '+ Add Break')}
                      </span>
                    </button>

                    {day.hasBreak && (
                      <div className="flex items-center gap-1.5 bg-amber-50/60 p-1.5 rounded-xl border border-amber-200 text-amber-900">
                        <span className="text-[11px] font-bold">{tr('من:', 'From:')}</span>
                        <input
                          type="time"
                          value={day.breakStart}
                          onChange={(e) => updateDayTime(day.id, 'breakStart', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-amber-300 bg-white font-bold text-xs"
                        />
                        <span className="text-[11px] font-bold">{tr('إلى:', 'To:')}</span>
                        <input
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) => updateDayTime(day.id, 'breakEnd', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-amber-300 bg-white font-bold text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span>
                    {tr(
                      'عطلة أسبوعية · لن تظهر أي مواعيد للحجز في هذا اليوم عند الاستقبال',
                      'Day off · No booking slots will be shown at reception for this day'
                    )}
                  </span>
                </div>
              )}

              {/* شارة حالة اليوم */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black inline-block ${
                    day.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {day.enabled ? tr('متاح للحجز ✓', 'Available ✓') : tr('إجازة', 'Day Off')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
