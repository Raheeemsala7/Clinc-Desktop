'use client';

import React, { useState } from 'react';
import { usePayRemainingPaymentMutation } from '../hooks/payments.hook';
import { X, Coins, Banknote, CreditCard, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '../types/payments';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface PayRemainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export function PayRemainingModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  totalAmount,
  paidAmount,
  remainingAmount,
}: PayRemainingModalProps) {
  const { dir, tr } = useAppLocale();
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState<string>('');
  const payMutation = usePayRemainingPaymentMutation();

  if (!isOpen) return null;

  const currencyLabel = tr('ج.م', 'EGP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    payMutation.mutate(
      {
        appointmentId,
        amount: Number(amount),
        method,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#074C3A]">
                {tr('سداد المبلغ المتبقي', 'Pay Remaining Balance')}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {tr('المريض:', 'Patient:')}{' '}
                <strong className="text-slate-700">{patientName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* نموذج السداد */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {/* تفاصيل المبالغ */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {tr('إجمالي الكشف', 'Total Fee')}
              </span>
              <span className="font-black text-[#074C3A]">
                {totalAmount} {currencyLabel}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {tr('المسدد سابقاً', 'Previously Paid')}
              </span>
              <span className="font-black text-emerald-600">
                {paidAmount} {currencyLabel}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {tr('المتبقي حالياً', 'Current Remaining')}
              </span>
              <span className="font-black text-rose-600">
                {remainingAmount} {currencyLabel}
              </span>
            </div>
          </div>

          {/* المبلغ المراد تحصيله الآن */}
          <div>
            <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
              {tr('المبلغ المدفوع الآن (ج.م)', 'Amount Paid Now (EGP)')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={remainingAmount}
                value={amount === 0 ? '' : amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="w-full h-11 ps-3.5 pe-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-[#074C3A] focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15 transition-all font-sans"
                required
              />
              <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currencyLabel}
              </span>
            </div>
            {amount < remainingAmount && (
              <p className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {tr('سيتبقى بعد هذا الإيصال:', 'Remaining after this receipt:')}{' '}
                  {remainingAmount - amount} {currencyLabel}
                </span>
              </p>
            )}
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
              {tr('طريقة الدفع', 'Payment Method')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={cn(
                  'h-11 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  method === 'CASH'
                    ? 'border-[#0B7B5E] bg-[#E3F5EE]/70 text-[#0B7B5E] font-black shadow-xs ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <Banknote className="w-4 h-4" />
                <span>{tr('نقدي', 'Cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CARD')}
                className={cn(
                  'h-11 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  method === 'CARD'
                    ? 'border-[#0B7B5E] bg-[#E3F5EE]/70 text-[#0B7B5E] font-black shadow-xs ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <CreditCard className="w-4 h-4" />
                <span>{tr('بطاقة / فيزا', 'Card / Visa')}</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('WALLET')}
                className={cn(
                  'h-11 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  method === 'WALLET'
                    ? 'border-[#0B7B5E] bg-[#E3F5EE]/70 text-[#0B7B5E] font-black shadow-xs ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <Wallet className="w-4 h-4" />
                <span>{tr('محفظة', 'Wallet')}</span>
              </button>
            </div>
          </div>

          {/* ملاحظات الإيصال */}
          <div>
            <label className="block text-xs font-bold text-[#074C3A] mb-1.5">
              {tr('ملاحظات التحصيل (اختياري)', 'Payment Notes (Optional)')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr(
                'مثال: سداد باقي قيمة الكشف عند الخروج',
                'e.g., Settling remaining fee at checkout'
              )}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={payMutation.isPending}
              className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {tr('إلغاء', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={payMutation.isPending || amount <= 0}
              className="h-11 px-5 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {payMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{tr('جاري تسجيل السداد...', 'Recording payment...')}</span>
                </>
              ) : (
                <span>{tr('تأكيد السداد وإصدار الإيصال', 'Confirm Payment & Issue Receipt')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
