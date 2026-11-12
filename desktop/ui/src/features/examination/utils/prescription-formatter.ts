/**
 * مساعدات صياغة وترجمة جرعات وتكرار ومدد الروشتة الطبية
 * مصممة لتلبية متطلبات د. إسلام بدقة متناهية
 */

/**
 * ترجمة وصياغة الجرعة بناءً على الرقم وشكل الدواء (Form)
 * تراعي نوع الدواء تلقائياً: الحقن تُصاغ كـ "حقنة / حقنتين / 3 حقن"،
 * والأقراص "قرص / قرصين / 3 أقراص"، والنقط "نقطة / نقطتين / 3 نقط"، إلخ.
 */
export function formatDose(rawDose?: string, form?: string): string {
  if (!rawDose) return '';
  const trimmed = rawDose.trim();
  const normalizedForm = (form || '').toLowerCase();

  // 1. تحويل الأرقام المشرقية للعربية القياسية
  const cleanStr = trimmed.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // 2. هل النص يحتوي على رقم أو تعبير كمي معروف يمكن تحويله؟
  let num: number | null = null;
  let isHalf = false;
  let isOneAndHalf = false;

  if (/^(0\.5|1\/2|½)$/.test(cleanStr) || /^نصف\s*(قرص|كبسولة|ملعقة|كيس|أمبول|حقنة)?$/i.test(cleanStr)) {
    isHalf = true;
  } else if (/^(1\.5|1\s*1\/2|1½)$/.test(cleanStr) || /^قرص\s*ونصف$/i.test(cleanStr)) {
    isOneAndHalf = true;
  } else if (
    /^(1|حقنة واحدة|قرص واحد|كبسولة واحدة|بخة واحدة|نقطة واحدة|كيس واحد|لبوسة واحدة|أمبول واحد)$/i.test(
      cleanStr
    )
  ) {
    num = 1;
  } else if (
    /^(2|حقنتين|قرصين|كبسولتين|بختين|نقطتين|كيسين|لبوستين|أمبولين)$/i.test(cleanStr)
  ) {
    num = 2;
  } else {
    // محاولة استخراج رقم مجرد أو رقم متبوع بوحدة سابقة
    // مثال: "3", "3 قرص", "3 أقراص", "3 حقن", "4 كبسولات", "5 سم", "10 سم"
    const match = cleanStr.match(
      /^([0-9.]+)\s*(قرص|أقراص|حقن|حقنة|نقط|نقطة|كبسول|كبسولة|كبسولات|بخة|بخات|كيس|أكياس|لبوس|لبوسة|أمبول|أمبولات|سم|ملعقة|ملاعق)?$/
    );
    if (match) {
      num = parseFloat(match[1]);
    }
  }

  // إذا لم نجد كمية رقمية وكان النص يحتوي على صياغة عربية أخرى خاصة ومعقدة، نتركه كما هو
  if (num === null && !isHalf && !isOneAndHalf) {
    if (/[\u0600-\u06FF]/.test(cleanStr)) {
      return trimmed;
    }
  }

  // أ. الحقن والأمبولات والفيال (Injection / Ampoule / Vial / حقن / أمبول)
  if (
    normalizedForm.includes('injection') ||
    normalizedForm.includes('ampoule') ||
    normalizedForm.includes('vial') ||
    normalizedForm.includes('حقن') ||
    normalizedForm.includes('أمبول') ||
    normalizedForm.includes('فيال')
  ) {
    if (isHalf) return 'نصف أمبول';
    if (num === 1) return 'حقنة واحدة';
    if (num === 2) return 'حقنتين';
    if (num !== null && num >= 3 && num <= 10) return `${num} حقن`;
    if (num !== null && num > 10) return `${num} حقنة`;
    if (num !== null) return `${num} حقن`;
  }

  // ب. بخاخات الأنف والفم والأذن والاستنشاق (Sprays / Inhalers)
  if (
    normalizedForm.includes('spray') ||
    normalizedForm.includes('inhaler') ||
    normalizedForm.includes('بخاخ') ||
    normalizedForm.includes('استنشاق')
  ) {
    const isNasal = normalizedForm.includes('nasal') || normalizedForm.includes('أنف');
    if (num === 1) return isNasal ? 'بخة بكل فتحة أنف' : 'بخة واحدة';
    if (num === 2) return isNasal ? 'بختين بكل فتحة أنف' : 'بختين';
    if (num !== null && num >= 3 && num <= 10) return `${num} بخات`;
    if (num !== null && num > 10) return `${num} بخة`;
    if (num !== null) return `${num} بخات`;
  }

  // ج. نقط الأذن والعين والأنف والفم (Drops)
  if (
    normalizedForm.includes('drops') ||
    normalizedForm.includes('drop') ||
    normalizedForm.includes('نقط')
  ) {
    if (num === 1) return 'نقطة واحدة';
    if (num === 2) return 'نقطتين';
    if (num !== null && num >= 3 && num <= 10) return `${num} نقط`;
    if (num !== null && num > 10) return `${num} نقطة`;
    if (num !== null) return `${num} نقط`;
  }

  // د. الشراب والمعلق والمحاليل (Syrup / Suspension / Solution)
  if (
    normalizedForm.includes('syrup') ||
    normalizedForm.includes('suspension') ||
    normalizedForm.includes('solution') ||
    normalizedForm.includes('شراب') ||
    normalizedForm.includes('معلق') ||
    normalizedForm.includes('محلول')
  ) {
    if (num === 1) return '1 ملعقة كبيرة (10 سم)';
    if (num === 2) return '2 ملعقة كبيرة';
    if (num === 2.5) return '2.5 سم';
    if (num === 5) return '5 سم (ملعقة صغيرة)';
    if (num === 10) return '10 سم (ملعقة كبيرة)';
    if (num === 15) return '15 سم';
    if (num !== null && num <= 4) return `${num} ملاعق كبيرة`;
    if (num !== null) return `${num} سم`;
  }

  // هـ. الأكياس والفوار والبودرة (Sachet / Powder / Granules)
  if (
    normalizedForm.includes('sachet') ||
    normalizedForm.includes('powder') ||
    normalizedForm.includes('granules') ||
    normalizedForm.includes('أكياس') ||
    normalizedForm.includes('فوار') ||
    normalizedForm.includes('مسحوق')
  ) {
    if (isHalf) return 'نصف كيس في ربع كوب ماء';
    if (num === 1) return 'كيس واحد في نصف كوب ماء';
    if (num === 2) return 'كيسين';
    if (num !== null && num >= 3 && num <= 10) return `${num} أكياس`;
    if (num !== null && num > 10) return `${num} كيس`;
    if (num !== null) return `${num} أكياس`;
  }

  // و. كبسولات (Capsule / كبسول)
  if (normalizedForm.includes('capsule') || normalizedForm.includes('كبسول')) {
    if (num === 1) return '1 كبسولة';
    if (num === 2) return 'كبسولتين';
    if (num !== null && num >= 3 && num <= 10) return `${num} كبسولات`;
    if (num !== null && num > 10) return `${num} كبسولة`;
    if (num !== null) return `${num} كبسولات`;
  }

  // ز. اللبوس (Suppository / لبوس)
  if (normalizedForm.includes('suppository') || normalizedForm.includes('لبوس')) {
    if (num === 1) return 'لبوسة واحدة';
    if (num === 2) return '2 لبوسة';
    if (num !== null && num >= 3 && num <= 10) return `${num} لبوسات`;
    if (num !== null && num > 10) return `${num} لبوسة`;
    if (num !== null) return `${num} لبوسات`;
  }

  // ح. استحلاب (Lozenges / استحلاب)
  if (normalizedForm.includes('lozenge') || normalizedForm.includes('استحلاب')) {
    if (num === 1) return 'قرص استحلاب واحد';
    if (num === 2) return '2 قرص استحلاب';
    if (num !== null && num >= 3 && num <= 10) return `${num} أقراص استحلاب`;
    if (num !== null) return `${num} أقراص استحلاب`;
  }

  // ط. الأقراص الافتراضية (Tablet / ODT / أقراص / الافتراضي)
  if (isHalf) return 'نصف قرص';
  if (isOneAndHalf) return 'قرص ونصف';
  if (num === 1) return '1 قرص';
  if (num === 2) return '2 قرص';
  if (num !== null && num >= 3 && num <= 10) return `${num} أقراص`;
  if (num !== null && num > 10) return `${num} قرص`;
  if (num !== null) return `${num} أقراص`;

  return trimmed;
}

/**
 * الحصول على اقتراحات الجرعات المناسبة حسب شكل الدواء (Form)
 */
export function getDoseSuggestionsForForm(form?: string): string[] {
  const norm = (form || '').toLowerCase();
  if (
    norm.includes('injection') ||
    norm.includes('ampoule') ||
    norm.includes('vial') ||
    norm.includes('حقن') ||
    norm.includes('أمبول')
  ) {
    return ['حقنة واحدة', 'حقنتين', '3 حقن', 'أمبول واحد', 'أمبولين', '1 حقنة عضل', '1 حقنة وريد'];
  }
  if (norm.includes('spray') || norm.includes('بخاخ') || norm.includes('inhaler')) {
    if (norm.includes('nasal') || norm.includes('أنف')) {
      return ['بخة بكل فتحة أنف', 'بختين بكل فتحة أنف', 'بخة واحدة', 'بختين', '3 بخات'];
    }
    return ['بخة واحدة', 'بختين', '3 بخات', '4 بخات'];
  }
  if (norm.includes('drops') || norm.includes('نقط')) {
    return ['نقطة واحدة', 'نقطتين', '3 نقط', '4 نقط', '5 نقط'];
  }
  if (
    norm.includes('syrup') ||
    norm.includes('suspension') ||
    norm.includes('شراب') ||
    norm.includes('معلق')
  ) {
    return ['2.5 سم', '5 سم (ملعقة صغيرة)', '10 سم (ملعقة كبيرة)', '15 سم', '1 ملعقة كبيرة', '2 ملعقة كبيرة'];
  }
  if (norm.includes('capsule') || norm.includes('كبسول')) {
    return ['1 كبسولة', 'كبسولتين', '3 كبسولات'];
  }
  if (norm.includes('sachet') || norm.includes('أكياس') || norm.includes('فوار')) {
    return ['كيس واحد في نصف كوب ماء', 'كيسين', '3 أكياس'];
  }
  if (norm.includes('suppository') || norm.includes('لبوس')) {
    return ['لبوسة واحدة', '2 لبوسة', '3 لبوسات'];
  }
  if (norm.includes('lozenge') || norm.includes('استحلاب')) {
    return ['قرص استحلاب واحد', '2 قرص استحلاب', '3 أقراص استحلاب'];
  }
  return ['نصف قرص', '1 قرص', '2 قرص', '3 أقراص', 'قرص ونصف', '4 أقراص'];
}

/**
 * الحصول على الجرعة الافتراضية المناسبة لشكل الدواء عند اختياره
 */
export function getDefaultDoseForForm(form?: string): string {
  const norm = (form || '').toLowerCase();
  if (
    norm.includes('injection') ||
    norm.includes('ampoule') ||
    norm.includes('vial') ||
    norm.includes('حقن') ||
    norm.includes('أمبول')
  ) {
    return 'حقنة واحدة';
  }
  if (norm.includes('spray') || norm.includes('بخاخ') || norm.includes('inhaler')) {
    if (norm.includes('nasal') || norm.includes('أنف')) return 'بخة بكل فتحة أنف';
    return 'بخة واحدة';
  }
  if (norm.includes('drops') || norm.includes('نقط')) return '3 نقط';
  if (
    norm.includes('syrup') ||
    norm.includes('suspension') ||
    norm.includes('شراب') ||
    norm.includes('معلق')
  ) {
    return '5 سم (ملعقة صغيرة)';
  }
  if (norm.includes('capsule') || norm.includes('كبسول')) return '1 كبسولة';
  if (norm.includes('sachet') || norm.includes('أكياس') || norm.includes('فوار')) return 'كيس واحد في نصف كوب ماء';
  if (norm.includes('suppository') || norm.includes('لبوس')) return 'لبوسة واحدة';
  if (norm.includes('lozenge') || norm.includes('استحلاب')) return 'قرص استحلاب واحد';
  return '1 قرص';
}

/**
 * ترجمة وصياغة التكرار (Frequency) من أرقام أو رموز طبية إلى صياغة عربية واضحة
 */
export function formatFrequency(rawFreq?: string): string {
  if (!rawFreq) return '';
  const trimmed = rawFreq.trim().toLowerCase();

  // إذا كان النص يحتوي بالفعل على كلمات عربية مكتملة نتركه
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    if (!/^[٠١٢٣٤٥٦٧٨٩0-9\s]+$/.test(trimmed)) {
      return rawFreq.trim();
    }
  }

  const englishNum = trimmed.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // التكرار بالأرقام
  if (englishNum === '1' || trimmed === 'once' || trimmed === 'od' || trimmed === 'qd') {
    return 'مرة واحدة يومياً (كل 24 ساعة)';
  }
  if (englishNum === '2' || trimmed === 'bid' || trimmed === 'q12h' || trimmed === '12') {
    return 'كل 12 ساعة (مرتين يومياً)';
  }
  if (englishNum === '3' || trimmed === 'tid' || trimmed === 'q8h' || trimmed === '8') {
    return 'كل 8 ساعات (3 مرات يومياً)';
  }
  if (englishNum === '4' || trimmed === 'qid' || trimmed === 'q6h' || trimmed === '6') {
    return 'كل 6 ساعات (4 مرات يومياً)';
  }
  if (englishNum === '6' || trimmed === 'q4h' || trimmed === '4') {
    return 'كل 4 ساعات';
  }
  if (trimmed === 'prn' || trimmed === 'sos' || trimmed === 'needed') {
    return 'عند اللزوم';
  }
  if (trimmed === 'sleep' || trimmed === 'bedtime' || trimmed === 'hs' || trimmed === 'نوم') {
    return 'مساءً قبل النوم';
  }

  return rawFreq.trim();
}

/**
 * ترجمة وصياغة المدة (Duration) من أرقام إلى أيام وأسابيع واضحة
 */
export function formatDuration(rawDuration?: string): string {
  if (!rawDuration) return '';
  const trimmed = rawDuration.trim();

  // إذا كان مكتوباً بالعربي ويحتوي على أحرف نتركه
  if (/[\u0600-\u06FF]/.test(trimmed) && !/^[٠١٢٣٤٥٦٧٨٩0-9\s]+$/.test(trimmed)) {
    return trimmed;
  }

  const cleanNumStr = trimmed.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const num = parseInt(cleanNumStr, 10);
  if (isNaN(num)) return trimmed;

  if (num === 1) return 'يوم واحد';
  if (num === 2) return 'يومان';
  if (num === 3) return '3 أيام';
  if (num === 4) return '4 أيام';
  if (num === 5) return '5 أيام';
  if (num === 6) return '6 أيام';
  if (num === 7) return 'أسبوع (7 أيام)';
  if (num === 10) return '10 أيام';
  if (num === 14) return 'أسبوعين (14 يوماً)';
  if (num === 21) return '3 أسابيع';
  if (num === 30) return 'شهر (30 يوماً)';
  if (num <= 10) return `${num} أيام`;
  return `${num} يوماً`;
}
