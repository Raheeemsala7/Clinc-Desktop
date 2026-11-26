import React from 'react';
import Link from 'next/link';
import { Users, AlertTriangle } from 'lucide-react';
import { getServerLocaleInfo } from '@/i18n/server-locale';
import { getPatientsListApi, GetPatientsParams } from '../apis/patient.api';
import { TablePatientsRowActions } from './table-patients-row-actions';

interface TablePatientsReceptionProps {
  searchParams?: Promise<GetPatientsParams> | GetPatientsParams;
}

/**
 * دالة مساعدة لتنسيق التاريخ إلى DD/MM/YYYY
 */
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

/**
 * دالة استخراج أول حرف من اسم المريض للأيقونة الدائرية
 */
function getFirstLetter(name: string, fallback: string): string {
  if (!name) return fallback;
  const clean = name.trim();
  return clean.charAt(0) || fallback;
}

/**
 * جدول عرض المرضى لشاشة الاستقبال (Server Component)
 */
export async function TablePatientsReception({ searchParams }: TablePatientsReceptionProps = {}) {
  const { dir, tr } = await getServerLocaleInfo();
  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const page = Number(resolvedParams.page || 1);
  const pageSize = 10;

  const response = await getPatientsListApi({
    q: resolvedParams.q,
    page,
    pageSize,
    filter: resolvedParams.filter,
  });

  const patients = response.payload || [];
  const meta = response.meta || {
    page: 1,
    pageSize: 10,
    total: patients.length,
    totalPages: Math.ceil(patients.length / pageSize) || 1,
    hasNext: false,
    hasPrevious: false,
  };

  const total = meta.total || patients.length;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // في حالة عدم وجود مرضى
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center" dir={dir}>
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E3F5EE] border border-[#D0E5DC] flex items-center justify-center text-[#0B7B5E] mb-4 shadow-2xs">
            <Users className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="text-lg font-black text-[#074C3A] mb-2">
            {resolvedParams.q || resolvedParams.filter
              ? tr('لا توجد نتائج مطابقة لبحثك', 'No matching results found')
              : tr('لا يوجد مرضى مسجلون حتى الآن', 'No registered patients yet')}
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {resolvedParams.q || resolvedParams.filter
              ? tr(
                  'يرجى تجربة البحث بكلمة أخرى أو إلغاء الفلتر المحدد',
                  'Please try searching with another term or clear the active filter'
                )
              : tr(
                  'قم بالضغط على زر "مريض جديد" للبدء في فتح سجل طبي لمريض جديد في العيادة',
                  'Click "Add New Patient" to create a medical record for a new clinic patient'
                )}
          </p>
        </div>
      </div>
    );
  }

  // بناء أزرار الترقيم (Pagination)
  const totalPages = meta.totalPages || 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const buildPageUrl = (targetPage: number) => {
    const qp = new URLSearchParams();
    if (resolvedParams.q) qp.set('q', resolvedParams.q);
    if (resolvedParams.filter && resolvedParams.filter !== 'all') qp.set('filter', resolvedParams.filter);
    qp.set('page', String(targetPage));
    return `?${qp.toString()}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none" dir={dir}>
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs">
              <th className="py-4 px-6 text-start">{tr('المريض', 'Patient')}</th>
              <th className="py-4 px-6 text-start">{tr('التصنيف', 'Category')}</th>
              <th className="py-4 px-6 text-center">{tr('آخر زيارة', 'Last Visit')}</th>
              <th className="py-4 px-6 text-center">{tr('الزيارات', 'Visits')}</th>
              <th className="py-4 px-6 text-end">{tr('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {patients.map((patient) => {
              const hasChronic =
                patient.chronicConditions && patient.chronicConditions.length > 0;
              const isMale = patient.gender === 'MALE';

              return (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* 1. عمود المريض: الأيقونة الدائرية الكحلية + الاسم + العمر والهاتف */}
                  <td className="py-4 px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#074C3A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                        {getFirstLetter(patient.fullName, tr('م', 'P'))}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-[#074C3A] text-sm group-hover:text-[#0B7B5E] transition-colors">
                          {patient.fullName}
                        </h4>
                        <div className="text-xs text-slate-400 font-sans flex items-center gap-1.5 justify-start">
                          <span>{patient.age ? tr(`${patient.age} سنة`, `${patient.age} yrs`) : ''}</span>
                          {patient.phone && <span>·</span>}
                          <span dir="ltr">{patient.phone || ''}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. عمود التصنيف: شارة النوع + شارة المرض المزمن */}
                  <td className="py-4 px-6 text-start">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* شارة النوع */}
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          isMale
                            ? 'bg-[#E3F5EE] text-[#0B7B5E]'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {isMale ? tr('ذكر', 'Male') : tr('أنثى', 'Female')}
                      </span>

                      {/* شارة المرض المزمن */}
                      {hasChronic && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#FEFCE8] text-[#B45309] border border-[#FEF08A] text-xs font-bold flex items-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                          <span>{tr('مرض مزمن', 'Chronic Condition')}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. عمود تاريخ آخر زيارة */}
                  <td className="py-4 px-6 text-center text-xs text-slate-500 font-mono">
                    <span dir="ltr">{formatDate(patient.lastVisitDate)}</span>
                  </td>

                  {/* 4. عمود عدد الزيارات */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-black text-[#074C3A] font-sans">
                      {patient.visitCount ?? 0}
                    </span>
                  </td>

                  {/* 5. عمود أزرار الإجراءات */}
                  <td className="py-4 px-6 text-end">
                    <TablePatientsRowActions patient={patient} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* شريط ترقيم الصفحات (Pagination) أسفل الجدول مطابقة للصورة */}
      <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-bold bg-white">
        {/* عدد السجلات */}
        <div className="text-start">
          {tr(`عرض ${startItem}–${endItem} من [${total}]`, `Showing ${startItem}–${endItem} of ${total}`)}
        </div>

        {/* أزرار الصفحات */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 justify-center sm:justify-end">
            {pageNumbers.map((pNum) => {
              const isCurrent = pNum === page;
              return (
                <Link
                  key={pNum}
                  href={buildPageUrl(pNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-[#0B7B5E] text-white shadow-2xs font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

