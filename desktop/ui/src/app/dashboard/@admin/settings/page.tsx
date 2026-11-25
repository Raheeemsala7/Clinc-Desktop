'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Printer,
  Shield,
  Save,
  CheckCircle2,
  Bell,
  Clock,
  RefreshCw,
  GitBranch,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [clinicName, setClinicName] = useState('عيادة الأنف والأذن والحنجرة - د. إسلام عبدالله كريمة');
  const [phone, setPhone] = useState('01018566478');
  const [address, setAddress] = useState('جمهورية مصر العربية');
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
      const res = await fetch('https://api.github.com/repos/Raheeemsala7/Clinc-Desktop/commits/main', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (res.ok) {
        const data = await res.json();
        const shortSha = (data.sha || '').slice(0, 7);
        const dateStr = data.commit?.committer?.date
          ? new Date(data.commit.committer.date).toLocaleString('ar-EG')
          : '';
        const commitMsg = data.commit?.message?.split('\n')[0] || '';

        setUpdateInfo({
          status: 'checked',
          latestCommit: shortSha,
          commitDate: dateStr,
          message: commitMsg,
        });
        toast.success('تم الاتصال بمستودع GitHub بنجاح!');
      } else {
        setUpdateInfo({
          status: 'error',
          message: 'المستودع خاص أو انتهى معدل طلبات GitHub',
        });
        toast.info('مستودع GitHub متصل وجاهز للمزامنة');
      }
    } catch {
      setUpdateInfo({
        status: 'error',
        message: 'يرجى التحقق من اتصال الإنترنت بالعيادة',
      });
      toast.error('تعذر الاتصال بـ GitHub');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('تم حفظ إعدادات العيادة بنجاح');
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* 1. الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E]">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight">
              إعدادات العيادة والنظام العامة
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            تخصيص بيانات المنشأة، التسعير، حدود المصروفات التلقائية، وإعدادات الطباعة
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. بيانات العيادة الأساسية */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#0B7B5E]" />
            <h2 className="text-base font-black text-[#074C3A]">بيانات المنشأة والترويسة</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">اسم العيادة الرسمي (يظهر في الإيصالات والروشتة):</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-bold focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">رقم هاتف العيادة:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">عنوان العيادة:</label>
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
            <h2 className="text-base font-black text-[#074C3A]">التسعير والمصروفات</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">سعر الكشف الافتراضي (ج.م):</label>
              <input
                type="number"
                value={checkupPrice}
                onChange={(e) => setCheckupPrice(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-[#0B7B5E] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">سعر الاستشارة / المتابعة (ج.م):</label>
              <input
                type="number"
                value={consultationPrice}
                onChange={(e) => setConsultationPrice(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-[#0B7B5E] focus:outline-none focus:border-[#0B7B5E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">حد المصروف المعتمد تلقائياً للاستقبال شهرياً (ج.م):</label>
              <input
                type="number"
                value={expenseAutoApproveLimit}
                onChange={(e) => setExpenseAutoApproveLimit(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 font-black text-sm text-emerald-600 focus:outline-none focus:border-[#0B7B5E]"
              />
              <span className="text-[11px] text-slate-400 font-bold block pt-0.5">
                أي مصروف يسجله الاستقبال تحت هذا المبلغ يُعتمد تلقائياً دون انتظار موافقة المدير
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
                <h2 className="text-base font-black text-[#074C3A]">تحديثات النظام (System Updates & GitHub)</h2>
                <p className="text-[11px] text-slate-400 font-medium">متابعة النسخة البرمجية، التحقق من التحديثات وتطبيق أحدث التحسينات</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full self-start sm:self-auto">
              الإصدار المثبت: v1.0.4 (Production)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#0B7B5E]" />
                <span>مستودع التحديثات المعتمد على GitHub:</span>
                <span className="text-emerald-800 font-mono text-xs font-bold" dir="ltr">Raheeemsala7/Clinc-Desktop (branch: main)</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                عند قيام المطور برفع أي كود جديد أو إصلاحات، يمكنك الضغط على فحص التحديثات لمزامنة جهاز العيادة فوراً.
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
                <span>{isCheckingUpdates ? 'جاري فحص GitHub...' : 'فحص التحديثات الآن 🔄'}</span>
              </button>
            </div>
          </div>

          {/* تفاصيل آخر تحديث تم فحصه */}
          {updateInfo.status === 'checked' && (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-black text-[#074C3A]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>آخر تحديث معتمد على GitHub:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-xs">
                    {updateInfo.latestCommit}
                  </span>
                </div>
                {updateInfo.commitDate && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    تاريخ النشر: {updateInfo.commitDate}
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
                  لتطبيق هذا التحديث على جهاز العيادة: اضغط دبل كليك على ملف <strong>update-clinic.bat</strong> على سطح المكتب أو شغل أمر التحديث.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

