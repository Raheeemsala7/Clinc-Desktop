'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings2, Loader2 } from 'lucide-react';
import { useUpdateExpenseBudgetMutation } from '../hooks/expenses.hook';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface UpdateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
}

export function UpdateBudgetModal({ isOpen, onClose, currentLimit }: UpdateBudgetModalProps) {
  const { dir, tr } = useAppLocale();
  const [limit, setLimit] = useState<number>(currentLimit);
  const updateMutation = useUpdateExpenseBudgetMutation();

  useEffect(() => {
    if (isOpen) {
      setLimit(currentLimit);
    }
  }, [isOpen, currentLimit]);

  if (!isOpen) return null;

  const currencyLabel = tr('ج.م', 'EGP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (limit === undefined || limit < 0) return;

    updateMutation.mutate(Number(limit), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      dir={dir}
    >
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* رأس النافذة */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E] flex items-center justify-center border border-[#D0E5DC] shadow-2xs">
              <Settings2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#074C3A]">
                {tr('تعديل سقف المصروفات الشهري', 'Edit Monthly Expense Limit')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr(
                  'تحديد المبلغ الأقصى المسموح للاستقبال بصرفه شهرياً بدون موافقة',
                  'Set the maximum monthly amount reception can spend without approval'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النموذج */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {tr('سقف المصروفات المسموح به شهرياً (ج.م) *', 'Monthly Allowed Expense Limit (EGP) *')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                required
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full ps-4 pe-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#0B7B5E] focus:ring-2 focus:ring-[#0B7B5E]/10 text-sm font-bold font-sans transition-all"
                placeholder="1000"
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currencyLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {tr(
                '* أي مصروف يقوم الاستقبال بتسجيله ضمن هذا السقف الشهري يُعتمد تلقائياً، وما يتجاوزه ينتظر موافقتك.',
                '* Any expense recorded by reception within this monthly limit is auto-approved; excess amounts require your approval.'
              )}
            </p>
          </div>

          {/* اختصارات سريعة */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              {tr('مبالغ شائعة:', 'Common Amounts:')}
            </span>
            <div className="flex gap-2">
              {[500, 1000, 1500, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLimit(val)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    limit === val
                      ? 'border-[#0B7B5E] bg-[#E3F5EE] text-[#0B7B5E]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val} {currencyLabel}
                </button>
              ))}
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{tr('جاري الحفظ...', 'Saving...')}</span>
                </>
              ) : (
                <span>{tr('حفظ التعديل', 'Save Changes')}</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all cursor-pointer"
            >
              {tr('إلغاء', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
