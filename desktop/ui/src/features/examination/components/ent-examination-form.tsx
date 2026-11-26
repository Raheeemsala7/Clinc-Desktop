'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { EntExaminationData } from '../types/ent-examination.types';
import { EntPaperSheet } from './ent-paper-sheet';
import { PrescriptionView, PrintablePrescriptionSlip } from './prescription-view';
import {
  saveAppointmentExaminationAction,
  finishAndSubmitExamAction,
} from '../apis/examination.action';
import { admitAppointmentAction } from '@/features/appointments/apis/appointment.action';
import { updatePatientAction } from '@/features/patient/apis/patient.action';

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
  const { isAr, dir, tr } = useAppLocale();
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
  const [rxPrintPageMode, setRxPrintPageMode] = useState<'all' | 'front' | 'back'>('all');
  const [externalRxPrintReq, setExternalRxPrintReq] = useState<{ seq: number; mode: 'full' | 'plain' } | null>(null);

  // الحالة الابتدائية لبيانات الفحص
  const existingExam = visit?.entExamination || {};
  const defaultFileNo =
    (patient as any)?.fileNumber ||
    existingExam.fileNo ||
    (patient?.id ? patient.id.slice(-4) : '101');

  const [livePatientFileNumber, setLivePatientFileNumber] = useState<string>(
    String((patient as any)?.fileNumber || defaultFileNo || '').trim()
  );
  const lastSyncedFileNoRef = useRef<string>(
    String((patient as any)?.fileNumber || existingExam.fileNo || '').trim()
  );
  const effectivePatient = useMemo(
    () =>
      patient
        ? { ...patient, fileNumber: livePatientFileNumber || (patient as any).fileNumber }
        : patient,
    [patient, livePatientFileNumber]
  );

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

  // اختصار لوحة المفاتيح Alt+R للتبديل السريع بين شيت الكشف والروشتة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R' || e.key === 'ق')) {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'exam' ? 'prescription' : 'exam'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // مزامنة فورية لـ File NO عند تحديث كود المريض من الخادم (router.refresh) أو عبر Socket.IO (الاستقبال <-> الطبيب)
  useEffect(() => {
    const incoming = String((patient as any)?.fileNumber || '').trim();
    if (incoming && incoming !== lastSyncedFileNoRef.current) {
      lastSyncedFileNoRef.current = incoming;
      setLivePatientFileNumber(incoming);
      setExamData((prev) => (prev.fileNo === incoming ? prev : { ...prev, fileNo: incoming }));
    }
  }, [(patient as any)?.fileNumber]);

  useEffect(() => {
    const patientId = patient?.id || (patient as any)?._id;
    if (!patientId) return;

    const onPatientUpdated = (e: Event) => {
      const detail = (e as CustomEvent<any>)?.detail;
      if (!detail || detail.patientId !== patientId) return;
      const incoming = String(detail.fileNumber ?? detail.code ?? '').trim();
      if (!incoming || incoming === lastSyncedFileNoRef.current) return;

      lastSyncedFileNoRef.current = incoming;
      setLivePatientFileNumber(incoming);
      setExamData((prev) => (prev.fileNo === incoming ? prev : { ...prev, fileNo: incoming }));
      toast.info(
        tr(
          `تم تحديث كود المريض إلى #${incoming}`,
          `Patient file # updated to #${incoming}`
        )
      );
      router.refresh();
    };

    window.addEventListener('clinic:patient-updated', onPatientUpdated);
    return () => window.removeEventListener('clinic:patient-updated', onPatientUpdated);
  }, [patient?.id, (patient as any)?._id, router, tr]);

  // حفظ كود المريض فوراً في ملف المريض عند تعديل حقل File NO في استمارة الكشف وبث التحديث للجميع
  const handleFileNoCommit = async (rawValue: string) => {
    const nextCode = String(rawValue || '').trim();
    const patientId = patient?.id || (patient as any)?._id;
    if (!nextCode) {
      if (lastSyncedFileNoRef.current) {
        setExamData((prev) => ({ ...prev, fileNo: lastSyncedFileNoRef.current }));
      }
      return;
    }
    if (!patientId || nextCode === lastSyncedFileNoRef.current) {
      return;
    }

    const prevSynced = lastSyncedFileNoRef.current;
    lastSyncedFileNoRef.current = nextCode;
    setLivePatientFileNumber(nextCode);

    try {
      const res = await updatePatientAction(patientId, { fileNumber: nextCode });
      if (res.status) {
        toast.success(
          tr(
            `تم تحديث كود المريض إلى #${nextCode}`,
            `Patient file # updated to #${nextCode}`
          )
        );
        router.refresh();
      } else {
        lastSyncedFileNoRef.current = prevSynced;
        setLivePatientFileNumber(prevSynced);
        setExamData((prev) => ({ ...prev, fileNo: prevSynced }));
        toast.error(res.message || tr('تعذر تحديث كود المريض', 'Failed to update patient file #'));
      }
    } catch {
      lastSyncedFileNoRef.current = prevSynced;
      setLivePatientFileNumber(prevSynced);
      setExamData((prev) => ({ ...prev, fileNo: prevSynced }));
      toast.error(
        tr(
          'تعذر الاتصال بالخادم لتحديث كود المريض',
          'Could not connect to server to update patient file #'
        )
      );
    }
  };

  // إدخال المريض وبدء الكشف
  const handleAdmit = async () => {
    const targetApptId = appointment?.id || appointment?._id || '';
    if (!targetApptId) return;
    setIsAdmitting(true);
    try {
      const res = await admitAppointmentAction(targetApptId);
      if (res.status) {
        toast.success(
          tr('تم إدخال المريض وبدء الكشف بنجاح 🚪', 'Patient admitted and examination started 🚪')
        );
        setCurrentStatus('IN_PROGRESS');
        router.refresh();
      } else {
        toast.error(res.message || tr('فشل إدخال المريض', 'Failed to admit patient'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء إدخال المريض', 'An error occurred while admitting patient'));
    } finally {
      setIsAdmitting(false);
    }
  };

  // دالة الحفظ
  const handleSave = async (showToast = true) => {
    const targetApptId = appointment?.id || appointment?._id || '';
    const targetVisitId = visit?.id || visit?._id || '';
    if (!targetApptId) {
      if (showToast) toast.error(tr('تعذر تحديد رقم الموعد', 'Unable to identify appointment ID'));
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
        if (showToast) toast.success(tr('تم حفظ التعديلات بنجاح', 'Changes saved successfully'));
        const savedCode = String(examData.fileNo || '').trim();
        if (savedCode) {
          lastSyncedFileNoRef.current = savedCode;
          setLivePatientFileNumber(savedCode);
        }
        setVersion((v) => v + 1);
        setLastSavedTime(
          new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
        return true;
      } else {
        if (showToast) toast.error(res.message || tr('فشل حفظ الكشف', 'Failed to save examination'));
        return false;
      }
    } catch {
      if (showToast) toast.error(tr('حدث خطأ أثناء الحفظ', 'An error occurred while saving'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // الانتقال إلى كتابة الروشتة مع حفظ التعديلات
  const handleProceedToPrescription = async () => {
    await handleSave(false);
    setActiveTab('prescription');
    toast.success(
      tr(
        'تم حفظ الكشف، يمكنك الآن كتابة الروشتة والأدوية',
        'Examination saved; you can now write the prescription'
      )
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // إنهاء الكشف وتسليم للاستقبال
  const handleFinish = async () => {
    if (
      !confirm(
        tr(
          'هل أنت متأكد من إنهاء الكشف وتسليم المريض للاستقبال؟ لن تتمكن من تعديل الحالة لاحقاً.',
          'Are you sure you want to finish the examination and send the patient to reception? You will not be able to edit this case later.'
        )
      )
    ) {
      return;
    }

    const targetApptId = appointment?.id || appointment?._id || '';
    const targetVisitId = visit?.id || visit?._id || '';
    if (!targetApptId) {
      toast.error(tr('تعذر تحديد رقم الموعد', 'Unable to identify appointment ID'));
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
        toast.success(
          tr(
            'تم إنهاء الكشف بنجاح ونقل المريض للاستقبال لتسوية الحساب',
            'Examination completed and patient transferred to reception for checkout'
          )
        );
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(res.message || tr('فشل اعتماد الكشف', 'Failed to finalize examination'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء إنهاء الكشف', 'An error occurred while finishing examination'));
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

  // طباعة الروشتة الطبية (كاملة، أو الوجه فقط، أو الظهر فقط، أو Duplex)
  const handlePrintRx = (
    mode: 'full' | 'plain' = 'full',
    pageMode: 'all' | 'front' | 'back' = 'all',
    useDuplex = false
  ) => {
    setRxPrintMode(mode);
    setRxPrintPageMode(pageMode);
    setPrintTarget('prescription');
    setTimeout(() => {
      const electronApi = (window as any).electronAPI;
      if (useDuplex && electronApi?.printCurrentWindow) {
        electronApi.printCurrentWindow({ duplexMode: 'longEdge' }).catch(() => window.print());
      } else {
        window.print();
      }
    }, 180);
  };

  return (
    <div dir={dir} className="space-y-6 pb-28 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* ============================================================== */}
      {/* 1. الشريط العلوي الموحّد والمبسّط (يُخفى تماماً عند الطباعة)       */}
      {/* ============================================================== */}
      <div className="bg-white px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs print:hidden flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* جانب البداية: زر العودة + بيانات المريض + حالة الحفظ */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title={tr('العودة لشاشة الطبيب', 'Back to Doctor Dashboard')}
          >
            {isAr ? (
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{tr('شاشة الطبيب', 'Doctor Dashboard')}</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm sm:text-base font-black text-[#074C3A]">
              {patient?.fullName || tr('مريض غير محدد', 'Unnamed Patient')}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              (
              {patient?.age
                ? tr(`${patient.age} سنة`, `${patient.age} yrs`)
                : tr('عمر غير محدد', 'Age N/A')}
              )
            </span>
            {(effectivePatient?.fileNumber || examData.fileNo) && (
              <span className="text-[11px] font-mono font-black text-[#0B7B5E] bg-[#E3F5EE] border border-[#CBE7DB] px-2 py-0.5 rounded-full">
                #{effectivePatient?.fileNumber || examData.fileNo}
              </span>
            )}
            {lastSavedTime && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold hidden lg:inline-block">
                {tr(`تم الحفظ ${lastSavedTime}`, `Saved ${lastSavedTime}`)}
              </span>
            )}
          </div>
        </div>

        {/* المنتصف: تبديل سلس ومرتب بين استمارة الكشف والروشتة */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-center md:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'exam'
                ? 'bg-white text-[#074C3A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className={`w-3.5 h-3.5 ${activeTab === 'exam' ? 'text-[#0B7B5E]' : 'text-slate-400'}`} />
            <span>{tr('1. استمارة الكشف الطبي', '1. Examination Form')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescription')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'prescription'
                ? 'bg-white text-[#074C3A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className={`w-3.5 h-3.5 ${activeTab === 'prescription' ? 'text-[#0B7B5E]' : 'text-slate-400'}`} />
            <span>{tr('2. الروشتة (Rx)', '2. Prescription (Rx)')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
              (examData.prescriptionItems?.length || 0) > 0
                ? 'bg-[#E3F5EE] text-[#0B7B5E]'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {examData.prescriptionItems?.length || 0}
            </span>
          </button>
        </div>

        {/* جانب النهاية: أزرار العمليات السريعة */}
        <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
          {(currentStatus === 'WAITING' || currentStatus === 'BOOKED') && (
            <button
              type="button"
              onClick={handleAdmit}
              disabled={isAdmitting}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <LogIn className={`w-3.5 h-3.5 ${isAdmitting ? 'animate-spin' : ''}`} />
              <span>
                {isAdmitting ? tr('إدخال...', 'Admitting...') : tr('إدخال للكشف 🚪', 'Admit Patient 🚪')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            title={tr('حفظ التعديلات (Alt+S)', 'Save changes (Alt+S)')}
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">
              {isSaving ? tr('حفظ...', 'Saving...') : tr('حفظ', 'Save')}
            </span>
          </button>

          <button
            type="button"
            onClick={
              activeTab === 'exam'
                ? handlePrintExam
                : () => setExternalRxPrintReq((prev) => ({ seq: (prev?.seq || 0) + 1, mode: 'plain' }))
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title={tr('طباعة (Alt+P)', 'Print (Alt+P)')}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{tr('طباعة', 'Print')}</span>
          </button>

          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing || isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isFinishing ? 'animate-spin' : ''}`} />
            <span>{tr('إنهاء الكشف ✓', 'Finish Exam ✓')}</span>
          </button>
        </div>
      </div>

      {/* 🚀 أيقونة ثابتة على حافة الشريط الجانبي للانتقال للروشتة تظهر فقط أثناء تفحص شيت الكشف */}
      {activeTab === 'exam' && (
        <aside
          aria-label={tr('الانتقال السريع للروشتة', 'Quick jump to prescription')}
          className={`fixed ${
            isAr
              ? 'right-3 sm:right-4 md:right-[calc(var(--sidebar-width,16rem)+1rem)]'
              : 'left-3 sm:left-4 md:left-[calc(var(--sidebar-width,16rem)+1rem)]'
          } top-1/2 -translate-y-1/2 z-40 print:hidden flex flex-col items-center`}
        >
          <button
            type="button"
            onClick={handleProceedToPrescription}
            title={tr('انتقال فوري لكتابة الروشتة (Alt+R)', 'Jump to Prescription (Alt+R)')}
            className="group relative flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 rounded-2xl bg-[#074C3A] hover:bg-[#0B7B5E] active:scale-95 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-white/90 ring-2 ring-emerald-500/20"
          >
            <Pill className="w-6 h-6 stroke-[2.2] text-[#45DBA5] animate-pulse" />
            <span className="text-[11px] font-black whitespace-nowrap">
              {tr('الروشتة 💊', 'Rx 💊')}
            </span>
            {(examData.prescriptionItems?.length || 0) > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono font-black">
                {examData.prescriptionItems?.length}
              </span>
            )}
            <span className="text-[8px] px-1 py-0.2 rounded bg-black/20 text-emerald-200 font-mono">
              Alt+R
            </span>
          </button>
        </aside>
      )}

      {/* ============================================================== */}
      {/* 2. محتوى التبويب النشط (على الشاشة)                           */}
      {/* ============================================================== */}

      {/* الحالة A: استمارة الكشف الطبي (مطابقة للأصل الورقي) */}
      <div className={activeTab === 'exam' ? 'space-y-6 print:hidden' : 'hidden'}>

        {/* شيت الكشف الورقي التفاعلي المطابق للصورة */}
        <EntPaperSheet
          examData={examData}
          patient={effectivePatient}
          doctor={doctor}
          onChange={setExamData}
          onFileNoCommit={handleFileNoCommit}
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
              <span>{tr('طباعة شيت الكشف (طبق الأصل)', 'Print Examination Sheet')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>{isSaving ? tr('جاري الحفظ...', 'Saving...') : tr('حفظ مسودة الكشف', 'Save Draft')}</span>
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
              <span>
                {isFinishing
                  ? tr('جاري الإنهاء...', 'Finishing...')
                  : tr('إنهاء الكشف وتسليم للاستقبال ✓', 'Finish & Send to Reception ✓')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPrescription}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <span>{tr('حفظ ومتابعة إلى كتابة الروشتة (Rx)', 'Save & Continue to Prescription (Rx)')}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* الحالة B: الروشتة الطبية (شاشة مستقلة ومركزة) */}
      <div className={activeTab === 'prescription' ? 'space-y-6 print:hidden' : 'hidden'}>
        <PrescriptionView
          examData={examData}
          patient={effectivePatient}
          doctor={doctor}
          onChange={setExamData}
          onBackToExam={() => {
            setActiveTab('exam');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSave={() => handleSave(true)}
          onFinish={handleFinish}
          onPrintRx={handlePrintRx}
          externalPrintRequest={externalRxPrintReq}
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
          patient={effectivePatient}
          doctor={doctor}
          onChange={setExamData}
          isPrintOnly={true}
        />
      </div>

      {/* هدف الطباعة 2: الروشتة الطبية الرسمية للمريض */}
      <div className={`hidden ${printTarget === 'prescription' ? 'print:block' : ''}`}>
        <PrintablePrescriptionSlip
          examData={examData}
          patient={effectivePatient}
          doctor={doctor}
          printMode={rxPrintMode}
          pageMode={rxPrintPageMode}
        />
      </div>
    </div>
  );
}
