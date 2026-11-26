'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User, Stethoscope, DollarSign, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateAppointmentAction, deleteAppointmentAction } from '../apis/appointment.action';
import { useDoctorsQuery } from '../hooks/appointments.hook';
import { getLocalizedAppointmentTypes } from '../constants/booking.constant';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patientName: string;
    doctorId: string;
    doctorName?: string;
    type: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    notes?: string;
    startTime?: string;
  };
  onSuccess?: () => void;
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: EditAppointmentModalProps) {
  const { isAr, dir, tr } = useAppLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: doctorsData } = useDoctorsQuery();
  const doctors = doctorsData || [];
  const appointmentTypes = getLocalizedAppointmentTypes(isAr);

  const [selectedDoctorId, setSelectedDoctorId] = useState(appointment.doctorId || '');
  const [selectedType, setSelectedType] = useState(appointment.type || 'EXAMINATION');
  const [totalAmount, setTotalAmount] = useState<number>(appointment.totalAmount || 0);
  const [paidAmount, setPaidAmount] = useState<number>(appointment.paidAmount || 0);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedDoctorId(appointment.doctorId || '');
    setSelectedType(appointment.type || 'EXAMINATION');
    setTotalAmount(appointment.totalAmount || 0);
    setPaidAmount(appointment.paidAmount || 0);
    setNotes(appointment.notes || '');
  }, [appointment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateAppointmentAction(appointment.id, {
        doctorId: selectedDoctorId,
        type: selectedType,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        notes,
      });

      if (res.status) {
        toast.success(
          tr(
            'تم تعديل بيانات الحجز وتحديث الطبيب بنجاح',
            'Appointment updated successfully'
          )
        );
        queryClient.invalidateQueries({ queryKey: ['queue'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['doctors'] });
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(res.message || tr('فشل تعديل الحجز', 'Failed to update appointment'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء تعديل الحجز', 'An error occurred while updating the appointment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        tr(
          `هل أنت متأكد من حذف حجز المريض (${appointment.patientName}) نهائياً؟\nسيتم حذف الحجز وإلغاء مبالغه من تقارير المدفوعات والخزينة.`,
          `Are you sure you want to permanently delete the appointment for (${appointment.patientName})?\nThe appointment and its payment records will be removed from reports and register.`
        )
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAppointmentAction(appointment.id);
      if (res.status) {
        toast.success(
          tr(
            'تم حذف الحجز وإلغاء مدفوعاته بنجاح',
            'Appointment and its payments deleted successfully'
          )
        );
        queryClient.invalidateQueries({ queryKey: ['queue'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(res.message || tr('فشل حذف الحجز', 'Failed to delete appointment'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حذف الحجز', 'An error occurred while deleting the appointment'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200" dir={dir}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F5EE] border border-[#D0E5DC] flex items-center justify-center text-[#0B7B5E] shadow-2xs">
              <Stethoscope className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#074C3A]">
                {tr('تعديل بيانات الحجز والطبيب', 'Edit Appointment & Doctor')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {tr('المريض:', 'Patient:')} <span className="font-bold text-slate-800">{appointment.patientName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* اختيار الطبيب المعالج */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {tr('الطبيب المعالج (تحويل الكشف إلى طبيب آخر):', 'Doctor (Transfer to another doctor):')}
            </label>
            <div className="relative">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* نوع الكشف */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {tr('نوع الكشف أو الإجراء:', 'Appointment Type / Procedure:')}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
            >
              {appointmentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* السعر والمدفوع */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {tr('سعر الكشف الإجمالي (ج.م):', 'Total Fee (EGP):')}
              </label>
              <input
                type="number"
                min="0"
                value={totalAmount === 0 ? '' : totalAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTotalAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {tr('المبلغ المسدد (ج.م):', 'Paid Amount (EGP):')}
              </label>
              <input
                type="number"
                min="0"
                value={paidAmount === 0 ? '' : paidAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPaidAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {tr('ملاحظات إضافية:', 'Additional Notes:')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr('أي ملاحظات تخص الحجز...', 'Any booking notes...')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
            />
          </div>

          {/* زر حذف الحجز بالكامل */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>
                {isDeleting
                  ? tr('جاري حذف الحجز...', 'Deleting appointment...')
                  : tr('حذف هذا الحجز نهائياً وإلغاء مدفوعاته', 'Permanently delete booking & cancel payments')}
              </span>
            </button>
          </div>

          {/* أزرار الإجراءات في الأسفل */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              {tr('إلغاء', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? tr('جاري الحفظ...', 'Saving...') : tr('حفظ التعديلات', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

