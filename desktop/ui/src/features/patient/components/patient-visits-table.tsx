'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Pill } from 'lucide-react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { PatientVisitItem } from '../types/patient';

interface PatientVisitsTableProps {
  visits: PatientVisitItem[];
  onViewPrescription?: (visitId?: string | null, appointmentId?: string) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function PatientVisitsTable({ visits, onViewPrescription }: PatientVisitsTableProps) {
  const { tr } = useAppLocale();

  if (!visits || visits.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl">
        {tr(
          'لا توجد زيارات أو كشوفات مسجلة سابقة لهذا المريض',
          'No previous visits or examinations recorded for this patient'
        )}
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'FOLLOW_UP':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
            {tr('إعادة', 'Follow-up')}
          </span>
        );
      case 'OPERATION_FOLLOWUP':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold">
            {tr('متابعة عملية', 'Post-Op Follow-up')}
          </span>
        );
      case 'ENDOSCOPY':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold">
            {tr('منظار', 'Endoscopy')}
          </span>
        );
      case 'SURGERY':
      case 'POST_OPERATIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 text-xs font-bold">
            {tr('تدخل جراحي', 'Surgery')}
          </span>
        );
      case 'CONSULTATION':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
            {tr('استشارة', 'Consultation')}
          </span>
        );
      case 'LAB_TESTS_IMAGING':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold">
            {tr('منظار', 'Endoscopy')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold">
            {tr('كشف', 'Examination')}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-[#FEF08A] text-[#854D0E] text-xs font-bold shadow-2xs">
            {tr('في الانتظار', 'Waiting')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
            {tr('في الكشف', 'In Exam')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
            {tr('تم الكشف', 'Completed')}
          </span>
        );
      case 'BOOKED':
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold">
            {tr('مؤكد', 'Confirmed')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto select-none">
      <table className="w-full text-start border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold">
            <th className="py-3 px-4 text-start">{tr('التاريخ', 'Date')}</th>
            <th className="py-3 px-4 text-center">{tr('النوع', 'Type')}</th>
            <th className="py-3 px-4 text-center">{tr('الطبيب', 'Doctor')}</th>
            <th className="py-3 px-4 text-center">{tr('الحالة', 'Status')}</th>
            <th className="py-3 px-4 text-end">{tr('الرسوم', 'Fee')}</th>
            <th className="py-3 px-4 text-center">{tr('الإجراءات الطبية', 'Medical Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-bold">
          {visits.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
              {/* التاريخ */}
              <td className="py-3 px-4 text-start font-mono text-slate-600">
                <span dir="ltr">{formatDate(v.clinicDate || v.createdAt)}</span>
              </td>

              {/* النوع */}
              <td className="py-3 px-4 text-center">
                {getTypeBadge(v.type)}
              </td>

              {/* الطبيب */}
              <td className="py-3 px-4 text-center text-slate-700">
                {v.doctorName || tr('د. إسلام', 'Dr. Eslam')}
              </td>

              {/* الحالة */}
              <td className="py-3 px-4 text-center">
                {getStatusBadge(v.status)}
              </td>

              {/* الرسوم */}
              <td className="py-3 px-4 text-end">
                {v.paymentStatus === 'EXEMPT' ? (
                  <span className="text-emerald-600 font-black">{tr('معفي', 'Exempt')}</span>
                ) : (
                  <span className="text-[#074C3A] font-sans font-black">
                    {v.totalAmount} {tr('ج.م', 'EGP')}
                  </span>
                )}
              </td>

              {/* الإجراءات الطبية */}
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <Link
                    href={`/dashboard/examination/${v.id}`}
                    title={tr('عرض استمارة الفحص والكشف الطبي', 'View medical examination form')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E3F5EE] hover:bg-[#E3F5EE] text-[#0B7B5E] text-[11px] font-bold border border-[#D0E5DC]/60 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{tr('استمارة الكشف', 'Exam Form')}</span>
                  </Link>
                  {onViewPrescription ? (
                    <button
                      type="button"
                      onClick={() => onViewPrescription(v.visitId, v.id)}
                      title={tr('عرض وطباعة الروشتة الطبية مباشرة', 'View and print prescription directly')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>{tr('الروشتة (Rx)', 'Prescription (Rx)')}</span>
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/examination/${v.id}?tab=prescription`}
                      title={tr('عرض وطباعة الروشتة الطبية', 'View and print prescription')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>{tr('الروشتة (Rx)', 'Prescription (Rx)')}</span>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

