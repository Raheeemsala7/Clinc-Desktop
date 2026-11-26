'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Banknote,
  Wallet,
  X,
  CheckCircle2,
  ShieldCheck,
  Split,
  CircleDollarSign,
  HeartHandshake,
  RotateCcw,
} from 'lucide-react';
import {
  useCheckoutAppointmentMutation,
  useRefundAppointmentMutation,
} from '../hooks/appointments.hook';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  remainingAmount: number;
  totalAmount: number;
  paidAmount: number;
  onSuccess: () => void;
}

export function CheckoutPaymentModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  remainingAmount,
  totalAmount,
  paidAmount,
  onSuccess,
}: CheckoutPaymentModalProps) {
  const t = useTranslations('Dashboard.receptionist.table');
  const { isAr, dir, tr } = useAppLocale();
  const [settlementType, setSettlementType] = useState<'FULL' | 'PARTIAL' | 'EXEMPT' | 'REFUND'>('FULL');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'WALLET'>('CASH');
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [refundAmount, setRefundAmount] = useState<number>(paidAmount > 0 ? Math.min(paidAmount, 100) : 0);
  const [refundReason, setRefundReason] = useState<string>(
    tr('بتوجيه الطبيب بعد إنهاء الكشف', 'Per doctor instructions after exam')
  );
  const [exemptionReason, setExemptionReason] = useState<string>(
    tr('بتعليمات الطبيب المعالج', 'Per treating doctor instructions')
  );
  const [notes, setNotes] = useState<string>('');

  const checkoutMutation = useCheckoutAppointmentMutation();
  const refundMutation = useRefundAppointmentMutation();
  const isPending = checkoutMutation.isPending || refundMutation.isPending;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (settlementType === 'REFUND') {
      const refundAmt = Number(refundAmount) || 0;
      refundMutation.mutate(
        {
          id: appointmentId,
          payload: {
            amount: refundAmt,
            reason:
              refundReason ||
              tr('بتوجيه الطبيب بعد إنهاء الكشف', 'Per doctor instructions after exam'),
            method,
          },
        },
        {
          onSuccess: () => {
            onClose();
            onSuccess();
          },
        }
      );
      return;
    }

    const payAmount =
      settlementType === 'EXEMPT'
        ? 0
        : settlementType === 'FULL'
        ? remainingAmount
        : Number(amount) || 0;

    checkoutMutation.mutate(
      {
        id: appointmentId,
        payload: {
          method: settlementType === 'EXEMPT' ? undefined : method,
          amount: payAmount,
          settlementType,
          isExempt: settlementType === 'EXEMPT',
          exemptionReason: settlementType === 'EXEMPT' ? exemptionReason : undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
      },
    );
  };

  const calculatedRemainingAfterPartial = Math.max(0, remainingAmount - (Number(amount) || 0));
  const calculatedPaidAfterRefund = Math.max(0, paidAmount - (Number(refundAmount) || 0));

  const exemptionTags = [
    tr('بتعليمات الطبيب المعالج', 'Per treating doctor instructions'),
    tr('حالة إنسانية / خصم كامل', 'Humanitarian case / Full waiver'),
    tr('متابعة بدون رسوم', 'Complimentary follow-up'),
    tr('أقارب ومعارف', 'Relatives & acquaintances'),
  ];

  const refundTags = [
    tr('بتعليمات الطبيب بعد إنهاء الكشف', 'Per doctor instructions after exam'),
    tr('تخفيض قيمة الكشف', 'Reduced exam fee'),
    tr('إلغاء إجراء طبي إضافي', 'Cancelled additional procedure'),
    tr('طلب الطبيب إرجاع جزء من الكشف', 'Doctor requested partial refund'),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200" dir={dir}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F5EE] border border-[#D0E5DC] flex items-center justify-center text-[#0B7B5E] shadow-2xs">
              <CircleDollarSign className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#074C3A]">
                {tr('تسوية الحساب ومغادرة المريض', 'Settle Balance & Patient Checkout')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {tr('المريض:', 'Patient:')} <span className="font-bold text-slate-800">{patientName}</span>
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Card Summary */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">
                {tr('سعر الكشف الإجمالي:', 'Total Fee:')}
              </span>
              <span className="font-black text-slate-700 text-sm">
                {totalAmount} {tr('ج.م', 'EGP')}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block mb-0.5">
                {tr('المسدد مسبقاً (عربون):', 'Paid Previously:')}
              </span>
              <span className="font-black text-emerald-600 text-sm">
                {paidAmount} {tr('ج.م', 'EGP')}
              </span>
            </div>
            <div className="text-end">
              <span className="text-slate-400 block mb-0.5">
                {tr('المتبقي المطلوب:', 'Remaining Due:')}
              </span>
              <span className="font-black text-amber-700 text-base">
                {remainingAmount} {tr('ج.م', 'EGP')}
              </span>
            </div>
          </div>

          {remainingAmount > 0 ? (
            <>
              {/* خيارات تسوية المتبقي (سداد كامل / سداد جزء / إعفاء) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {tr('اختر إجراء تسوية المبلغ المتبقي:', 'Choose how to settle the remaining balance:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* خيار 1: سداد كامل المتبقي */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('FULL');
                      setAmount(remainingAmount);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      settlementType === 'FULL'
                        ? 'border-[#0B7B5E] bg-[#E3F5EE] text-[#0B7B5E] shadow-xs ring-2 ring-[#0B7B5E]/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 mb-1.5 text-[#0B7B5E]" />
                    <span>{tr('سداد كامل', 'Full Payment')}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      ({remainingAmount} {tr('ج.م', 'EGP')})
                    </span>
                  </button>

                  {/* خيار 2: سداد جزء من المتبقي */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('PARTIAL');
                      setAmount(Math.floor(remainingAmount / 2) || 10);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      settlementType === 'PARTIAL'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Split className="w-5 h-5 mb-1.5 text-amber-600" />
                    <span>{tr('سداد جزء', 'Partial Payment')}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {tr('دفعة وتأجيل الباقي', 'Pay part, defer rest')}
                    </span>
                  </button>

                  {/* خيار 3: إعفاء من باقي المبلغ */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('EXEMPT');
                      setAmount(0);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      settlementType === 'EXEMPT'
                        ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <HeartHandshake className="w-5 h-5 mb-1.5 text-purple-600" />
                    <span>{tr('إعفاء من المتبقي', 'Waive Balance')}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {tr('تصفير الحساب', 'Clear balance')}
                    </span>
                  </button>
                </div>
              </div>

              {/* تفاصيل حالة السداد الكامل أو الجزئي */}
              {settlementType !== 'EXEMPT' && (
                <div className="space-y-4 pt-1">
                  {/* حقل إدخال المبلغ في حالة السداد الجزئي */}
                  {settlementType === 'PARTIAL' && (
                    <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-900">
                          {tr('المبلغ المُسدد الآن من المريض:', 'Amount Paid Now:')}
                        </label>
                        <span className="text-xs font-bold text-amber-800">
                          {tr(
                            `سيتبقى: ${calculatedRemainingAfterPartial} ج.م`,
                            `Remaining: ${calculatedRemainingAfterPartial} EGP`
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={remainingAmount}
                          value={amount === 0 ? '' : amount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="0"
                          className="w-full ps-3.5 pe-12 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-black text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                          {tr('ج.م', 'EGP')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* طريقة الدفع */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {t('selectPaymentMethod')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMethod('CASH')}
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          method === 'CASH'
                            ? 'border-[#0B7B5E] bg-[#E3F5EE]/50 text-[#0B7B5E] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>{t('cash')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod('CARD')}
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          method === 'CARD'
                            ? 'border-[#0B7B5E] bg-[#E3F5EE]/50 text-[#0B7B5E] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{t('card')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod('WALLET')}
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          method === 'WALLET'
                            ? 'border-[#0B7B5E] bg-[#E3F5EE]/50 text-[#0B7B5E] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        <span>{t('wallet')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* تفاصيل الإعفاء من المتبقي */}
              {settlementType === 'EXEMPT' && (
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex items-start gap-2.5 text-purple-900 text-xs">
                    <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {tr('إعفاء المريض وتصفير باقي الحساب', 'Waive remaining balance and clear account')}
                      </p>
                      <p className="text-purple-700 text-[11px] mt-0.5">
                        {tr(
                          `سيتم إعفاء المريض من باقي المبلغ (${remainingAmount} ج.م) رسمياً ولن تُحسب كديون متأخرة على العيادة.`,
                          `The patient will be officially exempted from the remaining ${remainingAmount} EGP with no outstanding balance.`
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1.5">
                      {tr('سبب الإعفاء:', 'Exemption Reason:')}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {exemptionTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setExemptionReason(tag)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                            exemptionReason === tag
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={exemptionReason}
                      onChange={(e) => setExemptionReason(e.target.value)}
                      placeholder={tr('اكتب سبب الإعفاء...', 'Enter exemption reason...')}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* ملاحظات إضافية */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {tr('ملاحظات إضافية (اختياري)', 'Additional Notes (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder={tr('مثال: تم تسليم الروشتة للمريض', 'e.g., Prescription handed to patient')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-hidden focus:border-[#0B7B5E] focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {paidAmount > 0 ? (
                <>
                  <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setSettlementType('FULL')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settlementType !== 'REFUND'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tr('مغادرة عادية (الحساب مسدد)', 'Standard Checkout (Paid)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettlementType('REFUND')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        settlementType === 'REFUND'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-rose-700 hover:text-rose-800'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{tr('استرجاع جزء من الفلوس بتوجيه الطبيب', 'Partial Refund per Doctor')}</span>
                    </button>
                  </div>

                  {settlementType === 'REFUND' ? (
                    <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-3.5 animate-in fade-in-50">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-950">
                        <span>{tr('المبلغ المراد رده للمريض (ج.م):', 'Refund Amount (EGP):')}</span>
                        <span className="text-[11px] text-rose-700">
                          {tr(`المدفوع: ${paidAmount} ج.م`, `Paid: ${paidAmount} EGP`)}
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={paidAmount}
                          value={refundAmount === 0 ? '' : refundAmount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setRefundAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="0"
                          className="w-full ps-3.5 pe-12 py-2.5 rounded-xl border border-rose-300 bg-white text-sm font-black text-rose-950 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-700">
                          {tr('ج.م', 'EGP')}
                        </span>
                      </div>

                      {/* أزرار سريعة للمبالغ الشائعة */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[50, 100, 150, 200, paidAmount]
                          .filter((val, idx, arr) => val <= paidAmount && arr.indexOf(val) === idx)
                          .map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setRefundAmount(val)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                                refundAmount === val
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {val === paidAmount
                                ? tr(`كامل المبلغ (${val} ج.م)`, `Full Amount (${val} EGP)`)
                                : tr(`${val} ج.م`, `${val} EGP`)}
                            </button>
                          ))}
                      </div>

                      {/* سبب الاسترجاع */}
                      <div>
                        <label className="block text-xs font-bold text-rose-950 mb-1.5">
                          {tr('سبب استرجاع الفلوس:', 'Refund Reason:')}
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {refundTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setRefundReason(tag)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                                refundReason === tag
                                  ? 'bg-rose-700 text-white border-rose-700'
                                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder={tr('اكتب سبب الاسترجاع...', 'Enter refund reason...')}
                          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs text-rose-950 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                        />
                      </div>

                      {/* طريقة رد الفلوس */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          {tr('طريقة رد المبلغ للمريض:', 'Refund Method:')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setMethod('CASH')}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              method === 'CASH'
                                ? 'border-rose-600 bg-rose-100/50 text-rose-800 shadow-2xs'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Banknote className="w-4 h-4" />
                            <span>{tr('نقدي (كاش)', 'Cash')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMethod('CARD')}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              method === 'CARD'
                                ? 'border-rose-600 bg-rose-100/50 text-rose-800 shadow-2xs'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{tr('بطاقة', 'Card')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMethod('WALLET')}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              method === 'WALLET'
                                ? 'border-rose-600 bg-rose-100/50 text-rose-800 shadow-2xs'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Wallet className="w-4 h-4" />
                            <span>{tr('محفظة', 'Wallet')}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-[11px] text-rose-900 font-semibold">
                        {isAr ? (
                          <>
                            💡 سيتم رد <strong>{refundAmount} ج.م</strong> من الخزينة، وتصبح قيمة الكشف الصافية{' '}
                            <strong>{calculatedPaidAfterRefund} ج.م</strong>، وتسوية الزيارة ومغادرة المريض دون أي دين.
                          </>
                        ) : (
                          <>
                            💡 <strong>{refundAmount} EGP</strong> will be refunded from the register; net visit fee becomes{' '}
                            <strong>{calculatedPaidAfterRefund} EGP</strong> with zero remaining balance.
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        {tr(
                          `المبلغ مدفوع بالكامل مسبقاً (${paidAmount} ج.م)، اضغط "تأكيد المغادرة" لإنهاء الزيارة.`,
                          `Amount is already paid in full (${paidAmount} EGP). Click "Confirm Checkout" to finish the visit.`
                        )}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {tr(
                      'المبلغ مدفوع بالكامل مسبقاً، يمكنك تأكيد إنهاء الزيارة ومغادرة المريض الآن.',
                      'Amount is already paid in full. You can confirm visit completion and checkout now.'
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl active:scale-95 disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
              settlementType === 'REFUND'
                ? 'bg-rose-600 hover:bg-rose-700'
                : settlementType === 'EXEMPT'
                ? 'bg-purple-600 hover:bg-purple-700'
                : settlementType === 'PARTIAL'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#0B7B5E] hover:bg-[#09634C]'
            }`}
          >
            {settlementType === 'REFUND' ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isPending
                ? tr('جاري الحفظ...', 'Saving...')
                : settlementType === 'REFUND'
                ? tr(
                    `تأكيد استرجاع ${refundAmount || 0} ج.م وإنهاء الزيارة`,
                    `Confirm Refund of ${refundAmount || 0} EGP & Complete`
                  )
                : settlementType === 'EXEMPT'
                ? tr('تأكيد الإعفاء وإنهاء الزيارة', 'Confirm Exemption & Complete')
                : settlementType === 'PARTIAL'
                ? tr(
                    `تحصيل ${amount || 0} ج.م ومغادرة المريض`,
                    `Collect ${amount || 0} EGP & Checkout`
                  )
                : remainingAmount > 0
                ? tr(
                    `تحصيل ${remainingAmount} ج.م ومغادرة المريض`,
                    `Collect ${remainingAmount} EGP & Checkout`
                  )
                : tr('تأكيد المغادرة', 'Confirm Checkout')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
