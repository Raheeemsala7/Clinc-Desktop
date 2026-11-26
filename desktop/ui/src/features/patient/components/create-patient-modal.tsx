'use client';

import React, { useState, useTransition } from 'react';
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { createNewPatientAction } from '../apis/patient.action';
import { CHRONIC_DISEASES } from '@/features/appointments/constants/booking.constant';

const CHRONIC_DISEASE_EN: Record<string, string> = {
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  heart: 'Heart Disease',
  allergy: 'Allergy',
  asthma: 'Asthma',
  kidney: 'Kidney Disease',
  thyroid: 'Thyroid',
  other: 'Other',
};

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePatientModal({ isOpen, onClose, onSuccess }: CreatePatientModalProps) {
  const { isAr, dir, tr } = useAppLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(30);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [maritalStatus, setMaritalStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED'>('MARRIED');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [hasChronic, setHasChronic] = useState(false);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [otherDiseaseText, setOtherDiseaseText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isChild = typeof age === 'number' && age < 18;

  if (!isOpen) return null;

  const toggleDisease = (name: string) => {
    setSelectedDiseases((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // التحقق من الاسم الرباعي
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 4) {
      setFormError(
        tr(
          'يجب إدخال اسم المريض رباعياً على الأقل (أربعة أسماء).',
          'Please enter the patient full name (at least 4 parts).'
        )
      );
      return;
    }

    // التحقق من رقم الهاتف
    const phoneClean = phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) {
      setFormError(
        tr(
          'رقم الهاتف غير صالح، يجب أن يبدأ بـ 01 ويتكون من 11 رقماً.',
          'Invalid phone number; must start with 01 and be 11 digits.'
        )
      );
      return;
    }

    if (!age || Number(age) <= 0 || Number(age) > 120) {
      setFormError(
        tr(
          'يرجى إدخال عمر صحيح بين 1 و 120 سنة.',
          'Please enter a valid age between 1 and 120 years.'
        )
      );
      return;
    }

    startTransition(async () => {
      let finalChronic = hasChronic ? [...selectedDiseases] : [];
      if (finalChronic.includes('أخرى')) {
        finalChronic = finalChronic.filter((d) => d !== 'أخرى');
        if (otherDiseaseText.trim()) {
          finalChronic.push(`أخرى: ${otherDiseaseText.trim()}`);
        }
      }

      const res = await createNewPatientAction({
        fullName: fullName.trim(),
        phone: phoneClean,
        gender,
        maritalStatus: isChild ? 'SINGLE' : maritalStatus,
        age: Number(age),
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        chronicConditions: finalChronic,
      });

      if (res.status) {
        toast.success(
          tr(
            `تم تسجيل المريض (${fullName}) بنجاح`,
            `Patient (${fullName}) registered successfully`
          )
        );
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setFormError(res.message || tr('فشل تسجيل المريض', 'Failed to register patient'));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-start relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        dir={dir}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E] flex items-center justify-center">
              <UserPlus className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#074C3A]">{tr('إضافة مريض جديد', 'Add New Patient')}</h3>
              <p className="text-xs text-slate-400">{tr('سجل ملف المريض في قاعدة بيانات العيادة', 'Register a patient record in the clinic database')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
          {/* الاسم رباعياً */}
          <div>
            <label className="block mb-1.5 text-slate-700">{tr('الاسم بالكامل (رباعي) *', 'Full Name (4 parts) *')}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={tr('مثال: محمد علاء الدين محمود أحمد', 'e.g. Mohamed Alaa El-Din Mahmoud Ahmed')}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* رقم الهاتف */}
            <div>
              <label className="block mb-1.5 text-slate-700">{tr('رقم الهاتف *', 'Phone Number *')}</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-mono font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* العمر */}
            <div>
              <label className="block mb-1.5 text-slate-700">{tr('العمر (بالسنوات) *', 'Age (Years) *')}</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* النوع */}
            <div>
              <label className="block mb-1.5 text-slate-700">{tr('النوع *', 'Gender *')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    gender === 'MALE'
                      ? 'bg-[#E3F5EE] border-[#0B7B5E] text-[#0B7B5E]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tr('ذكر', 'Male')}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    gender === 'FEMALE'
                      ? 'bg-pink-50 border-pink-500 text-pink-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tr('أنثى', 'Female')}
                </button>
              </div>
            </div>

            {/* العنوان */}
            <div>
              <label className="block mb-1.5 text-slate-700">
                {tr('العنوان / المدينة', 'Address / City')}{' '}
                <span className="text-slate-400 font-normal text-[11px]">{tr('(اختياري)', '(Optional)')}</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tr('مثال: الزقازيق، الشرقية', 'e.g. Zagazig, Sharqia')}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* الوظيفة (اختياري) */}
          <div>
            <label className="block mb-1.5 text-slate-700">
              {tr('الوظيفة', 'Occupation')}{' '}
              <span className="text-slate-400 font-normal text-[11px]">{tr('(اختياري)', '(Optional)')}</span>
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder={tr('مثال: مهندس، معلم، تاجر...', 'e.g. Engineer, Teacher, Merchant...')}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* الحالة الاجتماعية - تختفي تلقائياً إذا كان المريض طفلاً */}
          <div>
            <label className="block mb-1.5 text-slate-700">{tr('الحالة الاجتماعية *', 'Marital Status *')}</label>
            {!isChild ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'MARRIED', label: tr('متزوج', 'Married') },
                  { id: 'SINGLE', label: tr('أعزب', 'Single') },
                  { id: 'WIDOWED', label: tr('أرمل / أرملة', 'Widowed') },
                  { id: 'DIVORCED', label: tr('مطلق / مطلقة', 'Divorced') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMaritalStatus(item.id as any)}
                    className={`h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none ${
                      maritalStatus === item.id
                        ? 'bg-[#074C3A] text-white border-[#074C3A] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>{tr('الحالة الاجتماعية:', 'Marital Status:')}</span>
                <span className="text-[#0B7B5E] bg-[#E3F5EE] px-2.5 py-0.5 rounded-lg border border-[#D0E5DC]">
                  {tr('طفل / قاصر (أعزب تلقائياً)', 'Child / Minor (Single automatically)')}
                </span>
              </div>
            )}
          </div>

          {/* الأمراض المزمنة */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 font-bold">{tr('هل يعاني من أمراض مزمنة؟', 'Has chronic conditions?')}</span>
              <button
                type="button"
                onClick={() => setHasChronic(!hasChronic)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasChronic ? 'bg-[#0B7B5E]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hasChronic ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {hasChronic && (
              <div className="space-y-2 pt-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {CHRONIC_DISEASES.map((disease) => {
                    const isSelected = selectedDiseases.includes(disease.label);
                    const displayLabel = isAr ? disease.label : (CHRONIC_DISEASE_EN[disease.id] || disease.label);
                    return (
                      <button
                        key={disease.id}
                        type="button"
                        onClick={() => toggleDisease(disease.label)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>

                {/* حقل إدخال مرض مزمن آخر عند اختيار "أخرى" */}
                {selectedDiseases.includes('أخرى') && (
                  <div className="pt-1.5 animate-in fade-in-50">
                    <label className="block mb-1 text-[11px] font-bold text-amber-900">
                      {tr('حدد اسم المرض المزمن الآخر:', 'Specify other chronic condition:')}
                    </label>
                    <input
                      type="text"
                      value={otherDiseaseText}
                      onChange={(e) => setOtherDiseaseText(e.target.value)}
                      placeholder={tr('مثال: سيولة الدم، روماتيزم، حساسية بنسلين...', 'e.g. Hemophilia, Rheumatism, Penicillin allergy...')}
                      className="w-full h-9 px-3 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{tr('جاري التسجيل...', 'Registering...')}</span>
                </>
              ) : (
                <span>{tr('تسجيل المريض', 'Register Patient')}</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all cursor-pointer"
            >
              {tr('إلغاء', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
