'use client';

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { BookingFormType } from '../types/booking';
import {
  formatDoctorName,
  formatTime12h,
  getAppointmentTypeLabel,
  getChronicDiseaseLabel,
  getExemptionReasonLabel,
} from '../constants/booking.constant';
import { useDoctorsQuery } from '../hooks/appointments.hook';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface BookingSummaryPanelProps {
  isSubmitting?: boolean;
  onCancel?: () => void;
}

/**
 * لوحة ملخص الحجز - كارت جانبي ثابت على الشاشات الكبيرة، وشريط ملخص سفلي على الموبايل
 * ترتبط لحظياً بجميع قيم النموذج عبر useWatch لتحديث البيانات فور حدوث أي تغيير
 */
export function BookingSummaryPanel({ isSubmitting = false, onCancel }: BookingSummaryPanelProps) {
  const { isAr, tr } = useAppLocale();
  const { control } = useFormContext<BookingFormType>();

  // استخدام useWatch لضمان الاشتراك اللحظي وإعادة التصيير الفوري عند تغيير أي حقل
  const patientName = useWatch({ control, name: 'patientName' });
  const isChild = useWatch({ control, name: 'isChild' });
  const doctorId = useWatch({ control, name: 'doctorId' });
  const appointmentType = useWatch({ control, name: 'appointmentType' });
  const appointmentDate = useWatch({ control, name: 'appointmentDate' });
  const appointmentTime = useWatch({ control, name: 'appointmentTime' });
  const source = useWatch({ control, name: 'source' });
  const hasChronicDisease = useWatch({ control, name: 'hasChronicDisease' });
  const chronicDiseases = useWatch({ control, name: 'chronicDiseases' }) || [];
  const examinationFee = useWatch({ control, name: 'examinationFee' }) || 0;
  const discount = useWatch({ control, name: 'discount' }) || 0;
  const paidAmount = useWatch({ control, name: 'paidAmount' }) || 0;
  const isExempt = useWatch({ control, name: 'isExempt' });
  const exemptionReason = useWatch({ control, name: 'exemptionReason' });

  // جلب بيانات الأطباء من الكاش
  const { data: doctorsData } = useDoctorsQuery();
  const doctorsList = doctorsData && doctorsData.length > 0 ? doctorsData : [];
  const currentDoctor = doctorsList.find((d) => d.id === doctorId) || doctorsList[0];

  // إيجاد مسمى نوع الموعد
  const currentTypeLabel = getAppointmentTypeLabel(appointmentType, isAr);

  // إيجاد أسماء الأمراض المزمنة المحددة (سواء قياسية أو مخصصة)
  const selectedDiseasesLabels = chronicDiseases
    .map((id) => getChronicDiseaseLabel(id, isAr))
    .filter(Boolean)
    .join(isAr ? '، ' : ', ');

  const displayTime = appointmentTime
    ? formatTime12h(appointmentTime, isAr)
    : tr('04:30 م', '04:30 PM');

  // حساب المتبقي المالي مع الخصم
  const netFee = isExempt ? 0 : Math.max(0, examinationFee - discount);
  const remainingAmount = Math.max(0, netFee - paidAmount);

  return (
    <>
      {/* 1. الكارت الجانبي للشاشات الكبيرة (Desktop Sticky Sidebar) */}
      <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
        <div className="sticky top-20 bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden select-none">
          {/* رأس الملخص مع شعار العيادة المربّع */}
          <div className="bg-[#074C3A] text-white px-5 py-4 flex items-center justify-between">
            <h3 className="font-black text-base tracking-tight">{tr('ملخص الحجز', 'Booking Summary')}</h3>
            {/* الشعار المربّع الملوّن */}
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 shrink-0" aria-hidden="true">
              <span className="w-2 h-2 rounded-2xs bg-[#0B7B5E]" />
              <span className="w-2 h-2 rounded-2xs bg-white" />
              <span className="w-2 h-2 rounded-2xs bg-[#05382A]" />
              <span className="w-2 h-2 rounded-2xs bg-brand-yellow" />
            </div>
          </div>

          {/* محتويات تفاصيل الحجز */}
          <div className="p-5 space-y-3.5 text-xs">
            {/* المريض */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('المريض', 'Patient')}</span>
              <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                {isChild && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 shrink-0">
                    {tr('👶 طفل', '👶 Pediatric')}
                  </span>
                )}
                <span className="font-bold text-[#074C3A] truncate">
                  {patientName ? patientName : tr('[اسم المريض]', '[Patient Name]')}
                </span>
              </div>
            </div>

            {/* نوع الموعد */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('النوع', 'Type')}</span>
              <span className="font-bold text-[#074C3A]">{currentTypeLabel}</span>
            </div>

            {/* الطبيب */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('الطبيب', 'Doctor')}</span>
              <span className="font-bold text-[#074C3A]">
                {currentDoctor?.name ? formatDoctorName(currentDoctor.name, isAr) : tr('د. إسلام', 'Dr. Eslam')}
              </span>
            </div>

            {/* التاريخ */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('التاريخ', 'Date')}</span>
              <span dir="ltr" className="font-bold text-[#074C3A]">{appointmentDate || '02/11/2026'}</span>
            </div>

            {/* الساعة */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('الساعة', 'Time')}</span>
              <span className="font-bold text-[#074C3A]">{displayTime}</span>
            </div>

            {/* نوع الحضور */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('الحضور', 'Visit Type')}</span>
              <span className="font-bold text-[#074C3A]">
                {source === 'WALK_IN'
                  ? tr('بدون موعد (مباشر)', 'Walk-in (Direct)')
                  : tr('موعد مسبق', 'Scheduled')}
              </span>
            </div>

            {/* تنبيه المرض المزمن إن وجد */}
            {hasChronicDisease && selectedDiseasesLabels ? (
              <div className="p-2.5 rounded-xl bg-[#FFFDF0] border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in-50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  {tr(`مرض مزمن: ${selectedDiseasesLabels}`, `Chronic: ${selectedDiseasesLabels}`)}
                </span>
              </div>
            ) : null}

            <hr className="border-slate-100 my-2" />

            {/* سعر الكشف */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('سعر الكشف', 'Exam Fee')}</span>
              <span className={cn('font-black text-[#074C3A]', isExempt && 'line-through text-slate-300')}>
                {examinationFee} {tr('ج.م', 'EGP')}
              </span>
            </div>

            {/* الخصم (إن وجد) */}
            {!isExempt && discount > 0 && (
              <div className="flex items-center justify-between text-rose-600 font-bold">
                <span className="font-semibold text-rose-500">{tr('الخصم', 'Discount')}</span>
                <span>-{discount} {tr('ج.م', 'EGP')}</span>
              </div>
            )}

            {/* الصافي المطلوب بعد الخصم */}
            {!isExempt && discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">{tr('المطلوب', 'Net Total')}</span>
                <span className="font-black text-[#0B7B5E]">{netFee} {tr('ج.م', 'EGP')}</span>
              </div>
            )}

            {/* المدفوع */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{tr('المدفوع', 'Paid')}</span>
              <span className="font-black text-[#074C3A]">{paidAmount} {tr('ج.م', 'EGP')}</span>
            </div>

            {/* شارة الإعفاء من الرسوم إن وجدت */}
            {isExempt && (
              <div className="p-2.5 rounded-xl bg-[#FFFDF0] border border-amber-300 text-amber-900 text-[11px] font-bold text-center animate-in fade-in-50">
                {tr('معفى من الرسوم', 'Fee Exempt')} — {getExemptionReasonLabel(exemptionReason, isAr)}
              </div>
            )}

            {/* المتبقي */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-bold">{tr('المتبقي', 'Remaining')}</span>
              <span className="font-black text-sm text-[#074C3A]">{remainingAmount} {tr('ج.م', 'EGP')}</span>
            </div>

            {/* أزرار الإجراءات */}
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tr('جاري الحفظ...', 'Saving...')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{tr('تأكيد وحفظ الحجز', 'Confirm & Save Booking')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                {tr('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. الشريط العائم السفلي على شاشات الموبايل (Mobile Sticky Bottom Bar) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-40 shadow-xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#074C3A] truncate">
            {patientName ? `${patientName} · ` : ''}{currentTypeLabel} · {displayTime}
          </p>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {isExempt
              ? tr('معفى من الرسوم', 'Fee Exempt')
              : tr(`المتبقي: ${remainingAmount} ج.م`, `Remaining: ${remainingAmount} EGP`)}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2.5 px-5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? tr('جاري الحفظ...', 'Saving...') : tr('تأكيد الحجز', 'Confirm Booking')}
        </button>
      </div>
    </>
  );
}
