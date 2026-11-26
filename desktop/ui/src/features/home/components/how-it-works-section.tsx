'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

export const HowItWorksSection = () => {
  const { dir, tr } = useAppLocale();

  const steps = [
    {
      num: '1',
      title: tr('الحجز', 'Booking'),
      description: tr(
        'حجز المريض وتسجيل بياناته ودوره في طابور العيادة.',
        'Book the patient, register their details, and assign their place in the clinic queue.'
      ),
    },
    {
      num: '2',
      title: tr('الانتظار', 'Waiting'),
      description: tr(
        'يتابع الاستقبال الطابور ويدخل المريض في دوره المحدد بدقة.',
        'Reception monitors the live queue and sends the patient in right on turn.'
      ),
    },
    {
      num: '3',
      title: tr('الكشف', 'Examination'),
      description: tr(
        'يفحص الطبيب الحالة، يطّلع على السجل، ويكتب الإجراء والروشتة.',
        'The doctor examines the patient, reviews their medical history, and writes the notes and prescription.'
      ),
    },
    {
      num: '4',
      title: tr('الإنهاء', 'Completion'),
      description: tr(
        'يغادر المريض العيادة ومعه الروشتة المطبوعة في ثوانٍ معدودة.',
        'The patient leaves the clinic with a cleanly printed prescription in just seconds.'
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-14 lg:py-20 select-none" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* عنوان القسم */}
        <div className="text-center space-y-3 mb-14">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#E3F5EE] text-[#0B7B5E] text-xs font-bold border border-[#D0E5DC]">
            {tr('كيف نعمل', 'How It Works')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-[#0B241D]">
            {tr(
              'من دخول المريض حتى خروجه، في أربع خطوات',
              'From Patient Check-in to Check-out in Four Steps'
            )}
          </h2>
        </div>

        {/* الخطوات الأربعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white border border-[#D0E5DC] p-6 rounded-3xl relative text-center space-y-3 shadow-2xs hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B7B5E] text-white font-black text-base flex items-center justify-center mx-auto shadow-xs">
                {st.num}
              </div>
              <h3 className="font-heading font-black text-lg text-[#0B241D]">
                {st.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#4A635B] leading-relaxed font-medium">
                {st.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

