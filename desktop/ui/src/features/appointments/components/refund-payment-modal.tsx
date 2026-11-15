'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Banknote,
  Wallet,
  CreditCard,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useRefundAppointmentMutation } from '../hooks/appointments.hook';

interface RefundPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  onSuccess?: () => void;
}

export function RefundPaymentModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  totalAmount,
  paidAmount,
  onSuccess,
}: RefundPaymentModalProps) {
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [amount, setAmount] = useState<number>(paidAmount);
  const [reason, setReason] = useState<string>('بتعليمات الطبيب المعالج');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'WALLET'>('CASH');

  useEffect(() => {
    if (isOpen) {
      setRefundType('FULL');
      setAmount(paidAmount);
      setReason('بتعليمات الطبيب المعالج');
      setMethod('CASH');
    }
  }, [isOpen, paidAmount]);

  const refundMutation = useRefundAppointmentMutation();
  const isPending = refundMutation.isPending;

  if (!isOpen) return null;

  const handleConfirm = () => {
    const refundAmt = refundType === 'FULL' ? paidAmount : Number(amount) || 0;

    refundMutation.mutate(
      {
        id: appointmentId,
        payload: {
          amount: refundAmt,
          reason: reason || 'بتعليمات الطبيب المعالج',
          method,
        },
      },
      {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const calculatedPaidAfterRefund = Math.max(
    0,
    paidAmount - (refundType === 'FULL' ? paidAmount : Number(amount) || 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50 select-none">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* رأس النافذة */}
        <div className="p-4 sm:p-5 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-rose-950">
                استرجاع فلوس للمريض (Refund)
              </h3>
              <p className="text-xs text-rose-700 font-bold">
                المريض: <strong className="text-rose-900">{patientName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* ملخص الموقف المالي للمريض */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي قيمة الكشف:</span>
              <span className="text-sm font-black text-slate-800">{totalAmount} ج.م</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">المبلغ المدفوع حالياً:</span>
              <span className="text-sm font-black text-emerald-700">{paidAmount} ج.م</span>
            </div>
          </div>

          {/* نوع الاسترجاع: كامل أو جزئي */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              طبيعة استرجاع المبلغ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefundType('FULL');
                  setAmount(paidAmount);
                }}
                className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  refundType === 'FULL'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>استرجاع كامل المبلغ</span>
                <span className="text-[11px] font-normal text-rose-700">({paidAmount} ج.م)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRefundType('PARTIAL');
                  if (amount >= paidAmount) setAmount(Math.round(paidAmount / 2));
                }}
                className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  refundType === 'PARTIAL'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>استرجاع جزء من المبلغ</span>
                <span className="text-[11px] font-normal text-amber-700">تحديد المبلغ يدويّاً</span>
              </button>
            </div>
          </div>

          {/* تحديد المبلغ في حالة الاسترجاع الجزئي */}
          {refundType === 'PARTIAL' && (
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <label className="text-xs font-black text-amber-900 block">
                مبلغ الاسترجاع المراد إرجاعه للمريض:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={paidAmount}
                  value={amount === 0 ? '' : amount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setAmount(Math.min(paidAmount, Math.max(0, val)));
                  }}
                  placeholder="0"
                  className="w-full h-11 px-3.5 pr-8 rounded-xl border border-amber-300 bg-white font-mono font-black text-base text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                  ج.م
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500">
                المبلغ المتبقي لدى العيادة بعد الاسترجاع: <strong className="text-emerald-700">{calculatedPaidAfterRefund} ج.م</strong>
              </p>
            </div>
          )}

          {/* طريقة إرجاع المبلغ */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              طريقة الإرجاع:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'نقدي (كاش)', icon: Banknote },
                { id: 'WALLET', label: 'محفظة', icon: Wallet },
                { id: 'CARD', label: 'كارت / فيزا', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#074C3A] text-white border-[#074C3A]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* سبب الاسترجاع */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              سبب الاسترجاع (للتوثيق والحسابات):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: بتعليمات الطبيب المعالج / عدم اكتمال الكشف..."
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* أزرار الإجراء */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (refundType === 'PARTIAL' && (!amount || amount <= 0))}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending ? 'جاري الاسترجاع...' : `تأكيد استرجاع ${refundType === 'FULL' ? paidAmount : amount} ج.م`}
          </button>
        </div>
      </div>
    </div>
  );
}
