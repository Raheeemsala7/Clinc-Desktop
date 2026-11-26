'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Pencil,
  BarChart3,
  Calendar,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { DrugItem, DrugAnalyticsData } from '../types/drug.types';
import { parseDoseShortcut, adaptDoseToNewForm } from '@/features/examination/utils/prescription-formatter';

const FORM_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Ampoule',
  'Vial',
  'Nasal Spray',
  'Nasal Drops',
  'Ear Drops',
  'Eye Drops',
  'Oral Drops',
  'Lozenges',
  'Sachet',
  'Suppository',
  'Cream',
  'Ointment',
  'Inhaler',
  'Gargle',
  'Mouthwash',
];

export function DrugsManagementView() {
  const { isAr, dir, tr } = useAppLocale();
  const [activeTab, setActiveTab] = useState<'catalog' | 'forms' | 'analytics'>('catalog');
  const [drugs, setDrugs] = useState<DrugItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'month' | '6months' | '1year' | 'month-select' | 'range'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState<DrugAnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');

  // فلترة الأدوية الأكثر استخداماً حسب البحث الفوري
  const filteredAnalyticsItems = useMemo(() => {
    if (!analyticsData?.items) return [];
    if (!analyticsSearchQuery.trim()) return analyticsData.items;
    const q = analyticsSearchQuery.trim().toLowerCase();
    return analyticsData.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.concentration && item.concentration.toLowerCase().includes(q)) ||
        (item.form && item.form.toLowerCase().includes(q))
    );
  }, [analyticsData?.items, analyticsSearchQuery]);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<DrugItem | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    form: 'Tablet',
    concentration: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
    shortcutInput: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Custom Forms State (إدارة الأشكال والأنواع الدوائية الكاملة للطبيب)
  const [customForms, setCustomForms] = useState<
    Array<{ id: string; name: string; nameAr: string; defaultDose?: string; defaultInstructions?: string; isCustom?: boolean }>
  >([]);
  const [formsSearchQuery, setFormsSearchQuery] = useState('');
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<{
    id: string;
    name: string;
    nameAr: string;
    defaultDose?: string;
    isCustom?: boolean;
  } | null>(null);
  const [newFormInput, setNewFormInput] = useState({ name: '', nameAr: '', defaultDose: '' });
  const [isSavingForm, setIsSavingForm] = useState(false);

  const fetchCustomForms = async () => {
    try {
      const res = await fetch('/api/drugs/forms');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.payload) ? data.payload : Array.isArray(data) ? data : [];
        setCustomForms(list);
      }
    } catch {}
  };

  const filteredForms = useMemo(() => {
    if (!formsSearchQuery.trim()) return customForms;
    const q = formsSearchQuery.trim().toLowerCase();
    return customForms.filter(
      (cf) =>
        cf.name.toLowerCase().includes(q) ||
        cf.nameAr.toLowerCase().includes(q) ||
        (cf.defaultDose && cf.defaultDose.toLowerCase().includes(q))
    );
  }, [customForms, formsSearchQuery]);

  const allFormOptions = useMemo(() => {
    const base = [...FORM_OPTIONS];
    customForms.forEach((cf) => {
      if (!base.includes(cf.name)) {
        base.push(cf.name);
      }
    });
    return base;
  }, [customForms]);

  const handleOpenAddFormModal = () => {
    setEditingForm(null);
    setNewFormInput({ name: '', nameAr: '', defaultDose: '' });
    setIsAddFormModalOpen(true);
  };

  const handleOpenEditFormModal = (form: {
    id: string;
    name: string;
    nameAr: string;
    defaultDose?: string;
    isCustom?: boolean;
  }) => {
    setEditingForm(form);
    setNewFormInput({
      name: form.name || '',
      nameAr: form.nameAr || '',
      defaultDose: form.defaultDose || '',
    });
    setIsAddFormModalOpen(true);
  };

  const handleDeleteCustomForm = async (form: { id: string; name: string; nameAr: string }) => {
    if (
      !confirm(
        tr(
          `هل أنت متأكد من حذف النوع "${form.name} (${form.nameAr})" من القائمة؟`,
          `Are you sure you want to delete "${form.name} (${form.nameAr})" from the list?`
        )
      )
    )
      return;
    try {
      const res = await fetch(`/api/drugs/forms/${form.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(tr(`✓ تم حذف "${form.name}" بنجاح`, `✓ Deleted "${form.name}" successfully`));
        fetchCustomForms();
      } else {
        toast.error(tr('تعذر حذف الشكل الدوائي', 'Failed to delete dosage form'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حذف الشكل الدوائي', 'An error occurred while deleting dosage form'));
    }
  };

  const handleSaveCustomForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormInput.name.trim() || !newFormInput.nameAr.trim()) {
      toast.error(
        tr(
          'يرجى كتابة اسم الشكل الدوائي بالإنجليزية والعربية',
          'Please enter both English and Arabic dosage form names'
        )
      );
      return;
    }
    setIsSavingForm(true);
    try {
      const url = editingForm ? `/api/drugs/forms/${editingForm.id}` : '/api/drugs/forms';
      const method = editingForm ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFormInput.name.trim(),
          nameAr: newFormInput.nameAr.trim(),
          defaultDose: newFormInput.defaultDose.trim(),
        }),
      });

      if (res.ok) {
        const addedName = newFormInput.name.trim();
        const defaultDose = newFormInput.defaultDose.trim();
        toast.success(
          editingForm
            ? tr(
                `✓ تم تعديل الشكل الدوائي "${addedName}" بنجاح`,
                `✓ Updated dosage form "${addedName}" successfully`
              )
            : tr(
                `✓ تم حفظ وإضافة الشكل الدوائي "${addedName}" بنجاح`,
                `✓ Saved and added dosage form "${addedName}" successfully`
              )
        );
        if (!editingForm) {
          setModalForm((prev) => ({
            ...prev,
            form: addedName,
            dose: defaultDose || adaptDoseToNewForm(prev.dose, addedName),
          }));
        }
        setNewFormInput({ name: '', nameAr: '', defaultDose: '' });
        setEditingForm(null);
        setIsAddFormModalOpen(false);
        fetchCustomForms();
      } else {
        toast.error(tr('تعذر حفظ الشكل الدوائي', 'Failed to save dosage form'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حفظ الشكل الدوائي', 'An error occurred while saving dosage form'));
    } finally {
      setIsSavingForm(false);
    }
  };

  // 1. Fetch Drugs Catalog
  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drugs?limit=300');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.payload)
          ? data.payload
          : Array.isArray(data)
          ? data
          : [];
        setDrugs(list);
      } else {
        toast.error(tr('تعذر تحميل قائمة الأدوية', 'Failed to load medications catalog'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء تحميل الأدوية', 'An error occurred while loading medications'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
    fetchCustomForms();
  }, []);

  // 2. Fetch Drug Analytics
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      let url = `/api/drugs/analytics?period=${analyticsPeriod}`;
      if (analyticsPeriod === 'month-select') {
        const m = selectedMonth.toString().padStart(2, '0');
        const startDate = `${selectedYear}-${m}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${m}-${lastDay.toString().padStart(2, '0')}`;
        url = `/api/drugs/analytics?period=custom&startDate=${startDate}&endDate=${endDate}`;
      } else if (analyticsPeriod === 'range') {
        url = `/api/drugs/analytics?period=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.payload || data);
      }
    } catch {
      toast.error(tr('تعذر تحميل تقرير الأدوية الأكثر استخداماً', 'Failed to load top prescribed report'));
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (activeTab === 'analytics') {
      setIsLoadingAnalytics(true);
      let url = `/api/drugs/analytics?period=${analyticsPeriod}`;
      if (analyticsPeriod === 'month-select') {
        const m = selectedMonth.toString().padStart(2, '0');
        const startDate = `${selectedYear}-${m}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${m}-${lastDay.toString().padStart(2, '0')}`;
        url = `/api/drugs/analytics?period=custom&startDate=${startDate}&endDate=${endDate}`;
      } else if (analyticsPeriod === 'range') {
        url = `/api/drugs/analytics?period=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then((data) => {
          if (!isCancelled) {
            setAnalyticsData(data.payload || data);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            toast.error(tr('تعذر تحميل تقرير الأدوية الأكثر استخداماً', 'Failed to load top prescribed report'));
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingAnalytics(false);
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTab, analyticsPeriod, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setModalForm({
      name: '',
      form: 'Tablet',
      concentration: '',
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
      shortcutInput: '',
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (drug: DrugItem) => {
    setEditingDrug(drug);
    setModalForm({
      name: drug.name,
      form: drug.form || 'Tablet',
      concentration: drug.concentration || '',
      dose: drug.dose || '',
      frequency: drug.frequency || '',
      duration: drug.duration || '',
      instructions: drug.instructions || '',
      shortcutInput: '',
    });
    setIsModalOpen(true);
  };

  // Save (Add or Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      toast.error(tr('يرجى كتابة اسم الدواء', 'Please enter medication name'));
      return;
    }

    setIsSaving(true);
    try {
      if (editingDrug?.id) {
        // Update
        const res = await fetch(`/api/drugs/${editingDrug.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: modalForm.name.trim(),
            form: modalForm.form,
            concentration: modalForm.concentration.trim(),
            dose: modalForm.dose.trim(),
            frequency: modalForm.frequency.trim(),
            duration: modalForm.duration.trim(),
            instructions: modalForm.instructions.trim(),
          }),
        });

        if (res.ok) {
          toast.success(tr('✓ تم تحديث بيانات الدواء بنجاح', '✓ Medication updated successfully'));
          setIsModalOpen(false);
          fetchDrugs();
        } else {
          toast.error(tr('تعذر تحديث الدواء', 'Failed to update medication'));
        }
      } else {
        // Create
        const res = await fetch('/api/drugs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: modalForm.name.trim(),
            form: modalForm.form,
            concentration: modalForm.concentration.trim(),
            dose: modalForm.dose.trim(),
            frequency: modalForm.frequency.trim(),
            duration: modalForm.duration.trim(),
            instructions: modalForm.instructions.trim(),
            incrementUsage: false,
          }),
        });

        if (res.ok) {
          toast.success(tr('✓ تمت إضافة الدواء الجديد بنجاح', '✓ New medication added successfully'));
          setIsModalOpen(false);
          fetchDrugs();
        } else {
          toast.error(
            tr(
              'تعذر حفظ الدواء (تأكد من عدم تكرار الاسم)',
              'Failed to save medication (check for duplicate name)'
            )
          );
        }
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حفظ الدواء', 'An error occurred while saving medication'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Drug
  const handleDeleteDrug = async (drug: DrugItem) => {
    if (
      !confirm(
        tr(
          `هل أنت متأكد من حذف دواء "${drug.name}" من قاعدة البيانات؟`,
          `Are you sure you want to delete "${drug.name}" from the catalog?`
        )
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/drugs/${drug.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(tr(`تم حذف "${drug.name}" بنجاح`, `Deleted "${drug.name}" successfully`));
        setDrugs((prev) => prev.filter((d) => d.id !== drug.id));
      } else {
        toast.error(tr('تعذر حذف الدواء', 'Failed to delete medication'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء حذف الدواء', 'An error occurred while deleting medication'));
    }
  };

  // Shortcut parsing inside modal
  const handleShortcutEnter = () => {
    if (!modalForm.shortcutInput.trim()) return;
    const parsed = parseDoseShortcut(modalForm.shortcutInput, modalForm.form);
    if (parsed) {
      setModalForm((prev) => ({
        ...prev,
        dose: parsed.dose,
        frequency: parsed.frequency,
        duration: parsed.duration || prev.duration,
        instructions: parsed.instructions || prev.instructions,
      }));
      toast.success(tr(`✓ تمت ترجمة الاختصار: ${parsed.summary}`, `✓ Shortcut applied: ${parsed.summary}`));
    } else {
      toast.info(
        tr(
          'اكتب الاختصار بالشكل: 1/3/5/-30 (جرعة / تكرار / مدة / توقيت الأكل)',
          'Enter shortcut as: 1/3/5/-30 (dose / frequency / days / meal timing)'
        )
      );
    }
  };

  // Filtered Drugs in Catalog
  const filteredDrugs = useMemo(() => {
    if (!searchQuery.trim()) return drugs;
    const q = searchQuery.toLowerCase().trim();
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.form && d.form.toLowerCase().includes(q)) ||
        (d.concentration && d.concentration.toLowerCase().includes(q)) ||
        (d.instructions && d.instructions.toLowerCase().includes(q))
    );
  }, [drugs, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* 1. ترويسة الصفحة العامة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#074C3A] flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            <Pill className="w-6 h-6 text-[#0B7B5E]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A]">
              {tr('دليل وصيدلية أدوية العيادة', 'Clinic Drugs Catalog & Formulary')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {tr(
                'إدارة قاموس الأدوية، الجرعات الافتراضية، ومتابعة تقرير الأدوية الأكثر استخداماً',
                'Manage medication dictionary, default dosages, and top prescribed analytics'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* تبديل التبويبات */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#074C3A] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{tr(`دليل الأدوية (${drugs.length})`, `Drug Catalog (${drugs.length})`)}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('forms')}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'forms'
                  ? 'bg-[#074C3A] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {tr(
                  `أنواع وأشكال الأدوية (${customForms.length})`,
                  `Dosage Forms (${customForms.length})`
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#074C3A] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{tr('الأدوية الأكثر استخداماً', 'Top Prescribed')}</span>
            </button>
          </div>

          {/* زر إضافة شكل دوائي جديد */}
          <button
            type="button"
            onClick={handleOpenAddFormModal}
            className="h-11 px-4 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-[#0B7B5E] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{tr('إضافة شكل / نوع جديد', 'Add Dosage Form')}</span>
          </button>

          {/* زر إضافة دواء جديد */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-11 px-4 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{tr('إضافة دواء جديد', 'Add Medication')}</span>
          </button>
        </div>
      </div>

      {/* 2. محتوى تبويب: دليل الأدوية (Catalog) */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* شريط البحث والتصفية */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(
                  'ابحث باسم الدواء، التركيز، أو الشكل...',
                  'Search by drug name, strength, or form...'
                )}
                className="w-full h-10 ps-9 pe-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#074C3A] placeholder:text-slate-400 focus:outline-none focus:border-[#0B7B5E] focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={fetchDrugs}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title={tr('تحديث القائمة', 'Refresh list')}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B7B5E]' : ''}`} />
              </button>
              <span>
                {tr(
                  `عرض ${filteredDrugs.length} من إجمالي ${drugs.length} صنف`,
                  `Showing ${filteredDrugs.length} of ${drugs.length} items`
                )}
              </span>
            </div>
          </div>

          {/* جدول الأدوية */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0B7B5E] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  {tr('جاري تحميل أدوية العيادة...', 'Loading clinic medications...')}
                </p>
              </div>
            ) : filteredDrugs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {tr('لا توجد أدوية مطابقة للبحث', 'No medications match your search')}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-[#0B7B5E] text-white text-xs font-bold shadow-xs hover:bg-[#09634C] cursor-pointer"
                >
                  {tr('+ إضافة هذا الدواء الآن', '+ Add this medication now')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4 text-start">{tr('اسم الدواء', 'Drug Name')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('الشكل', 'Form')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('التركيز', 'Strength')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('الجرعة الافتراضية', 'Default Dose')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('التكرار', 'Frequency')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('المدة', 'Duration')}</th>
                      <th className="py-3.5 px-3 text-start">{tr('التعليمات', 'Instructions')}</th>
                      <th className="py-3.5 px-3 text-center">{tr('مرات الصرف', 'Times Prescribed')}</th>
                      <th className="py-3.5 px-4 text-center">{tr('الإجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDrugs.map((drug, idx) => (
                      <tr key={drug.id} className="hover:bg-[#E3F5EE]/30 transition-colors group">
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-sm text-[#074C3A] block">
                            {drug.name}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold text-[11px]">
                            {drug.form || 'Tablet'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {drug.concentration || '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {drug.dose || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {drug.frequency || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {drug.duration || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {drug.instructions || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-[#074C3A] font-black text-xs font-mono">
                            {drug.usageCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(drug)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B7B5E] hover:bg-[#E3F5EE] transition-colors cursor-pointer"
                              title={tr('تعديل بيانات الدواء', 'Edit medication')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDrug(drug)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={tr('حذف من القاموس', 'Delete from catalog')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. محتوى تبويب: تحليلات الأدوية الأكثر استخداماً (Analytics) */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* شريط الفلاتر الزمنية */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0B7B5E]" />
                <span>{tr('الفترة الزمنية للتقرير:', 'Report Period:')}</span>
              </span>

              <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-bold flex-wrap">
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('month')}
                  className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    analyticsPeriod === 'month'
                      ? 'bg-[#074C3A] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr('آخر شهر', 'Last Month')}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('6months')}
                  className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    analyticsPeriod === '6months'
                      ? 'bg-[#074C3A] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr('آخر 6 شهور', 'Last 6 Months')}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('1year')}
                  className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    analyticsPeriod === '1year'
                      ? 'bg-[#074C3A] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr('آخر سنة', 'Last Year')}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('month-select')}
                  className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    analyticsPeriod === 'month-select'
                      ? 'bg-[#074C3A] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr('شهر محدد 📅', 'Specific Month 📅')}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('range')}
                  className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    analyticsPeriod === 'range'
                      ? 'bg-[#074C3A] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr('فترة مخصصة (من - إلى) 🗓️', 'Custom Range 🗓️')}
                </button>
              </div>
            </div>

            {/* محدد الشهر والسنة عند اختيار "شهر محدد" */}
            {analyticsPeriod === 'month-select' && (
              <div className="flex items-center gap-2 animate-in fade-in-50 flex-wrap">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
                >
                  {[
                    { m: 1, ar: 'يناير', en: 'January' },
                    { m: 2, ar: 'فبراير', en: 'February' },
                    { m: 3, ar: 'مارس', en: 'March' },
                    { m: 4, ar: 'أبريل', en: 'April' },
                    { m: 5, ar: 'مايو', en: 'May' },
                    { m: 6, ar: 'يونيو', en: 'June' },
                    { m: 7, ar: 'يوليو', en: 'July' },
                    { m: 8, ar: 'أغسطس', en: 'August' },
                    { m: 9, ar: 'سبتمبر', en: 'September' },
                    { m: 10, ar: 'أكتوبر', en: 'October' },
                    { m: 11, ar: 'نوفمبر', en: 'November' },
                    { m: 12, ar: 'ديسمبر', en: 'December' },
                  ].map((mo) => (
                    <option key={mo.m} value={mo.m}>
                      {isAr ? `شهر ${mo.m} (${mo.ar})` : `${mo.en} (${mo.m})`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* محدد الفترة المخصصة (من تاريخ - إلى تاريخ) */}
            {analyticsPeriod === 'range' && (
              <div className="flex items-center gap-2 animate-in fade-in-50 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <span className="font-bold text-slate-500">{tr('من:', 'From:')}</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <span className="font-bold text-slate-500">{tr('إلى:', 'To:')}</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchAnalytics}
                  className="h-8 px-3 rounded-xl bg-[#0B7B5E] text-white font-bold text-xs hover:bg-[#09634C] transition-all cursor-pointer shadow-2xs"
                >
                  {tr('تحديث التقرير', 'Apply')}
                </button>
              </div>
            )}
          </div>

          {/* بطاقات الإحصائيات العامة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {tr('أكثر دواء تم وصفه', 'Most Prescribed Drug')}
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#074C3A] truncate">
                {analyticsData?.items?.[0]?.name || '—'}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {analyticsData?.items?.[0]
                  ? tr(
                      `تم وصفه ${analyticsData.items[0].count} مرة في هذه الفترة`,
                      `Prescribed ${analyticsData.items[0].count} times in this period`
                    )
                  : tr('لا توجد بيانات متاحة', 'No data available')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {tr('إجمالي الأصناف الموصوفة', 'Total Items Prescribed')}
                </span>
                <TrendingUp className="w-4 h-4 text-[#0B7B5E]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#074C3A] font-mono">
                {analyticsData?.totalItemsPrescribed || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {tr(
                  'إجمالي عناصر الأدوية الصادرة بالروشتات',
                  'Total medication lines issued in prescriptions'
                )}
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {tr('عدد الأدوية الفريدة', 'Unique Medications')}
                </span>
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#074C3A] font-mono">
                {analyticsData?.items?.length || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {tr('أصناف دوائية مختلفة تم صرفها', 'Distinct medication items prescribed')}
              </p>
            </div>
          </div>

          {/* قائمة ترتيب الأدوية مع أشرطة التقدم البيانية */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#074C3A] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0B7B5E]" />
                <span>{tr('ترتيب الأدوية الأكثر وصفاً واستخداماً', 'Top Prescribed Medications Ranking')}</span>
                {analyticsData?.items && (
                  <span className="text-xs font-normal text-slate-500">
                    ({filteredAnalyticsItems.length} {tr('من', 'of')} {analyticsData.items.length})
                  </span>
                )}
              </h3>

              {/* حقل البحث السريع في الأدوية الأكثر استخداماً */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={analyticsSearchQuery}
                  onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                  placeholder={tr('ابحث في الأدوية الأكثر استخداماً...', 'Search top prescribed drugs...')}
                  className="w-full pe-8 ps-9 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-bold text-[#074C3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B7B5E] focus:bg-white focus:ring-1 focus:ring-[#0B7B5E] transition-all"
                />
                {analyticsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAnalyticsSearchQuery('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                    title={tr('مسح البحث', 'Clear search')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {isLoadingAnalytics ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0B7B5E] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  {tr('جاري تجميع إحصائيات الأدوية...', 'Loading medication analytics...')}
                </p>
              </div>
            ) : !analyticsData?.items || analyticsData.items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                {tr('لا توجد أدوية موصوفة في هذه الفترة الزمنية.', 'No medications prescribed in this period.')}
              </div>
            ) : filteredAnalyticsItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold space-y-2">
                <p>
                  {tr(
                    `لا توجد نتائج تطابق بحثك عن "${analyticsSearchQuery}"`,
                    `No results matching "${analyticsSearchQuery}"`
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setAnalyticsSearchQuery('')}
                  className="text-emerald-700 hover:underline text-xs cursor-pointer"
                >
                  {tr('إلغاء البحث وإظهار الكل', 'Clear search & show all')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAnalyticsItems.map((item, idx) => {
                  const maxCount = analyticsData.items[0]?.count || 1;
                  const percent = Math.round((item.count / maxCount) * 100);

                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-[#E3F5EE]/40 border border-slate-200/70 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                              idx === 0
                                ? 'bg-amber-500 text-white'
                                : idx === 1
                                ? 'bg-slate-400 text-white'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-[#074C3A] text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm text-[#074C3A]">{item.name}</span>
                          {item.concentration && (
                            <span className="text-[11px] font-mono text-slate-500 font-bold">
                              ({item.concentration})
                            </span>
                          )}
                          {item.form && (
                            <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {item.form}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 font-mono font-black text-xs text-[#074C3A]">
                          <span>
                            {item.count} {tr('مرة', item.count === 1 ? 'time' : 'times')}
                          </span>
                          {item.lastPrescribed && (
                            <span className="text-[11px] font-sans font-medium text-slate-400">
                              {tr('آخر وصف:', 'Last prescribed:')}{' '}
                              {new Date(item.lastPrescribed).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* شريط التقدم المرئي */}
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isAr ? 'bg-gradient-to-l' : 'bg-gradient-to-r'
                          } from-[#074C3A] to-[#0B7B5E] transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3.5 محتوى تبويب: إدارة أنواع وأشكال الأدوية (Forms CRUD Page) */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={formsSearchQuery}
                onChange={(e) => setFormsSearchQuery(e.target.value)}
                placeholder={tr(
                  'ابحث عن نوع الدواء بالإنجليزية أو العربية...',
                  'Search dosage form in English or Arabic...'
                )}
                className="w-full h-10 ps-9 pe-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#074C3A] placeholder:text-slate-400 focus:outline-none focus:border-[#0B7B5E] focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {formsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFormsSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>
                {tr('إجمالي الأنواع:', 'Total Forms:')}{' '}
                <strong className="text-[#074C3A]">{filteredForms.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleOpenAddFormModal}
                className="px-3.5 py-2 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr('إضافة نوع دوائي جديد', 'Add Dosage Form')}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredForms.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {tr('لا توجد أنواع دوائية مطابقة للبحث', 'No dosage forms match your search')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold">
                      <th className="py-3.5 px-5 text-start">{tr('الاسم بالإنجليزية (Form)', 'Form Name (English)')}</th>
                      <th className="py-3.5 px-4 text-start">{tr('الترجمة بالعربية', 'Arabic Translation')}</th>
                      <th className="py-3.5 px-4 text-start">{tr('الجرعة الافتراضية المقترحة', 'Suggested Default Dose')}</th>
                      <th className="py-3.5 px-4 text-center">{tr('التصنيف', 'Category')}</th>
                      <th className="py-3.5 px-5 text-end">{tr('إجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredForms.map((cf) => (
                      <tr key={cf.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-5 font-black text-[#074C3A] text-sm" dir="ltr">
                          {cf.name}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {cf.nameAr}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {cf.defaultDose || (
                            <span className="text-slate-400">
                              {tr('— (تلقائي حسب النوع)', '— (Auto by form)')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              cf.isCustom
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#E3F5EE] text-[#0B7B5E]'
                            }`}
                          >
                            {cf.isCustom
                              ? tr('مضاف بواسطة الطبيب ★', 'Custom ★')
                              : tr('أساسي بالنظام', 'Built-in')}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFormModal(cf)}
                              className="p-2 rounded-xl border border-slate-200 hover:border-[#0B7B5E] hover:bg-emerald-50 text-slate-600 hover:text-[#074C3A] transition-colors cursor-pointer"
                              title={tr('تعديل هذا النوع', 'Edit form')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomForm(cf)}
                              className="p-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title={tr('حذف هذا النوع', 'Delete form')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. نافذة منبثقة لإضافة أو تعديل دواء (Modal) */}
      {isModalOpen && (
        <div
          dir={dir}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#0B7B5E]" />
                <h3 className="font-black text-base text-[#074C3A]">
                  {editingDrug
                    ? tr(`تعديل بيانات الدواء: ${editingDrug.name}`, `Edit Medication: ${editingDrug.name}`)
                    : tr('إضافة دواء جديد لقاعدة البيانات', 'Add New Medication')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* اسم الدواء */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr('اسم الدواء (Drug Name) *', 'Drug Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={tr('مثال: Augmentin, Cataflam, Otrivin...', 'e.g. Augmentin, Cataflam, Otrivin...')}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:bg-white"
                />
              </div>

              {/* نوع وشكل الدواء + التركيز */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {tr('الشكل الدوائي (Form)', 'Dosage Form')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddFormModalOpen(true)}
                      className="text-[11px] font-bold text-[#0B7B5E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{tr('إضافة شكل جديد', 'Add new form')}</span>
                    </button>
                  </div>
                  <select
                    value={modalForm.form}
                    onChange={(e) => {
                      const newForm = e.target.value;
                      setModalForm((prev) => ({
                        ...prev,
                        form: newForm,
                        dose: adaptDoseToNewForm(prev.dose, newForm),
                      }));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
                  >
                    {allFormOptions.map((f) => {
                      const customMatch = customForms.find((cf) => cf.name === f);
                      return (
                        <option key={f} value={f}>
                          {f} {customMatch ? `(${customMatch.nameAr}) ★` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr('التركيز (Concentration)', 'Strength / Concentration')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.concentration}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, concentration: e.target.value }))}
                    placeholder={tr('مثال: 500mg, 1gm, 0.1%', 'e.g. 500mg, 1gm, 0.1%')}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>
              </div>

              {/* حقل اختصار سريع للتعبئة الفورية */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                <span className="text-[11px] font-black text-[#074C3A] block">
                  {tr(
                    '⚡ تعبئة سريعة عبر الاختصار (مثال: 1/3/5/-30 أو 1/1/7/* أو 1/1/10/~ ثم اضغط تطبيق):',
                    '⚡ Quick fill via shortcut (e.g. 1/3/5/-30, 1/1/7/*, or 1/1/10/~ then click Apply):'
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={modalForm.shortcutInput}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, shortcutInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleShortcutEnter();
                      }
                    }}
                    placeholder={tr('1/3/5/-30 أو 1/1/7/*', '1/3/5/-30 or 1/1/7/*')}
                    className="flex-1 h-8 px-2.5 rounded-lg border border-emerald-300 bg-white font-mono text-xs font-bold text-[#074C3A] focus:outline-none focus:ring-1 focus:ring-[#0B7B5E]"
                  />
                  <button
                    type="button"
                    onClick={handleShortcutEnter}
                    className="px-3 h-8 rounded-lg bg-[#0B7B5E] text-white font-bold text-xs hover:bg-[#09634C] transition-colors cursor-pointer shrink-0"
                  >
                    {tr('تطبيق الاختصار', 'Apply')}
                  </button>
                </div>
              </div>

              {/* الجرعة والتكرار والمدة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {tr('الجرعة الافتراضية', 'Default Dose')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.dose}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, dose: e.target.value }))}
                    placeholder={tr('قرص واحد، 5 سم...', '1 tablet, 5 ml...')}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {tr('التكرار الافتراضي', 'Default Frequency')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.frequency}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, frequency: e.target.value }))}
                    placeholder={tr('مرتين في اليوم...', 'Twice daily...')}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {tr('المدة الافتراضية', 'Default Duration')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.duration}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder={tr('لمدة 5 أيام...', 'For 5 days...')}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#0B7B5E]"
                  />
                </div>
              </div>

              {/* التعليمات والإرشادات */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr('إرشادات الاستخدام الافتراضية (Instructions)', 'Default Instructions')}
                </label>
                <input
                  type="text"
                  value={modalForm.instructions}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder={tr(
                    'قبل الأكل بنصف ساعة، بعد الأكل مباشرة...',
                    '30 mins before meals, after meals...'
                  )}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0B7B5E]"
                />
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {tr('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#0B7B5E] hover:bg-[#09634C] transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSaving
                    ? tr('جاري الحفظ...', 'Saving...')
                    : editingDrug
                    ? tr('حفظ التعديلات', 'Save Changes')
                    : tr('إضافة لقاعدة البيانات', 'Add Medication')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 4. نافذة منبثقة لإضافة شكل / نوع دوائي مخصص جديد */}
      {isAddFormModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          dir={dir}
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B7B5E] flex items-center justify-center font-bold">
                  {editingForm ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                </div>
                <h3 className="font-black text-base text-[#074C3A]">
                  {editingForm
                    ? tr(`تعديل الشكل الدوائي: ${editingForm.name}`, `Edit Dosage Form: ${editingForm.name}`)
                    : tr('إضافة شكل أو نوع دوائي جديد', 'Add New Dosage Form')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddFormModalOpen(false);
                  setEditingForm(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {editingForm
                ? tr(
                    'يمكنك تعديل الاسم أو الترجمة العربية أو الجرعة الافتراضية لهذا النوع ليظهر محدّثاً فوراً في جميع الروشتات.',
                    'Edit the English name, Arabic translation, or default dose for this form across all prescriptions.'
                  )
                : tr(
                    'يمكنك هنا إضافة أشكال أو مستحضرات جديدة غير مدرجة في القائمة (مثل جل أنف، مضمضة، غسول، بخاخ فم، أمبولات...) لتصبح متاحة فوراً في الروشتات وقائمة الأدوية.',
                    'Add custom dosage forms not yet listed (e.g. Nasal Gel, Mouthwash, Throat Spray) so they become available immediately in prescriptions and the drug catalog.'
                  )}
            </p>

            <form onSubmit={handleSaveCustomForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr('اسم الشكل بالإنجليزية (English Form Name) *', 'English Form Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={newFormInput.name}
                  onChange={(e) => setNewFormInput((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={tr('مثال: Nasal Gel, Mouthwash, Throat Spray...', 'e.g. Nasal Gel, Mouthwash, Throat Spray...')}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr('اسم الشكل بالعربية (Arabic Form Name) *', 'Arabic Form Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={newFormInput.nameAr}
                  onChange={(e) => setNewFormInput((prev) => ({ ...prev, nameAr: e.target.value }))}
                  placeholder={tr('مثال: جل أنف، مضمضة وغسول فم، بخاخ للحلق...', 'e.g. جل أنف، مضمضة وغسول فم، بخاخ للحلق...')}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr('الجرعة الافتراضية المقترحة (اختياري)', 'Suggested Default Dose (Optional)')}
                </label>
                <input
                  type="text"
                  value={newFormInput.defaultDose}
                  onChange={(e) => setNewFormInput((prev) => ({ ...prev, defaultDose: e.target.value }))}
                  placeholder={tr(
                    'مثال: دهان جل موضعي داخل الأنف، مضمضة 15 مل...',
                    'e.g. Apply thin layer inside nose, gargle 15 ml...'
                  )}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#0B7B5E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddFormModalOpen(false);
                    setEditingForm(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {tr('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingForm}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#0B7B5E] hover:bg-[#09634C] transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSavingForm
                    ? tr('جاري الحفظ...', 'Saving...')
                    : editingForm
                    ? tr('حفظ التعديلات', 'Save Changes')
                    : tr('حفظ وإضافة للقائمة', 'Save & Add to List')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

