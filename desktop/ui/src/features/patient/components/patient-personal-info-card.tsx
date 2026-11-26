'use client';

import React from 'react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { PatientDetails } from '../types/patient';

interface PatientPersonalInfoCardProps {
  details: PatientDetails;
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

export function PatientPersonalInfoCard({ details }: PatientPersonalInfoCardProps) {
  const { tr } = useAppLocale();
  const patient = details.patient;

  const maritalStatusLabel =
    patient.maritalStatus === 'SINGLE'
      ? tr('أعزب', 'Single')
      : patient.maritalStatus === 'WIDOWED'
      ? tr('أرمل / أرملة', 'Widowed')
      : patient.maritalStatus === 'DIVORCED'
      ? tr('مطلق / مطلقة', 'Divorced')
      : tr('متزوج', 'Married');

  const rows = [
    { label: tr('رقم الملف', 'File Number'), value: patient.fileNumber ? `#${patient.fileNumber}` : `#${patient.id?.slice(-4)}`, isLtr: true },
    { label: tr('الاسم الكامل', 'Full Name'), value: patient.fullName },
    { label: tr('تاريخ الميلاد', 'Date of Birth'), value: formatDate(patient.dateOfBirth), isLtr: true },
    { label: tr('النوع', 'Gender'), value: patient.gender === 'MALE' ? tr('ذكر', 'Male') : tr('أنثى', 'Female') },
    { label: tr('الحالة الاجتماعية', 'Marital Status'), value: maritalStatusLabel },
    { label: tr('الهاتف', 'Phone'), value: patient.phone, isLtr: true },
    { label: tr('الوظيفة', 'Occupation'), value: patient.occupation || '—' },
    { label: tr('العنوان', 'Address'), value: patient.address || '—' },
    { label: tr('تاريخ التسجيل', 'Registration Date'), value: formatDate(patient.createdAt), isLtr: true },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs text-start select-none">
      <h3 className="text-base font-black text-[#074C3A] mb-4 pb-3 border-b border-slate-100">
        {tr('البيانات الشخصية', 'Personal Information')}
      </h3>

      <div className="space-y-3.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-bold">{row.label}</span>
            <span
              dir={row.isLtr ? 'ltr' : undefined}
              className={`font-black text-[#074C3A] ${
                row.isLtr ? 'font-mono' : ''
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

