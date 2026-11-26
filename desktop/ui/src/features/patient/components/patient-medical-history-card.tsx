'use client';

import React from 'react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { PatientDetails } from '../types/patient';

interface PatientMedicalHistoryCardProps {
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

export function PatientMedicalHistoryCard({ details }: PatientMedicalHistoryCardProps) {
  const { isAr, tr } = useAppLocale();
  const patient = details.patient;
  const chronicList = patient.chronicConditions || [];
  const hasChronic = chronicList.length > 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs text-start select-none">
      <h3 className="text-base font-black text-[#074C3A] mb-4 pb-3 border-b border-slate-100">
        {tr('التاريخ المرضي', 'Medical History')}
      </h3>

      <div className="space-y-4 text-xs font-bold">
        {/* هل يعاني من مرض مزمن */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">{tr('هل يعاني من مرض مزمن؟', 'Has chronic condition?')}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              hasChronic
                ? 'bg-[#074C3A] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {hasChronic ? tr('نعم', 'Yes') : tr('لا', 'No')}
          </span>
        </div>

        {/* قائمة الأمراض المزمنة بالشارات الصفراء */}
        {hasChronic && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chronicList.map((disease, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-xl bg-[#FEF08A] text-[#854D0E] font-black text-xs shadow-2xs"
              >
                {formatChronicLabel(disease, isAr)}
              </span>
            ))}
          </div>
        )}

        {/* الأدوية المعتادة */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-slate-400 block mb-1">{tr('الأدوية المعتادة:', 'Regular Medications:')}</span>
          <p className="text-slate-700 font-medium leading-relaxed">
            {hasChronic
              ? tr('أدوية الضغط والسكري المنتظمة', 'Regular hypertension and diabetes medications')
              : tr('لا توجد أدوية مزمنة مسجلة', 'No chronic medications recorded')}
          </p>
        </div>
      </div>
    </div>
  );
}

