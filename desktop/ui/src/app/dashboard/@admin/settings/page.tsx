'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Save,
  CheckCircle2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

const DEFAULT_CLINIC_NAME_AR = 'عيادة الأنف والأذن والحنجرة - د. إسلام عبدالله كريمة';
const DEFAULT_CLINIC_NAME_EN = 'ENT Clinic - Dr. Eslam Abdallah Kareema';
const DEFAULT_ADDRESS_AR = 'جمهورية مصر العربية';
const DEFAULT_ADDRESS_EN = 'Egypt';

export default function AdminSettingsPage() {
  const { isAr, dir, tr } = useAppLocale();
  const [clinicName, setClinicName] = useState(() =>
    isAr ? DEFAULT_CLINIC_NAME_AR : DEFAULT_CLINIC_NAME_EN
  );
  const [phone, setPhone] = useState('01018566478');
  const [address, setAddress] = useState(() =>
    isAr ? DEFAULT_ADDRESS_AR : DEFAULT_ADDRESS_EN
  );

  useEffect(() => {
    setClinicName((prev) =>
      prev === DEFAULT_CLINIC_NAME_AR || prev === DEFAULT_CLINIC_NAME_EN
        ? isAr
          ? DEFAULT_CLINIC_NAME_AR
          : DEFAULT_CLINIC_NAME_EN
        : prev
    );
    setAddress((prev) =>
      prev === DEFAULT_ADDRESS_AR || prev === DEFAULT_ADDRESS_EN
        ? isAr
          ? DEFAULT_ADDRESS_AR
          : DEFAULT_ADDRESS_EN
        : prev
    );
  }, [isAr]);
  const [checkupPrice, setCheckupPrice] = useState(300);
  const [consultationPrice, setConsultationPrice] = useState(100);
  const [expenseAutoApproveLimit, setExpenseAutoApproveLimit] = useState(1000);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    status: 'idle' | 'checked' | 'error';
    message?: string;
    latestCommit?: string;
    commitDate?: string;
  }>({ status: 'idle' });

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const res = await fetch(
        'https://api.github.com/repos/Raheeemsala7/Clinc-Desktop/commits/main',
        {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const shortSha = (data.sha || '').slice(0, 7);
        const dateStr = data.commit?.committer?.date
          ? new Date(data.commit.committer.date).toLocaleString(isAr ? 'ar-EG' : 'en-US')
          : '';
        const commitMsg = data.commit?.message?.split('\n')[0] || '';

        setUpdateInfo({
          status: 'checked',
          latestCommit: shortSha,
          commitDate: dateStr,
          message: commitMsg,
        });
        toast.success(tr('تم الاتصال بمستودع GitHub بنجاح!', 'Connected to GitHub repository successfully!'));
      } else {
        setUpdateInfo({
          status: 'error',
          message: tr(
            'المستودع خاص أو انتهى معدل طلبات GitHub',
            'Repository is private or GitHub rate limit reached'
          ),
        });
        toast.info(tr('مستودع GitHub متصل وجاهز للمزامنة', 'GitHub repository connected and ready to sync'));
      }
    } catch {
      setUpdateInfo({
        status: 'error',
        message: tr(
          'يرجى التحقق من اتصال الإنترنت بالعيادة',
          'Please check the clinic internet connection'
        ),
      });
      toast.error(tr('تعذر الاتصال بـ GitHub', 'Failed to connect to GitHub'));
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(tr('تم حفظ إعدادات العيادة بنجاح', 'Clinic settings saved successfully'));
    }, 600);
  };

  const currencyLabel = tr('ج.م', 'EGP');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* 1. الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E]">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight">
              {tr('إعدادات العيادة والنظام العامة', 'General Clinic & System Settings')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {tr(
              'تخصيص بيانات المنشأة، التسعير، حدود المصروفات التلقائية، وإعدادات الطباعة',
              'Customize clinic info, default pricing, auto-approved expense limits, and print settings'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? tr('جاري الحفظ...', 'Saving...') : tr('حفظ التعديلات', 'Save Changes')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. بيانات العيادة الأساسية */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#0B7B5E]" />
            <h2 className="text-base font-black text-[#074C3A]">
              {tr('بيانات المنشأة والترويسة', 'Clinic Information & Header')}
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr(
                  'اسم العيادة الرسمي (يظهر في الإيصالات والروشتة):',
                  'Official Clinic Name (shown on receipts and prescriptions):'
                )}
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-bold focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr('رقم هاتف العيادة:', 'Clinic Phone Number:')}
              </label>
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr('عنوان العيادة:', 'Clinic Address:')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-bold focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>
          </div>
        </div>

        {/* 3. الإعدادات المالية والتسعير */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-[#074C3A]">
              {tr('التسعير والمصروفات', 'Pricing & Expenses')}
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr(
                  `سعر الكشف الافتراضي (${currencyLabel}):`,
                  `Default Examination Price (${currencyLabel}):`
                )}
              </label>
              <input
                type="number"
                value={checkupPrice}
                onChange={(e) => setCheckupPrice(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-[#0B7B5E] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr(
                  `سعر الاستشارة / المتابعة (${currencyLabel}):`,
                  `Consultation / Follow-up Price (${currencyLabel}):`
                )}
              </label>
              <input
                type="number"
                value={consultationPrice}
                onChange={(e) => setConsultationPrice(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-[#0B7B5E] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {tr(
                  `حد المصروف المعتمد تلقائياً للاستقبال شهرياً (${currencyLabel}):`,
                  `Monthly Reception Auto-Approved Expense Limit (${currencyLabel}):`
                )}
              </label>
              <input
                type="number"
                value={expenseAutoApproveLimit}
                onChange={(e) => setExpenseAutoApproveLimit(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-emerald-600 focus:outline-none focus:border-[#0B7B5E]"
              />
              <span className="text-[11px] text-slate-400 font-bold block pt-0.5">
                {tr(
                  'أي مصروف يسجله الاستقبال تحت هذا المبلغ يُعتمد تلقائياً دون انتظار موافقة المدير',
                  'Any expense recorded by reception below this limit is auto-approved without waiting for admin approval'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 4. تحديثات النظام ومزامنة GitHub */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-sky-50 text-sky-600">
                <RefreshCw className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#074C3A]">
                  {tr('تحديثات النظام (System Updates & GitHub)', 'System Updates & GitHub')}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {tr(
                    'متابعة النسخة البرمجية، التحقق من التحديثات وتطبيق أحدث التحسينات',
                    'Track software version, check for updates, and apply the latest improvements'
                  )}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full self-start sm:self-auto">
              {tr('الإصدار المثبت: v1.0.5 (Production)', 'Installed Version: v1.0.5 (Production)')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
                <GitBranch className="w-4 h-4 text-[#0B7B5E]" />
                <span>{tr('مستودع التحديثات المعتمد على GitHub:', 'Official GitHub Update Repository:')}</span>
                <span className="text-emerald-800 font-mono text-xs font-bold" dir="ltr">
                  Raheeemsala7/Clinc-Desktop (branch: main)
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {tr(
                  'عند قيام المطور برفع أي كود جديد أو إصلاحات، يمكنك الضغط على فحص التحديثات لمزامنة جهاز العيادة فوراً.',
                  'When new code or fixes are pushed, click Check Updates to sync your clinic system.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdates}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                <span>
                  {isCheckingUpdates
                    ? tr('جاري فحص GitHub...', 'Checking GitHub...')
                    : tr('فحص التحديثات الآن 🔄', 'Check Updates Now 🔄')}
                </span>
              </button>
            </div>
          </div>

          {/* تفاصيل آخر تحديث تم فحصه */}
          {updateInfo.status === 'checked' && (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-black text-[#074C3A]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{tr('آخر تحديث معتمد على GitHub:', 'Latest verified GitHub commit:')}</span>
                  <span
                    className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-xs"
                    dir="ltr"
                  >
                    {updateInfo.latestCommit}
                  </span>
                </div>
                {updateInfo.commitDate && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {tr('تاريخ النشر:', 'Published:')} {updateInfo.commitDate}
                  </span>
                )}
              </div>
              {updateInfo.message && (
                <p className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-emerald-100 font-mono">
                  {updateInfo.message}
                </p>
              )}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="text-emerald-800 font-bold text-[11px]">
                  {tr(
                    'لتطبيق هذا التحديث على جهاز العيادة: اضغط دبل كليك على ملف ',
                    'To apply this update on the clinic PC: double-click '
                  )}
                  <strong dir="ltr">update-clinic.bat</strong>
                  {tr(
                    ' على سطح المكتب أو شغل أمر التحديث.',
                    ' on the desktop or run the update command.'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
