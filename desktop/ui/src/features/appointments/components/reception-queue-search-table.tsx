'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  User,
  Calendar,
  Search,
  Plus,
  ShieldCheck,
  UserPlus,
  FileText,
  Loader2,
} from 'lucide-react';
import { TableAppointmentsRowActions } from './table-appointments-row-actions';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { formatDoctorName, getAppointmentTypeLabel } from '../constants/booking.constant';

export interface TodayWaitingPatient {
  id: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  fileNumber?: string;
  patientFileNumber?: string;
  doctorName?: string;
  type: string;
  source: string;
  status: string;
  waitingMinutes: number | null;
  isExempt: boolean;
  isFullyPaid: boolean;
  remainingAmount: number;
  discount: number;
  totalAmount?: number;
  paidAmount?: number;
}

interface ReceptionQueueSearchTableProps {
  initialPatients: TodayWaitingPatient[];
  doctorId?: string;
  translations: {
    number: string;
    patient: string;
    doctor: string;
    appointmentType: string;
    status: string;
    waitingDuration: string;
    financialStatus: string;
    actions: string;
    checkup: string;
    consultation: string;
    inCheckup: string;
    pendingCheckout: string;
    waiting: string;
    exempt: string;
    paidInFull: string;
    partiallyPaid: string;
    unpaid: string;
    remaining: string;
    minutes: string;
  };
}

export function ReceptionQueueSearchTable({
  initialPatients,
  doctorId,
  translations: t,
}: ReceptionQueueSearchTableProps) {
  const { isAr, dir, tr } = useAppLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');

  // فصل وترتيب قائمة اليوم: شاشة العرض الموحدة (النشطين أولاً ثم المكتملين)، الانتظار، والمكتملين
  const { allList, waitingList, completedList } = useMemo(() => {
    const active = initialPatients.filter((p) => p.status !== 'COMPLETED');
    const done = initialPatients.filter((p) => p.status === 'COMPLETED');

    const waiting: TodayWaitingPatient[] = [];
    const completed: TodayWaitingPatient[] = [];

    initialPatients.forEach((p) => {
      const isCompleted = p.status === 'COMPLETED';
      if (isCompleted) {
        completed.push(p);
      } else {
        waiting.push(p);
      }
    });

    return { allList: [...active, ...done], waitingList: waiting, completedList: completed };
  }, [initialPatients]);

  // القائمة المحددة حسب التبويب النشط
  const currentList = activeTab === 'ALL' ? allList : activeTab === 'WAITING' ? waitingList : completedList;

  // فلترة القائمة المحلية بالبحث
  const filteredLocal = useMemo(() => {
    if (!searchTerm.trim()) return currentList;
    const term = searchTerm.trim().toLowerCase();
    return currentList.filter((p) => {
      const nameMatch = p.patientName?.toLowerCase().includes(term);
      const phoneMatch = p.patientPhone?.includes(term);
      const queueMatch = String(p.queueNumber).includes(term);
      const codeMatch = (p.fileNumber && p.fileNumber.toLowerCase().includes(term)) || ((p as any).patientFileNumber && (p as any).patientFileNumber.toLowerCase().includes(term));
      return nameMatch || phoneMatch || queueMatch || codeMatch;
    });
  }, [searchTerm, currentList]);

  // عرض القائمة المفلترة
  const visiblePatients = useMemo(() => {
    if (activeTab === 'WAITING') {
      return filteredLocal.slice(0, 15);
    }
    return filteredLocal;
  }, [activeTab, filteredLocal]);

  // إذا كان المستخدم في تبويب الانتظار وبحث عن مريض انتهى كشفه وغادر اليوم، نظهره له في قسم سريع للاسترجاع الفوري
  const matchedCompletedPatients = useMemo(() => {
    if (activeTab === 'COMPLETED' || !searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return completedList.filter((p) => {
      const nameMatch = p.patientName?.toLowerCase().includes(term);
      const phoneMatch = p.patientPhone?.includes(term);
      const queueMatch = String(p.queueNumber).includes(term);
      return nameMatch || phoneMatch || queueMatch;
    });
  }, [activeTab, searchTerm, completedList]);

  // البحث في كامل قاعدة بيانات العيادة مع إلغاء الطلبات المتكررة تلقائياً
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearchingExternal(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearchingExternal(true);
      fetch(`/api/patients/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          const rawList = Array.isArray(data)
            ? data
            : data?.payload && Array.isArray(data.payload)
            ? data.payload
            : [];

          // استبعاد المرضى الموجودين بالفعل في قائمة انتظار اليوم الحالية
          const localIds = new Set(initialPatients.map((p) => p.patientId));
          const external = rawList.filter((p: any) => !localIds.has(p.id));
          setSearchResults(external.slice(0, 5));
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSearchResults([]);
          }
        })
        .finally(() => setIsSearchingExternal(false));
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, initialPatients]);

  return (
    <div className="space-y-4 select-none" dir={dir}>
      {/* 📑 تبويبات التبديل: شاشة العرض الموحدة (الكل)، صالة الانتظار، والمكتملين */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#0B7B5E] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{tr('شاشة عرض اليوم الكاملة (الكل)', "All Today's Queue")}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {allList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WAITING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'WAITING'
              ? 'bg-[#0B7B5E] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{tr('صالة الانتظار النشطة', 'Active Waiting Room')}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'WAITING' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {waitingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'bg-[#0B7B5E] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{tr('المكتملين والمغادرين', 'Completed & Departed')}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {completedList.length}
          </span>
        </button>
      </div>

      {/* 🔍 شريط البحث السريع والإحصائية المحددة بـ 10 مرضى دائمًا */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* حقل البحث السريع */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'WAITING'
                ? tr(
                    'بحث في صالة الانتظار أو المرضى المكتملين بالاسم أو الهاتف...',
                    'Search waiting room or completed patients by name or phone...'
                  )
                : tr(
                    'بحث في المرضى المكتملين والمغادرين اليوم...',
                    "Search today's completed & departed patients..."
                  )
            }
            className="w-full h-10 ps-10 pe-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-[#074C3A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B7B5E] focus:bg-white transition-all shadow-2xs"
          />
          {isSearchingExternal && (
            <Loader2 className="w-4 h-4 text-[#0B7B5E] animate-spin absolute end-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* الإحصائية وشارة الحد الأقصى */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500">
          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
            {activeTab === 'WAITING' ? (
              <>
                {tr('المعروض بالانتظار:', 'Showing in waiting:')}{' '}
                <strong className="text-[#074C3A] font-black">{visiblePatients.length}</strong>{' '}
                {tr('(حد أقصى 10)', '(max 10)')}
              </>
            ) : (
              <>
                {tr('إجمالي المكتملين اليوم:', 'Total shown today:')}{' '}
                <strong className="text-[#074C3A] font-black">{visiblePatients.length}</strong>
              </>
            )}
          </span>
          {activeTab === 'WAITING' && waitingList.length > 10 && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              {tr(`إجمالي الانتظار: ${waitingList.length}`, `Total waiting: ${waitingList.length}`)}
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{tr('اليوم', 'Today')}</span>
          </span>
        </div>
      </div>

      {/* ↩️ في حال البحث: عرض فوري لمرضى اليوم المكتملين المطابقين مع زر استرجاع الفلوس مباشرة */}
      {matchedCompletedPatients.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2.5 animate-in fade-in-50">
          <div className="flex items-center justify-between text-xs font-black text-rose-950">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>
                {tr(
                  'مرضى اليوم المكتملين المطابقين للبحث (يمكنك استرجاع الفلوس مباشرة هنا):',
                  'Matching completed patients from today (you can issue a refund directly here):'
                )}
              </span>
            </span>
            <span className="text-[11px] font-bold text-rose-700">
              {tr(
                `${matchedCompletedPatients.length} مريض انتهى كشفه`,
                `${matchedCompletedPatients.length} completed`
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {matchedCompletedPatients.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between gap-2 hover:border-rose-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-[#074C3A]">{p.patientName}</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tr(`مدفوع: ${p.paidAmount || 0} ج.م`, `Paid: ${p.paidAmount || 0} EGP`)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span dir="ltr">{p.patientPhone || tr('بدون هاتف', 'No phone')}</span>
                    <span>• {formatDoctorName(p.doctorName, isAr)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {tr('تم الكشف والمغادرة', 'Examined & departed')}
                  </span>
                  <TableAppointmentsRowActions
                    appointmentId={p.id}
                    patientName={p.patientName}
                    status="COMPLETED"
                    hasRemaining={false}
                    remainingAmount={0}
                    totalAmount={p.totalAmount || 0}
                    paidAmount={p.paidAmount || 0}
                    doctorId={doctorId}
                    doctorName={p.doctorName}
                    type={p.type}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🌟 نتائج البحث لمرضى مسجلين بالعيادة ولكنهم ليسوا في قائمة انتظار اليوم */}
      {searchTerm.trim().length >= 2 && searchResults.length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2.5 animate-in fade-in-50">
          <div className="flex items-center justify-between text-xs font-black text-[#074C3A]">
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#0B7B5E]" />
              <span>
                {tr(
                  'نتائج البحث في سجل مرضى العيادة (غير مسجلين في انتظار اليوم):',
                  "Clinic patient registry results (not in today's queue):"
                )}
              </span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700">
              {tr(`${searchResults.length} مريض`, `${searchResults.length} patients`)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between gap-2 hover:border-[#0B7B5E] transition-all"
              >
                <div>
                  <h4 className="font-black text-sm text-[#074C3A]">
                    {p.fullName || p.name}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span dir="ltr">{p.phone || tr('بدون هاتف', 'No phone')}</span>
                    {p.fileNumber && (
                      <span>{tr(`• ملف #${p.fileNumber}`, `• File #${p.fileNumber}`)}</span>
                    )}
                    {p.age && <span>{tr(`• ${p.age} سنة`, `• ${p.age} yrs`)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <Link
                    href={`/dashboard/appointments/new?patientId=${encodeURIComponent(p.id)}${doctorId ? `&doctorId=${encodeURIComponent(doctorId)}` : ''}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr('تسجيل كشف اليوم', 'Register Visit Today')}</span>
                  </Link>

                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                    title={tr('فتح الملف الطبي للمريض', 'Open patient medical file')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. جدول حالات انتظار اليوم (10 حالات فقط) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {visiblePatients.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-600">
              {searchTerm
                ? tr('لا توجد نتائج مطابقة في قائمة اليوم', "No matching results in today's list")
                : activeTab === 'COMPLETED'
                ? tr('لا يوجد مرضى أتموا الكشف وغادروا حتى الآن اليوم', 'No patients have completed their visit yet today')
                : tr('لا يوجد مرضى في قائمة الانتظار حالياً', 'No patients currently in the waiting queue')}
            </p>
            {searchTerm && searchResults.length === 0 && (
              <p className="text-xs text-slate-400">
                {tr(
                  'يمكنك الضغط على زر "حجز جديد" لتسجيل مريض جديد غير مسجل مسبقاً.',
                  'You can click "New Booking" to register a new patient.'
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs">
                  <th className="py-4 px-6 text-start">{t.number}</th>
                  <th className="py-4 px-6 text-start">{t.patient}</th>
                  <th className="py-4 px-6 text-start">{t.doctor}</th>
                  <th className="py-4 px-6 text-center">{t.appointmentType}</th>
                  <th className="py-4 px-6 text-center">{t.status}</th>
                  <th className="py-4 px-6 text-center">{t.waitingDuration}</th>
                  <th className="py-4 px-6 text-center">{t.financialStatus}</th>
                  <th className="py-4 px-6 text-end">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {visiblePatients.map((patient) => {
                  const queueNo = String(patient.queueNumber).padStart(2, '0');

                  return (
                    <tr
                      key={patient.id}
                      className={`transition-all ${
                        patient.status === 'COMPLETED'
                          ? 'bg-slate-50/60 opacity-60 hover:opacity-95 border-s-4 border-s-slate-300'
                          : patient.status === 'PENDING_CHECKOUT'
                          ? 'bg-amber-50/50 hover:bg-amber-50/80 border-s-4 border-s-amber-500'
                          : patient.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60 border-s-4 border-s-emerald-500'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* رقم الكشف */}
                      <td className="py-4 px-6 text-start">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#E3F5EE] text-[#0B7B5E] font-black text-sm">
                          #{queueNo}
                        </span>
                      </td>

                      {/* اسم المريض وبياناته */}
                      <td className="py-4 px-6 text-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#074C3A] text-sm">
                              {patient.patientName}
                            </span>
                            {(patient.fileNumber || patient.patientFileNumber) && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 text-[10px] font-mono font-black border border-emerald-300/60 shadow-2xs">
                                #{patient.fileNumber || patient.patientFileNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 font-mono" dir="ltr">
                              {patient.patientPhone || tr('لا يوجد هاتف', 'No phone')}
                            </span>
                            {patient.patientAge && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {tr(`• ${patient.patientAge} سنة`, `• ${patient.patientAge} yrs`)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* الطبيب المعالج */}
                      <td className="py-4 px-6 text-start">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-xs text-[#074C3A]">
                            {formatDoctorName(patient.doctorName, isAr)}
                          </span>
                        </div>
                      </td>

                      {/* نوع الكشف ومصدر الحجز */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black opacity-100 shadow-2xs bg-[#E3F5EE] text-[#0B7B5E] border border-[#D0E5DC]">
                            {patient.type === 'EXAMINATION'
                              ? t.checkup
                              : patient.type === 'CONSULTATION'
                              ? t.consultation
                              : getAppointmentTypeLabel(patient.type, isAr)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {patient.source === 'WALK_IN'
                              ? tr('كشف مباشر', 'Walk-in')
                              : tr('حجز مسبق', 'Scheduled')}
                          </span>
                        </div>
                      </td>

                      {/* الحالة */}
                      <td className="py-4 px-6 text-center">
                        {patient.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t.inCheckup}
                          </span>
                        ) : patient.status === 'PENDING_CHECKOUT' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            {t.pendingCheckout}
                          </span>
                        ) : patient.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            {tr('تم الكشف والمغادرة', 'Completed & Departed')}
                          </span>
                        ) : patient.status === 'WAITING' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {t.waiting}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            {patient.status}
                          </span>
                        )}
                      </td>

                      {/* مدة الانتظار */}
                      <td className="py-4 px-6 text-center">
                        {patient.waitingMinutes !== null ? (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                patient.waitingMinutes > 30 ? 'text-amber-500' : 'text-slate-400'
                              }`}
                            />
                            <span className={patient.waitingMinutes > 30 ? 'text-amber-700 font-bold' : ''}>
                              {tr(`${patient.waitingMinutes} دقيقة`, `${patient.waitingMinutes} mins`)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* الموقف المالي والمتبقي */}
                      <td className="py-4 px-6 text-center">
                        {patient.isExempt ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>{t.exempt}</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {tr('0 ج.م', '0 EGP')}
                            </span>
                          </div>
                        ) : patient.isFullyPaid ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{t.paidInFull}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold mt-0.5">
                              {patient.remainingAmount === 0
                                ? tr('خالص', 'Settled')
                                : tr(`${patient.remainingAmount} ج.م`, `${patient.remainingAmount} EGP`)}
                            </span>
                          </div>
                        ) : patient.remainingAmount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              {patient.discount > 0 ? t.partiallyPaid : t.unpaid}
                            </span>
                            <span className="text-[11px] text-amber-900 font-black mt-0.5">
                              {tr(`متبقي: ${patient.remainingAmount} ج.م`, `Remaining: ${patient.remainingAmount} EGP`)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">
                            {tr('خالص', 'Settled')}
                          </span>
                        )}
                      </td>

                      {/* إجراءات الموعد */}
                      <td className="py-4 px-6 text-end">
                        <TableAppointmentsRowActions
                          appointmentId={patient.id}
                          patientName={patient.patientName}
                          status={patient.status as 'WAITING' | 'IN_PROGRESS' | 'BOOKED' | 'PENDING_CHECKOUT' | 'COMPLETED'}
                          hasRemaining={!patient.isFullyPaid && patient.remainingAmount > 0}
                          remainingAmount={patient.remainingAmount}
                          totalAmount={patient.totalAmount || 0}
                          paidAmount={patient.paidAmount || 0}
                          doctorId={doctorId}
                          doctorName={patient.doctorName}
                          type={patient.type}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
