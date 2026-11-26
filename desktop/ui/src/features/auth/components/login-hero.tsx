'use client';

import React from 'react';
import { NafsIcon } from '@/shared/components/nafs-logo';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

export function LoginHero() {
  const { dir, tr } = useAppLocale();

  return (
    <div dir={dir} className="relative w-full h-full min-h-[500px] lg:min-h-screen bg-gradient-to-br from-[#071510] via-[#074C3A] to-[#0B7B5E] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none">
      {/* إضاءات جمالية متوهجة في الخلفية بالأخضر الزمردي والنعناعي */}
      <div
        className="absolute top-1/4 -end-16 w-96 h-96 bg-[#45DBA5]/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -start-16 w-80 h-80 bg-[#0B7B5E]/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* الشريط العلوي: شعار ميدورا الرسمي */}
      <div className="relative z-10 flex items-center justify-end w-full">
        <div className="flex items-center gap-2.5">
          <span className="font-heading font-black text-white text-lg tracking-tight">
            {tr('ميدورا (Medora)', 'Medora')}
          </span>
          <NafsIcon size={32} />
        </div>
      </div>

      {/* المحتوى الأوسط: العنوان العريض والنص التوضيحي */}
      <div className="relative z-10 my-auto py-12 text-start max-w-lg space-y-4">
        <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold border border-white/20">
          {tr('منظومة إدارة العيادات', 'Clinic Management System')}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-white leading-tight tracking-tight">
          {tr('نظّم عيادتك', 'Organize your clinic')}
          <br />
          <span className="text-[#45DBA5]">{tr('بكل بساطة', 'effortlessly')}</span>
        </h1>
        <p className="text-emerald-50 text-sm sm:text-base leading-relaxed max-w-md font-medium">
          {tr(
            'سجلات المرضى، الحجوزات والطابور الحي، الروشتات الإلكترونية، والحسابات اليومية في مكان واحد آمن ومدى الحياة.',
            'Patient records, appointments, live queue, digital prescriptions, and daily finances all in one secure clinic workspace.'
          )}
        </p>
      </div>

      {/* الأشكال الجمالية المنحنية في الأسفل */}
      <div className="relative z-0 h-36 w-full pointer-events-none flex items-end justify-start">
        <div className="w-36 h-36 bg-[#0B7B5E]/60 rounded-3xl border border-white/10 shadow-2xl relative -bottom-6 start-6" />
        <div className="w-24 h-24 bg-[#45DBA5]/25 rounded-2xl border border-white/15 relative -bottom-4 start-10" />
      </div>
    </div>
  );
}
