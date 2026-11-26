'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { BookingFormType } from '../types/booking';
import { formatTime12h } from '../constants/booking.constant';
import { useDoctorsQuery, useDoctorAvailableSlotsQuery } from '../hooks/appointments.hook';
import { Calendar, ChevronDown, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

/**
 * القسم 3: الطبيب والتوقيت
 * - تحديد الطبيب المعالج، وتاريخ الموعد، ونوع الحضور
 * - اختيار وقت الموعد مباشرة من شبكة المواعيد المتاحة
 * - زر «الآن» للحضور المباشر الفوري بالوقت الحالي
 */
export function DoctorTimingStepCard() {
  const { isAr, tr } = useAppLocale();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<BookingFormType>();

  const searchParams = useSearchParams();
  const urlDoctorId = searchParams.get('doctorId');

  const doctorId = useWatch({ control, name: 'doctorId' });
  const appointmentDate = useWatch({ control, name: 'appointmentDate' });
  const selectedTime = useWatch({ control, name: 'appointmentTime' });
  const source = useWatch({ control, name: 'source' });

  // 1. استعلام الأطباء وتخزينهم في الـ Cache
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctorsQuery();
  const doctorsList = doctorsData && doctorsData.length > 0 ? doctorsData : [];

  const userChangedDoctorRef = React.useRef(false);
  const initializedRef = React.useRef(false);

  // تعيين الطبيب المحدد من الرابط أو أول طبيب تلقائياً عند أول تحميل فقط وبدون الكتابة فوق اختيار المستخدم
  useEffect(() => {
    if (userChangedDoctorRef.current) return;
    if (initializedRef.current && doctorId) return;

    if (doctorsData && doctorsData.length > 0) {
      const urlDoc = urlDoctorId ? doctorsData.find((d) => d.id === urlDoctorId) : null;
      const targetDoctorId = urlDoc ? urlDoc.id : doctorsData[0].id;
      const exists = doctorsData.some((d) => d.id === doctorId);
      if (!doctorId || !exists) {
        setValue('doctorId', targetDoctorId, {
          shouldValidate: true,
          shouldDirty: false,
        });
        initializedRef.current = true;
      }
    }
  }, [doctorsData, doctorId, urlDoctorId, setValue]);

  // 2. استعلام المواعيد المتاحة للطبيب واليوم المختار
  const effectiveDoctorId = doctorId || doctorsList[0]?.id;
  const {
    data: slotsData,
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
  } = useDoctorAvailableSlotsQuery(effectiveDoctorId, appointmentDate);

  // تعيين الحضور المباشر الآن بالوقت الحالي الفعلي
  const handleSelectNow = () => {
    setValue('source', 'WALK_IN', {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const isPm = hours >= 12;
    const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
    const period = isPm ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
    const formattedTime = `${displayHours}:${minutes} ${period}`;

    setValue('appointmentTime', formattedTime, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // تعيين فترة زمنية محددة عند الضغط على وقت متاح
  const handleSelectSlot = (slotLabel: string) => {
    setValue('appointmentTime', slotLabel, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue('source', 'SCHEDULED', {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // قائمة المواعيد المعروضة: المتاحة والمحجوزة والسابقة لليوم
  const hasApiSlots = Boolean(slotsData && Array.isArray(slotsData.slots));
  const rawSlots = hasApiSlots ? slotsData!.slots : [];

  const displayableSlots = rawSlots;

  // حماية ذكية: إذا تغير اليوم أو الطبيب في وضع الحجز المسبق، نتحقق أن الوقت المختار ما زال متاحاً أو صالحاً
  useEffect(() => {
    if (source === 'SCHEDULED' && displayableSlots.length > 0) {
      const isCurrentTimeAvailable = displayableSlots.some(
        (s: any) =>
          !s.isBooked &&
          (s.label === selectedTime ||
            s.startTime === selectedTime ||
            formatTime12h(s.startTime || s.label, isAr) === selectedTime)
      );
      if (!isCurrentTimeAvailable) {
        const firstAvailable = displayableSlots.find((s: any) => !s.isBooked && !s.isPast) || displayableSlots.find((s: any) => !s.isBooked);
        if (firstAvailable) {
          const rawVal = (firstAvailable as any).startTime || (firstAvailable as any).label || (firstAvailable as any).time;
          const slotLabel = formatTime12h(rawVal, isAr);
          setValue('appointmentTime', slotLabel, {
            shouldValidate: true,
            shouldDirty: true,
          });
        } else {
          setValue('appointmentTime', '', {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }
  }, [displayableSlots, source, selectedTime, setValue, isAr]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-100 space-y-6 animate-in fade-in-50">
      {/* رأس القسم: الرقم 3 والعنوان */}
      <div className="flex items-start gap-3.5">
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0B7B5E] text-white flex items-center justify-center font-black text-sm shrink-0">
          3
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#074C3A] tracking-tight">
            {tr('الطبيب والتوقيت', 'Doctor & Timing')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr('حدد الطبيب والتاريخ والساعة ونوع الحضور', 'Select the doctor, date, time, and visit type')}
          </p>
        </div>
      </div>

      {/* عناصر التحكم الرئيسية في 4 حقول متناسقة مطابقة للتصميم: الطبيب المعالج + تاريخ الموعد + ساعة الموعد + نوع الحضور */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
        {/* 1. الطبيب المعالج */}
        <div>
          <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
            {tr('الطبيب المعالج', 'Doctor')} <span className="text-rose-500">*</span>
          </label>
          <Controller
            name="doctorId"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  value={field.value || ''}
                  onChange={(e) => {
                    userChangedDoctorRef.current = true;
                    field.onChange(e);
                  }}
                  disabled={isLoadingDoctors}
                  className={cn(
                    'w-full h-11 ps-3.5 pe-9 rounded-2xl border bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15 transition-all appearance-none cursor-pointer disabled:opacity-60',
                    errors.doctorId ? 'border-rose-400' : 'border-slate-200'
                  )}
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          />
          {errors.doctorId && (
            <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.doctorId.message}</span>
            </p>
          )}
        </div>

        {/* 2. تاريخ الموعد */}
        <div>
          <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
            {tr('تاريخ الموعد', 'Appointment Date')} <span className="text-rose-500">*</span>
          </label>
          <Controller
            name="appointmentDate"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  type="date"
                  value={field.value}
                  onChange={field.onChange}
                  className={cn(
                    'w-full h-11 ps-10 pe-3.5 rounded-2xl border bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15 transition-all cursor-pointer',
                    errors.appointmentDate ? 'border-rose-400' : 'border-slate-200'
                  )}
                />
                <Calendar className="w-4 h-4 text-[#0B7B5E] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          />
          {errors.appointmentDate && (
            <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.appointmentDate.message}</span>
            </p>
          )}
        </div>

        {/* 3. ساعة الموعد (عرض ذكي بالقراءة فقط لاختيار الوقت من المواعيد المتاحة) */}
        <div>
          <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
            {tr('ساعة الموعد', 'Appointment Time')} <span className="text-rose-500">*</span>
          </label>
          <div
            className={cn(
              'w-full h-11 px-3.5 rounded-2xl border bg-white flex items-center justify-between text-xs font-bold transition-all select-none',
              errors.appointmentTime ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
            )}
          >
            <span className={cn(selectedTime ? 'text-[#074C3A]' : 'text-slate-400 font-normal')}>
              {selectedTime ? formatTime12h(selectedTime, isAr) : tr('اختر من المواعيد', 'Select a time slot')}
            </span>
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          {errors.appointmentTime && (
            <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.appointmentTime.message}</span>
            </p>
          )}
        </div>

        {/* 4. نوع الحضور */}
        <div>
          <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
            {tr('نوع الحضور', 'Visit Type')} <span className="text-rose-500">*</span>
          </label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-1 p-1 h-11 rounded-2xl border border-slate-200 bg-slate-50/70 items-center">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('WALK_IN');
                    handleSelectNow();
                  }}
                  className={cn(
                    'h-full rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center leading-tight py-0.5 select-none',
                    field.value === 'WALK_IN'
                      ? 'bg-[#0B7B5E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>{tr('بدون موعد', 'Walk-in')}</span>
                  <span className="text-[9px] opacity-90">{tr('(مباشر)', '(Direct)')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('SCHEDULED');
                    // إذا لم يكن هناك موعد مسبق مختار، نحدد أول موعد متاح
                    const firstAvailable =
                      displayableSlots.find((s: any) => !s.isBooked && !s.isPast) ||
                      displayableSlots.find((s: any) => !s.isBooked);
                    if (firstAvailable) {
                      const rawVal = (firstAvailable as any).startTime || (firstAvailable as any).label || (firstAvailable as any).time;
                      handleSelectSlot(formatTime12h(rawVal, isAr));
                    }
                  }}
                  className={cn(
                    'h-full rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center leading-tight py-0.5 select-none',
                    field.value === 'SCHEDULED'
                      ? 'bg-[#0B7B5E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>{tr('موعد', 'Scheduled')}</span>
                  <span className="text-[9px] opacity-90">{tr('مسبق', 'Pre-booked')}</span>
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* قسم المواعيد المتاحة واختيار الوقت */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-black text-[#074C3A]">
              {tr('المواعيد المتاحة اليوم', 'Available Slots')}
            </h4>
            {selectedTime && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#E3F5EE] border border-[#D0E5DC] text-[#0B7B5E] text-[11px] font-black">
                {tr(
                  `الوقت المختار: ${formatTime12h(selectedTime, isAr)}`,
                  `Selected: ${formatTime12h(selectedTime, isAr)}`
                )}
              </span>
            )}
            {isFetchingSlots && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B7B5E]" />
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {tr(
              'المشطوبة محجوزة • «الآن» للحضور المباشر',
              'Crossed-out slots are booked • "Now" for direct walk-in'
            )}
          </span>
        </div>

        {/* حالة التحميل الأولي للمواعيد */}
        {isLoadingSlots ? (
          <div className="flex items-center gap-2 py-4 text-xs font-bold text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#0B7B5E]" />
            <span>{tr('جاري فحص المواعيد المتاحة للطبيب...', 'Checking available slots for doctor...')}</span>
          </div>
        ) : slotsData && !slotsData.isWorkingDay ? (
          /* حالة يوم عطلة أو غير متاح */
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {slotsData.message ||
                tr(
                  'عطلة أسبوعية · لا توجد فترات عمل متاحة لهذا الطبيب في هذا اليوم',
                  'Day off · No working shifts available for this doctor on this date'
                )}
            </span>
          </div>
        ) : slotsData && slotsData.isPast ? (
          /* حالة تاريخ في الماضي */
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {slotsData.message ||
                tr(
                  'التاريخ المحدد في الماضي · لا يمكن حجز مواعيد سابقة',
                  'Selected date is in the past · Cannot book past dates'
                )}
            </span>
          </div>
        ) : displayableSlots.length === 0 ? (
          /* حالة عدم وجود مواعيد متاحة أو محجوزة */
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold text-center">
            {tr('لا توجد مواعيد متاحة أو محجوزة متبقية لهذا اليوم.', 'No available or remaining slots for this day.')}
          </div>
        ) : (
          /* شبكة أزرار الفترات الزمنية المتاحة لاختيار الوقت */
          <div className="flex flex-wrap items-center gap-2">
            {/* زر «الآن» الأصفر المميز */}
            <button
              type="button"
              onClick={handleSelectNow}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs bg-brand-yellow text-slate-950 hover:brightness-95 active:scale-98 select-none',
                source === 'WALK_IN' && 'ring-2 ring-amber-500 ring-offset-1'
              )}
            >
              {tr('الآن', 'Now')}
            </button>

            {/* أزرار الساعات */}
            {displayableSlots.map((slot: any, idx: number) => {
              const rawLabel = slot.label || slot.startTime || `slot-${idx}`;
              const displayLabel = slot.startTime
                ? formatTime12h(slot.startTime, isAr)
                : formatTime12h(rawLabel, isAr);
              const isBooked = Boolean(slot.isBooked);
              const isPast = Boolean(slot.isPast);
              const isSelected =
                selectedTime === displayLabel ||
                selectedTime === rawLabel ||
                (slot.startTime && selectedTime === slot.startTime);

              // 1. موعد محجوز لمريض آخر (مشطوب وغير متاح)
              if (isBooked) {
                return (
                  <button
                    key={slot.time || slot.startTime || idx}
                    type="button"
                    disabled
                    title={tr('موعد محجوز لمريض آخر', 'Booked for another patient')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 line-through cursor-not-allowed select-none opacity-80"
                  >
                    <span>{displayLabel}</span>
                    <span className="text-[10px] ms-1">{tr('(محجوز)', '(Booked)')}</span>
                  </button>
                );
              }

              // 2. موعد انقضى وقته اليوم (متاح للاختيار لتسجيل الحضور الفعلي أو المتأخر)
              if (isPast) {
                return (
                  <button
                    key={slot.time || slot.startTime || idx}
                    type="button"
                    onClick={() => handleSelectSlot(displayLabel)}
                    title={tr('موعد سابق اليوم (متاح للاختيار)', 'Earlier slot today (selectable)')}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-[#0B7B5E] text-white border-[#0B7B5E] shadow-xs font-black ring-2 ring-[#0B7B5E]/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#0B7B5E] hover:bg-[#E3F5EE]/40'
                    )}
                  >
                    {displayLabel}
                  </button>
                );
              }

              // 3. موعد متاح قادم (قابل للاختيار بالضغط عليه)
              return (
                <button
                  key={slot.time || slot.startTime || idx}
                  type="button"
                  onClick={() => handleSelectSlot(displayLabel)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-[#0B7B5E] text-white border-[#0B7B5E] shadow-xs font-black ring-2 ring-[#0B7B5E]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#0B7B5E] hover:bg-[#E3F5EE]/40'
                  )}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* تنبيه الخطأ في حال عدم اختيار وقت موعد */}
        {errors.appointmentTime && (
          <p className="text-xs text-rose-500 font-bold flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.appointmentTime.message}</span>
          </p>
        )}
      </div>
    </div>
  );
}
