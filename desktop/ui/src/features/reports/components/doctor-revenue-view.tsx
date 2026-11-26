'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  FileText,
  BadgePercent,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface ConsultationItem {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  fileNumber: string;
  patientAge?: number;
  patientGender?: string;
  doctorId?: string;
  doctorName?: string;
  clinicDate: string;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  type: string;
  status: string;
  queueNumber: number;
  originalFee: number;
  discount: number;
  fee: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'EXEMPT';
  isExempt: boolean;
}

interface RevenueData {
  from: string;
  to: string;
  doctorId: string | null;
  allDoctors?: Array<{ id: string; name: string }>;
  summary: {
    totalConsultations: number;
    completedVisits: number;
    totalFees: number;
    totalPaid: number;
    totalRemaining: number;
    freeCount: number;
    collectionRate: number;
  };
  typeBreakdown: Record<string, { count: number; totalFees: number; totalPaid: number }>;
  consultations: ConsultationItem[];
}

export function DoctorRevenueView() {
  const { isAr, dir, tr } = useAppLocale();

  const getClinicToday = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [period, setPeriod] = useState<'today' | 'yesterday' | 'day-select' | 'week' | 'month' | 'custom'>('month');
  const [selectedDay, setSelectedDay] = useState<string>(() => getClinicToday());
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = getClinicToday();
    return today.slice(0, 7) + '-01';
  });
  const [toDate, setToDate] = useState<string>(() => getClinicToday());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'EXEMPT'>('ALL');

  // Compute dates when period button changes
  const handlePeriodChange = (newPeriod: 'today' | 'yesterday' | 'day-select' | 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    const todayStr = getClinicToday();

    if (newPeriod === 'today') {
      setSelectedDay(todayStr);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (newPeriod === 'yesterday') {
      const d = new Date(todayStr + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      const yStr = d.toISOString().split('T')[0];
      setSelectedDay(yStr);
      setFromDate(yStr);
      setToDate(yStr);
    } else if (newPeriod === 'day-select') {
      setFromDate(selectedDay);
      setToDate(selectedDay);
    } else if (newPeriod === 'week') {
      const d = new Date(todayStr + 'T12:00:00Z');
      const day = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
      const diff = (day + 1) % 7;
      d.setUTCDate(d.getUTCDate() - diff);
      const startStr = d.toISOString().split('T')[0];
      setFromDate(startStr);
      setToDate(todayStr);
    } else if (newPeriod === 'month') {
      const startOfMonth = todayStr.slice(0, 7) + '-01';
      setFromDate(startOfMonth);
      setToDate(todayStr);
    }
  };

  const handleStepDay = (delta: number) => {
    const d = new Date(selectedDay + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    const nextDay = d.toISOString().split('T')[0];
    setSelectedDay(nextDay);
    setPeriod('day-select');
    setFromDate(nextDay);
    setToDate(nextDay);
  };

  const handleSelectSpecificDay = (day: string) => {
    setSelectedDay(day);
    setPeriod('day-select');
    setFromDate(day);
    setToDate(day);
  };

  const fetchRevenue = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports/doctor-revenue?from=${fromDate}&to=${toDate}`;
      if (selectedDoctorId && selectedDoctorId !== 'ALL') {
        url += `&doctorId=${encodeURIComponent(selectedDoctorId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json.payload || json);
      } else {
        toast.error(tr('تعذر تحميل بيانات التقرير المالي', 'Failed to load financial report data'));
      }
    } catch {
      toast.error(tr('حدث خطأ أثناء تحميل التقرير', 'An error occurred while loading the report'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        let url = `/api/reports/doctor-revenue?from=${fromDate}&to=${toDate}`;
        if (selectedDoctorId && selectedDoctorId !== 'ALL') {
          url += `&doctorId=${encodeURIComponent(selectedDoctorId)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            setData(json.payload || json);
          }
        } else if (!isCancelled) {
          toast.error(tr('تعذر تحميل بيانات التقرير المالي', 'Failed to load financial report data'));
        }
      } catch {
        if (!isCancelled) {
          toast.error(tr('حدث خطأ أثناء تحميل التقرير', 'An error occurred while loading the report'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [fromDate, toDate, selectedDoctorId, tr]);

  // Translate appointment types
  const formatTypeName = (type: string) => {
    switch (type) {
      case 'EXAMINATION':
        return tr('كشف جديد', 'New Examination');
      case 'FOLLOW_UP':
        return tr('إعادة واستشارة', 'Follow-up');
      case 'POST_OPERATIVE':
        return tr('متابعة ما بعد العملية', 'Post-operative Follow-up');
      case 'OPERATION_FOLLOWUP':
        return tr('متابعة جراحة', 'Surgery Follow-up');
      case 'ENDOSCOPY':
        return tr('منظار تشخيصي', 'Diagnostic Endoscopy');
      case 'SURGERY':
        return tr('عملية جراحية', 'Surgical Procedure');
      case 'CONSULTATION':
        return tr('استشارة طبية', 'Medical Consultation');
      default:
        return type || tr('كشف', 'Examination');
    }
  };

  // Filter consultations for table
  const filteredConsultations = (data?.consultations || []).filter((item) => {
    if (statusFilter !== 'ALL' && item.paymentStatus !== statusFilter) return false;
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase().trim();
    return (
      item.patientName.toLowerCase().includes(q) ||
      (item.patientPhone && item.patientPhone.includes(q)) ||
      (item.fileNumber && item.fileNumber.toLowerCase().includes(q)) ||
      (item.doctorName && item.doctorName.toLowerCase().includes(q))
    );
  });

  const currencyLabel = tr('ج.م', 'EGP');

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* 1. الترويسة الرئيسية */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#074C3A] flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            <DollarSign className="w-6 h-6 text-[#0B7B5E]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A]">
              {tr('تقرير الكشوفات والإيرادات للطبيب', 'Doctor Consultations & Revenue Report')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {tr(
                'متابعة عدد الحالات والكشوفات ومحصلة الإيرادات والمبالغ المحصلة والمتبقية',
                'Track consultation counts, total revenue, collected amounts, and remaining balances'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRevenue}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B7B5E]' : ''}`} />
          <span>{tr('تحديث التقرير', 'Refresh Report')}</span>
        </button>
      </div>

      {/* 2. شريط اختيار الفترة الزمنية واختيار الطبيب */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-[#0B7B5E]" />
              <span>{tr('الفترة الزمنية:', 'Time Period:')}</span>
            </span>

            <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center gap-1 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => handlePeriodChange('today')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'today'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('اليوم', 'Today')}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('yesterday')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'yesterday'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('أمس', 'Yesterday')}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('day-select')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'day-select'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('يوم محدد 🗓️', 'Specific Day 🗓️')}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('week')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'week'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('هذا الأسبوع', 'This Week')}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('month')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'month'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('هذا الشهر', 'This Month')}
              </button>
              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`h-8 px-3 rounded-lg transition-all cursor-pointer ${
                  period === 'custom'
                    ? 'bg-[#074C3A] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr('فترة مخصصة (من - إلى) 📊', 'Custom Range (From - To) 📊')}
              </button>
            </div>
          </div>

          {/* محدد الطبيب */}
          <div className="relative shrink-0 self-start xl:self-auto">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="h-9 ps-3 pe-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] cursor-pointer appearance-none shadow-2xs"
            >
              <option value="ALL">
                {tr('كافة أطباء وكشوفات العيادة', 'All Clinic Doctors & Consultations')}
              </option>
              {data?.allDoctors?.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* شريط محدد اليوم الفردي (عند اختيار "يوم محدد") */}
        {period === 'day-select' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 animate-in fade-in-50 flex-wrap text-xs font-bold">
            <span className="text-[#074C3A] font-black flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0B7B5E]" />
              <span>{tr('اختر اليوم المطلوب:', 'Select Day:')}</span>
            </span>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-300 shadow-2xs">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                title={tr('اليوم السابق', 'Previous Day')}
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-[#074C3A] hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <input
                type="date"
                value={selectedDay}
                onChange={(e) => handleSelectSpecificDay(e.target.value)}
                className="h-7 px-2 font-mono text-xs font-black text-[#074C3A] bg-transparent focus:outline-none cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleStepDay(1)}
                title={tr('اليوم التالي', 'Next Day')}
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-[#074C3A] hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectSpecificDay(getClinicToday())}
              className="h-8 px-3 rounded-xl bg-white hover:bg-emerald-100 text-[#074C3A] border border-emerald-300 font-bold text-xs transition-colors cursor-pointer"
            >
              {tr('الرجوع لليوم الحالي', 'Back to Today')}
            </button>

            <span className="text-slate-500 text-[11px] font-medium ms-auto">
              {tr('تاريخ الكشوفات المعروضة:', 'Displayed Date:')}{' '}
              <strong className="font-mono text-[#074C3A]">{selectedDay}</strong>
            </span>
          </div>
        )}

        {/* محدد التواريخ للفترة المخصصة (من - إلى) */}
        {period === 'custom' && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in-50 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-[#074C3A] font-black">
              {tr('حدد المدى الزمني:', 'Select Date Range:')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{tr('من:', 'From:')}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{tr('إلى:', 'To:')}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>
            <button
              type="button"
              onClick={fetchRevenue}
              className="h-8 px-3 rounded-xl bg-[#0B7B5E] text-white font-bold text-xs hover:bg-[#09634C] transition-all cursor-pointer shadow-2xs"
            >
              {tr('تطبيق الفترة', 'Apply Range')}
            </button>
          </div>
        )}
      </div>

      {/* 3. بطاقات المؤشرات المالية والتشغيلية (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي الكشوفات */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {tr('عدد الكشوفات المسجلة', 'Registered Consultations')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#074C3A] flex items-center justify-center font-bold">
              <Stethoscope className="w-4 h-4 text-[#0B7B5E]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#074C3A] font-mono">
            {data?.summary?.totalConsultations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {tr(
              `تم إنجاز ${data?.summary?.completedVisits ?? 0} كشف بالكامل`,
              `${data?.summary?.completedVisits ?? 0} examinations completed`
            )}
          </p>
        </div>

        {/* إجمالي قيمة الكشوفات */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {tr('إجمالي قيمة الكشوفات', 'Total Consultation Fees')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#074C3A] font-mono">
            {(data?.summary?.totalFees ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-sans font-bold">{currencyLabel}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {tr('إجمالي أسعار الخدمات والكشوفات', 'Total price of services and consultations')}
          </p>
        </div>

        {/* المبالغ المحصلة فعلياً */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-300 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#074C3A]">
              {tr('المدفوعات المحصلة', 'Collected Payments')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#0B7B5E] text-white flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B7B5E] font-mono">
            {(data?.summary?.totalPaid ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-sans font-bold">{currencyLabel}</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            {tr('نسبة التحصيل:', 'Collection Rate:')} {data?.summary?.collectionRate ?? 100}%
          </p>
        </div>

        {/* المبالغ المتبقية غير المحصلة */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {tr('المتبقي غير المحصل', 'Remaining Uncollected')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
            {(data?.summary?.totalRemaining ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-sans font-bold">{currencyLabel}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {tr(
              `${data?.summary?.freeCount ?? 0} حالات كشف مجاني / معفى`,
              `${data?.summary?.freeCount ?? 0} free / exempt consultations`
            )}
          </p>
        </div>
      </div>

      {/* 4. تفصيل الكشوفات بحسب نوع الخدمة */}
      {data?.typeBreakdown && Object.keys(data.typeBreakdown).length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-[#074C3A] flex items-center gap-2">
            <BadgePercent className="w-4 h-4 text-[#0B7B5E]" />
            <span>{tr('توزيع الكشوفات والتحصيل بحسب نوع الحجز:', 'Breakdown by Appointment Type:')}</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {Object.entries(data.typeBreakdown).map(([typeKey, stats]) => (
              <div
                key={typeKey}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-1"
              >
                <span className="font-bold text-slate-600 block truncate">
                  {formatTypeName(typeKey)}
                </span>
                <div className="text-base font-black text-[#074C3A] font-mono">
                  {stats.count}{' '}
                  <span className="text-[10px] font-sans font-normal text-slate-400">
                    {tr('حالة', 'cases')}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-bold text-[#0B7B5E]">
                  {stats.totalPaid.toLocaleString()} {currencyLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. جدول سجل الكشوفات التفصيلي */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-[#074C3A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0B7B5E]" />
              <span>
                {tr('سجل الحالات والكشوفات التفصيلي', 'Detailed Consultations Ledger')} (
                {filteredConsultations.length})
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {tr(
                'قائمة بجميع المرضى والكشوفات المسجلة وحالة السداد لكل كشف',
                'List of all patients, registered consultations, and payment status'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* فلتر حالة الدفع */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] cursor-pointer"
            >
              <option value="ALL">{tr('جميع حالات الدفع', 'All Payment Statuses')}</option>
              <option value="PAID">{tr('مدفوع بالكامل', 'Paid in Full')}</option>
              <option value="PARTIAL">{tr('دفع جزئي', 'Partial Payment')}</option>
              <option value="UNPAID">{tr('غير مدفوع', 'Unpaid')}</option>
              <option value="EXEMPT">{tr('معفى / مجاني', 'Exempt / Free')}</option>
            </select>

            {/* بحث في الجدول */}
            <div className="relative w-48 sm:w-60">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={tr('ابحث باسم المريض أو الطبيب...', 'Search by patient or doctor name...')}
                className="w-full h-9 ps-8 pe-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#074C3A] focus:bg-white focus:outline-none focus:border-[#0B7B5E]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#0B7B5E] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              {tr('جاري تحميل سجل الكشوفات...', 'Loading consultations ledger...')}
            </p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {tr(
                `لا توجد كشوفات مسجلة في هذه الفترة المحددة (${fromDate} إلى ${toDate}).`,
                `No consultations recorded in this period (${fromDate} to ${toDate}).`
              )}
            </p>
            <p className="text-[11px] text-slate-400">
              {tr(
                'جرب الضغط على "هذا الشهر" أو اختيار "كافة أطباء وكشوفات العيادة" للاطلاع على جميع الحالات.',
                'Try clicking "This Month" or selecting "All Clinic Doctors & Consultations" to view all cases.'
              )}
            </p>
          </div>
        ) : (
          <>
            {/* عرض شاشات الموبايل والأجهزة الصغيرة (بطاقات سريعة ومتجاوبة) */}
            <div className="block md:hidden space-y-3">
              {filteredConsultations.map((c, idx) => (
                <div
                  key={`mobile-${c.id}`}
                  className="p-4 bg-slate-50/70 hover:bg-[#E3F5EE]/40 rounded-2xl border border-slate-200 text-xs space-y-3 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#074C3A] text-white font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-black text-sm text-[#074C3A]">
                          {c.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          {c.fileNumber && (
                            <span>
                              {tr('ملف:', 'File:')} #{c.fileNumber}
                            </span>
                          )}
                          {c.patientPhone && (
                            <span dir="ltr">· {c.patientPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {c.isExempt ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                          {tr('معفى', 'Exempt')}
                        </span>
                      ) : c.remainingAmount === 0 && c.fee > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                          {tr('مدفوع كامل ✓', 'Paid ✓')}
                        </span>
                      ) : c.paidAmount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                          {tr('دفع جزئي', 'Partial')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                          {tr('غير مدفوع', 'Unpaid')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">{tr('الطبيب:', 'Doctor:')}</span>
                      <strong className="text-slate-700">
                        {c.doctorName || tr('طبيب العيادة', 'Clinic Doctor')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{tr('نوع الكشف:', 'Type:')}</span>
                      <strong className="text-slate-700">{formatTypeName(c.type)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {tr('التاريخ والوقت:', 'Date & Time:')}
                      </span>
                      <strong className="text-slate-700 font-mono">
                        {c.clinicDate} {c.startTime ? `(${c.startTime})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {tr('حالة الكشف:', 'Exam Status:')}
                      </span>
                      <strong
                        className={c.status === 'COMPLETED' ? 'text-emerald-700' : 'text-slate-700'}
                      >
                        {c.status === 'COMPLETED'
                          ? tr('تم الكشف', 'Completed')
                          : c.status === 'IN_PROGRESS'
                          ? tr('جاري الفحص', 'In Progress')
                          : tr('في الانتظار', 'Waiting')}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">
                          {tr('القيمة:', 'Fee:')}
                        </span>
                        <strong className="text-slate-800">
                          {c.fee} {currencyLabel}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">
                          {tr('المدفوع:', 'Paid:')}
                        </span>
                        <strong className="text-[#0B7B5E]">
                          {c.paidAmount} {currencyLabel}
                        </strong>
                      </div>
                      {c.remainingAmount > 0 && (
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans">
                            {tr('المتبقي:', 'Remaining:')}
                          </span>
                          <strong className="text-rose-600">
                            {c.remainingAmount} {currencyLabel}
                          </strong>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/examination/${c.appointmentId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B7B5E] text-white font-bold text-xs shadow-2xs hover:bg-[#09634C] transition-colors"
                    >
                      <span>{tr('فتح الكشف', 'Open Exam')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* عرض شاشات التابلت والكمبيوتر (جدول كامل) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">{tr('المريض', 'Patient')}</th>
                    <th className="py-3 px-3">{tr('الطبيب المعالج', 'Doctor')}</th>
                    <th className="py-3 px-3">{tr('التاريخ والوقت', 'Date & Time')}</th>
                    <th className="py-3 px-3">{tr('نوع الكشف', 'Type')}</th>
                    <th className="py-3 px-3">{tr('حالة الكشف', 'Status')}</th>
                    <th className="py-3 px-3">{tr('قيمة الكشف', 'Fee')}</th>
                    <th className="py-3 px-3">{tr('المدفوع', 'Paid')}</th>
                    <th className="py-3 px-3">{tr('المتبقي', 'Remaining')}</th>
                    <th className="py-3 px-3 text-center">{tr('حالة السداد', 'Payment')}</th>
                    <th className="py-3 px-3 text-center">{tr('إجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsultations.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#E3F5EE]/30 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-black text-sm text-[#074C3A] block">
                          {c.patientName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                          {c.patientPhone ||
                            (c.fileNumber ? `${tr('ملف:', 'File:')} ${c.fileNumber}` : '—')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {c.doctorName || tr('طبيب العيادة', 'Clinic Doctor')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <div>{c.clinicDate}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {c.startTime ||
                            (c.scheduledAt
                              ? new Date(c.scheduledAt).toLocaleTimeString(
                                  isAr ? 'ar-EG' : 'en-US',
                                  { hour: '2-digit', minute: '2-digit' }
                                )
                              : '—')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {formatTypeName(c.type)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {c.status === 'COMPLETED' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{tr('تم الكشف', 'Completed')}</span>
                          </span>
                        ) : c.status === 'IN_PROGRESS' ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{tr('جاري الفحص', 'In Progress')}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {tr('في الانتظار', 'Waiting')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {c.fee} {currencyLabel}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-[#0B7B5E]">
                        {c.paidAmount} {currencyLabel}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-600">
                        {c.remainingAmount > 0 ? `${c.remainingAmount} ${currencyLabel}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {c.isExempt ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                            {tr('معفى / مجاني', 'Exempt / Free')}
                          </span>
                        ) : c.remainingAmount === 0 && c.fee > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                            {tr('مدفوع كامل ✓', 'Paid ✓')}
                          </span>
                        ) : c.paidAmount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                            {tr('دفع جزئي', 'Partial')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                            {tr('غير مدفوع', 'Unpaid')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          href={`/dashboard/examination/${c.appointmentId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#074C3A] font-bold text-[11px] transition-colors"
                        >
                          <span>{tr('فتح الكشف', 'Open Exam')}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
