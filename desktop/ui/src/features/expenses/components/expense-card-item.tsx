'use client';

import React from 'react';
import { ExpenseItem } from '../types/expenses';
import { Check, X, Clock, Calendar, User, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApproveExpenseMutation } from '../hooks/expenses.hook';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface ExpenseCardItemProps {
  expense: ExpenseItem;
  isAdmin?: boolean;
  onReject: (expense: ExpenseItem) => void;
}

export function ExpenseCardItem({ expense, isAdmin, onReject }: ExpenseCardItemProps) {
  const { isAr, dir, tr } = useAppLocale();
  const approveMutation = useApproveExpenseMutation();

  const formatMoney = (val: number) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateStr = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const isPending = expense.status === 'PENDING';
  const isApproved = expense.status === 'APPROVED';

  const handleApprove = () => {
    approveMutation.mutate(expense.id);
  };

  const currencyLabel = tr('ج.م', 'EGP');

  return (
    <div
      className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 relative overflow-hidden group"
      dir={dir}
    >
      {/* شريط الإشارة الملون أسفل البطاقة */}
      <div
        className={`absolute bottom-0 right-0 left-0 h-1 transition-all ${
          isApproved
            ? 'bg-emerald-500 group-hover:h-1.5'
            : isPending
            ? 'bg-amber-400 group-hover:h-1.5'
            : 'bg-rose-500 group-hover:h-1.5'
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* الجانب الأيمن: تصنيف المصروف والبيان والتواريخ */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* اسم التصنيف */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E3F5EE] text-[#0B7B5E] border border-[#D0E5DC] text-xs font-black shadow-2xs">
              <Tag className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{expense.category?.name || tr('مصروف عام', 'General Expense')}</span>
            </span>

            {/* شارة حالة الاعتماد */}
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tr('معتمد', 'Approved')}</span>
                {(!expense.reviewedById || expense.isAutoApproved) && (
                  <span className="text-[10px] text-emerald-600 font-medium ms-1 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                    {tr('تلقائياً ضمن السقف', 'Auto within limit')}
                  </span>
                )}
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{tr('بانتظار موافقة الإدارة', 'Pending Admin Approval')}</span>
                <span className="text-[10px] text-amber-700 font-medium ms-1 bg-amber-100/60 px-1.5 py-0.5 rounded-md">
                  {tr('تجاوز السقف الشهري', 'Exceeded Monthly Limit')}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{tr('مرفوض', 'Rejected')}</span>
              </span>
            )}
          </div>

          {/* بيان المصروف / الوصف */}
          <p className="text-sm sm:text-base font-bold text-[#074C3A] leading-relaxed">
            {expense.description}
          </p>

          {/* سبب الرفض إن وُجد */}
          {expense.rejectionReason && (
            <div className="bg-rose-50/70 border border-rose-100 px-3.5 py-2 rounded-2xl text-xs text-rose-700 font-medium inline-block">
              {tr('سبب الرفض:', 'Rejection Reason:')} {expense.rejectionReason}
            </div>
          )}

          {/* بيانات الموظف والتواريخ */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {tr('تاريخ الصرف:', 'Expense Date:')} {formatDateStr(expense.spentAt)}
              </span>
            </div>

            {expense.recordedBy && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {tr('المسجل:', 'Recorded by:')} {expense.recordedBy.name}
                </span>
              </div>
            )}

            {expense.reviewedBy && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {tr('المعتمد:', 'Approved by:')} {expense.reviewedBy.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* الجانب الأيسر: المبلغ المالي وأزرار اعتماد/رفض للإدارة */}
        <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-s border-slate-100 pt-3 md:pt-0 md:ps-6 shrink-0 min-w-[160px]">
          <div className="text-start w-full">
            <span className="text-xs text-slate-400 font-medium block mb-1">
              {tr('قيمة المصروف', 'Expense Amount')}
            </span>
            <div
              className={`flex items-baseline justify-end gap-1.5 ${
                isApproved
                  ? 'text-emerald-600'
                  : isPending
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
                {formatMoney(expense.amount)}
              </span>
              <span className="text-xs font-bold text-slate-500">{currencyLabel}</span>
            </div>
          </div>

          {/* أزرار الإدارة للمصروفات المعلقة */}
          {isAdmin && isPending && (
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
                title={tr('موافقة على المصروف', 'Approve Expense')}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{tr('موافقة', 'Approve')}</span>
              </button>

              <button
                type="button"
                onClick={() => onReject(expense)}
                disabled={approveMutation.isPending}
                className="py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 active:scale-95 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                title={tr('رفض المصروف', 'Reject Expense')}
              >
                <X className="w-3.5 h-3.5" />
                <span>{tr('رفض', 'Reject')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
