'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  Printer,
  Stethoscope,
  Pill,
  FileText,
  User,
  Clock,
  Check,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { EntExaminationData } from '../types/ent-examination.types';
import { EntPaperSheet } from './ent-paper-sheet';
import { PrescriptionView, PrintablePrescriptionSlip } from './prescription-view';
import {
  saveAppointmentExaminationAction,
  finishAndSubmitExamAction,
} from '../apis/examination.action';
import { admitAppointmentAction } from '@/features/appointments/apis/appointment.action';

interface EntExaminationFormProps {
  appointment: any;
  patient: any;
  doctor: any;
  visit: any;
}

export function EntExaminationForm({
  appointment,
  patient,
  doctor,
  visit,
}: EntExaminationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get('tab');

  // الحالة النشطة: 'exam' (شيت الكشف الطبي) أو 'prescription' (الروشتة)
  const [activeTab, setActiveTab] = useState<'exam' | 'prescription'>(
    requestedTab === 'prescription' ? 'prescription' : 'exam'
  );

  // هدف الطباعة: 'exam' (شيت الكشف طبق الأصل الورقي) أو 'prescription' (الروشتة الطبية)
  const [printTarget, setPrintTarget] = useState<'exam' | 'prescription'>(
    requestedTab === 'prescription' ? 'prescription' : 'exam'
  );
  const [rxPrintMode, setRxPrintMode] = useState<'full' | 'plain'>('full');

  // الحالة الابتدائية لبيانات الفحص
  const existingExam = visit?.entExamination || {};
  const defaultFileNo =
    existingExam.fileNo ||
    (patient as any)?.fileNumber ||
    (patient?.id ? patient.id.slice(-4) : '101');

  const defaultMarital =
    existingExam.maritalStatus ||
    (patient?.maritalStatus === 'SINGLE'
      ? 'Single'
      : patient?.maritalStatus === 'WIDOWED'
      ? 'Widowed'
      : patient?.maritalStatus === 'DIVORCED'
      ? 'Divorced'
      : 'Married');

  const [examData, setExamData] = useState<EntExaminationData>({
    fileNo: defaultFileNo,
    date: existingExam.date || appointment?.clinicDate || new Date().toISOString().slice(0, 10),
    residence: existingExam.residence || patient?.address || '',
    maritalStatus: defaultMarital,
    work: existingExam.work || (patient as any)?.occupation || '',
    habits: existingExam.habits || '',
    smokingIndex: existingExam.smokingIndex || '',

    complaint: existingExam.complaint || visit?.complaint || '',
    historyOfPresentIllness: existingExam.historyOfPresentIllness || '',

    medicalProblems: existingExam.medicalProblems || (patient?.chronicConditions?.join('، ') || ''),
    drugs: existingExam.drugs || '',
    previousOperationsNotRelated: existingExam.previousOperationsNotRelated || '',
    previousOperationsRelated: existingExam.previousOperationsRelated || '',
    familyHistory: existingExam.familyHistory || '',

    ear: existingExam.ear || {
      rt: {},
      lt: {},
      weber: 'Centralized',
      vestibular: {},
    },

    nose: existingExam.nose || {
      rt: {},
      lt: {},
      deformity: '',
    },

    oropharynx: existingExam.oropharynx || {
      mallampati: 'Class I',
    },

    larynx: existingExam.larynx || {},

    investigations: existingExam.investigations || {},

    prescriptionItems: existingExam.prescriptionItems || [],
    treatmentNotes: existingExam.treatmentNotes || visit?.notes || '',

    diagnosis: existingExam.diagnosis || visit?.diagnosis || '',
    followUpDate: existingExam.followUpDate || '',
    operationNeeded: existingExam.operationNeeded || '',
    operativeData: existingExam.operativeData || '',
    secondVisitNotes: existingExam.secondVisitNotes || '',
    thirdVisitNotes: existingExam.thirdVisitNotes || '',
    additionalVisits: existingExam.additionalVisits || [],
  });

  const [version, setVersion] = useState<number>(visit?.version || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(appointment?.status || 'IN_PROGRESS');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // إدخال المريض وبدء الكشف
  const handleAdmit = async () => {
    const targetApptId = appointment?.id || appointment?._id || '';
    if (!targetApptId) return;
    setIsAdmitting(true);
    try {
      const res = await admitAppointmentAction(targetApptId);
      if (res.status) {
        toast.success('تم إدخال المريض وبدء الكشف بنجاح 🚪');
        setCurrentStatus('IN_PROGRESS');
        router.refresh();
      } else {
        toast.error(res.message || 'فشل إدخال المريض');
      }
    } catch {
      toast.error('حدث خطأ أثناء إدخال المريض');
    } finally {
      setIsAdmitting(false);
    }
  };

  // دالة الحفظ
  const handleSave = async (showToast = true) => {
    const targetApptId = appointment?.id || appointment?._id || '';
    const targetVisitId = visit?.id || visit?._id || '';
    if (!targetApptId) {
      if (showToast) toast.error('تعذر تحديد رقم الموعد');
      return false;
    }

    setIsSaving(true);
    try {
      const res = await saveAppointmentExaminationAction(
        targetApptId,
        targetVisitId,
        version,
        examData
      );
      if (res.status) {
        if (showToast) toast.success('تم حفظ التعديلات بنجاح');
        setVersion((v) => v + 1);
        setLastSavedTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        return true;
      } else {
        if (showToast) toast.error(res.message || 'فشل حفظ الكشف');
        return false;
      }
    } catch (e: any) {
      if (showToast) toast.error('حدث خطأ أثناء الحفظ');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // الانتقال إلى كتابة الروشتة مع حفظ التعديلات
  const handleProceedToPrescription = async () => {
    await handleSave(false);
    setActiveTab('prescription');
    toast.success('تم حفظ الكشف، يمكنك الآن كتابة الروشتة والأدوية');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // إنهاء الكشف وتسليم للاستقبال
  const handleFinish = async () => {
    if (!confirm('هل أنت متأكد من إنهاء الكشف وتسليم المريض للاستقبال؟ لن تتمكن من تعديل الحالة لاحقاً.')) {
      return;
    }

    const targetApptId = appointment?.id || appointment?._id || '';
    const targetVisitId = visit?.id || visit?._id || '';
    if (!targetApptId) {
      toast.error('تعذر تحديد رقم الموعد');
      return;
    }

    setIsFinishing(true);
    try {
      const res = await finishAndSubmitExamAction(
        targetApptId,
        targetVisitId,
        version,
        examData
      );
      if (res.status) {
        toast.success('تم إنهاء الكشف بنجاح ونقل المريض للاستقبال لتسوية الحساب');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(res.message || 'فشل اعتماد الكشف');
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء إنهاء الكشف');
    } finally {
      setIsFinishing(false);
    }
  };

  // طباعة شيت الكشف طبق الأصل
  const handlePrintExam = () => {
    setPrintTarget('exam');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // طباعة الروشتة الطبية
  const handlePrintRx = (mode: 'full' | 'plain' = 'full') => {
    setRxPrintMode(mode);
    setPrintTarget('prescription');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* ============================================================== */}
      {/* 1. الشريط العلوي العام (يُخفى تماماً عند الطباعة)               */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span>العودة لشاشة الطبيب</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base sm:text-lg font-black text-[#074C3A] tracking-wide">
              {patient?.fullName}
            </span>
            <span className="text-xs sm:text-sm text-slate-600 font-bold">
              ({patient?.age ? `${patient.age} سنة` : 'عمر غير محدد'})
            </span>
            {lastSavedTime && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold hidden md:inline-block">
                تم الحفظ {lastSavedTime}
              </span>
            )}
          </div>
        </div>

        {/* أزرار الإجراءات العلوية السريعة */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* زر إدخال المريض إذا كان لا يزال في الانتظار */}
          {(currentStatus === 'WAITING' || currentStatus === 'BOOKED') && (
            <button
              type="button"
              onClick={handleAdmit}
              disabled={isAdmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <LogIn className={`w-4 h-4 ${isAdmitting ? 'animate-spin' : ''}`} />
              <span>{isAdmitting ? 'جاري الإدخال...' : 'إدخال للكشف 🚪'}</span>
            </button>
          )}

          {/* زر إنهاء الكشف وتسليم للاستقبال متاح دائماً للطبيب */}
          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing || isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className={`w-4 h-4 ${isFinishing ? 'animate-spin' : ''}`} />
            <span>{isFinishing ? 'جاري الإنهاء...' : 'إنهاء الكشف ✓'}</span>
          </button>

          <button
            type="button"
            onClick={activeTab === 'exam' ? handlePrintExam : () => handlePrintRx('full')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{activeTab === 'exam' ? 'طباعة الكشف' : 'طباعة الروشتة'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. تبويبات الفصل: الكشف لوحده والروشتة لوحدها                  */}
      {/* ============================================================== */}
      <div className="bg-slate-100/80 p-2 rounded-2xl flex items-center gap-2 border border-slate-200 print:hidden">
        {/* التبويب 1: استمارة الكشف الطبي */}
        <button
          type="button"
          onClick={() => setActiveTab('exam')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer ${
            activeTab === 'exam'
              ? 'bg-white text-[#074C3A] shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Stethoscope className={`w-5 h-5 ${activeTab === 'exam' ? 'text-[#0B7B5E]' : 'text-slate-400'}`} />
          <span>1. استمارة الكشف الطبي (ENT Examination Sheet)</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold hidden sm:inline-block">
            متاح التعديل ✍️
          </span>
        </button>

        {/* التبويب 2: الروشتة الطبية */}
        <button
          type="button"
          onClick={() => setActiveTab('prescription')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer ${
            activeTab === 'prescription'
              ? 'bg-white text-[#074C3A] shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Pill className={`w-5 h-5 ${activeTab === 'prescription' ? 'text-[#0B7B5E]' : 'text-slate-400'}`} />
          <span>2. الروشتة الطبية (Prescription Rx)</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            (examData.prescriptionItems?.length || 0) > 0
              ? 'bg-[#E3F5EE] text-[#0B7B5E]'
              : 'bg-slate-200 text-slate-600'
          }`}>
            {examData.prescriptionItems?.length || 0} أدوية
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. محتوى التبويب النشط (على الشاشة)                           */}
      {/* ============================================================== */}

      {/* الحالة A: استمارة الكشف الطبي (مطابقة للأصل الورقي) */}
      <div className={activeTab === 'exam' ? 'space-y-6 print:hidden' : 'hidden'}>
        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              شيت الكشف مفتوح ومتاح لتعديل أي خانة في أي وقت. يتم الحفظ تلقائياً عند الانتقال للروشتة.
            </span>
          </div>
          <button
            type="button"
            onClick={handleProceedToPrescription}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B7B5E] text-white text-[11px] font-black hover:bg-[#09634C] transition-all cursor-pointer shadow-xs shrink-0"
          >
            <span>الانتقال للروشتة ➔</span>
          </button>
        </div>

        {/* شيت الكشف الورقي التفاعلي المطابق للصورة */}
        <EntPaperSheet
          examData={examData}
          patient={patient}
          doctor={doctor}
          onChange={setExamData}
        />

        {/* شريط الإجراءات في أسفل استمارة الكشف */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintExam}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>طباعة شيت الكشف (طبق الأصل)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ مسودة الكشف'}</span>
            </button>
          </div>

          {/* أزرار الحفظ والانتقال والإنهاء */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing || isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isFinishing ? 'جاري الإنهاء...' : 'إنهاء الكشف وتسليم للاستقبال ✓'}</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPrescription}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <span>حفظ ومتابعة إلى كتابة الروشتة (Rx)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* الحالة B: الروشتة الطبية (شاشة مستقلة ومركزة) */}
      <div className={activeTab === 'prescription' ? 'space-y-6 print:hidden' : 'hidden'}>
        <PrescriptionView
          examData={examData}
          patient={patient}
          doctor={doctor}
          onChange={setExamData}
          onBackToExam={() => {
            setActiveTab('exam');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSave={() => handleSave(true)}
          onFinish={handleFinish}
          onPrintRx={handlePrintRx}
          isSaving={isSaving}
          isFinishing={isFinishing}
        />
      </div>

      {/* ============================================================== */}
      {/* 4. قسم الطباعة المخصص (@media print)                           */}
      {/* ============================================================== */}

      {/* هدف الطباعة 1: شيت الكشف الطبي طبق الأصل (الصفحة 1 والصفحة 2) */}
      <div className={`hidden ${printTarget === 'exam' ? 'print:block' : ''}`}>
        <EntPaperSheet
          examData={examData}
          patient={patient}
          doctor={doctor}
          onChange={setExamData}
          isPrintOnly={true}
        />
      </div>

      {/* هدف الطباعة 2: الروشتة الطبية الرسمية للمريض */}
      <div className={`hidden ${printTarget === 'prescription' ? 'print:block' : ''}`}>
        <PrintablePrescriptionSlip
          examData={examData}
          patient={patient}
          doctor={doctor}
          printMode={rxPrintMode}
        />
      </div>
    </div>
  );
}
