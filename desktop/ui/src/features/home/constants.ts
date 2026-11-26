import {
  ClinicFacility,
  HeroStat,
  NavLinkItem,
  PatientReview,
  ServiceItem,
  TimelineMilestone,
} from './types';

/**
 * الموقع الرسمي للشركة المطورة لمنظومة نَفَس (Vyro Software)
 */
export const COMPANY_WEBSITE_URL = 'https://www.vyro.software/en';

/**
 * رسالة التنبيه عند طلب التجربة المباشرة للنظام
 */
export const TRY_DEMO_TOAST_MESSAGE = {
  ar: 'تواصل مع فريق تطوير Vyro Software لتجربة المنظومة ومعرفة كل التفاصيل: https://www.vyro.software/en',
  en: 'Contact the Vyro Software development team to try the system and learn all the details: https://www.vyro.software/en',
} as const;

/**
 * رقم واتساب العيادة المخصص للحجز والاستفسارات
 */
export const CLINIC_WHATSAPP_NUMBER = '201050792622';

/**
 * دالة لإنشاء رابط الواتساب المباشر مع رسالة مسبقة تدعم اللغتين
 */
export const getWhatsAppUrl = (message?: string, locale: string = 'ar'): string => {
  const defaultMsg =
    locale === 'en'
      ? 'Hello Dr. Eslam, I would like to book an appointment at the ENT clinic.'
      : 'مرحباً د. إسلام، أود حجز موعد كشف في عيادة الأنف والأذن والحنجرة.';
  const text = message ? encodeURIComponent(message) : encodeURIComponent(defaultMsg);
  return `https://wa.me/${CLINIC_WHATSAPP_NUMBER}?text=${text}`;
};

/**
 * روابط شريط التنقل العلوي
 */
export const NAV_LINKS: NavLinkItem[] = [
  { label: 'الرئيسية', href: '#hero' },
  { label: 'نبذة', href: '#about' },
  { label: 'المؤهلات', href: '#qualifications' },
  { label: 'الخدمات', href: '#services' },
  { label: 'العيادة', href: '#clinic' },
  { label: 'آراء المرضى', href: '#reviews' },
];

export const NAV_LINKS_EN: NavLinkItem[] = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Qualifications', href: '#qualifications' },
  { label: 'Services', href: '#services' },
  { label: 'Clinic', href: '#clinic' },
  { label: 'Patient Reviews', href: '#reviews' },
];

export const getNavLinks = (isAr: boolean): NavLinkItem[] =>
  isAr ? NAV_LINKS : NAV_LINKS_EN;

/**
 * مميزات سريعة في شاشة الهيرو
 */
export const HERO_STATS: HeroStat[] = [
  {
    title: 'مناظير',
    subtitle: 'أنف · أذن · حنجرة',
  },
  {
    title: 'جراحات دقيقة',
    subtitle: 'ميكروسكوبية وبالمناظير',
  },
  {
    title: 'تجميل وظيفي',
    subtitle: 'للأنف والأذن',
  },
];

export const HERO_STATS_EN: HeroStat[] = [
  {
    title: 'Endoscopy',
    subtitle: 'Ear · Nose · Throat',
  },
  {
    title: 'Micro-Surgeries',
    subtitle: 'Microscopic & Endoscopic',
  },
  {
    title: 'Functional Aesthetics',
    subtitle: 'Nose & Ear',
  },
];

export const getHeroStats = (isAr: boolean): HeroStat[] =>
  isAr ? HERO_STATS : HERO_STATS_EN;

/**
 * قائمة الخدمات الطبية التسع بنفس الترتيب والألوان والتصميم
 */
export const SERVICES_LIST: ServiceItem[] = [
  {
    id: 's-01',
    number: '01',
    title: 'مناظير الأنف والجيوب الأنفية',
    description: 'تشخيص وعلاج مشاكل الجيوب والحاجز الأنفي بالمنظار.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
  {
    id: 's-02',
    number: '02',
    title: 'جراحات الأذن الميكروسكوبية',
    description: 'جراحات دقيقة لتحسين السمع باستخدام الميكروسكوب.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-03',
    number: '03',
    title: 'جراحات الأذن بالمنظار',
    description: 'تقنية حديثة بأقل تدخل جراحي ممكن.',
    theme: 'white',
    badgeColor: 'navy',
    linkColor: 'blue',
  },
  {
    id: 's-04',
    number: '04',
    title: 'استئصال اللوزتين واللحمية',
    description: 'بأحدث الطرق الجراحية للكبار والأطفال.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-05',
    number: '05',
    title: 'مناظير الحنجرة والقصبة الهوائية',
    description: 'فحص دقيق لمشاكل الصوت والبلع والتنفس.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
  {
    id: 's-06',
    number: '06',
    title: 'استخراج الأجسام الغريبة',
    description: 'إخراج الأجسام الغريبة بالمنظار بأمان.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-07',
    number: '07',
    title: 'عمليات الشخير',
    description: 'تقييم أسباب الشخير وعلاجه جراحياً عند الحاجة.',
    theme: 'white',
    badgeColor: 'navy',
    linkColor: 'blue',
  },
  {
    id: 's-08',
    number: '08',
    title: 'تجميل الأنف الوظيفي',
    description: 'تحسين التنفس مع الحفاظ على الشكل الطبيعي.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-09',
    number: '09',
    title: 'تجميل الأذن الخفاشية',
    description: 'تصحيح بروز الأذن للأطفال والكبار.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
];

export const SERVICES_LIST_EN: ServiceItem[] = [
  {
    id: 's-01',
    number: '01',
    title: 'Nose & Sinus Endoscopy',
    description: 'Diagnosis and endoscopic management of sinus and nasal septum conditions.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
  {
    id: 's-02',
    number: '02',
    title: 'Microscopic Ear Surgery',
    description: 'Precision microscopic surgeries to improve hearing and treat ear diseases.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-03',
    number: '03',
    title: 'Endoscopic Ear Surgery',
    description: 'State-of-the-art minimally invasive endoscopic ear interventions.',
    theme: 'white',
    badgeColor: 'navy',
    linkColor: 'blue',
  },
  {
    id: 's-04',
    number: '04',
    title: 'Tonsillectomy & Adenoidectomy',
    description: 'Modern surgical techniques for both pediatric and adult patients.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-05',
    number: '05',
    title: 'Laryngeal & Tracheal Endoscopy',
    description: 'Comprehensive evaluation of voice, swallowing, and airway disorders.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
  {
    id: 's-06',
    number: '06',
    title: 'Foreign Body Extraction',
    description: 'Safe, gentle endoscopic foreign body removal from ear, nose, and throat.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-07',
    number: '07',
    title: 'Snoring & Sleep Apnea Surgery',
    description: 'Assessment and surgical management of snoring causes when indicated.',
    theme: 'white',
    badgeColor: 'navy',
    linkColor: 'blue',
  },
  {
    id: 's-08',
    number: '08',
    title: 'Functional Rhinoplasty',
    description: 'Restoring nasal airway function while preserving natural cosmetic contours.',
    theme: 'navy',
    badgeColor: 'yellow',
    linkColor: 'yellow',
  },
  {
    id: 's-09',
    number: '09',
    title: 'Otoplasty (Prominent Ear Correction)',
    description: 'Aesthetic and corrective ear reshaping for children and adults.',
    theme: 'white',
    badgeColor: 'blue',
    linkColor: 'blue',
  },
];

export const getServicesList = (isAr: boolean): ServiceItem[] =>
  isAr ? SERVICES_LIST : SERVICES_LIST_EN;

/**
 * المحطات التعليمية والمهنية للطبيب
 */
export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'm-1',
    year: '[السنة]',
    degree: '[بكالوريوس الطب والجراحة]',
    institution: '[الجامعة]',
  },
  {
    id: 'm-2',
    year: '[السنة]',
    degree: '[الماجستير / الدبلوم]',
    institution: '[الجهة]',
  },
  {
    id: 'm-3',
    year: '[السنة]',
    degree: '[الدكتوراه / الزمالة]',
    institution: '[الجهة]',
  },
  {
    id: 'm-4',
    year: '[السنة — الحاضر]',
    degree: '[الوظيفة الحالية]',
    institution: '[المستشفى / العيادة]',
    isCurrent: true,
  },
];

export const TIMELINE_MILESTONES_EN: TimelineMilestone[] = [
  {
    id: 'm-1',
    year: '[Year]',
    degree: '[Bachelor of Medicine & Surgery (MBBCh)]',
    institution: '[University]',
  },
  {
    id: 'm-2',
    year: '[Year]',
    degree: "[Master's Degree / Diploma]",
    institution: '[Institution]',
  },
  {
    id: 'm-3',
    year: '[Year]',
    degree: '[Doctorate / Fellowship]',
    institution: '[Authority]',
  },
  {
    id: 'm-4',
    year: '[Year — Present]',
    degree: '[Current Position]',
    institution: '[Hospital / Clinic]',
    isCurrent: true,
  },
];

export const getTimelineMilestones = (isAr: boolean): TimelineMilestone[] =>
  isAr ? TIMELINE_MILESTONES : TIMELINE_MILESTONES_EN;

/**
 * أقسام ومرافق العيادة
 */
export const CLINIC_FACILITIES: ClinicFacility[] = [
  {
    id: 'c-main',
    title: '[صورة الواجهة / الاستقبال]',
    isFeatured: true,
  },
  {
    id: 'c-checkup',
    title: '[غرفة الكشف]',
  },
  {
    id: 'c-devices',
    title: '[الأجهزة]',
  },
  {
    id: 'c-endoscopy',
    title: '[المناظير]',
  },
  {
    id: 'c-waiting',
    title: '[صالة الانتظار]',
  },
];

export const CLINIC_FACILITIES_EN: ClinicFacility[] = [
  {
    id: 'c-main',
    title: '[Reception & Front Desk Photo]',
    isFeatured: true,
  },
  {
    id: 'c-checkup',
    title: '[Examination Room]',
  },
  {
    id: 'c-devices',
    title: '[Medical Devices]',
  },
  {
    id: 'c-endoscopy',
    title: '[Endoscopy Suite]',
  },
  {
    id: 'c-waiting',
    title: '[Waiting Lounge]',
  },
];

export const getClinicFacilities = (isAr: boolean): ClinicFacility[] =>
  isAr ? CLINIC_FACILITIES : CLINIC_FACILITIES_EN;

/**
 * آراء المرضى وتقييماتهم
 */
export const PATIENT_REVIEWS: PatientReview[] = [
  {
    id: 'r-1',
    accent: 'yellow',
    rating: 5,
    text: '[اكتب هنا رأي المريض كما كتبه]',
    patientName: '[اسم المريض]',
  },
  {
    id: 'r-2',
    accent: 'blue',
    rating: 5,
    text: '[اكتب هنا رأي المريض كما كتبه]',
    patientName: '[اسم المريض]',
  },
  {
    id: 'r-3',
    accent: 'navy',
    rating: 5,
    text: '[اكتب هنا رأي المريض كما كتبه]',
    patientName: '[اسم المريض]',
  },
];

export const PATIENT_REVIEWS_EN: PatientReview[] = [
  {
    id: 'r-1',
    accent: 'yellow',
    rating: 5,
    text: '[Patient review statement as written]',
    patientName: '[Patient Name]',
  },
  {
    id: 'r-2',
    accent: 'blue',
    rating: 5,
    text: '[Patient review statement as written]',
    patientName: '[Patient Name]',
  },
  {
    id: 'r-3',
    accent: 'navy',
    rating: 5,
    text: '[Patient review statement as written]',
    patientName: '[Patient Name]',
  },
];

export const getPatientReviews = (isAr: boolean): PatientReview[] =>
  isAr ? PATIENT_REVIEWS : PATIENT_REVIEWS_EN;

