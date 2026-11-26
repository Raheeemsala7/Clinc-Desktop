'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Printer,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  FileCheck,
  Search,
  ChevronDown,
  Pencil,
  Stethoscope,
  History,
  Calendar,
  X,
  RotateCcw,
  Ruler,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { getPatientPrescriptionHistoryAction } from '../apis/examination.action';
import {
  PrescriptionMedicine,
  EntExaminationData,
} from '../types/ent-examination.types';
import {
  formatDose,
  formatFrequency,
  formatDuration,
  getDoseSuggestionsForForm,
  getDefaultDoseForForm,
  adaptDoseToNewForm,
  parseDoseShortcut,
} from '../utils/prescription-formatter';

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

export interface DrugFormOption {
  id: string;
  labelEn: string;
  labelAr: string;
  defaultDose?: string;
  isCustom?: boolean;
}

export const DRUG_FORMS: DrugFormOption[] = [
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
  { id: 'Nasal Gel', labelEn: 'Nasal Gel', labelAr: 'جل أنف موضعي' },
  { id: 'Inhaler', labelEn: 'Inhaler', labelAr: 'بخاخ استنشاق' },
  { id: 'Nebulizer Solution', labelEn: 'Nebulizer Solution', labelAr: 'محلول جلسات' },
  { id: 'Suppository', labelEn: 'Suppository', labelAr: 'لبوس' },
  { id: 'Vaginal Suppository', labelEn: 'Vaginal Suppository', labelAr: 'لبوس مهبلي' },
  { id: 'Vaginal Cream', labelEn: 'Vaginal Cream', labelAr: 'كريم مهبلي' },
  { id: 'Powder', labelEn: 'Powder', labelAr: 'مسحوق' },
  { id: 'Sachet', labelEn: 'Sachet', labelAr: 'أكياس فوار' },
  { id: 'Granules', labelEn: 'Granules', labelAr: 'حبيبات فوارة' },
  { id: 'Patch', labelEn: 'Patch', labelAr: 'لصقات جلدية' },
  { id: 'Mouthwash', labelEn: 'Mouthwash', labelAr: 'مضمضة وغسول فم' },
  { id: 'Oral Spray', labelEn: 'Oral Spray', labelAr: 'بخاخ فم وحلق' },
  { id: 'Lozenges', labelEn: 'Lozenges', labelAr: 'أقراص استحلاب' },
  { id: 'Nasal Wash', labelEn: 'Nasal Wash', labelAr: 'غسول تنظيف الأنف' },
  { id: 'Gargle', labelEn: 'Gargle', labelAr: 'غرغرة ومطهر حلق' },
  { id: 'Inhalation Solution', labelEn: 'Inhalation Solution', labelAr: 'محلول استنشاق' },
];

export const CONCENTRATION_SUGGESTIONS = [
  '100mg',
  '250mg',
  '500mg',
  '1000mg',
  '1gm',
  '0.1%',
  '0.05%',
  '5mg',
  '10mg',
  '20mg',
  '50mg',
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
  onPrintRx: (mode?: 'full' | 'plain', pageMode?: 'all' | 'front' | 'back', useDuplex?: boolean) => void;
  externalPrintRequest?: { seq: number; mode: 'full' | 'plain' } | null;
  isSaving: boolean;
  isFinishing: boolean;
}

const RX_FRONT_PAGE_LIMIT = 8;
const RX_BACK_PAGE_LIMIT = 12;

function splitPrescriptionPages(
  items: PrescriptionMedicine[],
  treatmentNotes?: string
): PrescriptionMedicine[][] {
  if (!items || items.length === 0) {
    return [[]];
  }
  const pages: PrescriptionMedicine[][] = [];
  pages.push(items.slice(0, RX_FRONT_PAGE_LIMIT));
  for (let i = RX_FRONT_PAGE_LIMIT; i < items.length; i += RX_BACK_PAGE_LIMIT) {
    pages.push(items.slice(i, i + RX_BACK_PAGE_LIMIT));
  }
  if (items.length === RX_FRONT_PAGE_LIMIT && Boolean(treatmentNotes?.trim())) {
    pages.push([]);
  }
  return pages;
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
  externalPrintRequest,
  isSaving,
  isFinishing,
}: PrescriptionViewProps) {
  const { isAr, dir, tr } = useAppLocale();
  const items = examData.prescriptionItems || [];
  const [savedDrugs, setSavedDrugs] = useState<SavedDrugItem[]>([]);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [activeFormRowId, setActiveFormRowId] = useState<string | null>(null);
  const [expandedManualEditRows, setExpandedManualEditRows] = useState<Record<string, boolean>>({});
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [twoSidedPrintState, setTwoSidedPrintState] = useState<{
    isOpen: boolean;
    mode: 'full' | 'plain';
    frontPrinted: boolean;
  }>({ isOpen: false, mode: 'plain', frontPrinted: false });

  const hasBackPage = useMemo(
    () => splitPrescriptionPages(items, examData.treatmentNotes).length > 1,
    [items, examData.treatmentNotes]
  );

  const handleSmartPrintClick = (mode: 'full' | 'plain') => {
    if (hasBackPage) {
      setTwoSidedPrintState({ isOpen: true, mode, frontPrinted: false });
    } else {
      onPrintRx(mode, 'all', false);
    }
  };

  useEffect(() => {
    if (externalPrintRequest?.seq) {
      handleSmartPrintClick(externalPrintRequest.mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrintRequest?.seq]);

  // 1. أشكال الأدوية من قاعدة البيانات والمخصصة والمحذوفة
  const [dbForms, setDbForms] = useState<DrugFormOption[]>([]);
  const [customForms, setCustomForms] = useState<DrugFormOption[]>([]);
  const [deletedFormIds, setDeletedFormIds] = useState<string[]>([]);

  // 2. الاقتراحات المخصصة والمحذوفة (الجرعة، التركيز، التكرار، المدة)
  const [customSuggestions, setCustomSuggestions] = useState<{
    dose: string[];
    concentration: string[];
    frequency: string[];
    duration: string[];
  }>({
    dose: [],
    concentration: [],
    frequency: [],
    duration: [],
  });

  const [deletedSuggestions, setDeletedSuggestions] = useState<{
    dose: string[];
    concentration: string[];
    frequency: string[];
    duration: string[];
  }>({
    dose: [],
    concentration: [],
    frequency: [],
    duration: [],
  });

  // قراءة الاقتراحات والمحذوفات من LocalStorage
  useEffect(() => {
    try {
      const savedCustomForms = localStorage.getItem('clinic_rx_custom_forms');
      if (savedCustomForms) {
        const parsed = JSON.parse(savedCustomForms);
        if (Array.isArray(parsed)) setCustomForms(parsed);
      }

      const savedDeletedForms = localStorage.getItem('clinic_rx_deleted_forms');
      if (savedDeletedForms) {
        const parsed = JSON.parse(savedDeletedForms);
        if (Array.isArray(parsed)) setDeletedFormIds(parsed);
      }

      const savedCustom = localStorage.getItem('clinic_rx_custom_suggestions');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (parsed && typeof parsed === 'object') {
          setCustomSuggestions({
            dose: Array.isArray(parsed.dose) ? parsed.dose : [],
            concentration: Array.isArray(parsed.concentration) ? parsed.concentration : [],
            frequency: Array.isArray(parsed.frequency) ? parsed.frequency : [],
            duration: Array.isArray(parsed.duration) ? parsed.duration : [],
          });
        }
      }

      const savedDeleted = localStorage.getItem('clinic_rx_deleted_suggestions');
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (parsed && typeof parsed === 'object') {
          setDeletedSuggestions({
            dose: Array.isArray(parsed.dose) ? parsed.dose : [],
            concentration: Array.isArray(parsed.concentration) ? parsed.concentration : [],
            frequency: Array.isArray(parsed.frequency) ? parsed.frequency : [],
            duration: Array.isArray(parsed.duration) ? parsed.duration : [],
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // حالة نافذة إضافة الاقتراحات أو أشكال الأدوية البديلة لـ window.prompt (تعمل بكفاءة 100% في Electron)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'suggestion' | 'form';
    field?: 'dose' | 'concentration' | 'frequency' | 'duration';
    title: string;
    label: string;
    placeholder: string;
    formEnglish: string;
    formArabic: string;
    inputValue: string;
  }>({
    isOpen: false,
    type: 'suggestion',
    title: '',
    label: '',
    placeholder: '',
    formEnglish: '',
    formArabic: '',
    inputValue: '',
  });

  const openAddFormModal = () => {
    setModalState({
      isOpen: true,
      type: 'form',
      title: tr('إضافة شكل / نوع دواء جديد (Drug Form)', 'Add New Drug Form'),
      label: tr('اسم شكل الدواء بالإنجليزي', 'Drug Form Name (English)'),
      placeholder: tr(
        'مثال: Nasal Gel, Eye Ointment, Suppository...',
        'e.g. Nasal Gel, Eye Ointment, Suppository...'
      ),
      formEnglish: '',
      formArabic: '',
      inputValue: '',
    });
  };

  const openAddSuggestionModal = (
    field: 'dose' | 'concentration' | 'frequency' | 'duration',
    titleAr: string,
    placeholder = ''
  ) => {
    setModalState({
      isOpen: true,
      type: 'suggestion',
      field,
      title: tr(`إضافة اقتراح جديد - ${titleAr}`, `Add New Suggestion - ${titleAr}`),
      label: tr(`نص الاقتراح المراد إضافته لـ (${titleAr})`, `Suggestion text for (${titleAr})`),
      placeholder: placeholder || tr('اكتب الاقتراح الجديد هنا...', 'Type new suggestion here...'),
      formEnglish: '',
      formArabic: '',
      inputValue: '',
    });
  };

  const handleSaveModal = () => {
    if (modalState.type === 'form') {
      const en = (modalState.formEnglish || '').trim();
      const ar = (modalState.formArabic || '').trim() || en;
      if (!en) {
        toast.error(tr('يرجى إدخال اسم شكل الدواء بالإنجليزي', 'Please enter English drug form name'));
        return;
      }
      const id = en.toLowerCase().replace(/\s+/g, '-');
      if (allDrugForms.some((f) => f.id === id || f.labelEn.toLowerCase() === en.toLowerCase())) {
        toast.info(tr(`"${en}" موجود بالفعل في القائمة`, `"${en}" already exists in the list`));
        setModalState((prev) => ({ ...prev, isOpen: false }));
        return;
      }
      const newForm: DrugFormOption = {
        id,
        labelEn: en,
        labelAr: ar,
        isCustom: true,
      };

      setCustomForms((prev) => {
        const next = [...prev, newForm];
        try {
          localStorage.setItem('clinic_rx_custom_forms', JSON.stringify(next));
        } catch {}
        return next;
      });

      // حفظ في قاعدة البيانات أيضاً ليتزامن مع صفحة إدارة أنواع الأدوية
      fetch('/api/drugs/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: en, nameAr: ar }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((resData) => {
          const saved = resData?.payload || resData;
          if (saved?.id) {
            setDbForms((prev) => [
              ...prev.filter((f) => f.labelEn.toLowerCase() !== en.toLowerCase()),
              {
                id: saved.id,
                labelEn: saved.name,
                labelAr: saved.nameAr,
                defaultDose: saved.defaultDose || '',
                isCustom: Boolean(saved.isCustom),
              },
            ]);
          }
        })
        .catch(() => {});

      setDeletedFormIds((prev) => {
        const next = prev.filter((x) => x !== id);
        try {
          localStorage.setItem('clinic_rx_deleted_forms', JSON.stringify(next));
        } catch {}
        return next;
      });

      toast.success(
        tr(`تمت إضافة "${en}" بنجاح إلى أشكال الأدوية`, `Added "${en}" to drug forms successfully`)
      );
      setModalState((prev) => ({ ...prev, isOpen: false }));
    } else if (modalState.field) {
      const field = modalState.field;
      const clean = (modalState.inputValue || '').trim();
      if (!clean) {
        toast.error(tr('يرجى كتابة نص الاقتراح', 'Please enter suggestion text'));
        return;
      }

      setDeletedSuggestions((prev) => {
        const next = { ...prev, [field]: prev[field].filter((x) => x !== clean) };
        try {
          localStorage.setItem('clinic_rx_deleted_suggestions', JSON.stringify(next));
        } catch {}
        return next;
      });

      setCustomSuggestions((prev) => {
        if (prev[field].includes(clean)) {
          toast.info(tr(`"${clean}" موجود بالفعل في الاقتراحات`, `"${clean}" already exists in suggestions`));
          return prev;
        }
        const next = { ...prev, [field]: [...prev[field], clean] };
        try {
          localStorage.setItem('clinic_rx_custom_suggestions', JSON.stringify(next));
        } catch {}
        return next;
      });

      toast.success(tr(`تمت إضافة "${clean}" إلى الاقتراحات بنجاح`, `Added "${clean}" to suggestions`));
      setModalState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // إغلاق أي قائمة منسدلة تلقائياً عند الضغط في أي مكان خارجها أو Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-combobox-root]')) {
        setActiveFormRowId(null);
        setActiveDropdownRowId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFormRowId(null);
        setActiveDropdownRowId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDeleteForm = (id: string, label: string) => {
    if (!confirm(tr(`هل تريد حذف "${label}" من قائمة أشكال الأدوية؟`, `Delete "${label}" from drug forms?`))) return;
    setDeletedFormIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('clinic_rx_deleted_forms', JSON.stringify(next));
      } catch {}
      return next;
    });
    setCustomForms((prev) => {
      const next = prev.filter((f) => f.id !== id);
      try {
        localStorage.setItem('clinic_rx_custom_forms', JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(tr(`تم حذف "${label}" من القائمة`, `Removed "${label}" from the list`));
  };

  const allDrugForms = useMemo(() => {
    const baseList = dbForms.length > 0 ? dbForms : DRUG_FORMS;
    const seen = new Set(baseList.map((f) => f.labelEn.toLowerCase()));
    const extras = customForms.filter((cf) => !seen.has(cf.labelEn.toLowerCase()));
    const combined = [...baseList, ...extras];
    return combined.filter((f) => !deletedFormIds.includes(f.id));
  }, [dbForms, customForms, deletedFormIds]);

  const handleRemoveSuggestion = (
    field: 'dose' | 'concentration' | 'frequency' | 'duration',
    val: string
  ) => {
    // 1. الحذف من الاقتراحات المخصصة إن وجدت
    setCustomSuggestions((prev) => {
      const next = { ...prev, [field]: prev[field].filter((x) => x !== val) };
      try {
        localStorage.setItem('clinic_rx_custom_suggestions', JSON.stringify(next));
      } catch {}
      return next;
    });
    // 2. الإضافة إلى قائمة المحذوفات لتختفي حتى لو كانت افتراضية
    setDeletedSuggestions((prev) => {
      const next = { ...prev, [field]: Array.from(new Set([...prev[field], val])) };
      try {
        localStorage.setItem('clinic_rx_deleted_suggestions', JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(tr(`تم حذف "${val}" من الاقتراحات`, `Removed "${val}" from suggestions`));
  };

  const allConcentrationList = useMemo(
    () =>
      Array.from(new Set([...CONCENTRATION_SUGGESTIONS, ...customSuggestions.concentration])).filter(
        (x) => !deletedSuggestions.concentration.includes(x)
      ),
    [customSuggestions.concentration, deletedSuggestions.concentration]
  );

  const allFrequencyList = useMemo(
    () =>
      Array.from(new Set([...FREQUENCY_SUGGESTIONS, ...customSuggestions.frequency])).filter(
        (x) => !deletedSuggestions.frequency.includes(x)
      ),
    [customSuggestions.frequency, deletedSuggestions.frequency]
  );

  const allDurationList = useMemo(
    () =>
      Array.from(new Set([...DURATION_SUGGESTIONS, ...customSuggestions.duration])).filter(
        (x) => !deletedSuggestions.duration.includes(x)
      ),
    [customSuggestions.duration, deletedSuggestions.duration]
  );

  // حساب اقتراحات الجرعات المخصصة لكل سطر حسب شكل الدواء المختار (حقنة، قرص، بخة، نقط...)
  const getDoseListForRow = (form?: string) => {
    const contextual = getDoseSuggestionsForForm(form);
    const combined = Array.from(new Set([...contextual, ...customSuggestions.dose]));
    return combined.filter((x) => !deletedSuggestions.dose.includes(x));
  };

  // 1. جلب الأدوية وأشكال الأدوية المسجلة مسبقاً من الخادم
  useEffect(() => {
    let isMounted = true;
    fetch('/api/drugs/forms')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data.payload)
          ? data.payload
          : Array.isArray(data)
          ? data
          : [];
        if (list.length > 0) {
          setDbForms(
            list.map((f: any) => ({
              id: f.id || f.name,
              labelEn: f.name,
              labelAr: f.nameAr,
              defaultDose: f.defaultDose || '',
              isCustom: Boolean(f.isCustom),
            }))
          );
        }
      })
      .catch(() => {});

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
        toast.success(
          tr(
            `تم حذف "${drugName || 'الدواء'}" من الاقتراحات`,
            `Removed "${drugName || 'medication'}" from suggestions`
          )
        );
      } else {
        toast.error(tr('فشل حذف الدواء من الاقتراحات', 'Failed to remove medication from suggestions'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حذف الدواء', 'An error occurred while deleting medication'));
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

  // 6. اختيار شكل دواء جديد مع تحديث وحدة الجرعة تلقائياً وفوراً
  const handleSelectFormForRow = (itemId: string, newForm: string) => {
    const currentItem = items.find((it) => it.id === itemId);
    const matchedForm = allDrugForms.find(
      (f) => f.labelEn.toLowerCase() === newForm.toLowerCase() || f.id.toLowerCase() === newForm.toLowerCase()
    );
    const nextDose =
      matchedForm?.defaultDose && matchedForm.defaultDose.trim()
        ? matchedForm.defaultDose.trim()
        : adaptDoseToNewForm(currentItem?.dose, newForm);

    onChange((prev) => ({
      ...prev,
      prescriptionItems: (prev.prescriptionItems || []).map((it) =>
        it.id === itemId
          ? {
              ...it,
              form: newForm,
              dose: nextDose,
            }
          : it
      ),
    }));
    setActiveFormRowId(null);
  };

  const addItem = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newItem: PrescriptionMedicine = {
      id: newId,
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

    // التمرير السلس والتركيز المباشر على حقل اسم الدواء المضاف حديثاً
    setTimeout(() => {
      const el = document.getElementById(`drug-row-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector<HTMLInputElement>('input[data-drug-input="name"]');
        if (input) input.focus();
      }
    }, 100);
  };

  const handleAutoSaveUntrackedDrugs = async () => {
    for (const item of items) {
      const name = item.drugName?.trim();
      if (!name) continue;
      const alreadySaved = savedDrugs.some(
        (d) => d.drugName.trim().toLowerCase() === name.toLowerCase()
      );
      if (!alreadySaved) {
        try {
          const res = await fetch('/api/drugs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              form: item.form || 'Tablet',
              concentration: item.concentration || '',
              dose: item.dose || '',
              frequency: item.frequency || '',
              duration: item.duration || '',
              instructions: item.instructions || '',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const saved = data?.payload || data;
            if (saved) {
              setSavedDrugs((prev) => [
                ...prev,
                {
                  id: saved.id || saved._id,
                  drugName: saved.name || name,
                  form: saved.form || item.form || 'Tablet',
                  concentration: saved.concentration || item.concentration || '',
                  dose: saved.dose || item.dose || '',
                  frequency: saved.frequency || item.frequency || '',
                  duration: saved.duration || item.duration || '',
                  instructions: saved.instructions || item.instructions || '',
                  usageCount: 1,
                },
              ]);
            }
          }
        } catch (e) {
          console.warn('Auto-save drug failed:', e);
        }
      }
    }
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

  const handleCopyEntireRx = (oldItems: any[]) => {
    if (!oldItems || !Array.isArray(oldItems) || oldItems.length === 0) return;
    const mapped: PrescriptionMedicine[] = oldItems.map((item) => ({
      id: Math.random().toString(36).substring(2, 9),
      drugName: item.drugName || '',
      form: (item.form as any) || 'Tablet',
      concentration: item.concentration || '',
      dose: item.dose || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      instructions: item.instructions || '',
    }));

    onChange((prev) => ({
      ...prev,
      prescriptionItems: [...(prev.prescriptionItems || []), ...mapped],
    }));
    toast.success(
      tr(
        `تم نسخ ${mapped.length} أصناف من الروشتة السابقة بنجاح`,
        `Copied ${mapped.length} items from previous prescription`
      )
    );
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="space-y-3.5 select-none" dir={dir}>
      {/* التشخيص الطبي للحالة (Diagnosis) - شريط سريع وأنيق في سطر واحد ومريح للعين */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#074C3A] shrink-0">
          <Stethoscope className="w-4 h-4 text-[#0B7B5E]" />
          <span>{tr('التشخيص (Diagnosis):', 'Diagnosis:')}</span>
        </div>
        <input
          type="text"
          value={examData.diagnosis || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, diagnosis: e.target.value }))
          }
          placeholder={tr(
            'اكتب التشخيص الطبي للحالة هنا (مثال: Acute Tonsillitis / Allergic Rhinitis / Sinusitis)...',
            'Enter clinical diagnosis (e.g. Acute Tonsillitis / Allergic Rhinitis / Sinusitis)...'
          )}
          className="flex-1 bg-slate-50/80 hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#074C3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B7B5E] focus:bg-white focus:ring-1 focus:ring-[#0B7B5E] transition-all"
        />
      </div>

      {/* 4. جدول إدخال الأدوية والجرعات والتكرار والمدة */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#0B7B5E]" />
            <div>
              <h4 className="font-black text-sm text-[#074C3A]">
                {tr('قائمة الأدوية الموصوفة', 'Prescribed Medications')}
              </h4>
              <p className="text-[11px] text-slate-500">
                {tr('إجمالي الأصناف:', 'Total items:')}{' '}
                <strong className="text-[#0B7B5E]">{items.length}</strong>{' '}
                {tr('دواء', items.length === 1 ? 'medication' : 'medications')}
              </p>
            </div>
          </div>

          {/* خيارات الطباعة والإضافة */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* زر طباعة روشتة كاملة */}
            <button
              type="button"
              onClick={() => handleSmartPrintClick('full')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={tr(
                'طباعة روشتة كاملة مع ترويسة العيادة واسم الطبيب',
                'Print full prescription with clinic header and doctor signature'
              )}
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{tr('طباعة كاملة (مع الترويسة)', 'Full Print (With Header)')}</span>
              {hasBackPage && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                  {tr('وجه + ظهر', 'Front + Back')}
                </span>
              )}
            </button>

            {/* زر طباعة أدوية فقط للورق الجاهز */}
            <button
              type="button"
              onClick={() => handleSmartPrintClick('plain')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition-all shadow-2xs cursor-pointer"
              title={tr(
                'طباعة على ورق عيادة مطبوع مسبقاً (تطبع فقط الأدوية والجرعات والإرشادات بدون ترويسة أو توقيع)',
                'Print on pre-printed clinic Rx paper (medications, doses, and instructions only)'
              )}
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {tr('طباعة أدوية فقط (ورق بدون ترويسة) 📄', 'Medications Only (Pre-printed) 📄')}
              </span>
              {hasBackPage && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black">
                  {tr('وجه + ظهر', 'Front + Back')}
                </span>
              )}
            </button>

            {/* زر سجل الروشتات السابقة للمريض */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-black transition-all shadow-2xs cursor-pointer"
              title={tr(
                'عرض سجل الروشتات السابقة المكتوبة لهذا المريض في زياراته السابقة وإمكانية نسخها',
                'View past prescriptions for this patient and copy items'
              )}
            >
              <History className="w-4 h-4 text-sky-600" />
              <span>{tr('الروشتات السابقة 📋', 'Past Prescriptions 📋')}</span>
            </button>

            {/* زر دليل رموز الاختصارات السريعة */}
            <button
              type="button"
              onClick={() => setShowShortcutHelp(!showShortcutHelp)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                showShortcutHelp
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-black'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
              }`}
              title={tr(
                'عرض دليل رموز وتوقيت الجرعات السريعة',
                'Show quick dosage and meal-timing shortcut guide'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{tr('دليل رموز الاختصارات ⚡', 'Shortcut Guide ⚡')}</span>
            </button>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{tr('إضافة صنف دواء', 'Add Medication')}</span>
            </button>
          </div>
        </div>

        {/* صندوق دليل رموز الاختصارات السريعة */}
        {showShortcutHelp && (
          <div className="p-4 bg-gradient-to-br from-amber-50/80 to-emerald-50/80 rounded-2xl border border-amber-200 text-xs space-y-2.5 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#074C3A] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>
                  {tr(
                    'دليل الرموز السريعة لترجمة الجرعات وتوقيت الطعام:',
                    'Quick Shortcut Guide for Dosage & Meal Timing:'
                  )}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                {tr('إغلاق ✕', 'Close ✕')}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('* أو r', '* or r')}
                </strong>
                <span className="block text-slate-700">
                  {tr('على الريق فور الاستيقاظ', 'On empty stomach upon waking')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('~ أو s', '~ or s')}
                </strong>
                <span className="block text-slate-700">
                  {tr('مساءً قبل النوم مباشرة', 'At bedtime')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('0 أو with', '0 or with')}
                </strong>
                <span className="block text-slate-700">
                  {tr('مع الأكل / وسط الطعام', 'With meals / during food')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('! أو sos', '! or sos')}
                </strong>
                <span className="block text-slate-700">
                  {tr('عند اللزوم / عند الألم', 'As needed (PRN / for pain)')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">-30</strong>
                <span className="block text-slate-700">
                  {tr('قبل الأكل بنصف ساعة', '30 mins before meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">+30</strong>
                <span className="block text-slate-700">
                  {tr('بعد الأكل بنصف ساعة', '30 mins after meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">-60</strong>
                <span className="block text-slate-700">
                  {tr('قبل الأكل بساعة', '1 hour before meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('+120 أو 120', '+120 or 120')}
                </strong>
                <span className="block text-slate-700">
                  {tr('بعد الأكل بساعتين', '2 hours after meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">-120</strong>
                <span className="block text-slate-700">
                  {tr('قبل الأكل بساعتين', '2 hours before meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">
                  {tr('+180 أو 180', '+180 or 180')}
                </strong>
                <span className="block text-slate-700">
                  {tr('بعد الأكل بثلاث ساعات', '3 hours after meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">bw</strong>
                <span className="block text-slate-700">
                  {tr('بين الوجبات', 'Between meals')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <strong className="text-amber-800 font-mono font-black text-xs">h2o</strong>
                <span className="block text-slate-700">
                  {tr('مع كوب ماء كامل', 'With a full glass of water')}
                </span>
              </div>
            </div>

            <div className="p-2 bg-white/80 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              {isAr ? (
                <>
                  💡 <strong>صيغة الاختصار:</strong> اكتب{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/3/5/-30
                  </code>{' '}
                  (قرص / 3 مرات / 5 أيام / قبل الأكل بنصف ساعة) أو{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/1/7/*
                  </code>{' '}
                  (على الريق) أو{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/1/10/~
                  </code>{' '}
                  (قبل النوم) واضغط <kbd className="bg-slate-200 px-1 rounded font-mono">Enter</kbd>{' '}
                  للترجمة الفورية.
                </>
              ) : (
                <>
                  💡 <strong>Shortcut Format:</strong> Type{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/3/5/-30
                  </code>{' '}
                  (dose / frequency / days / 30m before meals) or{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/1/7/*
                  </code>{' '}
                  (fasting) or{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#074C3A]">
                    1/1/10/~
                  </code>{' '}
                  (bedtime) and press <kbd className="bg-slate-200 px-1 rounded font-mono">Enter</kbd>{' '}
                  to auto-format.
                </>
              )}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {tr('لم تتم إضافة أي أدوية حتى الآن.', 'No medications added yet.')}
            </p>
            <p className="text-[11px] text-slate-500">
              {tr(
                'اضغط على أحد الأدوية السريعة بالأعلى أو اضغط "إضافة صنف دواء" لبدء كتابة الروشتة.',
                'Click "Add Medication" above to start writing the prescription.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                id={`drug-row-${item.id}`}
                className="p-3.5 bg-white hover:bg-[#E3F5EE]/20 rounded-2xl border border-slate-200 hover:border-[#0B7B5E]/50 transition-all shadow-2xs space-y-2.5"
              >
                {/* السطر الأول: رقم الصنف، اسم الدواء، الشكل، التركيز، اختصار الجرعة، وحذف */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                  {/* شارة الترقيم */}
                  <span className="w-7 h-7 rounded-lg bg-[#074C3A] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    #{index + 1}
                  </span>

                  {/* 1. اسم الدواء مع الإكمال التلقائي الذكي */}
                  <div className="relative flex-1 min-w-[190px]" data-combobox-root="drug">
                    <input
                      type="text"
                      data-drug-input="name"
                      value={item.drugName}
                      onFocus={() => setActiveDropdownRowId(item.id)}
                      onChange={(e) => {
                        updateItem(item.id, 'drugName', e.target.value);
                        setActiveDropdownRowId(item.id);
                      }}
                      placeholder={tr(
                        'اسم الدواء (Augmentin, Otrivin...)*',
                        'Drug Name (Augmentin, Otrivin...)*'
                      )}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B7B5E] focus:ring-1 focus:ring-[#0B7B5E]"
                    />

                    {/* قائمة الاقتراحات المنسدلة لاسم الدواء */}
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
                              </div>
                            </div>
                          ))}

                        <div
                          className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-400 font-medium text-center cursor-pointer hover:bg-slate-100"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveDropdownRowId(null);
                          }}
                        >
                          {tr('إغلاق الاقتراحات ✕', 'Close suggestions ✕')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. نوع / شكل الدواء (Form) */}
                  <div className="relative w-full sm:w-40 shrink-0" data-combobox-root="form">
                    <input
                      type="text"
                      value={item.form || ''}
                      onFocus={() => setActiveFormRowId(item.id)}
                      onChange={(e) => {
                        const newForm = e.target.value;
                        updateItem(item.id, 'form', newForm);
                        if (newForm.trim()) {
                          const adapted = adaptDoseToNewForm(item.dose, newForm);
                          if (adapted && adapted !== item.dose) {
                            updateItem(item.id, 'dose', adapted);
                          }
                        }
                        setActiveFormRowId(item.id);
                      }}
                      placeholder={tr('الشكل (Tablet...)', 'Form (Tablet...)')}
                      className="w-full h-9 ps-3 pe-7 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveFormRowId(activeFormRowId === item.id ? null : item.id)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* قائمة خيارات شكل الدواء */}
                    {activeFormRowId === item.id && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">
                        {allDrugForms
                          .filter((f) => {
                            const q = (item.form || '').toLowerCase().trim();
                            if (!q) return true;
                            return (
                              f.labelEn.toLowerCase().includes(q) ||
                              f.labelAr.toLowerCase().includes(q) ||
                              f.id.toLowerCase().includes(q)
                            );
                          })
                          .map((f) => (
                            <div
                              key={f.id}
                              className="px-3 py-1.5 hover:bg-[#E3F5EE] flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectFormForRow(item.id, f.labelEn);
                              }}
                            >
                              <span className="font-bold text-[#074C3A]">{f.labelEn}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {f.labelAr}
                              </span>
                            </div>
                          ))}
                        <div
                          className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-400 font-medium text-center cursor-pointer hover:bg-slate-100"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveFormRowId(null);
                          }}
                        >
                          {tr('إغلاق ✕', 'Close ✕')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. التركيز (Concentration) */}
                  <div className="w-full sm:w-28 shrink-0">
                    <input
                      type="text"
                      value={item.concentration || ''}
                      onChange={(e) => updateItem(item.id, 'concentration', e.target.value)}
                      placeholder={tr('التركيز (500mg)', 'Strength (500mg)')}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-[#0B7B5E]"
                    />
                  </div>

                  {/* 4. حقل اختصار الجرعة السريع (⚡ 1/3/5/-30 أو 1/1/7/* ثم Enter) */}
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder={tr(
                        '⚡ اختصار: 1/3/5/-30 أو 1/1/7/* ثم Enter',
                        '⚡ Shortcut: 1/3/5/-30 or 1/1/7/* + Enter'
                      )}
                      title={tr(
                        'اكتب اختصار الجرعة مثل 1/3/5/-30 أو 1/1/7/* (على الريق) أو 1/1/10/~ (قبل النوم) واضغط Enter',
                        'Type a dose shortcut like 1/3/5/-30, 1/1/7/* (fasting), or 1/1/10/~ (bedtime) and press Enter'
                      )}
                      className="w-full h-9 ps-3 pe-2 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 focus:bg-white font-mono text-xs font-bold text-[#074C3A] placeholder:text-emerald-700/60 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#0B7B5E] transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const parsed = parseDoseShortcut(e.currentTarget.value, item.form);
                          if (parsed) {
                            updateItem(item.id, 'dose', parsed.dose);
                            updateItem(item.id, 'frequency', parsed.frequency);
                            if (parsed.duration) updateItem(item.id, 'duration', parsed.duration);
                            if (parsed.instructions) updateItem(item.id, 'instructions', parsed.instructions);
                            toast.success(
                              tr(`✓ تمت ترجمة الاختصار: ${parsed.summary}`, `✓ Shortcut parsed: ${parsed.summary}`)
                            );
                          } else {
                            toast.info(
                              tr(
                                'اكتب الاختصار بالشكل: 1/3/5/-30 أو 1/1/7/* (جرعة / تكرار / مدة / رمز التوقيت)',
                                'Enter format: 1/3/5/-30 or 1/1/7/* (dose / frequency / days / timing)'
                              )
                            );
                          }
                        }
                      }}
                    />
                  </div>

                  {/* زر حذف الصنف */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={tr('حذف هذا الدواء', 'Delete medication')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* السطر الثاني: الفقرة التلخيصية للجرعة وزر التعديل اليدوي */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-black text-[#074C3A] flex items-center gap-1 shrink-0">
                      {tr('💊 الجرعة المحددة:', '💊 Selected Regimen:')}
                    </span>
                    {item.dose || item.frequency || item.duration || item.instructions ? (
                      <span className="font-bold text-slate-800">
                        {[
                          item.dose,
                          item.instructions,
                          item.frequency,
                          item.duration,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium italic">
                        {tr(
                          'لم يتم تحديد الجرعة بعد — اكتب اختصاراً في خانة (⚡ اختصار) واضغط Enter، أو اضغط "تعديل التفاصيل".',
                          'No dosage set yet — type a shortcut in (⚡ Shortcut) and press Enter, or click "Edit Details".'
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedManualEditRows((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#074C3A] font-bold text-[11px] border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Pencil className="w-3 h-3 text-[#0B7B5E]" />
                    <span>
                      {expandedManualEditRows[item.id]
                        ? tr('إخفاء التعديل ✕', 'Hide Details ✕')
                        : tr('تعديل التفاصيل ✏️', 'Edit Details ✏️')}
                    </span>
                  </button>
                </div>

                {/* الدرج المنسدل للتعديل اليدوي إن رغب الطبيب في إدخال القيم يدوياً */}
                {expandedManualEditRows[item.id] && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 pb-1 border-t border-slate-100 animate-in fade-in-50 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {tr('الجرعة (Dose):', 'Dose:')}
                      </label>
                      <input
                        type="text"
                        value={item.dose}
                        onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                        placeholder={tr('قرص واحد، 5 سم...', '1 tablet, 5 ml...')}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {tr('التكرار (Frequency):', 'Frequency:')}
                      </label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                        onBlur={(e) => {
                          const formatted = formatFrequency(e.target.value);
                          if (formatted !== e.target.value) {
                            updateItem(item.id, 'frequency', formatted);
                          }
                        }}
                        placeholder={tr('3 مرات في اليوم...', '3 times daily...')}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {tr('المدة (Duration):', 'Duration:')}
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                        onBlur={(e) => {
                          const formatted = formatDuration(e.target.value);
                          if (formatted !== e.target.value) {
                            updateItem(item.id, 'duration', formatted);
                          }
                        }}
                        placeholder={tr('لمدة 5 أيام...', 'For 5 days...')}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {tr('التعليمات (Instructions):', 'Instructions:')}
                      </label>
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                        placeholder={tr('قبل الأكل بنصف ساعة...', '30 mins before meals...')}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ملاحظات وإرشادات الطبيب للمريض */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          <label className="font-bold text-xs text-slate-700 block">
            {tr('ملاحظات وإرشادات عامة للمريض (Treatment Notes):', 'General Patient Notes & Instructions:')}
          </label>
          <textarea
            rows={3}
            value={examData.treatmentNotes || ''}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, treatmentNotes: e.target.value }))
            }
            placeholder={tr(
              'تعليمات إضافية مثل: الراحة التامة، شرب سوائل دافئة، تجنب المأكولات الحارة...',
              'Additional instructions e.g. complete rest, warm fluids, avoid spicy foods...'
            )}
            className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold leading-relaxed focus:outline-none focus:border-[#0B7B5E] focus:bg-white"
          />
        </div>
      </div>

      {/* 5. شريط الإجراءات السفلي */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={onBackToExam}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          {isAr ? (
            <ArrowRight className="w-4 h-4 text-slate-600" />
          ) : (
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          )}
          <span>{tr('العودة لتعديل استمارة الكشف الطبي', 'Back to Examination Form')}</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              await handleAutoSaveUntrackedDrugs();
              onSave();
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>{isSaving ? tr('جاري الحفظ...', 'Saving...') : tr('حفظ التعديلات', 'Save Changes')}</span>
          </button>

          {/* معاينة المقاسات والمسافات بالمسطرة قبل الطباعة */}
          <button
            type="button"
            onClick={() => setIsPrintPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black transition-all cursor-pointer"
            title={tr(
              'معاينة الورقة بالمسطرة والتحقق من كافة المسافات بالسنتيمتر قبل الطباعة',
              'Preview Rx paper with cm ruler guides before printing'
            )}
          >
            <Ruler className="w-4 h-4 text-amber-700" />
            <span>{tr('معاينة المقاسات والمسافات 📏', 'Layout & Ruler Preview 📏')}</span>
          </button>

          {/* طباعة أدوية فقط للورق المطبوع مسبقاً */}
          <button
            type="button"
            onClick={() => handleSmartPrintClick('plain')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition-all cursor-pointer"
            title={tr(
              'طباعة أدوية فقط بدون ترويسة أو توقيع (للورق الجاهز)',
              'Print medications only without header or signature (pre-printed paper)'
            )}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {tr('طباعة أدوية فقط (ورق بدون ترويسة) 📄', 'Medications Only (Pre-printed) 📄')}
            </span>
          </button>

          {/* طباعة روشتة كاملة */}
          <button
            type="button"
            onClick={() => handleSmartPrintClick('full')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D0E5DC] bg-[#E3F5EE]/60 hover:bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{tr('طباعة كاملة', 'Full Print')}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await handleAutoSaveUntrackedDrugs();
              onFinish();
            }}
            disabled={isFinishing}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isFinishing
                ? tr('جاري إنهاء الكشف...', 'Finishing...')
                : tr('إنهاء الكشف وتسليم للاستقبال', 'Finish & Send to Reception')}
            </span>
          </button>
        </div>
      </div>

      {/* نافذة إضافة شكل دواء أو اقتراح جديد داخل التطبيق (بديل موثوق لـ window.prompt في بيئة Electron) */}
      {modalState.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-[#074C3A]">
                {modalState.title}
              </h3>
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {modalState.type === 'form' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr('اسم شكل الدواء بالإنجليزي (English Name):', 'Drug Form Name (English):')}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={modalState.formEnglish || ''}
                    onChange={(e) =>
                      setModalState((prev) => ({ ...prev, formEnglish: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveModal();
                      }
                    }}
                    placeholder={tr(
                      'مثال: Nasal Gel, Eye Ointment, Suppository...',
                      'e.g. Nasal Gel, Eye Ointment, Suppository...'
                    )}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr('الاسم بالعربي (اختياري):', 'Arabic Name (Optional):')}
                  </label>
                  <input
                    type="text"
                    value={modalState.formArabic || ''}
                    onChange={(e) =>
                      setModalState((prev) => ({ ...prev, formArabic: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveModal();
                      }
                    }}
                    placeholder={tr(
                      'مثال: جل أنف، مرهم للعين، تحاميل...',
                      'e.g. جل أنف، مرهم للعين، تحاميل...'
                    )}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalState.label}:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={modalState.inputValue || ''}
                  onChange={(e) =>
                    setModalState((prev) => ({ ...prev, inputValue: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveModal();
                    }
                  }}
                  placeholder={modalState.placeholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B7B5E]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {tr('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B7B5E] hover:bg-[#09634C] transition-colors cursor-pointer shadow-xs"
              >
                {tr('حفظ وإضافة للقائمة', 'Save & Add to List')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة سجل الروشتات السابقة للمريض */}
      <PatientPrescriptionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        patientId={patient?.id || patient?._id || (patient as any)?.patientId}
        patientName={patient?.fullName}
        onSelectDrug={addQuickDrug}
        onCopyEntireRx={handleCopyEntireRx}
      />

      {/* نافذة معاينة المقاسات والمسافات بالمسطرة بالسنتيمتر */}
      {isPrintPreviewOpen && (
        <div
          className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-xs flex flex-col p-3 sm:p-5 print:hidden animate-in fade-in duration-150"
          dir={dir}
          onClick={() => setIsPrintPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl mx-auto flex flex-col max-h-[94vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* رأس نافذة المعاينة */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#074C3A]">
                    {tr(
                      'معاينة الطباعة والتحقق من المسافات بالسنتيمتر (16.5cm × 24cm)',
                      'Print Preview & CM Ruler Calibration (16.5cm × 24cm)'
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {tr(
                      'تحقق من موضع الاسم (6.00cm / يمين 0.5cm) والسن والتاريخ العربي والكود (شمال 2.1cm) والأدوية (شمال 3.5cm) والهامش السفلي (1.5cm)',
                      'Verify positions: Name (6.00cm / R 0.5cm), Age, Arabic Date, Code (L 2.1cm), Drugs (L 3.5cm), Bottom Margin (1.5cm)'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPrintGuides((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showPrintGuides
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {showPrintGuides
                      ? tr('إخفاء خطوط القياس', 'Hide Ruler Guides')
                      : tr('إظهار خطوط القياس', 'Show Ruler Guides')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrintPreviewOpen(false);
                    setTimeout(() => handleSmartPrintClick('plain'), 100);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr('طباعة الآن / حفظ PDF', 'Print Now / Save PDF')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* منطقة عرض الورقة الفعلية مع المسطرة */}
            <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-6 flex flex-col items-center gap-6">
              <div className="text-xs font-bold text-slate-700 bg-white/90 px-4 py-2 rounded-xl border border-slate-300 shadow-2xs text-center">
                {isAr ? (
                  <>
                    💡 نصيحة للتجربة العملية: اضغط <strong>&quot;طباعة الآن&quot;</strong> واطبع على{' '}
                    <strong>ورقة بيضاء عادية A4</strong> (أو احفظها PDF) ثم ضع الورقة المطبوعة فوق الروشتة الأصلية أمام الإضاءة للتأكد 100% من تطابق السنتيمترات.
                  </>
                ) : (
                  <>
                    💡 Calibration tip: Click <strong>&quot;Print Now&quot;</strong> on plain{' '}
                    <strong>A4 white paper</strong> (or Save as PDF), then hold it over the pre-printed Rx sheet against light to verify exact cm alignment.
                  </>
                )}
              </div>

              <div className="shadow-2xl rounded-sm overflow-hidden border border-slate-400 bg-white">
                <PrintablePrescriptionSlip
                  examData={examData}
                  patient={patient}
                  doctor={doctor}
                  printMode="plain"
                  showGuides={showPrintGuides}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة خيارات الطباعة على الوجهين (وجه أول ثم ظهر نفس الورقة) عند زيادة الأدوية عن 8 */}
      {twoSidedPrintState.isOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150"
          dir={dir}
          onClick={() => setTwoSidedPrintState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0B7B5E] flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#074C3A]">
                    {tr(
                      `الروشتة تتطلب وجهين (وجه + ظهر نفس الورقة — ${items.length} أصناف)`,
                      `Two-Sided Prescription Required (Front + Back — ${items.length} items)`
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {tr(
                      'لمنع الطابعة من سحب ورقة ثانية جديدة، اطبع الوجه الأول أولاً ثم اقلب نفس الورقة لطباعة الظهر',
                      'To prevent pulling a second sheet, print the front first, flip the same sheet, then print the back'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTwoSidedPrintState((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* الطريقة 1: طباعة الوجه الأول ثم قلب الورقة لطباعة الظهر (للطابعات العادية) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#074C3A]">
                  {tr(
                    '1. الطريقة المضمونة (اقلب نفس الورقة يدوياً — تعمل مع جميع الطابعات):',
                    '1. Manual Flip Method (works with all printers):'
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onPrintRx(twoSidedPrintState.mode, 'front', false);
                    setTwoSidedPrintState((prev) => ({ ...prev, frontPrinted: true }));
                  }}
                  className="px-4 py-3 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{tr('1️⃣ طباعة الوجه الأول فقط (1/2)', '1️⃣ Print Front Only (1/2)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPrintRx(twoSidedPrintState.mode, 'back', false);
                  }}
                  className={`px-4 py-3 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    twoSidedPrintState.frontPrinted
                      ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                      : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300'
                  }`}
                >
                  <span>
                    {tr('2️⃣ طباعة الظهر على نفس الورقة (2/2)', '2️⃣ Print Back on Same Sheet (2/2)')}
                  </span>
                </button>
              </div>

              {twoSidedPrintState.frontPrinted && (
                <p className="text-[11px] font-black text-amber-900 bg-amber-100 px-3 py-2 rounded-xl border border-amber-300 text-center">
                  {tr(
                    '⚠️ اقلب نفس الورقة التي خرجت الآن وأعد إدخالها في الطابعة ثم اضغط "طباعة الظهر على نفس الورقة (2/2)"',
                    '⚠️ Flip the printed sheet, re-insert it into the printer, then click "Print Back on Same Sheet (2/2)"'
                  )}
                </p>
              )}
            </div>

            {/* الطريقة 2: طباعة الوجهين أوتوماتيكياً معاً */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-bold">
                {tr(
                  '2. للطابعات المزوّدة بوحدة قلب أوتوماتيك (Auto-Duplex) فقط أو حفظ PDF (الطابعات العادية ستسحب ورقة ثانية):',
                  '2. Auto-Duplex printers or Save as PDF only (standard printers will feed a second sheet):'
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTwoSidedPrintState((prev) => ({ ...prev, isOpen: false }));
                  onPrintRx(twoSidedPrintState.mode, 'all', true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                {tr('طباعة الوجهين معاً ⚡', 'Print Both Sides ⚡')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * نموذج الروشتة الطبية الجاهز للطباعة المباشرة على ورقة A5 / A4
 * يدعم نمطين:
 * 1. 'full': روشتة كاملة مع ترويسة العيادة واسم الطبيب وتوقيعه
 * 2. 'plain': طباعة فقط أسماء الأدوية والجرعات والإرشادات (للورق المطبوع مسبقاً) بخلفية بيضاء نقية وتنسيق مرتب
 */
/**
 * نموذج الروشتة الطبية الجاهز للطباعة الدقيقة على ورق العيادة المطبوع مسبقاً
 * المقاسات المعتمدة لطابعة العيادة (ورق الروشتة 16.5cm × 24cm):
 * - طول الورقة: 24cm
 * - إزالة الخط الأخضر الجانبي بالكامل عند الطباعة
 * - طباعة الاسم (top: 6.00cm, right: 0.5cm, 12.5px)، السن (top: 6.02cm, left: 8.95cm)، التاريخ العربي ٢٥ / ١١ / ٢٠٢٦ (top: 6.00cm)، والكود (top: 6.02cm, left: 2.1cm)
 * - هامش الأدوية الأيسر: 3.5cm بالضبط
 * - هامش سفلي: 1.5cm فقط لاستيعاب حتى 8 أدوية في الوجه الأول
 * - ظهر الورقة (الصفحة الثانية): يبدأ من الأعلى بهامش علوي 3cm وهامش أيسر 3.5cm ويدعم الطباعة اليدوية والآلية
 * - التعليمات الإضافية: هامش أيمن 2cm
 */
function toArabicDigits(value: string): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(value).replace(/\d/g, (d) => map[Number(d)] ?? d);
}

export function PrintablePrescriptionSlip({
  examData,
  patient,
  doctor,
  printMode = 'full',
  showGuides = false,
  pageMode = 'all',
}: {
  examData: EntExaminationData;
  patient: any;
  doctor?: any;
  printMode?: 'full' | 'plain';
  showGuides?: boolean;
  pageMode?: 'all' | 'front' | 'back';
}) {
  const items = examData.prescriptionItems || [];

  // تقسيم الأدوية: الوجه الأول يستوعب حتى 8 أدوية (من 10cm حتى 1.5cm من الأسفل)
  // وما يزيد (أو التعليمات مع 8 أدوية) يُطبع في ظهر الورقة بدءاً من 3cm من الأعلى
  const pages = splitPrescriptionPages(items, examData.treatmentNotes);

  const visiblePages = pages
    .map((pageItems, originalIndex) => ({ pageItems, originalIndex }))
    .filter(({ originalIndex }) => {
      if (pageMode === 'front') return originalIndex === 0;
      if (pageMode === 'back') return originalIndex > 0;
      return true;
    });

  // تنسيق الاسم والسن والتاريخ العربي (٢٥  ١١  ٢٦) والكود للطباعة على الوجه الأول
  const patientNameText = patient?.fullName || '';
  const patientAgeText = (() => {
    const rawAge = patient?.age;
    let resolved = '';
    if (
      rawAge !== undefined &&
      rawAge !== null &&
      String(rawAge).trim() !== '' &&
      Number(rawAge) !== 0
    ) {
      resolved = String(rawAge).trim();
    } else {
      const dobRaw = patient?.dateOfBirth || patient?.birthDate;
      if (dobRaw) {
        const dob = new Date(dobRaw);
        if (!Number.isNaN(dob.getTime())) {
          const today = new Date();
          let years = today.getFullYear() - dob.getFullYear();
          const mDiff = today.getMonth() - dob.getMonth();
          if (mDiff < 0 || (mDiff === 0 && today.getDate() < dob.getDate())) {
            years -= 1;
          }
          if (years > 0) {
            resolved = String(years);
          } else if (years === 0) {
            const months = Math.max(
              1,
              (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth())
            );
            return `${toArabicDigits(String(months))} شهر`;
          }
        }
      }
    }
    if (!resolved) return '';
    return /[a-zA-Z\u0600-\u06FF]/.test(resolved)
      ? toArabicDigits(resolved)
      : `${toArabicDigits(resolved)} سنة`;
  })();
  const patientCodeText = patient?.fileNumber || examData.fileNo || '';
  const rawDate = examData.date || new Date().toISOString().slice(0, 10);
  const dateParts = (() => {
    const m = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return {
        year2Ar: toArabicDigits(m[1].slice(-2)),
        monthAr: toArabicDigits(m[2]),
        dayAr: toArabicDigits(m[3]),
        fallbackAr: '',
      };
    }
    return {
      year2Ar: '',
      monthAr: '',
      dayAr: '',
      fallbackAr: toArabicDigits(rawDate),
    };
  })();

  return (
    <>
      {/* ستايل الطباعة الدقيق لمقاسات ورق روشتة د. إسلام ومنع أي خطوط جانبية أو ورق فارغ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: 16.5cm 24cm;
          margin: 0;
        }
        @media print {
          html, body {
            width: auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          [data-slot="sidebar"],
          [data-slot="sidebar-container"],
          [data-slot="sidebar-gap"],
          [data-slot="sidebar-rail"],
          aside {
            display: none !important;
            width: 0 !important;
          }
          .rx-print-wrapper {
            width: 16.5cm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .rx-print-page {
            position: relative !important;
            width: 16.5cm !important;
            height: 23.9cm !important;
            max-height: 23.9cm !important;
            box-sizing: border-box !important;
            padding-bottom: 1.5cm !important;
            padding-left: 3.5cm !important;
            padding-right: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .rx-print-page-front {
            padding-top: 9.8cm !important;
          }
          .rx-print-page-back {
            padding-top: 3cm !important;
          }
          .rx-print-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .rx-print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}} />

      <div className="rx-print-wrapper" dir="ltr">
        {visiblePages.map(({ pageItems, originalIndex }, renderIdx) => {
          const isFirstPage = originalIndex === 0;
          const isLastPage = originalIndex === pages.length - 1;
          const isLastRenderedPage = renderIdx === visiblePages.length - 1;

          return (
            <div
              key={originalIndex}
              dir="ltr"
              className={`rx-print-page ${isFirstPage ? 'rx-print-page-front' : 'rx-print-page-back'} bg-white text-black font-sans relative box-border`}
              style={{
                width: '16.5cm',
                height: '23.9cm',
                maxHeight: '23.9cm',
                boxSizing: 'border-box',
                paddingTop: isFirstPage ? '9.8cm' : '3cm',
                paddingBottom: '1.5cm',
                paddingLeft: '3.5cm',
                paddingRight: '0',
                pageBreakAfter: isLastRenderedPage ? 'avoid' : 'always',
                breakAfter: isLastRenderedPage ? 'avoid' : 'page',
                overflow: 'hidden',
              }}
            >
              {/* بيانات المريض في الوجه الأول فقط حسب الإحداثيات المليمترية الدقيقة */}
              {showGuides && (
                <div className="print:hidden pointer-events-none select-none">
                  {/* شريط الهامش الأيسر 3.5cm */}
                  <div
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '3.5cm' }}
                    className="bg-sky-400/15 border-r-2 border-dashed border-sky-500 flex items-center justify-center"
                  >
                    <span className="bg-sky-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded -rotate-90 whitespace-nowrap">
                      هامش أيسر 3.5cm
                    </span>
                  </div>

                  {/* شريط الهامش السفلي 1.5cm */}
                  <div
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5cm' }}
                    className="bg-rose-400/15 border-t-2 border-dashed border-rose-500 flex items-center justify-center"
                  >
                    <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      هامش سفلي 1.5cm
                    </span>
                  </div>

                  {/* شريط هامش التعليمات الأيمن 2cm */}
                  <div
                    style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '2cm' }}
                    className="bg-amber-400/10 border-l border-dashed border-amber-500"
                  >
                    <span
                      style={{ position: 'absolute', bottom: '2cm', right: '0.1cm' }}
                      className="bg-amber-600 text-white text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                    >
                      يمين 2cm
                    </span>
                  </div>

                  {isFirstPage ? (
                    <>
                      {/* خط سطر الاسم والتاريخ والكود 6.02cm */}
                      <div
                        style={{ position: 'absolute', top: '6.02cm', left: 0, right: 0 }}
                        className="border-t-2 border-dashed border-rose-500"
                      >
                        <span className="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          سطر البيانات 6.02cm
                        </span>
                      </div>

                      {/* خط بداية الأدوية 9.8cm */}
                      <div
                        style={{ position: 'absolute', top: '9.8cm', left: 0, right: 0 }}
                        className="border-t-2 border-dashed border-emerald-500"
                      >
                        <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          بداية الأدوية ~10cm
                        </span>
                      </div>
                    </>
                  ) : (
                    /* خط بداية ظهر الورقة 3cm */
                    <div
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3cm' }}
                      className="bg-emerald-400/15 border-b-2 border-dashed border-emerald-500 flex items-end justify-center pb-1"
                    >
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        ظهر الورقة: هامش علوي 3cm
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isFirstPage && (
                <>
                  {/* الاسم: حجم 12.5px مضبوط في خانة الاسم على اليمين (right: 0.1cm) */}
                  {patientNameText && (
                    <div
                      dir="rtl"
                      style={{
                        position: 'absolute',
                        top: '6.00cm',
                        right: '0.1cm',
                        maxWidth: '5.5cm',
                      }}
                      className="text-[12.5px] font-black text-black text-right leading-none whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {patientNameText}
                    </div>
                  )}

                  {/* السن: في خانة السن مضبوطة تماماً تحت (السن :) عند 11.4cm */}
                  {patientAgeText && (
                    <div
                      dir="rtl"
                      style={{
                        position: 'absolute',
                        top: '6.02cm',
                        left: '11.4cm',
                        width: '1.8cm',
                      }}
                      className="text-[11.5px] font-black text-black text-center leading-none whitespace-nowrap"
                    >
                      {patientAgeText}
                    </div>
                  )}

                  {/* التاريخ العربي (٢٥ / ١١ / ٢٠٢٦): مضبوط تماماً في خانة (التاريخ : / / 20) عند 8.4cm - 9.8cm */}
                  {dateParts.year2Ar ? (
                    <>
                      <div
                        dir="ltr"
                        style={{
                          position: 'absolute',
                          top: '6.00cm',
                          left: '8.40cm',
                        }}
                        className="text-[11.5px] font-bold text-black leading-none whitespace-nowrap"
                      >
                        {dateParts.year2Ar}
                      </div>
                      <div
                        dir="ltr"
                        style={{
                          position: 'absolute',
                          top: '6.00cm',
                          left: '8.85cm',
                          width: '0.6cm',
                        }}
                        className="text-[11.5px] font-bold text-black text-center leading-none whitespace-nowrap"
                      >
                        {dateParts.monthAr}
                      </div>
                      <div
                        dir="ltr"
                        style={{
                          position: 'absolute',
                          top: '6.00cm',
                          left: '9.45cm',
                          width: '0.6cm',
                        }}
                        className="text-[11.5px] font-bold text-black text-center leading-none whitespace-nowrap"
                      >
                        {dateParts.dayAr}
                      </div>
                    </>
                  ) : (
                    dateParts.fallbackAr && (
                      <div
                        dir="ltr"
                        style={{
                          position: 'absolute',
                          top: '6.00cm',
                          left: '8.50cm',
                        }}
                        className="text-[11.5px] font-bold text-black leading-none whitespace-nowrap"
                      >
                        {dateParts.fallbackAr}
                      </div>
                    )
                  )}

                  {/* الكود: مضبوط على خط الرقم بجانب (رقم :) داخل الصفحة عند 4.2cm */}
                  {patientCodeText && (
                    <div
                      dir="ltr"
                      style={{
                        position: 'absolute',
                        top: '6.02cm',
                        left: '4.20cm',
                      }}
                      className="text-xs sm:text-sm font-black font-mono text-black leading-none whitespace-nowrap"
                    >
                      {patientCodeText}
                    </div>
                  )}
                </>
              )}

              {/* قائمة الأدوية الموصوفة بنقاط (•) مع هامش أيسر 3.5cm لاستغلال المساحة حتى 1.5cm أسفل الورقة */}
              {pageItems.length > 0 ? (
                <div style={{ paddingRight: '1.2cm' }} dir="ltr">
                  <div className="space-y-2 text-left">
                    {pageItems.map((item, idx) => {
                      const formObj = DRUG_FORMS.find(
                        (f) => f.id.toLowerCase() === (item.form || '').toLowerCase()
                      );
                      const formEnglish = formObj ? formObj.labelEn : (item.form || 'Tablet');

                      // ترجمة الجرعة والتكرار والمدة للصياغة الطبية المطلوبة
                      const displayDose = formatDose(item.dose, item.form);
                      const displayFrequency = formatFrequency(item.frequency);
                      const rawDuration = formatDuration(item.duration);
                      const displayDuration = rawDuration
                        ? (rawDuration.startsWith('لمدة') ? rawDuration : `لمدة ${rawDuration}`)
                        : '';

                      return (
                        <div key={item.id || idx} className="space-y-0.5 text-left leading-tight">
                          {/* السطر الأول: نقطة (•) + اسم الدواء + التركيز + الشكل */}
                          <div className="flex items-baseline gap-1.5 flex-wrap font-black text-black">
                            <span className="text-base font-black min-w-[10px] text-slate-900">•</span>
                            <span className="text-[14px] tracking-wide font-black text-slate-950">
                              {item.drugName}
                            </span>
                            {item.concentration && (
                              <span className="font-mono font-bold text-[11px] px-1 py-0 rounded border border-black/40 text-black">
                                {item.concentration}
                              </span>
                            )}
                            {formEnglish && (
                              <span className="font-bold text-[11px] px-1 py-0 rounded border border-black/40 text-black">
                                {formEnglish}
                              </span>
                            )}
                          </div>

                          {/* السطر الثاني: الجرعة والتكرار والمدة أسفل اسم الدواء */}
                          <div className="pl-4 space-y-0 text-left">
                            <div className="text-[11px] font-bold flex items-center gap-1.5 flex-wrap text-black">
                              {displayDose && (
                                <span className="font-black">{displayDose}</span>
                              )}
                              {displayFrequency && (
                                <span className="font-bold">
                                  {displayDose ? '▪ ' : ''}{displayFrequency}
                                </span>
                              )}
                              {displayDuration && (
                                <span className="font-black">
                                  {(displayDose || displayFrequency) ? '▪ ' : ''}
                                  {displayDuration}
                                </span>
                              )}
                            </div>

                            {/* سطر الإرشادات والتعليمات الخاصة بالدواء إن وجد */}
                            {item.instructions && (
                              <div className="text-[10.5px] font-semibold text-slate-800" dir="rtl">
                                <span>◄ {item.instructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : isFirstPage ? (
                <div style={{ paddingRight: '1.2cm' }} dir="ltr">
                  <p className="text-sm text-slate-400 italic">No medications prescribed.</p>
                </div>
              ) : null}

              {/* ملاحظات العلاج الإضافية إن وجدت (تظهر في الصفحة الأخيرة مع هامش يمين 2cm) */}
              {isLastPage && examData.treatmentNotes && (
                <div
                  dir="rtl"
                  style={{ paddingRight: '2cm' }}
                  className="mt-3 pt-2 border-t border-dotted border-black/50 text-[11px] text-right"
                >
                  <span className="font-bold text-black block mb-0.5">تعليمات إضافية:</span>
                  <p className="text-slate-800 whitespace-pre-line leading-4">
                    {examData.treatmentNotes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

interface PatientPrescriptionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  onSelectDrug: (drug: any) => void;
  onCopyEntireRx: (items: any[]) => void;
}

export function PatientPrescriptionHistoryModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSelectDrug,
  onCopyEntireRx,
}: PatientPrescriptionHistoryModalProps) {
  const { isAr, dir, tr } = useAppLocale();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !patientId) return;
    setIsLoading(true);
    getPatientPrescriptionHistoryAction(patientId)
      .then((res) => {
        if (res && res.status && res.payload) {
          const list = Array.isArray(res.payload)
            ? res.payload
            : Array.isArray((res.payload as any).data)
            ? (res.payload as any).data
            : [];
          setPrescriptions(list);
        } else {
          setPrescriptions([]);
        }
      })
      .catch((e) => {
        console.warn('Failed to load patient Rx history:', e);
        setPrescriptions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in-50">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        dir={dir}
      >
        {/* رأس النافذة */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#074C3A]">
                {tr('سجل الروشتات السابقة للمريض', 'Patient Prescription History')}
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                {tr('المريض:', 'Patient:')}{' '}
                <strong className="text-slate-800">
                  {patientName || tr('المريض الحالي', 'Current Patient')}
                </strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {tr('جاري استرجاع روشتات الزيارات السابقة...', 'Loading past visit prescriptions...')}
              </p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">
                {tr('لا توجد روشتات سابقة مسجلة', 'No previous prescriptions recorded')}
              </h4>
              <p className="text-xs text-slate-400">
                {tr(
                  'هذا المريض ليس لديه روشتات محفوظة من زيارات سابقة حتى الآن.',
                  'This patient has no saved prescriptions from earlier visits yet.'
                )}
              </p>
            </div>
          ) : (
            prescriptions.map((rx, idx) => {
              const rxDate = rx.createdAt
                ? new Date(rx.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : tr('زيارة سابقة', 'Previous Visit');
              const itemsList = Array.isArray(rx.items) ? rx.items : [];

              return (
                <div
                  key={rx.id || rx._id || idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 p-4 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-xs sm:text-sm font-black text-slate-800">
                        {tr(`روشتة تاريخ: ${rxDate}`, `Prescription Date: ${rxDate}`)}
                      </span>
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                        {tr(
                          `${itemsList.length} أصناف`,
                          `${itemsList.length} ${itemsList.length === 1 ? 'item' : 'items'}`
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCopyEntireRx(itemsList)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                      title={tr(
                        'نسخ جميع أصناف هذه الروشتة إلى الروشتة الحالية',
                        'Copy all medications from this prescription'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr('نسخ الروشتة بالكامل', 'Copy Entire Rx')}</span>
                    </button>
                  </div>

                  {/* قائمة الأدوية في هذه الروشتة */}
                  <div className="space-y-2" dir="ltr">
                    {itemsList.map((it: any, iIdx: number) => (
                      <div
                        key={it.id || iIdx}
                        className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-3 text-left"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-900">• {it.drugName}</span>
                            {it.concentration && (
                              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                                {it.concentration}
                              </span>
                            )}
                            {it.form && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {it.form}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2 flex-wrap">
                            {it.dose && <span className="text-amber-800">{it.dose}</span>}
                            {it.frequency && <span>▪ {it.frequency}</span>}
                            {it.duration && <span>▪ {it.duration}</span>}
                            {it.instructions && <span className="text-rose-700" dir="rtl">({it.instructions})</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectDrug(it);
                            toast.success(
                              tr(
                                `تمت إضافة "${it.drugName}" إلى الروشتة الحالية`,
                                `Added "${it.drugName}" to current prescription`
                              )
                            );
                          }}
                          className="shrink-0 p-1.5 rounded-lg border border-slate-200 hover:border-[#0B7B5E] hover:bg-[#E3F5EE] text-slate-600 hover:text-[#074C3A] transition-all cursor-pointer"
                          title={tr(
                            'إضافة هذا الصنف منفرداً للروشتة الحالية',
                            'Add this medication to current prescription'
                          )}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ذيل النافذة */}
        <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {tr('إغلاق', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
