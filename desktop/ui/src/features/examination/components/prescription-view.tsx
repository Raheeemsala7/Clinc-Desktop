'use client';

import  { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Printer,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Save,
  User,
  Calendar,
  FileCheck,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PrescriptionMedicine,
  EntExaminationData,
} from '../types/ent-examination.types';

export interface SavedDrugItem {
  id?: string;
  drugName: string;
  form?: string;
  concentration?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  usageCount?: number;
}

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

export const FREQUENCY_SUGGESTIONS = [
  'كل 24 ساعة',
  'مرتين في اليوم',
  '3 مرات في اليوم',
  '4 مرات في اليوم',
  'عند اللزوم',
  'قبل النوم',
  'كل 12 ساعة',
  'كل 8 ساعات',
];

export const DURATION_SUGGESTIONS = [
  'يومياً',
  '3 أيام',
  '5 أيام',
  'أسبوع',
  'أسبوعين',
  'شهر',
  'لحين انتهاء الأعراض',
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
  const [savedDrugs, setSavedDrugs] = useState<SavedDrugItem[]>([]);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);

  // 1. جلب الأدوية المسجلة مسبقاً من الخادم
  useEffect(() => {
    let isMounted = true;
    fetch('/api/drugs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data.payload)
          ? data.payload
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setSavedDrugs(
          list.map((d: any) => ({
            id: d.id || d._id,
            drugName: d.name || d.drugName,
            form: d.form || 'Tablet',
            concentration: d.concentration || '',
            dose: d.dose || '',
            frequency: d.frequency || '',
            duration: d.duration || '',
            instructions: d.instructions || '',
            usageCount: d.usageCount || 0,
          }))
        );
      })
      .catch((e) => console.warn('Failed to load saved drugs', e));
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. حذف دواء من الاقتراحات
  const handleDeleteDrug = async (drugId?: string, drugName?: string) => {
    if (!drugId) return;
    try {
      const res = await fetch(`/api/drugs/${encodeURIComponent(drugId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSavedDrugs((prev) => prev.filter((d) => d.id !== drugId));
        toast.success(`تم حذف "${drugName || 'الدواء'}" من الاقتراحات`);
      } else {
        toast.error('فشل حذف الدواء من الاقتراحات');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف الدواء');
    }
  };

  // 3. دمج الأدوية المسجلة من زيارات سابقة مع الأدوية الشائعة
  const combinedSuggestions: SavedDrugItem[] = useMemo(() => {
    const list: SavedDrugItem[] = [...savedDrugs];
    QUICK_ENT_DRUGS.forEach((quick) => {
      const exists = list.some(
        (s) => s.drugName.trim().toLowerCase() === quick.drugName.trim().toLowerCase()
      );
      if (!exists) {
        list.push({ ...quick });
      }
    });
    return list;
  }, [savedDrugs]);

  // 4. فلترة الأدوية في الشريط العلوي حسب البحث السريع
  const filteredChips = useMemo(() => {
    if (!drugSearchQuery.trim()) return combinedSuggestions;
    const q = drugSearchQuery.trim().toLowerCase();
    return combinedSuggestions.filter((d) =>
      d.drugName.toLowerCase().includes(q) ||
      (d.concentration && d.concentration.toLowerCase().includes(q)) ||
      (d.dose && d.dose.toLowerCase().includes(q))
    );
  }, [combinedSuggestions, drugSearchQuery]);

  // 5. اختيار دواء مقترح لتعبئة حقول السطر المحدد بضغطة واحدة
  const selectSuggestionForRow = (rowId: string, drug: SavedDrugItem) => {
    onChange((prev) => ({
      ...prev,
      prescriptionItems: (prev.prescriptionItems || []).map((it) =>
        it.id === rowId
          ? {
              ...it,
              drugName: drug.drugName,
              form: drug.form || it.form || 'Tablet',
              concentration: drug.concentration || it.concentration || '',
              dose: drug.dose || it.dose || '',
              frequency: drug.frequency || it.frequency || '',
              duration: drug.duration || it.duration || '',
              instructions: drug.instructions || it.instructions || '',
            }
          : it
      ),
    }));
    setActiveDropdownRowId(null);
  };

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

  const addQuickDrug = (drug: SavedDrugItem | Omit<PrescriptionMedicine, 'id'>) => {
    const newItem: PrescriptionMedicine = {
      id: Math.random().toString(36).substring(2, 9),
      drugName: drug.drugName || '',
      form: (drug.form as any) || 'Tablet',
      concentration: drug.concentration || '',
      dose: drug.dose || '',
      frequency: drug.frequency || '',
      duration: drug.duration || '',
      instructions: drug.instructions || '',
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
              <h3 className="text-lg font-black text-[#074C3A]">
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
            className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E]"
          />
        </div>
      </div>

      {/* 2. قاموس الأدوية الشائعة والمسجلة للدكتور مع البحث السريع والحذف */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>قاموس أدوية العيادة والاقتراحات السابقة (إضافة سريعة بضغطة واحدة):</span>
          </div>

          {/* حقل البحث السريع في الأدوية السابقة */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={drugSearchQuery}
              onChange={(e) => setDrugSearchQuery(e.target.value)}
              placeholder="ابحث في أدوية العيادة السابقة..."
              className="w-full h-8 pr-8 pl-6 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#074C3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B7B5E] focus:bg-white transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {drugSearchQuery && (
              <button
                type="button"
                onClick={() => setDrugSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* أشرطة الأدوية المقترحة */}
        <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto pr-1">
          {filteredChips.length === 0 ? (
            <span className="text-xs text-slate-400 italic py-1">
              لا توجد أدوية مطابقة لبحثك. يمكنك كتابة الدواء مباشرة بالأسفل وسيتم حفظه تلقائياً!
            </span>
          ) : (
            filteredChips.map((d, i) => (
              <div
                key={d.id || `${d.drugName}-${i}`}
                className="group inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#E3F5EE] hover:border-[#D0E5DC] text-slate-700 hover:text-[#0B7B5E] text-xs font-bold transition-all shadow-2xs overflow-hidden select-none"
              >
                <button
                  type="button"
                  onClick={() => addQuickDrug(d)}
                  className="px-2.5 py-1.5 flex items-center gap-1 cursor-pointer active:scale-95"
                  title="إضافة للروشتة مباشرة بجميع الجرعات"
                >
                  <Plus className="w-3 h-3 text-[#0B7B5E]" />
                  <span>{d.drugName}</span>
                  {d.concentration && (
                    <span className="text-[10px] text-[#0B7B5E] font-mono font-normal">
                      ({d.concentration})
                    </span>
                  )}
                </button>

                {/* زر الحذف من الاقتراحات */}
                {d.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`هل تريد حذف "${d.drugName}" من الاقتراحات نهائياً؟`)) {
                        handleDeleteDrug(d.id, d.drugName);
                      }
                    }}
                    className="h-full px-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-r border-slate-200/60"
                    title="حذف هذا الدواء من الاقتراحات"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. جدول الروشتة الطبية المخصصة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E3F5EE] flex items-center justify-center text-[#0B7B5E] font-black text-sm">
              ℞
            </div>
            <div>
              <h4 className="font-black text-sm text-[#074C3A]">
                قائمة الأدوية الموصوفة
              </h4>
              <p className="text-[11px] text-slate-500">
                إجمالي الأصناف: <strong className="text-[#0B7B5E]">{items.length}</strong> دواء
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                className="p-4 bg-slate-50/80 hover:bg-[#E3F5EE]/40 rounded-2xl border border-slate-200 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0B7B5E] text-white font-black text-xs flex items-center justify-center">
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
                  {/* 1. اسم الدواء مع البحث والإكمال التلقائي الذكي */}
                  <div className="sm:col-span-5 space-y-1 relative">
                    <label className="font-bold text-[11px] text-slate-700">اسم الدواء (Drug Name) *</label>
                    <input
                      type="text"
                      value={item.drugName}
                      onFocus={() => setActiveDropdownRowId(item.id)}
                      onChange={(e) => {
                        updateItem(item.id, 'drugName', e.target.value);
                        setActiveDropdownRowId(item.id);
                      }}
                      placeholder="Augmentin, Otrivin, Cataflam..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                    />

                    {/* قائمة الاقتراحات التلقائية المنسدلة للسطر */}
                    {activeDropdownRowId === item.id && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">
                        {combinedSuggestions
                          .filter((sug) =>
                            !item.drugName.trim() ||
                            sug.drugName.toLowerCase().includes(item.drugName.trim().toLowerCase()) ||
                            (sug.dose && sug.dose.toLowerCase().includes(item.drugName.trim().toLowerCase()))
                          )
                          .slice(0, 8)
                          .map((sug, sIdx) => (
                            <div
                              key={sug.id || `${sug.drugName}-${sIdx}`}
                              className="px-3 py-2 hover:bg-[#E3F5EE] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectSuggestionForRow(item.id, sug);
                              }}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-[#074C3A]">
                                  {sug.drugName}
                                </span>
                                {sug.concentration && (
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    ({sug.concentration})
                                  </span>
                                )}
                                {sug.form && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    {sug.form}
                                  </span>
                                )}
                                {sug.dose && (
                                  <span className="text-[11px] text-slate-500">
                                    · {sug.dose}
                                  </span>
                                )}
                                {sug.frequency && (
                                  <span className="text-[11px] text-slate-500">
                                    · {sug.frequency}
                                  </span>
                                )}
                              </div>

                              {sug.id && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm(`هل تريد حذف "${sug.drugName}" من الاقتراحات؟`)) {
                                      handleDeleteDrug(sug.id, sug.drugName);
                                    }
                                  }}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                                  title="حذف من الاقتراحات"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}

                        <div
                          className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-400 font-medium text-center cursor-pointer hover:bg-slate-100"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveDropdownRowId(null);
                          }}
                        >
                          إغلاق الاقتراحات ✕
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. نوع / شكل الدواء (Form) */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">نوع / شكل الدواء (Form)</label>
                    <select
                      value={item.form || 'Tablet'}
                      onChange={(e) => updateItem(item.id, 'form', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
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
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#0B7B5E]"
                    />
                  </div>

                  {/* 4. الجرعة */}
                  <div className="sm:col-span-12 sm:col-span-3 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">الجرعة (Dose)</label>
                    <input
                      type="text"
                      value={item.dose}
                      onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                      placeholder="1 قرص، بخة، ملعقة..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0B7B5E]"
                    />
                  </div>

                  {/* 5. التكرار مع الاقتراحات السريعة والكتابة اليدوية */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[11px] text-slate-700">التكرار (Frequency)</label>
                      <span className="text-[10px] text-slate-400">اختر أو اكتب بحرية</span>
                    </div>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                      placeholder="اكتب أو اختر (مثال: كل 24 ساعة، مرتين في اليوم)..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0B7B5E]"
                    />
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {FREQUENCY_SUGGESTIONS.map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => updateItem(item.id, 'frequency', freq)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            item.frequency === freq
                              ? 'bg-[#0B7B5E] text-white border-[#0B7B5E] font-bold shadow-2xs'
                              : 'bg-white hover:bg-[#E3F5EE] hover:text-[#0B7B5E] text-slate-600 border-slate-200'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. المدة مع الاقتراحات السريعة والكتابة اليدوية */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[11px] text-slate-700">المدة (Duration)</label>
                      <span className="text-[10px] text-slate-400">اختر أو اكتب بحرية</span>
                    </div>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                      placeholder="اكتب أو اختر (مثال: أسبوع، شهر، 5 أيام)..."
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0B7B5E]"
                    />
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {DURATION_SUGGESTIONS.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => updateItem(item.id, 'duration', dur)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            item.duration === dur
                              ? 'bg-[#0B7B5E] text-white border-[#0B7B5E] font-bold shadow-2xs'
                              : 'bg-white hover:bg-[#E3F5EE] hover:text-[#0B7B5E] text-slate-600 border-slate-200'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 7. تعليمات وإرشادات الاستخدام */}
                  <div className="sm:col-span-12 space-y-1">
                    <label className="font-bold text-[11px] text-slate-700">تعليمات وإرشادات الاستخدام (Instructions)</label>
                    <input
                      type="text"
                      value={item.instructions || ''}
                      onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                      placeholder="بعد الأكل مباشرة، قبل النوم، رج الزجاجة قبل الاستخدام..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-[#0B7B5E]"
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
            className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold leading-relaxed focus:outline-none focus:border-[#0B7B5E] focus:bg-white"
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D0E5DC] bg-[#E3F5EE]/60 hover:bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold transition-all cursor-pointer"
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

      {/* بيانات المريض والزيارة - اسم المريض يظهر بالكامل في سطر واحد */}
      <div
        className={`pb-3 ${
          isPlain ? 'border-b border-slate-400' : 'border-b-2 border-black'
        }`}
      >
        <div className="flex items-baseline justify-between gap-4 flex-nowrap overflow-x-hidden">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-slate-600 text-xs font-bold whitespace-nowrap">اسم المريض:</span>
            <span className="font-black text-base text-black whitespace-nowrap tracking-wide">
              {patient?.fullName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
            {patient?.age && (
              <span>السن: <strong>{patient.age} سنة</strong></span>
            )}
            <span>رقم الملف: <strong className="font-mono">{examData.fileNo || (patient as any)?.fileNumber || '---'}</strong></span>
            <span dir="ltr">Date: <strong>{examData.date || new Date().toISOString().slice(0, 10)}</strong></span>
          </div>
        </div>

        {examData.diagnosis && (
          <div className="text-xs font-bold mt-2 pt-1 border-t border-slate-100 flex items-center gap-2">
            <span className="text-slate-600">التشخيص (Diagnosis): </span>
            <span className="font-black text-black underline">{examData.diagnosis}</span>
          </div>
        )}
      </div>

      {/* رمز الروشتة ℞ والأدوية - تبدأ من الشمال بالكامل LTR */}
      <div className="space-y-4 min-h-[350px]" dir="ltr">
        <div className="text-3xl font-black text-black select-none">
          ℞
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No medications prescribed.</p>
        ) : (
          <div className="space-y-4 pl-2 text-left">
            {items.map((item, idx) => {
              const formObj = DRUG_FORMS.find((f) => f.id === item.form);
              const formEnglish = formObj ? formObj.labelEn : (item.form || 'Tablet');

              return (
                <div key={item.id || idx} className="space-y-1">
                  {/* السطر الأول: اسم الدواء (DrugName) التركيز الفورم (نوع الدواء) بالإنجليزي */}
                  <div className="flex items-baseline gap-2 flex-wrap text-sm font-black text-black">
                    <span className="text-base font-black min-w-[20px]">{idx + 1}.</span>
                    <span className="text-base tracking-wide font-black">
                      {item.drugName}
                    </span>
                    {item.concentration && (
                      <span className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-slate-100 print:bg-transparent print:border print:border-black">
                        {item.concentration}
                      </span>
                    )}
                    {formEnglish && (
                      <span className="font-bold text-slate-700 text-xs">
                        {formEnglish}
                      </span>
                    )}
                  </div>

                  {/* السطر الثاني: الجرعة والتكرار والمدة - اتجاه من اليمين للشمال RTL */}
                  <div
                    dir="rtl"
                    className="pr-6 text-xs font-bold text-slate-900 text-right flex items-center justify-start gap-2 flex-wrap"
                  >
                    {item.dose && <span>{item.dose}</span>}
                    {item.frequency && (
                      <span>{item.dose ? `• ${item.frequency}` : item.frequency}</span>
                    )}
                    {item.duration && (
                      <span className="font-black text-black">
                        • لمدة {item.duration}
                      </span>
                    )}
                  </div>

                  {/* سطر الإرشادات إن وجد - اتجاه من اليمين للشمال RTL */}
                  {item.instructions && (
                    <div dir="rtl" className="pr-6 text-[11px] font-semibold text-slate-700 text-right">
                      <span>◄ {item.instructions}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ملاحظات العلاج */}
      {examData.treatmentNotes && (
        <div dir="rtl" className="border-t border-dotted border-black pt-3 text-xs text-right">
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
