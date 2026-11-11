'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  EntExaminationData,
} from '../types/ent-examination.types';
import {
  EarAnatomyDiagram,
  NoseAnatomyDiagram,
  MallampatiSelector,
  LarynxVocalCordDiagram,
} from './ent-examination-diagrams';

interface EntPaperSheetProps {
  examData: EntExaminationData;
  patient: any;
  doctor?: any;
  onChange: (updater: (prev: EntExaminationData) => EntExaminationData) => void;
  isPrintOnly?: boolean;
}

/**
 * مكون حقل كتابة متعدد الأسطر بمظهر الشيت الورقي (خط منقط سفلي مع إمكانية النزول لسطر جديد تلقائياً)
 */
function PaperTextarea({
  value,
  onChange,
  className = '',
  placeholder = '',
  rows = 1,
  readOnly = false,
}: {
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.max(ref.current.scrollHeight, rows * 20)}px`;
    }
  }, [value, rows]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value || ''}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => {
        onChange?.(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      className={`w-full border-b border-dotted border-black bg-transparent px-1 focus:outline-none resize-none leading-snug overflow-hidden ${className}`}
    />
  );
}

/**
 * شيت الكشف الطبي الكامل لعيادة الأنف والأذن والحنجرة
 * مطابق 100% للأصل الورقي في الصورتين (الصفحة الأولى والصفحة الثانية)
 */
export function EntPaperSheet({
  examData,
  patient,
  doctor,
  onChange,
  isPrintOnly = false,
}: EntPaperSheetProps) {
  // تحديث حقل مباشر
  const setField = <K extends keyof EntExaminationData>(key: K, value: EntExaminationData[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  // تحديث فحص الأذن
  const updateEar = (side: 'rt' | 'lt', prop: string, val: string) => {
    onChange((prev) => ({
      ...prev,
      ear: {
        ...prev.ear,
        [side]: { ...prev.ear[side], [prop]: val },
      },
    }));
  };

  // تحديث فحص الاتزان
  const updateVestibular = (prop: string, val: string) => {
    onChange((prev) => ({
      ...prev,
      ear: {
        ...prev.ear,
        vestibular: { ...prev.ear.vestibular, [prop]: val },
      },
    }));
  };

  // تحديث فحص الأنف
  const updateNose = (side: 'rt' | 'lt', prop: string, val: string) => {
    onChange((prev) => ({
      ...prev,
      nose: {
        ...prev.nose,
        [side]: { ...prev.nose[side], [prop]: val },
      },
    }));
  };

  // تحديث فحص البلعوم
  const updateOropharynx = (prop: string, val: string) => {
    onChange((prev) => ({
      ...prev,
      oropharynx: { ...prev.oropharynx, [prop]: val },
    }));
  };

  // تحديث فحص الحنجرة والرقبة
  const updateLarynx = (prop: string, val: string) => {
    onChange((prev) => ({
      ...prev,
      larynx: { ...prev.larynx, [prop]: val },
    }));
  };

  // قائمة عناصر فحص الأذن
  const earItems = [
    { id: 'swelling', label: 'Swelling' },
    { id: 'tenderness', label: 'Tenderness' },
    { id: 'discharge', label: 'Discharge' },
    { id: 'rinne', label: 'Rinné' },
    { id: 'fistula', label: 'Fistula' },
    { id: 'deformity', label: 'Deformity' },
    { id: 'battleSign', label: 'Battle sign' },
    { id: 'facialPalsy', label: 'Facial palsy' },
    { id: 'others', label: 'Others' },
  ];

  // قائمة عناصر فحص الأنف
  const noseItems = [
    { id: 'septum', label: 'Septum' },
    { id: 'infTurbinate', label: 'Inf Turbinate' },
    { id: 'bleeders', label: 'Bleeders' },
    { id: 'discharge', label: 'Discharge' },
    { id: 'polypsGrade', label: 'Polyps: Grade' },
    { id: 'mass', label: 'Mass' },
    { id: 'eye', label: 'Eye' },
    { id: 'nasopharynx', label: 'Nasopharynx' },
  ];

  // قائمة عناصر فحص الحنجرة والرقبة
  const larynxItems = [
    { id: 'lymphNode', label: 'Lymph node' },
    { id: 'swelling', label: 'Swelling' },
    { id: 'mouresSign', label: "Moure's sign" },
    { id: 'thyroid', label: 'Thyroid' },
    { id: 'parotid', label: 'Parotid' },
    { id: 'submandibular', label: 'Submandibular' },
    { id: 'indirectLaryngoscope', label: 'Indirect laryngoscope' },
    { id: 'others', label: 'Others' },
  ];

  // قوائم الفحوصات المتعددة (Investigations: Present & Need)
  const presentList = examData.investigations?.presentList && examData.investigations.presentList.length > 0
    ? examData.investigations.presentList
    : (
        examData.investigations?.present
          ? [{ id: 'p1', name: examData.investigations.present, revealed: examData.investigations.presentRevealed || '' }]
          : [{ id: 'p1', name: '', revealed: '' }]
      );

  const needList = examData.investigations?.needList && examData.investigations.needList.length > 0
    ? examData.investigations.needList
    : (
        examData.investigations?.need
          ? [{ id: 'n1', name: examData.investigations.need, revealed: examData.investigations.needRevealed || '' }]
          : [{ id: 'n1', name: '', revealed: '' }]
      );

  const updatePresentItem = (index: number, field: 'name' | 'revealed', value: string) => {
    const updated = [...presentList];
    updated[index] = { ...updated[index], [field]: value };
    onChange((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        presentList: updated,
        present: updated[0]?.name || '',
        presentRevealed: updated[0]?.revealed || '',
      },
    }));
  };

  const addPresentItem = () => {
    const updated = [...presentList, { id: 'p_' + Date.now(), name: '', revealed: '' }];
    onChange((prev) => ({
      ...prev,
      investigations: { ...prev.investigations, presentList: updated },
    }));
  };

  const removePresentItem = (index: number) => {
    const updated = presentList.filter((_, i) => i !== index);
    const final = updated.length > 0 ? updated : [{ id: 'p_' + Date.now(), name: '', revealed: '' }];
    onChange((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        presentList: final,
        present: final[0]?.name || '',
        presentRevealed: final[0]?.revealed || '',
      },
    }));
  };

  const updateNeedItem = (index: number, field: 'name' | 'revealed', value: string) => {
    const updated = [...needList];
    updated[index] = { ...updated[index], [field]: value };
    onChange((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        needList: updated,
        need: updated[0]?.name || '',
        needRevealed: updated[0]?.revealed || '',
      },
    }));
  };

  const addNeedItem = () => {
    const updated = [...needList, { id: 'n_' + Date.now(), name: '', revealed: '' }];
    onChange((prev) => ({
      ...prev,
      investigations: { ...prev.investigations, needList: updated },
    }));
  };

  const removeNeedItem = (index: number) => {
    const updated = needList.filter((_, i) => i !== index);
    const final = updated.length > 0 ? updated : [{ id: 'n_' + Date.now(), name: '', revealed: '' }];
    onChange((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        needList: final,
        need: final[0]?.name || '',
        needRevealed: final[0]?.revealed || '',
      },
    }));
  };

  // قائمة الزيارات الإضافية المتعددة (Visits: 2nd, 3rd, 4th, 5th...)
  const getOrdinalLabel = (n: number) => {
    if (n === 2) return '2nd Visit:';
    if (n === 3) return '3rd Visit:';
    return `${n}th Visit:`;
  };

  const visitsList = examData.additionalVisits && examData.additionalVisits.length > 0
    ? examData.additionalVisits
    : [
        { id: 'v2', visitNumber: 2, label: '2nd Visit:', date: '', notes: examData.secondVisitNotes || '' },
      ];

  const updateVisit = (index: number, field: 'date' | 'notes', val: string) => {
    const updated = [...visitsList];
    updated[index] = { ...updated[index], [field]: val };
    onChange((prev) => ({
      ...prev,
      additionalVisits: updated,
      secondVisitNotes: updated[0]?.notes || '',
      thirdVisitNotes: updated[1]?.notes || '',
    }));
  };

  const addVisit = () => {
    const nextNum = visitsList.length + 2;
    const newVisit = {
      id: 'v_' + Date.now(),
      visitNumber: nextNum,
      label: getOrdinalLabel(nextNum),
      date: '',
      notes: '',
    };
    const updated = [...visitsList, newVisit];
    onChange((prev) => ({
      ...prev,
      additionalVisits: updated,
    }));
  };

  const removeVisit = (index: number) => {
    const updated = visitsList.filter((_, i) => i !== index).map((v, i) => ({
      ...v,
      visitNumber: i + 2,
      label: getOrdinalLabel(i + 2),
    }));
    onChange((prev) => ({
      ...prev,
      additionalVisits: updated,
      secondVisitNotes: updated[0]?.notes || '',
      thirdVisitNotes: updated[1]?.notes || '',
    }));
  };

  return (
    <div
      dir="ltr"
      className="w-full text-black font-serif select-text space-y-8 print:space-y-0 print:p-0 print:m-0"
    >

      {/* ============================================================== */}
      {/* 📄 الورقة الأولى (Sheet 1) - مطابقة تماماً للصورة الأولى         */}
      {/* ============================================================== */}
      <div className="sheet-page-1 bg-white border-2 border-black p-4 sm:p-5 rounded-none shadow-sm space-y-3 print:border-2 print:border-black print:p-4 print:shadow-none print:w-full">
        {/* الترويسة العلوية: File NO | Name | Date */}
        <div className="border border-black grid grid-cols-12 text-[13px]">
          <div className="col-span-3 border-r border-black p-1.5 flex items-baseline gap-1">
            <span className="font-bold uppercase tracking-tight shrink-0">File NO:</span>
            <input
              type="text"
              value={examData.fileNo || ''}
              onChange={(e) => setField('fileNo', e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[13px] font-mono font-bold focus:outline-none"
            />
          </div>
          <div className="col-span-6 border-r border-black p-1.5 flex items-baseline gap-1">
            <span className="font-bold uppercase tracking-tight shrink-0">Name:</span>
            <span className="font-black text-[14px] text-black">
              {patient?.fullName || '................................................'}
            </span>
          </div>
          <div className="col-span-3 p-1.5 flex items-baseline gap-1">
            <span className="font-bold uppercase tracking-tight shrink-0">Date:</span>
            <input
              type="text"
              value={examData.date || ''}
              onChange={(e) => setField('date', e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[13px] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* سطر البيانات الديموغرافية الأول: Age | Sex | Residence | Marital states */}
        <div className="grid grid-cols-12 gap-2 text-[12px] pt-1">
          <div className="col-span-2 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Age:</span>
            <span className="w-full border-b border-dotted border-black px-1 font-bold">
              {patient?.age ? `${patient.age} Y` : '......'}
            </span>
          </div>
          <div className="col-span-2 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Sex:</span>
            <span className="w-full border-b border-dotted border-black px-1 font-bold">
              {patient?.gender === 'MALE' ? 'Male' : patient?.gender === 'FEMALE' ? 'Female' : '......'}
            </span>
          </div>
          <div className="col-span-4 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Residence:</span>
            <PaperTextarea
              rows={1}
              value={examData.residence || ''}
              onChange={(val) => setField('residence', val)}
              className="text-[12px]"
            />
          </div>
          <div className="col-span-4 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Marital states:</span>
            <PaperTextarea
              rows={1}
              value={examData.maritalStatus || ''}
              onChange={(val) => setField('maritalStatus', val)}
              className="text-[12px]"
            />
          </div>
        </div>

        {/* سطر البيانات الديموغرافية الثاني: Work | Habits | Smoking index | Tele */}
        <div className="grid grid-cols-12 gap-2 text-[12px]">
          <div className="col-span-3 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Work:</span>
            <PaperTextarea
              rows={1}
              value={examData.work || ''}
              onChange={(val) => setField('work', val)}
              className="text-[12px]"
            />
          </div>
          <div className="col-span-3 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Habits:</span>
            <PaperTextarea
              rows={1}
              value={examData.habits || ''}
              onChange={(val) => setField('habits', val)}
              className="text-[12px]"
            />
          </div>
          <div className="col-span-3 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Smoking index:</span>
            <PaperTextarea
              rows={1}
              value={examData.smokingIndex || ''}
              onChange={(val) => setField('smokingIndex', val)}
              className="text-[12px]"
            />
          </div>
          <div className="col-span-3 flex items-baseline gap-1">
            <span className="font-bold shrink-0">Tele:</span>
            <span className="w-full border-b border-dotted border-black px-1 font-mono text-[11px] font-bold">
              {patient?.phone || '............'}
            </span>
          </div>
        </div>

        {/* Complaint (الشكوى الرئيسية) */}
        <div className="space-y-1 pt-1">
          <span className="font-bold text-[13px] underline block">Complaint:</span>
          <textarea
            rows={2}
            value={examData.complaint || ''}
            onChange={(e) => setField('complaint', e.target.value)}
            placeholder="اكتب شكوى المريض الرئيسية..."
            className="w-full border-b border-dotted border-black bg-transparent px-1 text-[12px] leading-6 focus:outline-none resize-none"
          />
        </div>

        {/* History of present illness (تاريخ المرض الحالي) */}
        <div className="space-y-1">
          <span className="font-bold text-[13px] underline block">History of present illness:</span>
          <textarea
            rows={5}
            value={examData.historyOfPresentIllness || ''}
            onChange={(e) => setField('historyOfPresentIllness', e.target.value)}
            placeholder="تفاصيل الشكوى الحالية وتطور الأعراض..."
            className="w-full border-b border-dotted border-black bg-transparent px-1 text-[12px] leading-6 focus:outline-none resize-none"
          />
        </div>

        {/* Past history (التاريخ المرضي السابق) */}
        <div className="space-y-1.5 text-[12px]">
          <span className="font-bold text-[13px] underline block">Past history:</span>

          <div className="flex items-baseline gap-1">
            <span className="font-bold shrink-0">- Medical problems:</span>
            <PaperTextarea
              rows={1}
              value={examData.medicalProblems || ''}
              onChange={(val) => setField('medicalProblems', val)}
            />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-bold shrink-0">- Drugs:</span>
            <PaperTextarea
              rows={1}
              value={examData.drugs || ''}
              onChange={(val) => setField('drugs', val)}
            />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-bold shrink-0">- Previous operations: (Not related)</span>
            <PaperTextarea
              rows={1}
              value={examData.previousOperationsNotRelated || ''}
              onChange={(val) => setField('previousOperationsNotRelated', val)}
            />
          </div>

          <div className="flex items-baseline gap-1 pl-6">
            <span className="font-bold shrink-0">(Related)</span>
            <PaperTextarea
              rows={1}
              value={examData.previousOperationsRelated || ''}
              onChange={(val) => setField('previousOperationsRelated', val)}
            />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-bold text-[13px] shrink-0">Family history:</span>
            <PaperTextarea
              rows={1}
              value={examData.familyHistory || ''}
              onChange={(val) => setField('familyHistory', val)}
            />
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Examination : & فحص الأذن (Ear) المكبّر والمطابق للصورة المرفقة */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[13px] underline block">Examination :</span>
          </div>

          <div className="grid grid-cols-12 gap-1.5 items-start">
            {/* القائمة اليسرى (Rt Ear) */}
            <div className="col-span-2 space-y-1 text-[12px] pt-4">
              {earItems.map((it) => (
                <div key={it.id} className="flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[10px] sm:text-[11px]">- {it.label}:</span>
                  <PaperTextarea
                    rows={1}
                    value={(examData.ear.rt as any)?.[it.id] || ''}
                    onChange={(val) => updateEar('rt', it.id, val)}
                    className="py-0.5 text-[11px]"
                  />
                </div>
              ))}
            </div>

            {/* في المنتصف: رسم الأذن التشريحي المكبّر إلى أقصى حد ممكن واختبار ويبر مع إمكانية الرسم بالقلم */}
            <div className="col-span-8 flex flex-col items-center justify-center">
              <EarAnatomyDiagram
                selectedWeber={examData.ear.weber}
                onSelectWeber={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    ear: { ...prev.ear, weber: val },
                  }))
                }
                drawing={examData.ear.drawing}
                onSaveDrawing={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    ear: { ...prev.ear, drawing: val },
                  }))
                }
                drawingHistory={examData.ear.drawingHistory}
                onAddSnapshot={(snap) =>
                  onChange((prev) => ({
                    ...prev,
                    ear: {
                      ...prev.ear,
                      drawingHistory: [...(prev.ear.drawingHistory || []), snap],
                    },
                  }))
                }
                readOnly={isPrintOnly}
              />
            </div>

            {/* القائمة اليمنى (Lt Ear) */}
            <div className="col-span-2 space-y-1 text-[12px] pt-4">
              {earItems.map((it) => (
                <div key={it.id} className="flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[10px] sm:text-[11px]">- {it.label}:</span>
                  <PaperTextarea
                    rows={1}
                    value={(examData.ear.lt as any)?.[it.id] || ''}
                    onChange={(val) => updateEar('lt', it.id, val)}
                    className="py-0.5 text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* فحص الاتزان (Vestibular Assessment) - 3 أعمدة */}
        <div className="space-y-1.5 text-[12px]">
          <span className="font-bold text-[13px] underline block">Vestibular Assessment:</span>

          <div className="grid grid-cols-12 gap-3">
            {/* العمود 1 */}
            <div className="col-span-4 space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Romberg test:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.rombergTest || ''}
                  onChange={(val) => updateVestibular('rombergTest', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Head Shaking:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.headShaking || ''}
                  onChange={(val) => updateVestibular('headShaking', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Others:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.others || ''}
                  onChange={(val) => updateVestibular('others', val)}
                  className="text-[11px]"
                />
              </div>
            </div>

            {/* العمود 2 */}
            <div className="col-span-4 space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Dexahallpike:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.dexahallpike || ''}
                  onChange={(val) => updateVestibular('dexahallpike', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Head Thrust (Impulse):</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.headThrust || ''}
                  onChange={(val) => updateVestibular('headThrust', val)}
                  className="text-[11px]"
                />
              </div>
            </div>

            {/* العمود 3 */}
            <div className="col-span-4 space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- High steppage:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.highSteppage || ''}
                  onChange={(val) => updateVestibular('highSteppage', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">- Caloric test:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.ear.vestibular?.caloricTest || ''}
                  onChange={(val) => updateVestibular('caloricTest', val)}
                  className="text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 📄 الورقة الثانية (Sheet 2) - مطابقة تماماً للصورة الثانية       */}
      {/* ============================================================== */}
      <div className="sheet-page-2 bg-white border-2 border-black p-4 sm:p-5 rounded-none shadow-sm space-y-3 print:border-2 print:border-black print:p-4 print:shadow-none print:w-full">
        {/* عنوان فحص الأنف (Nose) في المنتصف */}
        <div className="text-center font-bold text-[16px] underline">
          Nose
        </div>

        {/* فحص الأنف المفصل مع رسم الهرم الأنفي */}
        <div className="grid grid-cols-12 gap-3 items-start">
          {/* القائمة اليسرى (Rt Nose) */}
          <div className="col-span-4 space-y-1 text-[12px]">
            {noseItems.map((it) => (
              <div key={it.id} className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">{it.label}:</span>
                <PaperTextarea
                  rows={1}
                  value={(examData.nose.rt as any)?.[it.id] || ''}
                  onChange={(val) => updateNose('rt', it.id, val)}
                  className="py-0.5 text-[11px]"
                />
              </div>
            ))}
          </div>

          {/* في المنتصف: رسم الهرم الأنفي + Deformity & Edema مع إمكانية الرسم بالقلم */}
          <div className="col-span-4 flex flex-col items-center justify-center space-y-1">
            <NoseAnatomyDiagram
              drawing={examData.nose.drawing}
              onSaveDrawing={(val) =>
                onChange((prev) => ({
                  ...prev,
                  nose: { ...prev.nose, drawing: val },
                }))
              }
              drawingHistory={examData.nose.drawingHistory}
              onAddSnapshot={(snap) =>
                onChange((prev) => ({
                  ...prev,
                  nose: {
                    ...prev.nose,
                    drawingHistory: [...(prev.nose.drawingHistory || []), snap],
                  },
                }))
              }
              readOnly={isPrintOnly}
            />
            <div className="w-full space-y-1 text-[11px]">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Deformity:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.nose.deformity || ''}
                  onChange={(val) =>
                    onChange((prev) => ({
                      ...prev,
                      nose: { ...prev.nose, deformity: val },
                    }))
                  }
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Edema:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.nose.rt?.edema || ''}
                  onChange={(val) => updateNose('rt', 'edema', val)}
                  className="text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* القائمة اليمنى (Lt Nose) */}
          <div className="col-span-4 space-y-1 text-[12px]">
            {noseItems.map((it) => (
              <div key={it.id} className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">{it.label}:</span>
                <PaperTextarea
                  rows={1}
                  value={(examData.nose.lt as any)?.[it.id] || ''}
                  onChange={(val) => updateNose('lt', it.id, val)}
                  className="py-0.5 text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Oropharynx & Mallampati classification */}
        <div className="grid grid-cols-12 gap-3 items-start">
          <div className="col-span-7 space-y-2">
            <span className="font-bold text-[14px] underline block">Oropharynx</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Tonsils:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.tonsils || ''}
                  onChange={(val) => updateOropharynx('tonsils', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Adenoid:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.adenoid || ''}
                  onChange={(val) => updateOropharynx('adenoid', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Soft palate:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.softPalate || ''}
                  onChange={(val) => updateOropharynx('softPalate', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Uvula:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.uvula || ''}
                  onChange={(val) => updateOropharynx('uvula', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Tongue:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.tongue || ''}
                  onChange={(val) => updateOropharynx('tongue', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Sublingual area:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.sublingualArea || ''}
                  onChange={(val) => updateOropharynx('sublingualArea', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Buccal mucosa:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.buccalMucosa || ''}
                  onChange={(val) => updateOropharynx('buccalMucosa', val)}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold shrink-0">Signs of reflux:</span>
                <PaperTextarea
                  rows={1}
                  value={examData.oropharynx.signsOfReflux || ''}
                  onChange={(val) => updateOropharynx('signsOfReflux', val)}
                  className="text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <MallampatiSelector
              selectedClass={examData.oropharynx.mallampati}
              onSelect={(val) =>
                onChange((prev) => ({
                  ...prev,
                  oropharynx: { ...prev.oropharynx, mallampati: val },
                }))
              }
            />
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Larynx & Head & Neck */}
        <div className="space-y-1">
          <div className="text-center font-bold text-[15px] underline">
            Larynx & Head & Neck
          </div>

          <div className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-8 space-y-1 text-[12px]">
              {larynxItems.map((it) => (
                <div key={it.id} className="flex items-baseline gap-1">
                  <span className="font-bold shrink-0">{it.label}:</span>
                  <PaperTextarea
                    rows={1}
                    value={(examData.larynx as any)?.[it.id] || ''}
                    onChange={(val) => updateLarynx(it.id, val)}
                    className="py-0.5 text-[11px]"
                  />
                </div>
              ))}
            </div>

            <div className="col-span-4 flex flex-col items-center justify-center pt-1">
              <LarynxVocalCordDiagram
                drawing={examData.larynx.drawing}
                onSaveDrawing={(val) =>
                  onChange((prev) => ({
                    ...prev,
                    larynx: { ...prev.larynx, drawing: val },
                  }))
                }
                drawingHistory={examData.larynx.drawingHistory}
                onAddSnapshot={(snap) =>
                  onChange((prev) => ({
                    ...prev,
                    larynx: {
                      ...prev.larynx,
                      drawingHistory: [...(prev.larynx.drawingHistory || []), snap],
                    },
                  }))
                }
                readOnly={isPrintOnly}
              />
            </div>
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Investigations (فحوصات الحاضر والمطلوب مع إمكانية إضافة وحذف أكثر من فحص) */}
        <div className="space-y-2 text-[12px]">
          <span className="font-bold text-[13px] underline block">Investigations:</span>

          {/* قسم Present (الفحوصات الحاضرة مع المريض) */}
          <div className="space-y-1 pl-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-slate-800 uppercase">- Present:</span>
              {!isPrintOnly && (
                <button
                  type="button"
                  onClick={addPresentItem}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B7B5E] hover:text-[#074C3A] cursor-pointer print:hidden"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Present</span>
                </button>
              )}
            </div>

            {presentList.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-6 flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[11px]">{idx + 1}.</span>
                  <PaperTextarea
                    rows={1}
                    value={item.name || ''}
                    onChange={(val) => updatePresentItem(idx, 'name', val)}
                    placeholder="Investigation..."
                    className="text-[11px]"
                  />
                </div>
                <div className="col-span-6 flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[11px]">Revealed:</span>
                  <PaperTextarea
                    rows={1}
                    value={item.revealed || ''}
                    onChange={(val) => updatePresentItem(idx, 'revealed', val)}
                    placeholder="Revealed results..."
                    className="text-[11px]"
                  />
                  {!isPrintOnly && presentList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePresentItem(idx)}
                      title="حذف هذا الفحص"
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer print:hidden"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* قسم Need (الفحوصات المطلوبة) */}
          <div className="space-y-1 pl-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-slate-800 uppercase">- Need:</span>
              {!isPrintOnly && (
                <button
                  type="button"
                  onClick={addNeedItem}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B7B5E] hover:text-[#074C3A] cursor-pointer print:hidden"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Need</span>
                </button>
              )}
            </div>

            {needList.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-6 flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[11px]">{idx + 1}.</span>
                  <PaperTextarea
                    rows={1}
                    value={item.name || ''}
                    onChange={(val) => updateNeedItem(idx, 'name', val)}
                    placeholder="Investigation needed..."
                    className="text-[11px]"
                  />
                </div>
                <div className="col-span-6 flex items-baseline gap-1">
                  <span className="font-bold shrink-0 text-[11px]">Revealed:</span>
                  <PaperTextarea
                    rows={1}
                    value={item.revealed || ''}
                    onChange={(val) => updateNeedItem(idx, 'revealed', val)}
                    placeholder="Results if any..."
                    className="text-[11px]"
                  />
                  {!isPrintOnly && needList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNeedItem(idx)}
                      title="حذف هذا الفحص"
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer print:hidden"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Diagnosis (التشخيص الطبي) - تم وضعه قبل Treatment مباشرة بناءً على طلب الدكتور */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-[13px] underline shrink-0">Diagnosis:</span>
            <PaperTextarea
              rows={1}
              value={examData.diagnosis || ''}
              onChange={(val) => setField('diagnosis', val)}
              placeholder="اكتب التشخيص الطبي للحالة..."
              className="font-bold text-[13px]"
            />
          </div>
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Treatment (ملاحظات العلاج الأساسية بالورقة) */}
        <div className="space-y-1">
          <span className="font-bold text-[13px] underline block">Treatment:</span>
          <PaperTextarea
            rows={2}
            value={examData.treatmentNotes || ''}
            onChange={(val) => setField('treatmentNotes', val)}
            placeholder="ملاحظات وتفاصيل خطة العلاج..."
            className="text-[12px] leading-6"
          />
        </div>

        {/* خط فاصل منقط */}
        <div className="border-b border-dotted border-black my-2" />

        {/* Follow up & Operations */}
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-[13px] underline shrink-0">Follow up:</span>
            <PaperTextarea
              rows={1}
              value={examData.followUpDate || ''}
              onChange={(val) => setField('followUpDate', val)}
              placeholder="تاريخ أو موعد المتابعة..."
              className="font-bold text-[12px]"
            />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-bold text-[13px] underline shrink-0">Operation Needed:</span>
            <PaperTextarea
              rows={1}
              value={examData.operationNeeded || ''}
              onChange={(val) => setField('operationNeeded', val)}
              placeholder="العملية المطلوبة إن وجدت..."
              className="text-[12px]"
            />
          </div>

          <div className="space-y-1">
            <span className="font-bold text-[13px] underline block">Operative data:</span>
            <PaperTextarea
              rows={2}
              value={examData.operativeData || ''}
              onChange={(val) => setField('operativeData', val)}
              placeholder="تفاصيل وبيانات التدخل الجراحي..."
              className="text-[12px] leading-6"
            />
          </div>

          {/* خط فاصل منقط */}
          <div className="border-b border-dotted border-black my-2" />

          {/* قسم الزيارات الإضافية المتعددة (2nd, 3rd, 4th, 5th... Visits) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[13px] underline block">Visits History:</span>
              {!isPrintOnly && (
                <button
                  type="button"
                  onClick={addVisit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer transition-all border border-slate-300 print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة زيارة ({getOrdinalLabel(visitsList.length + 2)})</span>
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 ${visitsList.length > 1 ? 'sm:grid-cols-2' : ''} gap-x-4 gap-y-3`}>
              {visitsList.map((visit, idx) => (
                <div key={visit.id || idx} className="space-y-1 border-b border-dotted border-slate-300 pb-2">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-bold shrink-0 text-[12px]">
                      {visit.label || getOrdinalLabel(visit.visitNumber || idx + 2)}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[11px] text-slate-600 shrink-0">Date:</span>
                      <input
                        type="text"
                        value={visit.date || ''}
                        onChange={(e) => updateVisit(idx, 'date', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-24 border-b border-dotted border-black bg-transparent px-1 text-[11px] font-mono focus:outline-none"
                      />
                      {!isPrintOnly && visitsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVisit(idx)}
                          title="حذف هذه الزيارة"
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer print:hidden"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <PaperTextarea
                    rows={1}
                    value={visit.notes || ''}
                    onChange={(val) => updateVisit(idx, 'notes', val)}
                    placeholder="ملاحظات الزيارة والعلاج..."
                    className="text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* توقيع الطبيب وتاريخ الزيارة */}
        <div className="pt-4 border-t border-black flex items-center justify-between text-[11px] font-bold">
          <div>
            <span>Date: </span>
            <span>{examData.date}</span>
          </div>
          <div>
            <span>Doctor Signature: </span>
            <span className="font-black underline">{doctor?.name || 'د. إسلام عبدالله كريمة'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

