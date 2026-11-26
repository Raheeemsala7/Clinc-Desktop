'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { PatientDetails } from '../types/patient';

interface PatientHeroBannerProps {
  details: PatientDetails;
}

const CHRONIC_EN_MAP: Record<string, string> = {
  diabetes: 'Diabetes',
  السكر: 'Diabetes',
  hypertension: 'Hypertension',
  الضغط: 'Hypertension',
  heart: 'Heart Disease',
  القلب: 'Heart Disease',
  allergy: 'Allergy',
  الحساسية: 'Allergy',
  asthma: 'Asthma',
  الربو: 'Asthma',
  kidney: 'Kidney Disease',
  الكلى: 'Kidney Disease',
  thyroid: 'Thyroid',
  'الغدة الدرقية': 'Thyroid',
  other: 'Other',
  أخرى: 'Other',
};

function formatChronicLabel(condition: string, isAr: boolean): string {
  if (isAr) return condition;
  if (condition.startsWith('أخرى:')) {
    return `Other: ${condition.slice('أخرى:'.length).trim()}`;
  }
  return CHRONIC_EN_MAP[condition] || condition;
}

export function PatientHeroBanner({ details }: PatientHeroBannerProps) {
  const { isAr, tr } = useAppLocale();
  const patient = details.patient;
  const chronicList = patient.chronicConditions || [];
  const hasChronic = chronicList.length > 0;
  const firstLetter = patient.fullName?.trim()?.charAt(0) || tr('م', 'P');
  const fileNumber = (patient as any).fileNumber
    ? tr(`ملف #${(patient as any).fileNumber}`, `File #${(patient as any).fileNumber}`)
    : patient.id
    ? tr(`ملف #${patient.id.slice(-4)}`, `File #${patient.id.slice(-4)}`)
    : '';

  return (
    <div className="bg-[#074C3A] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-800/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 select-none">
      {/* الجانب الأيمن: الأيقونة الدائرية الصفراء + الاسم والبيانات الأساسية */}
      <div className="flex items-center gap-4">
        {/* الأيقونة الدائرية الصفراء الكبيرة مطابقة للتصميم */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#EAB308] text-[#074C3A] flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-md">
          {firstLetter}
        </div>

        <div className="space-y-1.5 text-start">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {patient.fullName}
          </h1>

          <div className="text-xs sm:text-sm text-slate-300 font-sans flex items-center gap-2 flex-wrap">
            <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md text-slate-200">
              {fileNumber}
            </span>
            <span>·</span>
            <span>{patient.age ? tr(`${patient.age} سنة`, `${patient.age} yrs`) : ''}</span>
            <span>·</span>
            <span dir="ltr">{patient.phone}</span>
            <span>·</span>
            <span>{patient.gender === 'MALE' ? tr('ذكر', 'Male') : tr('أنثى', 'Female')}</span>
          </div>
        </div>
      </div>

      {/* الجانب الأيسر: بطاقة المرض المزمن إذا كان المريض يعاني من أمراض مزمنة */}
      {hasChronic && (
        <div className="bg-[#EAB308] text-[#074C3A] rounded-2xl p-4 sm:p-4.5 min-w-[180px] shadow-sm shrink-0 border border-yellow-300">
          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm mb-1 text-[#074C3A]">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>{tr('مرض مزمن', 'Chronic Condition')}</span>
          </div>
          <p className="text-xs font-bold text-slate-900 leading-tight">
            {chronicList.map((c) => formatChronicLabel(c, isAr)).join(isAr ? '، ' : ', ')}
          </p>
        </div>
      )}
    </div>
  );
}

