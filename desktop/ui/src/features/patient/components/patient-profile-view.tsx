'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight, Plus, Edit2, Trash2, Pill, Printer, FileText } from 'lucide-react';
import { PatientDetails, Patient } from '../types/patient';
import { PatientHeroBanner } from './patient-hero-banner';
import { PatientMetricCards } from './patient-metric-cards';
import { PatientPersonalInfoCard } from './patient-personal-info-card';
import { PatientMedicalHistoryCard } from './patient-medical-history-card';
import { PatientAttachmentsCard } from './patient-attachments-card';
import { PatientVisitsTable } from './patient-visits-table';
import { PatientNotesCard } from './patient-notes-card';
import { DeletePatientModal } from './delete-patient-modal';
import { EditPatientModal } from './edit-patient-modal';

interface PatientProfileViewProps {
  details: PatientDetails;
}

type TabType = 'overview' | 'visits' | 'prescriptions' | 'payments' | 'attachments' | 'notes';

export function PatientProfileView({ details }: PatientProfileViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('visits');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const backUrl = pathname?.includes('view-patients') ? '/dashboard/view-patients' : '/dashboard/patients';

  const patient = details.patient;
  const patientAsItem: Patient = {
    id: patient.id,
    fullName: patient.fullName,
    phone: patient.phone,
    gender: patient.gender,
    age: patient.age,
    dateOfBirth: patient.dateOfBirth || undefined,
    address: patient.address || undefined,
    occupation: patient.occupation || undefined,
    chronicConditions: patient.chronicConditions,
  };

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'visits', label: `الزيارات (${details.previousAppointments?.length || 0})` },
    { id: 'prescriptions', label: `الروشتات الطبية (${details.prescriptions?.length || 0})` },
    { id: 'payments', label: 'المدفوعات' },
    { id: 'attachments', label: 'المرفقات' },
    { id: 'notes', label: 'ملاحظات' },
  ];

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* 1. الشريط العلوي: العودة للمرضى + أزرار الإجراءات */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        {/* أزرار الإجراءات على اليسار */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/appointments/new?patientId=${patient.id}`}
            className="h-10 px-4 rounded-xl bg-[#0040D8] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>حجز جديد</span>
          </Link>

          {details.previousAppointments && details.previousAppointments[0] && (
            <Link
              href={`/dashboard/examination/${details.previousAppointments[0].id}`}
              className="h-10 px-3.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-[#0040D8] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="فتح استمارة كشف المريض الكاملة"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>استمارة الكشف 📋</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>تعديل البيانات</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="h-10 px-3.5 rounded-xl border border-rose-200 bg-[#FFF5F5] hover:bg-rose-100 text-[#E11D48] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>حذف</span>
          </button>
        </div>

        {/* زر العودة للمرضى على اليمين */}
        <Link
          href={backUrl}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <span>العودة للمرضى</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* 2. بطاقة معلومات المريض الرئيسية (Hero Banner) */}
      <PatientHeroBanner details={details} />

      {/* 3. بطاقات الإحصائيات الأربع (KPI Metrics) */}
      <PatientMetricCards details={details} />

      {/* 4. التقسيم الرئيسي (عمودين متوازيين) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* العمود الأيمن (البيانات الشخصية والطبية والمرفقات) */}
        <div className="lg:col-span-4 space-y-5">
          <PatientPersonalInfoCard details={details} />
          <PatientMedicalHistoryCard details={details} />
          <PatientAttachmentsCard details={details} />
        </div>

        {/* العمود الأيسر (التبويبات وجدول الزيارات والملاحظات) */}
        <div className="lg:col-span-8 space-y-5">
          {/* بطاقة التبويبات والمحتوى */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            {/* شريط ألسنة التبويب */}
            <div className="flex items-center gap-4 px-6 pt-4 border-b border-slate-100 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 font-bold text-xs transition-all cursor-pointer whitespace-nowrap relative ${
                      isActive
                        ? 'text-[#0040D8] font-black'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0040D8] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* محتوى التبويب */}
            <div className="p-4 sm:p-5">
              {activeTab === 'visits' && (
                <PatientVisitsTable visits={details.previousAppointments || []} />
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {(!details.prescriptions || details.prescriptions.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl">
                      لا توجد روشتات علاجية مسجلة سابقة لهذا المريض
                    </div>
                  ) : (
                    details.prescriptions.map((rx, idx) => (
                      <div
                        key={rx.id || idx}
                        className="bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0040D8] flex items-center justify-center">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-[#0A164E]">
                                روشتة علاجية #{details.prescriptions!.length - idx}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('ar-EG') : '—'} · الطبيب: {rx.doctorName || 'د. إسلام'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {rx.visitId && (
                              <Link
                                href={`/dashboard/examination/${rx.visitId}?tab=prescription`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0040D8] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة ومعاينة الروشتة</span>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* جدول الأدوية */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-start text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <th className="py-2 px-3 text-start">الدواء</th>
                                <th className="py-2 px-3 text-center">الجرعة</th>
                                <th className="py-2 px-3 text-center">التكرار</th>
                                <th className="py-2 px-3 text-center">المدة</th>
                                <th className="py-2 px-3 text-start">تعليمات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {rx.items?.map((item: any, i: number) => (
                                <tr key={item.id || i} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-bold text-[#0A164E] font-mono">{item.drugName}</td>
                                  <td className="py-2 px-3 text-center font-bold text-slate-700">{item.dose || '—'}</td>
                                  <td className="py-2 px-3 text-center text-slate-600">{item.frequency || '—'}</td>
                                  <td className="py-2 px-3 text-center text-slate-600">{item.duration || '—'}</td>
                                  <td className="py-2 px-3 text-slate-500">{item.instructions || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {rx.notes && (
                          <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                            <span className="font-bold text-slate-800">ملاحظات الطبيب: </span>
                            <span>{rx.notes}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="p-4 text-center text-xs text-slate-400">
                  عرض موجز شامل لكافة التعاملات السابقة للمريض في العيادة
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="p-4 text-center text-xs text-slate-400">
                  إجمالي المبالغ المسددة {details.financialSummary.totalPaid} ج.م والمتبقي{' '}
                  {details.financialSummary.outstandingBalance} ج.م
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="p-4 text-center text-xs text-slate-400">
                  يمكن استعراض كافة المرفقات وصور الأشعة من القائمة الجانبية أو من تبويب المرفقات
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="p-4 text-center text-xs text-slate-400">
                  انظر قسم الملاحظات أدناه لإضافة واستعراض ملاحظات الاستقبال والطبيب
                </div>
              )}
            </div>
          </div>

          {/* قسم ملاحظات الطبيب والاستقبال */}
          <PatientNotesCard
            notes={details.notes}
            patientId={patient.id}
          />
        </div>
      </div>

      {/* مودال الحذف النهائي / الأرشفة */}
      <DeletePatientModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        patient={patientAsItem}
        onSuccess={() => router.push('/dashboard/patients')}
      />

      {/* مودال تعديل بيانات المريض */}
      <EditPatientModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        patient={patientAsItem}
      />
    </div>
  );
}

