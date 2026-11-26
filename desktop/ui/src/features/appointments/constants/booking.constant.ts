import { AppointmentTypeOption, PatientBasic } from '../types/booking';

export const CHRONIC_DISEASES = [
  { id: 'diabetes', label: 'السكر', labelEn: 'Diabetes' },
  { id: 'hypertension', label: 'الضغط', labelEn: 'Hypertension' },
  { id: 'heart', label: 'القلب', labelEn: 'Heart Disease' },
  { id: 'allergy', label: 'الحساسية', labelEn: 'Allergies' },
  { id: 'asthma', label: 'الربو', labelEn: 'Asthma' },
  { id: 'kidney', label: 'الكلى', labelEn: 'Kidney Disease' },
  { id: 'thyroid', label: 'الغدة الدرقية', labelEn: 'Thyroid' },
  { id: 'other', label: 'أخرى', labelEn: 'Other' },
] as const;

export const APPOINTMENT_TYPES: AppointmentTypeOption[] = [
  { id: 'EXAMINATION', label: 'كشف', dotColor: 'bg-[#0B7B5E]', defaultFee: 300 },
  { id: 'FOLLOW_UP', label: 'إعادة', dotColor: 'bg-emerald-500', defaultFee: 0 },
  { id: 'OPERATION_FOLLOWUP', label: 'متابعة عملية', dotColor: 'bg-amber-500', defaultFee: 0 },
  { id: 'ENDOSCOPY', label: 'منظار', dotColor: 'bg-teal-500', defaultFee: 200 },
  { id: 'SURGERY', label: 'تدخل جراحي', dotColor: 'bg-purple-600', defaultFee: 500 },
  { id: 'CONSULTATION', label: 'استشارة', dotColor: 'bg-indigo-500', defaultFee: 150 },
];

export const APPOINTMENT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  EXAMINATION: { ar: 'كشف', en: 'Examination' },
  FOLLOW_UP: { ar: 'إعادة', en: 'Follow Up' },
  OPERATION_FOLLOWUP: { ar: 'متابعة عملية', en: 'Post-Op Follow Up' },
  ENDOSCOPY: { ar: 'منظار', en: 'Endoscopy' },
  SURGERY: { ar: 'تدخل جراحي', en: 'Surgery' },
  POST_OPERATIVE: { ar: 'تدخل جراحي', en: 'Post-Operative' },
  TEST_RESULTS_REVIEW: { ar: 'مراجعة فحوصات', en: 'Test Review' },
  LAB_TESTS_IMAGING: { ar: 'منظار', en: 'Lab & Imaging' },
  CONSULTATION: { ar: 'استشارة', en: 'Consultation' },
};

export function getAppointmentTypeLabel(type: string | undefined, isAr: boolean): string {
  const entry = type ? APPOINTMENT_TYPE_LABELS[type] : undefined;
  if (entry) return isAr ? entry.ar : entry.en;
  return isAr ? 'كشف' : 'Examination';
}

export function getLocalizedAppointmentTypes(isAr: boolean): AppointmentTypeOption[] {
  return APPOINTMENT_TYPES.map((opt) => ({
    ...opt,
    label: getAppointmentTypeLabel(opt.id, isAr),
  }));
}

export function getChronicDiseaseLabel(idOrLabel: string, isAr: boolean): string {
  const match = CHRONIC_DISEASES.find(
    (d) => d.id === idOrLabel || d.label === idOrLabel || d.labelEn === idOrLabel
  );
  if (match) return isAr ? match.label : match.labelEn;
  return idOrLabel;
}

export const EXEMPTION_PRESETS = [
  'حالة إنسانية / غير مقتدر',
  'استشارة مجانية بعد كشف',
  'توصية وإعفاء من الطبيب',
  'طبيب زميل أو عائلة الطبيب',
  'تأمين / رعاية خاصة',
] as const;

export const EXEMPTION_PRESET_OPTIONS = [
  {
    value: 'حالة إنسانية / غير مقتدر',
    ar: 'حالة إنسانية / غير مقتدر',
    en: 'Humanitarian case / Unable to pay',
  },
  {
    value: 'استشارة مجانية بعد كشف',
    ar: 'استشارة مجانية بعد كشف',
    en: 'Free follow-up consultation',
  },
  {
    value: 'توصية وإعفاء من الطبيب',
    ar: 'توصية وإعفاء من الطبيب',
    en: 'Doctor recommendation & fee waiver',
  },
  {
    value: 'طبيب زميل أو عائلة الطبيب',
    ar: 'طبيب زميل أو عائلة الطبيب',
    en: 'Colleague doctor or doctor family',
  },
  {
    value: 'تأمين / رعاية خاصة',
    ar: 'تأمين / رعاية خاصة',
    en: 'Insurance / Special care',
  },
] as const;

export function getExemptionReasonLabel(reason: string | undefined, isAr: boolean): string {
  if (!reason) {
    return isAr ? EXEMPTION_PRESET_OPTIONS[0].ar : EXEMPTION_PRESET_OPTIONS[0].en;
  }
  const match = EXEMPTION_PRESET_OPTIONS.find(
    (opt) => opt.value === reason || opt.ar === reason || opt.en === reason
  );
  if (match) return isAr ? match.ar : match.en;
  return reason;
}

export function formatDoctorName(name: string | undefined, isAr: boolean): string {
  if (!name || !name.trim()) {
    return isAr ? 'د. إسلام عبدالله' : 'Dr. Eslam Abdallah';
  }
  const clean = name.trim();
  if (clean.startsWith('د.') || clean.startsWith('Dr.') || clean.startsWith('د/')) {
    return isAr ? clean : clean.replace(/^د[./]\s*/, 'Dr. ');
  }
  return isAr ? `د. ${clean}` : `Dr. ${clean}`;
}

export function formatTime12h(timeOrLabel: string | undefined, isAr: boolean): string {
  if (!timeOrLabel) return '--:--';
  const trimmed = timeOrLabel.trim();
  const isPmHint = trimmed.includes('م') || trimmed.toLowerCase().includes('pm');
  const isAmHint = trimmed.includes('ص') || trimmed.toLowerCase().includes('am');

  const digitsOnly = trimmed.replace(/[^\d:]/g, '');
  const parts = digitsOnly.split(':');
  if (parts.length < 2) return timeOrLabel;

  let hour = parseInt(parts[0], 10);
  const minute = parts[1].padStart(2, '0');
  if (isNaN(hour)) return timeOrLabel;

  if (isPmHint && hour < 12) hour += 12;
  if (isAmHint && hour === 12) hour = 0;

  const isPm = hour >= 12;
  const displayHour = (hour % 12 || 12).toString().padStart(2, '0');
  const period = isPm ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  return `${displayHour}:${minute} ${period}`;
}

export const SAMPLE_DOCTORS = [
  { id: 'doc-1', name: 'د. إسلام عبدالله كريمة', specialty: 'أخصائي أنف وأذن وحنجرة' },
];

export const SAMPLE_SLOTS = [
  { time: '04:00', label: '04:00 م', isAvailable: true, isBooked: false },
  { time: '04:30', label: '04:30 م', isAvailable: true, isBooked: false },
  { time: '05:00', label: '05:00 م', isAvailable: true, isBooked: false },
  { time: '05:30', label: '05:30 م', isAvailable: false, isBooked: true }, // محجوز
  { time: '06:00', label: '06:00 م', isAvailable: true, isBooked: false },
  { time: '06:30', label: '06:30 م', isAvailable: true, isBooked: false },
  { time: '07:00', label: '07:00 م', isAvailable: false, isBooked: true }, // محجوز
  { time: '07:30', label: '07:30 م', isAvailable: true, isBooked: false },
];

export const SAMPLE_PATIENTS: PatientBasic[] = [
  {
    id: 'p-1',
    name: 'محمد علاء أحمد علي',
    phone: '01012345678',
    age: 34,
    gender: 'MALE',
    lastVisit: '15/10/2026',
    totalVisits: 3,
  },
  {
    id: 'p-2',
    name: 'أحمد محمود إبراهيم حسن',
    phone: '01123456789',
    age: 42,
    gender: 'MALE',
    lastVisit: '01/09/2026',
    totalVisits: 1,
  },
  {
    id: 'p-3',
    name: 'سارة حسن علي السيد',
    phone: '01234567890',
    age: 28,
    gender: 'FEMALE',
    lastVisit: '20/08/2026',
    totalVisits: 2,
  },
];

