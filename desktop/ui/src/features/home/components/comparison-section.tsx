'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

export const ComparisonSection = () => {
  const { dir, tr } = useAppLocale();

  return (
    <section className="py-8 select-none" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* كرت قبل ميدورا */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-7 rounded-3xl bg-[#F2F8F4] border border-[#D0E5DC] space-y-3 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-[#C0282E]">
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center font-bold text-xs">
                <X className="w-4 h-4 text-[#C0282E]" />
              </div>
              <h3 className="font-heading font-black text-lg text-[#0B241D]">
                {tr('قبل ميدورا', 'Before Medora')}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[#4A635B] leading-relaxed font-medium">
              {tr(
                'دفاتر ورق، وزحام في الاستقبال، ووقت ضائع، وحسابات متفرقة بين أكثر من مكان، وسجلات مفقودة يصعب تتبعها في الزيارات المتكررة.',
                'Paper notebooks, crowded reception areas, wasted time, scattered accounts across multiple places, and lost records that are hard to track across follow-up visits.'
              )}
            </p>
          </motion.div>

          {/* كرت مع ميدورا (بالأخضر الزمردي) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-7 rounded-3xl bg-[#0B7B5E] text-white space-y-3 shadow-lg"
          >
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                <Check className="w-4 h-4 text-[#45DBA5]" />
              </div>
              <h3 className="font-heading font-black text-lg text-white">
                {tr('مع ميدورا', 'With Medora')}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-emerald-50 leading-relaxed font-medium">
              {tr(
                'حجز منظم، دور واضح لكل مريض، وروشتة مطبوعة في ثوانٍ، وحسابات تنتهي بضغطة زر واحدة، وعيادتك جاهزة للبداية في أي وقت.',
                'Organized bookings, a clear turn for every patient, prescriptions printed in seconds, accounts settled with one click, and your clinic ready to run anytime.'
              )}
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

