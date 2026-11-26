'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePaymentsQuery } from '../hooks/payments.hook';
import { useDoctorsQuery } from '@/features/appointments/hooks/appointments.hook';
import { PaymentFilterTab, PaymentItem, PaymentsSummary } from '../types/payments';
import { PaymentsSummaryCards } from './payments-summary-cards';
import { PaymentsFiltersBar } from './payments-filters-bar';
import { PaymentCardItem } from './payment-card-item';
import { PayRemainingModal } from './pay-remaining-modal';
import { Loader2, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

/**
 * دالة مساعدة للحصول على تاريخ اليوم بصيغة YYYY-MM-DD
 */
function getTodayIsoDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PaymentsView() {
  const t = useTranslations('Payments');
  const { isAr, dir, tr } = useAppLocale();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoDate);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<PaymentFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPaymentForPay, setSelectedPaymentForPay] = useState<PaymentItem | null>(null);

  // جلب قائمة أطباء العيادة للفلترة
  const { data: doctorsData } = useDoctorsQuery();
  const doctors = doctorsData || [];

  // استعلام المدفوعات باستخدام React Query كاش حسب التاريخ المختار والطبيب المحدد
  const {
    data: paymentsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePaymentsQuery(selectedDate, selectedDoctorId);

  const rawPayments = paymentsResponse?.data || [];
  const backendSummary = paymentsResponse?.meta?.summary;

  // 1. حساب الملخص الإحصائي إذا لم يأتِ من الباك إند
  const summary: PaymentsSummary = useMemo(() => {
    if (backendSummary) return backendSummary;

    const recorded = rawPayments.filter((p) => p.status === 'RECORDED');
    const totalCollected = recorded.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const activeDeposits = recorded.filter(
      (p) => p.paymentType === 'DEPOSIT' && (p.appointment?.remainingAmount ?? 0) > 0
    );
    const totalDeposits = activeDeposits.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // حساب المتبقي من المواعيد الفريدة
    const apptMap = new Map<string, number>();
    rawPayments.forEach((p) => {
      if (p.appointment?.id && !p.appointment.isExempt) {
        apptMap.set(p.appointment.id, Number(p.appointment.remainingAmount || 0));
      }
    });

    const totalRemaining = Array.from(apptMap.values()).reduce((sum, rem) => sum + rem, 0);
    const remainingCount = Array.from(apptMap.values()).filter((rem) => rem > 0).length;
    const depositCount = activeDeposits.length;
    const paidCount = recorded.filter(
      (p) =>
        p.paymentType === 'FULL' ||
        p.paymentType === 'REMAINING' ||
        p.appointment?.remainingAmount === 0
    ).length;

    return {
      totalCollected,
      totalDeposits,
      totalRemaining,
      counts: {
        all: rawPayments.length,
        paid: paidCount,
        deposit: depositCount,
        remaining: remainingCount,
      },
    };
  }, [backendSummary, rawPayments]);

  // 2. تطبيق فلتر البحث والتبويبات
  const filteredPayments = useMemo(() => {
    return rawPayments.filter((p) => {
      // فلتر التبويب (Tab)
      if (currentTab === 'paid') {
        const isPaid =
          p.paymentType === 'FULL' ||
          p.paymentType === 'REMAINING' ||
          p.appointment?.remainingAmount === 0;
        if (!isPaid) return false;
      } else if (currentTab === 'deposit') {
        const hasRemaining = (p.appointment?.remainingAmount ?? 0) > 0;
        if (p.paymentType !== 'DEPOSIT' || !hasRemaining) return false;
      } else if (currentTab === 'remaining') {
        const remaining = p.appointment?.remainingAmount ?? 0;
        if (remaining <= 0 || p.appointment?.isExempt) return false;
      }

      // فلتر البحث (Search Query)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const patientName = (p.patient?.fullName || '').toLowerCase();
        const patientPhone = (p.patient?.phone || '').toLowerCase();
        const doctorName = (p.doctor?.name || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        return (
          patientName.includes(q) ||
          patientPhone.includes(q) ||
          doctorName.includes(q) ||
          notes.includes(q)
        );
      }

      return true;
    });
  }, [rawPayments, currentTab, searchQuery]);

  // 3. تصدير كشف المدفوعات بصيغة CSV تدعم اللغة العربية
  const handleExportCsv = () => {
    if (filteredPayments.length === 0) {
      toast.warning(
        tr('لا توجد مدفوعات لتصديرها في هذا اليوم', 'No payments to export for this date')
      );
      return;
    }

    const headers = [
      tr('رقم الإيصال', 'Receipt ID'),
      tr('المريض', 'Patient'),
      tr('الهاتف', 'Phone'),
      tr('المبلغ المسدد', 'Amount Paid'),
      tr('إجمالي الكشف', 'Total Fee'),
      tr('المتبقي', 'Remaining'),
      tr('نوع الدفعة', 'Payment Type'),
      tr('طريقة الدفع', 'Method'),
      tr('الطبيب', 'Doctor'),
      tr('وقت العملية', 'Time'),
      tr('المحصل', 'Collector'),
      tr('الملاحظات', 'Notes'),
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.patient?.fullName || tr('غير مسجل', 'Unregistered'),
      p.patient?.phone || '',
      p.amount,
      p.appointment?.totalAmount ?? p.amount,
      p.appointment?.remainingAmount ?? 0,
      p.paymentType === 'DEPOSIT'
        ? tr('عربون', 'Deposit')
        : p.paymentType === 'REMAINING'
        ? tr('سداد متبقي', 'Remaining Payment')
        : tr('سداد كامل', 'Full Payment'),
      p.method === 'CARD'
        ? tr('فيزا', 'Card')
        : p.method === 'WALLET'
        ? tr('محفظة', 'Wallet')
        : tr('نقدي', 'Cash'),
      p.doctor?.name || '',
      new Date(p.createdAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US'),
      p.receivedBy?.name || '',
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tr('كشف_مدفوعات', 'payments_ledger')}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(tr('تم تصدير كشف المدفوعات بنجاح', 'Payments ledger exported successfully'));
  };

  // 4. طباعة إيصال دفع مفرد
  const handlePrintReceipt = (payment: PaymentItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(
        tr('يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال', 'Please allow pop-ups to print the receipt')
      );
      return;
    }

    const currency = tr('ج.م', 'EGP');
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${isAr ? 'ar' : 'en'}">
        <head>
          <meta charset="utf-8">
          <title>${tr('إيصال سداد', 'Payment Receipt')} - ${payment.patient?.fullName || ''}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #074C3A; }
            .header { text-align: center; border-bottom: 2px dashed #CBD5E1; padding-bottom: 16px; margin-bottom: 20px; }
            .clinic-name { font-size: 20px; font-weight: 900; }
            .title { font-size: 15px; color: #64748B; margin-top: 4px; }
            .details { line-height: 2; font-size: 14px; margin-bottom: 24px; }
            .amount-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
            .amount { font-size: 26px; font-weight: 900; color: #16A34A; }
            .footer { text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${tr('عيادة د. إسلام عبدالله كريمة', 'Dr. Eslam Abdallah Kareema Clinic')}</div>
            <div class="title">${tr('إيصال سداد رسوم طبية', 'Medical Fee Payment Receipt')}</div>
          </div>
          <div class="details">
            <div><strong>${tr('اسم المريض:', 'Patient Name:')}</strong> ${payment.patient?.fullName || tr('غير مسجل', 'Unregistered')}</div>
            <div><strong>${tr('الهاتف:', 'Phone:')}</strong> <span dir="ltr">${payment.patient?.phone || '-'}</span></div>
            <div><strong>${tr('الطبيب المعالج:', 'Doctor:')}</strong> ${payment.doctor?.name || tr('د. إسلام', 'Dr. Eslam')}</div>
            <div><strong>${tr('نوع الحجز:', 'Booking Type:')}</strong> ${payment.appointment?.type || tr('كشف', 'Examination')}</div>
            <div><strong>${tr('طريقة الدفع:', 'Payment Method:')}</strong> ${payment.method}</div>
            <div><strong>${tr('تاريخ وتوقيت العملية:', 'Date & Time:')}</strong> ${new Date(payment.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</div>
            <div><strong>${tr('المحصل:', 'Collector:')}</strong> ${payment.receivedBy?.name || '-'}</div>
          </div>
          <div class="amount-box">
            <div style="font-size: 13px; color: #64748B;">${tr('المبلغ المسدد في هذا الإيصال', 'Paid in this Receipt')}</div>
            <div class="amount">${payment.amount} ${currency}</div>
            ${
              (payment.appointment?.remainingAmount ?? 0) > 0
                ? `<div style="color: #D97706; font-size: 13px; margin-top: 6px;">${tr('المتبقي بعد هذا الإيصال:', 'Remaining after this receipt:')} ${payment.appointment?.remainingAmount} ${currency}</div>`
                : `<div style="color: #16A34A; font-size: 13px; margin-top: 6px;">${tr('تم سداد كامل الحساب ✓', 'Balance paid in full ✓')}</div>`
            }
          </div>
          <div class="footer">
            ${tr('شكراً لزيارتكم ونتمنى لكم دوام الصحة والعافية', 'Thank you for your visit. We wish you good health and wellness.')}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200" dir={dir}>
      {/* 1. رأس الصفحة: العنوان والوصف والتاريخ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight">
            {t('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('subtitle')} ({selectedDate})
          </p>
        </div>

        {/* زر التحديث اليدوي إذا احتاج المستخدم */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          title={t('refresh')}
          className="h-10 px-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#0B7B5E] ${isFetching ? 'animate-spin' : ''}`}
          />
          <span>{t('refresh')}</span>
        </button>
      </div>

      {/* 2. بطاقات الإحصائيات الثلاث في الأعلى (KPI Cards) */}
      <PaymentsSummaryCards summary={summary} dateLabel={selectedDate} />

      {/* 3. شريط الفلاتر والبحث والتحكم */}
      <PaymentsFiltersBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        counts={summary.counts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedDoctorId={selectedDoctorId}
        onDoctorChange={setSelectedDoctorId}
        doctors={doctors}
        onExport={handleExportCsv}
      />

      {/* 4. قائمة المدفوعات */}
      <div className="space-y-3.5">
        {isLoading ? (
          /* حالة التحميل */
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#0B7B5E] animate-spin" />
            <p className="text-sm font-bold text-[#074C3A]">
              {tr('جاري تحميل سجل المدفوعات...', 'Loading payments ledger...')}
            </p>
            <p className="text-xs text-slate-400">
              {tr('يرجى الانتظار لحظات', 'Please wait a moment')}
            </p>
          </div>
        ) : error ? (
          /* حالة الخطأ */
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-bold text-rose-800">
              {(error as any)?.message || tr('فشل جلب سجل المدفوعات', 'Failed to fetch payments ledger')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              {tr('إعادة المحاولة', 'Retry')}
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          /* حالة عدم وجود مدفوعات */
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-14 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-[#074C3A]">
              {searchQuery
                ? tr('لا توجد نتائج تطابق بحثك', 'No results match your search')
                : tr('لا توجد مدفوعات مسجلة لهذا اليوم', 'No payments recorded for this day')}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery
                ? tr(
                    'جرب البحث بكلمة أخرى أو تغيير معايير الفلترة',
                    'Try searching with another term or changing the filters'
                  )
                : tr(
                    'سيتم ظهور جميع المبالغ المحصلة وعربون الحجوزات تلقائياً هنا فور إتمامها',
                    'All collected amounts and booking deposits will appear here automatically'
                  )}
            </p>
          </div>
        ) : (
          /* عرض بطاقات المدفوعات */
          filteredPayments.map((payment) => (
            <PaymentCardItem
              key={payment.id}
              payment={payment}
              onPayRemaining={(p) => setSelectedPaymentForPay(p)}
              onPrintReceipt={(p) => handlePrintReceipt(p)}
            />
          ))
        )}
      </div>

      {/* 5. نافذة سداد المبلغ المتبقي (Pay Remaining Modal) */}
      {selectedPaymentForPay && selectedPaymentForPay.appointment && (
        <PayRemainingModal
          isOpen={Boolean(selectedPaymentForPay)}
          onClose={() => setSelectedPaymentForPay(null)}
          appointmentId={selectedPaymentForPay.appointment.id}
          patientName={selectedPaymentForPay.patient?.fullName || tr('المريض', 'Patient')}
          totalAmount={selectedPaymentForPay.appointment.totalAmount}
          paidAmount={selectedPaymentForPay.appointment.paidAmount}
          remainingAmount={selectedPaymentForPay.appointment.remainingAmount}
        />
      )}
    </div>
  );
}
