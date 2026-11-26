'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, LogIn, FileText } from 'lucide-react';
import { COMPANY_WEBSITE_URL, TRY_DEMO_TOAST_MESSAGE } from '../constants';
import { toast } from 'sonner';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

export const HeroSection = () => {
  const { dir, tr } = useAppLocale();

  const handleTryDemo = () => {
    toast.info(tr(TRY_DEMO_TOAST_MESSAGE.ar, TRY_DEMO_TOAST_MESSAGE.en), {
      duration: 6000,
    });
  };

  return (
    <section id="hero" className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden select-none" dir={dir}>
      {/* خلفية جمالية خفيفة بالأخضر الزمردي والنعناعي */}
      <div className="absolute top-0 start-1/4 w-96 h-96 bg-[#E3F5EE]/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 end-10 w-80 h-80 bg-[#45DBA5]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* الجانب الأيمن (النص التعريفي والأزرار) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            {/* الشارة العلوية */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3F5EE] border border-[#D0E5DC] text-[#0B7B5E] text-xs sm:text-sm font-bold shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#0B7B5E] animate-pulse" />
              <span>{tr('منظومة إدارة العيادات', 'Clinic Management System')}</span>
            </motion.div>

            {/* العنوان الرئيسي */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-[#0B241D] tracking-tight leading-[1.25]"
            >
              {tr('نظّم عيادتك من الحجز', 'Organize Your Clinic from Booking')}
              <br />
              <span className="text-[#0B7B5E]">{tr('حتى الروشتة', 'to Prescription')}</span>
            </motion.h1>

            {/* النص الوصفي لمنظومة ميدورا */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-[#4A635B] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
            >
              &ldquo;{tr(
                'ميدورا (Medora): منظومة متكاملة لإدارة العيادات، حجز وطابور حي، وروشتة إلكترونية، وملف لكل مريض، وتقارير مالية. كلها في مكان واحد وبصلاحيات واضحة لكل فرد في الفريق.',
                'Medora: An all-in-one clinic management system for bookings, live queues, electronic prescriptions, patient records, and financial reports — all in one place with clear permissions for every team member.'
              )}&rdquo;
            </motion.p>

            {/* أزرار الإجراءات الرئيسية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <a
                href={COMPANY_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleTryDemo}
                className="bg-[#0B7B5E] hover:bg-[#09634C] active:scale-95 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{tr('جرب الموقع تجريبياً', 'Try Live Demo')}</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <Link
                href="/auth/login"
                className="bg-white hover:bg-[#F2F8F4] active:scale-95 text-[#074C3A] border-2 border-[#074C3A] font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <LogIn className="w-4 h-4 text-[#074C3A]" />
                <span>{tr('تسجيل الدخول', 'Sign In')}</span>
              </Link>
            </motion.div>

            {/* مميزات سريعة تحت الأزرار */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-3 text-xs sm:text-sm font-semibold text-[#8D9D97] flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <span>{tr('يعمل أوفلاين', 'Works Offline')}</span>
              <span>•</span>
              <span>{tr('يستخدمه مئات العيادات', 'Trusted by Hundreds of Clinics')}</span>
              <span>•</span>
              <span>{tr('ملفاتك تحت أيديك', 'Your Records at Your Fingertips')}</span>
            </motion.div>
          </div>

          {/* الجانب الأيسر: كرت الطابور الحي والروشتة الإلكترونية المطابق للصورة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="w-full max-w-md bg-white border border-[#D0E5DC] rounded-3xl p-6 shadow-xl space-y-5 relative">
              {/* ترويسة كرت الطابور الحي */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D0E5DC]">
                <h3 className="font-heading font-black text-base text-[#0B241D]">
                  {tr('الطابور الحي', 'Live Queue')}
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold border border-[#D0E5DC]">
                  {tr('3 في الانتظار', '3 Waiting')}
                </span>
              </div>

              {/* عناصر الطابور التفاعلية */}
              <div className="space-y-2.5">
                {/* 1. داخل الكشف (الحالة النشطة بالأخضر) */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#E3F5EE] border border-[#D0E5DC] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#0B7B5E] text-white font-black text-xs flex items-center justify-center shadow-xs">
                      12
                    </span>
                    <div>
                      <p className="font-bold text-xs text-[#0B241D]">{tr('داخل الكشف', 'In Examination')}</p>
                      <p className="text-[11px] text-[#4A635B]">{tr('الطبيب المعالج', 'Attending Doctor')}</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B7B5E] animate-pulse" />
                </div>

                {/* 2. التالي */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#0B7B5E]/40 hover:border-[#0B7B5E] transition-all shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-[#0B7B5E] text-[#0B7B5E] font-black text-xs flex items-center justify-center">
                      13
                    </span>
                    <div>
                      <p className="font-bold text-xs text-[#0B241D]">{tr('التالي', 'Next Up')}</p>
                      <p className="text-[11px] text-[#4A635B]">{tr('كشف جديد', 'New Visit')}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#0B7B5E]">{tr('جاهز', 'Ready')}</span>
                </div>

                {/* 3. في الانتظار */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FBF9] border border-[#D0E5DC] text-[#4A635B]">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-[#D0E5DC] text-[#8D9D97] font-black text-xs flex items-center justify-center">
                      14
                    </span>
                    <div>
                      <p className="font-bold text-xs text-[#4A635B]">{tr('في الانتظار', 'Waiting')}</p>
                      <p className="text-[11px] text-[#8D9D97]">{tr('متابعة كشف', 'Follow-up Visit')}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#8D9D97]">{tr('في الصالة', 'In Lobby')}</span>
                </div>
              </div>

              {/* كرت الروشتة الإلكترونية المطابق للديزاين */}
              <div className="p-4 rounded-2xl bg-[#F8FBF9] border border-[#D0E5DC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E3F5EE] text-[#0B7B5E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-xs text-[#0B241D]">
                    {tr('روشتة إلكترونية', 'Electronic Prescription')}
                  </h4>
                  <p className="text-[11px] text-[#4A635B] font-medium">
                    {tr('تُطبع بضغطة واحدة، للقياس على كرت العيادة', 'One-click printing, sized for your clinic letterhead')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
