'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ServicePriceItem,
  DEFAULT_SERVICE_PRICES,
  getStoredPricing,
  saveStoredPricing,
} from '../pricing-storage';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

const SERVICE_DESCRIPTIONS_EN: Record<string, string> = {
  EXAMINATION: 'First-time clinic visit and comprehensive ENT examination',
  FOLLOW_UP: 'Follow-up checkup and progress review during the consultation window',
  OPERATION_FOLLOWUP: 'Post-operative checkup, wound care, and surgical recovery assessment',
  ENDOSCOPY: 'Specialized diagnostic endoscopy for ear, nose, or throat with documentation',
  SURGERY: 'Minor in-clinic surgical procedures such as nasal cautery or advanced ear cleaning',
  CONSULTATION: 'Medical consultation and review of lab tests, imaging, and reports',
};

export function PricingPageView() {
  const { isAr, dir, tr } = useAppLocale();
  const [services, setServices] = useState<ServicePriceItem[]>(DEFAULT_SERVICE_PRICES);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setServices(getStoredPricing());
  }, []);

  const handlePriceChange = (id: string, newPrice: number) => {
    setServices((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price: Math.max(0, newPrice) } : item
      )
    );
    setIsSaved(false);
  };

  const handleDurationChange = (id: string, newDuration: number) => {
    setServices((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, durationMinutes: Math.max(5, newDuration) } : item
      )
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    const success = saveStoredPricing(services);
    if (success) {
      toast.success(
        tr(
          'تم حفظ تسعيرات الخدمات بنجاح! سيتم تطبيقها تلقائياً عند إنشاء أي حجز جديد.',
          'Service pricing saved successfully! It will apply automatically to new bookings.'
        )
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      toast.error(tr('حدث خطأ أثناء حفظ التسعيرات', 'An error occurred while saving pricing'));
    }
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        tr(
          'هل أنت متأكد من استعادة أسعار الخدمات الافتراضية؟',
          'Are you sure you want to restore default service prices?'
        )
      )
    ) {
      setServices(DEFAULT_SERVICE_PRICES);
      saveStoredPricing(DEFAULT_SERVICE_PRICES);
      toast.success(tr('تمت استعادة الأسعار الافتراضية بنجاح', 'Default prices restored successfully'));
      setIsSaved(true);
    }
  };

  const currencyLabel = tr('ج.م', 'EGP');

  return (
    <div className="space-y-6 pb-20 select-none max-w-5xl mx-auto" dir={dir}>
      {/* ================== الشريط العلوي والترويسة ================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E3F5EE] border border-[#A7E3D0] flex items-center justify-center text-[#074C3A] shadow-xs shrink-0">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#074C3A]">
                {tr('تسعير خدمات العيادة والكشوفات', 'Clinic Services & Examination Pricing')}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E3F5EE] text-[#074C3A] font-black border border-[#A7E3D0]">
                {tr('الاستقبال', 'Reception')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
              {tr(
                'تحديد أسعار الكشف، الإعادة، المتابعة، المنظار والعمليات وتطبيقها التلقائي في الحجوزات',
                'Configure prices for examinations, follow-ups, endoscopy, and procedures for automatic booking defaults'
              )}
            </p>
          </div>
        </div>

        {/* أزرار العمليات العلوية */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title={tr('استعادة الأسعار الافتراضية', 'Restore default prices')}
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>{tr('الافتراضية', 'Defaults')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B7B5E] hover:bg-[#074C3A] active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr('تم الحفظ ✓', 'Saved ✓')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{tr('حفظ الأسعار', 'Save Prices')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================== كارت توضيحي إرشادي ================== */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-sky-950 font-bold space-y-1">
          <p>
            {tr('الأسعار المحددة هنا هي ', 'The prices configured here are the ')}
            <strong>{tr('الأسعار المعتمدة للعيادة', 'approved clinic prices')}</strong>
            {tr(
              ' التي تظهر تلقائياً لموظف الاستقبال عند اختيار نوع الحجز في شاشة الحجز الجديد.',
              ' shown automatically to receptionists when selecting an appointment type in New Booking.'
            )}
          </p>
          <p className="text-xs text-sky-800">
            {tr(
              '* يمكنك تعديل أي سعر بمرونة في أي وقت وسيتم تحديثه فورياً في جميع نماذج الحجز والمواعيد القادمة.',
              '* You can adjust any price at any time and it will update immediately across all booking forms and upcoming appointments.'
            )}
          </p>
        </div>
      </div>

      {/* ================== قائمة بطاقات الخدمات والأسعار ================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:border-[#0B7B5E]/50 transition-all flex flex-col justify-between space-y-4"
          >
            {/* رأس البطاقة */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-3.5 h-3.5 rounded-full ${service.dotColor} shrink-0 ring-2 ring-white shadow-xs`} />
                <div>
                  <h3 className="text-base font-black text-[#074C3A]">
                    {isAr ? service.name : service.nameEn}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {isAr ? service.nameEn : service.name}
                  </span>
                </div>
              </div>

              {/* وسم كود الخدمة */}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {service.id}
              </span>
            </div>

            {/* الوصف */}
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              {isAr ? service.description : SERVICE_DESCRIPTIONS_EN[service.id] || service.description}
            </p>

            {/* مدخلات السعر والمدة الزمنية */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              {/* حقل السعر */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {tr('السعر الأساسي', 'Base Price')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={service.price === 0 ? '' : service.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      handlePriceChange(service.id, e.target.value === '' ? 0 : Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-full h-11 px-3 pe-12 rounded-xl border border-slate-200 bg-white font-mono font-black text-sm text-[#074C3A] focus:border-[#0B7B5E] focus:ring-2 focus:ring-[#0B7B5E]/15 focus:outline-none transition-all"
                  />
                  <span className="absolute end-3 text-xs font-bold text-slate-400 pointer-events-none">
                    {currencyLabel}
                  </span>
                </div>
              </div>

              {/* حقل المدة التقديرية */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {tr('المدة المتوقعة', 'Estimated Duration')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={service.durationMinutes}
                    onChange={(e) =>
                      handleDurationChange(service.id, Number(e.target.value))
                    }
                    className="w-full h-11 px-3 pe-14 rounded-xl border border-slate-200 bg-white font-mono font-black text-sm text-slate-700 focus:border-[#0B7B5E] focus:ring-2 focus:ring-[#0B7B5E]/15 focus:outline-none transition-all"
                  />
                  <span className="absolute end-3 text-xs font-bold text-slate-400 pointer-events-none">
                    {tr('دقيقة', 'min')}
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار سريعة للضبط */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-bold">
                {tr('تعديل سريع:', 'Quick Adjust:')}
              </span>
              <button
                type="button"
                onClick={() => handlePriceChange(service.id, 0)}
                className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 transition-all cursor-pointer"
              >
                {tr('مجاني (0)', 'Free (0)')}
              </button>
              <button
                type="button"
                onClick={() => handlePriceChange(service.id, service.price + 50)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all cursor-pointer"
              >
                +50 {currencyLabel}
              </button>
              <button
                type="button"
                onClick={() => handlePriceChange(service.id, service.price + 100)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all cursor-pointer"
              >
                +100 {currencyLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* شريط الإجراءات السفلي */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs"
        >
          <ArrowRight className={`w-4 h-4 text-slate-500 ${!isAr ? 'rotate-180' : ''}`} />
          <span>{tr('العودة للوحة الاستقبال', 'Back to Reception Dashboard')}</span>
        </Link>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B7B5E] hover:bg-[#074C3A] active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{tr('حفظ كافة الأسعار', 'Save All Prices')}</span>
        </button>
      </div>
    </div>
  );
}
