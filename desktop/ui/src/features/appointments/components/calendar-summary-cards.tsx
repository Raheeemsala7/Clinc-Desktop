'use client';

import React from 'react';
import { CalendarSummary } from '../types/calendar';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface CalendarSummaryCardsProps {
  summary: CalendarSummary;
}

export function CalendarSummaryCards({ summary }: CalendarSummaryCardsProps) {
  const { dir, tr } = useAppLocale();

  const formatMoney = (val: number) => {
    return Number(val || 0).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 select-none" dir={dir}>
      {/* 1. مواعيد اليوم (البطاقة الكحلية الأولى في اليمين) */}
      <div className="bg-[#074C3A] text-white rounded-3xl p-5 shadow-xs border border-slate-800/20 flex flex-col justify-between min-h-[105px] transition-all hover:shadow-md text-start">
        <span className="text-xs font-bold text-slate-300">
          {tr('مواعيد اليوم', "Today's Appointments")}
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-black font-sans tracking-tight">
          {summary.totalToday}
        </div>
      </div>

      {/* 2. المدفوع / العربون (البطاقة الزرقاء الفاتحة) */}
      <div className="bg-[#F0F7FF] text-[#074C3A] rounded-3xl p-5 shadow-2xs border border-[#D0E5DC] flex flex-col justify-between min-h-[105px] transition-all hover:shadow-md text-start">
        <span className="text-xs font-bold text-slate-500">
          {tr('المدفوع / العربون', 'Paid / Deposits')}
        </span>
        <div className="mt-2 flex items-baseline gap-1 text-[#0B7B5E]">
          <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
            {formatMoney(summary.totalPaid)}
          </span>
          <span className="text-xs font-bold text-slate-500">{tr('ج.م', 'EGP')}</span>
        </div>
      </div>

      {/* 3. المتبقي للتحصيل (البطاقة الصفراء/الكريمية) */}
      <div className="bg-[#FEFCE8] text-[#074C3A] rounded-3xl p-5 shadow-2xs border border-[#FEF08A] flex flex-col justify-between min-h-[105px] transition-all hover:shadow-md text-start">
        <span className="text-xs font-bold text-slate-500">
          {tr('المتبقي للتحصيل', 'Remaining to Collect')}
        </span>
        <div className="mt-2 flex items-baseline gap-1 text-[#854D0E]">
          <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
            {formatMoney(summary.totalRemaining)}
          </span>
          <span className="text-xs font-bold text-slate-500">{tr('ج.م', 'EGP')}</span>
        </div>
      </div>

      {/* 4. حالات معفية (مجاني) */}
      <div className="bg-white text-[#074C3A] rounded-3xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between min-h-[105px] transition-all hover:shadow-md text-start">
        <span className="text-xs font-bold text-slate-400">
          {tr('حالات معفية (مجاني)', 'Fee-Exempt Cases (Free)')}
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-black font-sans text-slate-700 tracking-tight">
          {summary.totalExempt}
        </div>
      </div>
    </div>
  );
}

