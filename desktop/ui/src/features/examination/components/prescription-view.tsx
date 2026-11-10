'use client';

import React, { useState } from 'react';
import {
  Pill,
  Printer,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Save,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  PrescriptionMedicine,
  EntExaminationData,
} from '../types/ent-examination.types';

export const DRUG_FORMS = [
  { id: 'Tablet', labelEn: 'Tablet', labelAr: 'أقراص' },
  { id: 'ODT', labelEn: 'ODT (Orally Disintegrating Tablet)', labelAr: 'أقراص تذوب في الفم' },
  { id: 'ODF', labelEn: 'ODF (Oral Dissolving Film)', labelAr: 'شرائط تذوب في الفم' },
  { id: 'Capsule', labelEn: 'Capsule', labelAr: 'كبسولات' },
  { id: 'Syrup', labelEn: 'Syrup', labelAr: 'شراب' },
  { id: 'Suspension', labelEn: 'Suspension', labelAr: 'معلق' },
  { id: 'Oral Drops', labelEn: 'Oral Drops', labelAr: 'نقط بالفم' },
  { id: 'Oral Solution', labelEn: 'Oral Solution', labelAr: 'محلول فموي' },
  { id: 'Effervescent Tablet', labelEn: 'Effervescent Tablet', labelAr: 'أقراص فوارة' },
  { id: 'Chewable Tablet', labelEn: 'Chewable Tablet', labelAr: 'أقراص للمضغ' },
  { id: 'Sublingual Tablet', labelEn: 'Sublingual Tablet', labelAr: 'أقراص تحت اللسان' },
  { id: 'Injection', labelEn: 'Injection', labelAr: 'حقن' },
  { id: 'Ampoule', labelEn: 'Ampoule', labelAr: 'أمبول' },
  { id: 'Vial', labelEn: 'Vial', labelAr: 'فيال' },
  { id: 'Cream', labelEn: 'Cream', labelAr: 'كريم' },
  { id: 'Ointment', labelEn: 'Ointment', labelAr: 'مرهم' },
  { id: 'Gel', labelEn: 'Gel', labelAr: 'جل' },
  { id: 'Lotion', labelEn: 'Lotion', labelAr: 'لوشن' },
  { id: 'Eye Drops', labelEn: 'Eye Drops', labelAr: 'نقط عين' },
  { id: 'Eye Ointment', labelEn: 'Eye Ointment', labelAr: 'مرهم عين' },
  { id: 'Ear Drops', labelEn: 'Ear Drops', labelAr: 'نقط أذن' },
  { id: 'Ear Spray', labelEn: 'Ear Spray', labelAr: 'بخاخ أذن' },
  { id: 'Nasal Drops', labelEn: 'Nasal Drops', labelAr: 'نقط أنف' },
  { id: 'Nasal Spray', labelEn: 'Nasal Spray', labelAr: 'بخاخ أنف' },
  { id: 'Inhaler', labelEn: 'Inhaler', labelAr: 'بخاخ استنشاق' },
  { id: 'Nebulizer Solution', labelEn: 'Nebulizer Solution', labelAr: 'محلول جلسات' },
  { id: 'Suppository', labelEn: 'Suppository', labelAr: 'لبوس' },
  { id: 'Vaginal Suppository', labelEn: 'Vaginal Suppository', labelAr: 'لبوس مهبلي' },
  { id: 'Vaginal Cream', labelEn: 'Vaginal Cream', labelAr: 'كريم مهبلي' },
  { id: 'Powder', labelEn: 'Powder', labelAr: 'مسحوق' },
  { id: 'Sachet', labelEn: 'Sachet', labelAr: 'أكياس' },
  { id: 'Granules', labelEn: 'Granules', labelAr: 'حبيبات' },
  { id: 'Patch', labelEn: 'Patch', labelAr: 'لصقات جلدية' },
  { id: 'Mouthwash', labelEn: 'Mouthwash', labelAr: 'غسول فم' },
  { id: 'Oral Spray', labelEn: 'Oral Spray', labelAr: 'بخاخ فم' },
];

interface PrescriptionViewProps {
  examData: EntExaminationData;
  patient: any;
  doctor?: any;
  onChange: (updater: (prev: EntExaminationData) => EntExaminationData) => void;
  onBackToExam: () => void;
  onSave: () => void;
  onFinish: () => void;
  onPrintRx: (mode?: 'full' | 'plain') => void;
  isSaving: boolean;
  isFinishing: boolean;
}

const QUICK_ENT_DRUGS: Array<Omit<PrescriptionMedicine, 'id'>> = [
  { drugName: 'Augmentin', form: 'Tablet', concentration: '1gm', dose: '1 قرص', frequency: 'كل 12 ساعة', duration: '7 أيام', instructions: 'بعد الأكل مباشرة' },
  { drugName: 'Curam', form: 'Tablet', concentration: '1gm', dose: '1 قرص', frequency: 'كل 12 ساعة', duration: '7 أيام', instructions: 'وسط الأكل' },
  { drugName: 'Otrivin Adult', form: 'Nasal Spray', concentration: '0.1%', dose: 'بخة بكل فتحة أنف', frequency: 'مرتين يومياً', duration: '5 أيام', instructions: 'لا يُستخدم أكثر من 5 أيام لتجنب احتقان ارتدادي' },
  { drugName: 'Zyrtec (Cetirizine)', form: 'Tablet', concentration: '10mg', dose: '1 قرص', frequency: 'مساءً قبل النوم', duration: '10 أيام', instructions: 'قد يسبب بعض النعاس' },
  { drugName: 'Cataflam', form: 'Tablet', concentration: '50mg', dose: '1 قرص', frequency: 'عند اللزوم بعد الأكل', duration: '5 أيام', instructions: 'مسكن ومضاد للالتهاب' },
  { drugName: 'Otocort', form: 'Ear Drops', concentration: '', dose: '3 نقط في الأذن', frequency: '3 مرات يومياً', duration: '7 أيام', instructions: 'تدفئة الزجاجة بوضعها في راحة اليد أولاً' },
  { drugName: 'Bbc', form: 'Oral Spray', concentration: '', dose: 'بختين في الحلق', frequency: '3 مرات يومياً', duration: '5 أيام', instructions: 'مطهر ومسكن موضعي' },
  { drugName: 'Flixonase', form: 'Nasal Spray', concentration: '50mcg', dose: 'بخة بكل فتحة أنف', frequency: 'مرة واحدة صباحاً', duration: 'شهر', instructions: 'رج الزجاجة جيداً قبل الاستخدام' },
  { drugName: 'Alpha Chymotrypsin', form: 'Ampoule', concentration: '', dose: 'حقنة عضل', frequency: 'يومياً', duration: '5 أيام', instructions: 'مضاد للارتشاح والتورم' },
];

export function PrescriptionView({
  examData,
  patient,
  doctor,
  onChange,
  onBackToExam,
  onSave,
  onFinish,
  onPrintRx,
  isSaving,
  isFinishing,
}: PrescriptionViewProps) {
  const items = examData.prescriptionItems || [];

  const addItem = () => {
    const newItem: PrescriptionMedicine = {
      id: Math.random().toString(36).substring(2, 9),
      drugName: '',
      form: 'Tablet',
      concentration: '',
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
    };
    onChange((prev) => ({
      ...prev,
      prescriptionItems: [...(prev.prescriptionItems || []), newItem],
    }));
  };

  const updateItem = (id: string, field: keyof PrescriptionMedicine, value: string) => {
    onChange((prev) => ({
      ...prev,
      prescriptionItems: (prev.prescriptionItems || []).map((it) =>
        it.id === id ? { ...it, [field]: value } : it
      ),
    }));
  };

  const removeItem = (id: string) => {
    onChange((prev) => ({
      ...prev,
      prescriptionItems: (prev.prescriptionItems || []).filter((it) => it.id !== id),
    }));
  };

  const addQuickDrug = (drug: Omit<PrescriptionMedicine, 'id'>) => {
    const newItem: PrescriptionMedicine = {
      ...drug,
      id: Math.random().toString(36).substring(2, 9),
    };
    onChange((prev) => ({
      ...prev,
      prescriptionItems: [...(prev.prescriptionItems || []), newItem],
    }));
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* 1. الترويسة وبطاقة المريض */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-xs">
            ℞
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#0A164E]">
                الروشتة الطبية (Medical Prescription)
              </h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                إصدار معتمد
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                المريض: <strong className="text-slate-800">{patient?.fullName}</strong>
              </span>
              <span>·</span>
              <span>رقم الملف: <strong className="text-slate-800 font-mono">{examData.fileNo || (patient as any)?.fileNumber || '---'}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                التاريخ: <strong className="text-slate-800 font-mono">{examData.date || new Date().toISOString().slice(0, 10)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* التشخيص المعتمد */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 min-w-[260px] space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">
            التشخيص النهائي (Diagnosis):
          </span>
          <input
            type="text"
            value={examData.diagnosis || ''}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, diagnosis: e.target.value }))
            }
            placeholder="اكتب تشخيص الحالة ليظهر في الروشتة..."
            className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0A164E] focus:outline-none focus:border-[#0040D8]"
          />
        </div>
      </div>

      {/* 2. الأدوية السريعة الشائعة */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>أدوية الأنف والأذن والحنجرة الشائعة (إضافة سريعة بضغطة واحدة):</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            تضاف مباشرة لجدول الروشتة مع النوع والتركيز والجرعة
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ENT_DRUGS.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => addQuickDrug(d)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-[#0040D8] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3 text-[#0040D8]" />
              <span>{d.drugName}</span>
              {d.concentration && <span className="text-[10px] text-blue-600 font-mono font-normal">({d.concentration})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 3. جدول الروشتة الطبية المخصصة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#0040D8] font-black text-sm">
              ℞
            </div>
            <div>
              <h4 className="font-black text-sm text-[#0A164E]">
                قائمة الأدوية الموصوفة
              </h4>
              <p className="text-[11px] text-slate-500">
                إجمالي الأصناف: <strong className="text-[#0040D8]">{items.length}</strong> دواء
              </p>
            </div>
          </div>

          {/* خيارات الطباعة والإضافة */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* زر طباعة روشتة كاملة */}
            <button
              type="button"
              onClick={() => onPrintRx('full')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="طباعة روشتة كاملة مع ترويسة العيادة واسم الطبيب"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>طباعة كاملة (مع الترويسة)</span>
            </button>

            {/* زر طباعة أدوية فقط للورق الجاهز */}
            <button
              type="button"
              onClick={() => onPrintRx('plain')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition-all shadow-2xs cursor-pointer"
              title="طباعة على ورق عيادة مطبوع مسبقاً (تطبع فقط الأدوية والجرعات والإرشادات بدون ترويسة أو توقيع)"
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>طباعة أدوية فقط (ورق بدون ترويسة) 📄</span>
            </button>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0040D8] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف دواء</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              لم تتم إضافة أي أدوية حتى الآن.
            </p>
            <p className="text-[11px] text-slate-500">
              اضغط على أحد الأدوية السريعة بالأعلى أو اضغط &quot;إضافة صنف دواء&quot; لبدء كتابة الروشتة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50/80 hover:bg-blue-50/40 rounded-2xl border border-slate-200 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      الصنف #{index + 1}:
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف هذا الدواء"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                  {/* 1. اسم الدواء */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">اسم الدواء (Drug Name) *</label>
                    <input
                      type="text"
                      value={item.drugName}
                      onChange={(e) => updateItem(item.id, 'drugName', e.target.value)}
                      placeholder="Augmentin, Otrivin, Cataflam..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>

                  {/* 2. نوع / شكل الدواء (Form) */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">نوع / شكل الدواء (Form)</label>
                    <select
                      value={item.form || 'Tablet'}
                      onChange={(e) => updateItem(item.id, 'form', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0040D8] cursor-pointer"
                    >
                      {DRUG_FORMS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.labelAr} ({f.labelEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. التركيز (Concentration / Strength) */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">التركيز (Concentration)</label>
                    <input
                      type="text"
                      value={item.concentration || ''}
                      onChange={(e) => updateItem(item.id, 'concentration', e.target.value)}
                      placeholder="مثال: 500mg, 1gm, 0.1%..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>

                  {/* 4. الجرعة */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">الجرعة (Dose)</label>
                    <input
                      type="text"
                      value={item.dose}
                      onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                      placeholder="1 قرص، بخة، ملعقة..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>

                  {/* 5. التكرار */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">التكرار (Frequency)</label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                      placeholder="كل 12 ساعة، 3 مرات يومياً..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>

                  {/* 6. المدة */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">المدة (Duration)</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                      placeholder="5 أيام، أسبوع، شهر..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>

                  {/* 7. تعليمات وإرشادات الاستخدام */}
                  <div className="sm:col-span-12 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">تعليمات وإرشادات الاستخدام (Instructions)</label>
                    <input
                      type="text"
                      value={item.instructions || ''}
                      onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                      placeholder="بعد الأكل مباشرة، قبل النوم، رج الزجاجة قبل الاستخدام..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-[#0040D8]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ملاحظات وإرشادات الطبيب للمريض */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          <label className="font-bold text-xs text-slate-700 block">
            ملاحظات وإرشادات عامة للمريض (Treatment Notes):
          </label>
          <textarea
            rows={3}
            value={examData.treatmentNotes || ''}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, treatmentNotes: e.target.value }))
            }
            placeholder="تعليمات إضافية مثل: الراحة التامة، شرب سوائل دافئة، تجنب المأكولات الحارة..."
            className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold leading-relaxed focus:outline-none focus:border-[#0040D8] focus:bg-white"
          />
        </div>
      </div>

      {/* 4. شريط الإجراءات السفلي */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={onBackToExam}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>العودة لتعديل استمارة الكشف الطبي</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>

          {/* طباعة أدوية فقط للورق المطبوع مسبقاً */}
          <button
            type="button"
            onClick={() => onPrintRx('plain')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition-all cursor-pointer"
            title="طباعة أدوية فقط بدون ترويسة أو توقيع (للورق الجاهز)"
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>طباعة أدوية فقط (ورق بدون ترويسة) 📄</span>
          </button>

          {/* طباعة روشتة كاملة */}
          <button
            type="button"
            onClick={() => onPrintRx('full')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-[#0040D8] text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كاملة</span>
          </button>

          <button
            type="button"
            onClick={onFinish}
            disabled={isFinishing}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isFinishing ? 'جاري إنهاء الكشف...' : 'إنهاء الكشف وتسليم للاستقبال'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * نموذج الروشتة الطبية الجاهز للطباعة المباشرة على ورقة A5 / A4
 * يدعم نمطين:
 * 1. 'full': روشتة كاملة مع ترويسة العيادة واسم الطبيب وتوقيعه
 * 2. 'plain': طباعة فقط أسماء الأدوية والجرعات والإرشادات (للورق المطبوع مسبقاً) بخلفية بيضاء نقية وتنسيق مرتب
 */
export function PrintablePrescriptionSlip({
  examData,
  patient,
  doctor,
  printMode = 'full',
}: {
  examData: EntExaminationData;
  patient: any;
  doctor?: any;
  printMode?: 'full' | 'plain';
}) {
  const items = examData.prescriptionItems || [];
  const isPlain = printMode === 'plain';

  return (
    <div
      dir="rtl"
      className={`bg-white text-black font-sans ${
        isPlain
          ? 'p-6 pt-16 max-w-2xl mx-auto space-y-6 print:p-2 print:pt-20 print:max-w-none'
          : 'p-8 max-w-2xl mx-auto space-y-6 border border-slate-300 print:border-none print:p-4 print:max-w-none'
      }`}
    >
      {/* ترويسة العيادة - تظهر فقط في الوضع الكامل (full) */}
      {!isPlain && (
        <div className="border-b-2 border-black pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-black">
              عيادة الأنف والأذن والحنجرة وجراحات الرأس والرقبة
            </h2>
            <p className="text-sm font-bold text-slate-700">
              {doctor?.name || 'د. إسلام عبدالله كريمة'}
            </p>
            <p className="text-xs text-slate-500">
              أخصائي الأنف والأذن والحنجرة - ماجستير جراحة الأنف والأذن والحنجرة
            </p>
          </div>

          <div className="text-left text-xs font-bold text-slate-700 space-y-0.5" dir="ltr">
            <p>ENT & Head & Neck Surgery Clinic</p>
            <p>Tel: {doctor?.phone || '01018566478'}</p>
          </div>
        </div>
      )}

      {/* بيانات المريض والزيارة */}
      <div
        className={`pb-2 grid grid-cols-4 gap-2 text-xs font-bold items-baseline ${
          isPlain ? 'border-b border-slate-400' : 'border-b border-black'
        }`}
      >
        <div>
          <span className="text-slate-600">اسم المريض: </span>
          <span className="font-black text-sm">{patient?.fullName}</span>
        </div>
        <div>
          <span className="text-slate-600">رقم الملف: </span>
          <span className="font-mono font-black text-sm">
            {examData.fileNo || (patient as any)?.fileNumber || '---'}
          </span>
        </div>
        <div>
          <span className="text-slate-600">السن: </span>
          <span>{patient?.age ? `${patient.age} سنة` : '---'}</span>
        </div>
        <div className="text-left" dir="ltr">
          <span className="text-slate-600">Date: </span>
          <span>{examData.date || new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {examData.diagnosis && (
        <div className="text-xs font-bold">
          <span className="text-slate-600">التشخيص (Diagnosis): </span>
          <span className="font-black text-black underline">{examData.diagnosis}</span>
        </div>
      )}

      {/* رمز الروشتة ℞ والأدوية */}
      <div className="space-y-4 min-h-[350px]">
        <div className="text-3xl font-black text-black">
          ℞
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">لا توجد أدوية مضافة.</p>
        ) : (
          <div className="space-y-3.5 pr-4">
            {items.map((item, idx) => {
              const formObj = DRUG_FORMS.find((f) => f.id === item.form);
              const formLabel = formObj ? formObj.labelAr : item.form;

              return (
                <div key={item.id || idx} className="space-y-0.5 text-xs">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-black text-sm">{idx + 1}.</span>
                    <span className="font-black text-sm tracking-wide text-black">
                      {item.drugName}
                    </span>
                    {formLabel && (
                      <span className="text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px] print:bg-transparent print:border print:border-black">
                        ({formLabel})
                      </span>
                    )}
                    {item.concentration && (
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        [{item.concentration}]
                      </span>
                    )}
                    {item.dose && (
                      <span className="text-slate-800 font-bold">
                        - {item.dose}
                      </span>
                    )}
                  </div>
                  <div className="pr-5 text-slate-700 font-medium">
                    {item.frequency && <span>{item.frequency}</span>}
                    {item.duration && <span> - لمدة {item.duration}</span>}
                    {item.instructions && (
                      <span className="block text-slate-800 text-[11px] font-bold mt-0.5">
                        ◄ {item.instructions}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ملاحظات العلاج */}
      {examData.treatmentNotes && (
        <div className="border-t border-dotted border-black pt-3 text-xs">
          <span className="font-bold text-black block mb-1">تعليمات إضافية:</span>
          <p className="text-slate-800 whitespace-pre-line leading-5">
            {examData.treatmentNotes}
          </p>
        </div>
      )}

      {/* موعد المتابعة وتوقيع الطبيب - يظهر فقط في النمط الكامل */}
      {!isPlain && (
        <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs font-bold">
          <div>
            {examData.followUpDate ? (
              <span>موعد الاستشارة: <strong className="underline">{examData.followUpDate}</strong></span>
            ) : (
              <span>الاستشارة خلال أسبوع من تاريخ الكشف</span>
            )}
          </div>
          <div className="text-left" dir="ltr">
            <p>Doctor Signature:</p>
            <p className="font-black text-sm underline">{doctor?.name || 'Dr. Eslam Abdallah'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
