// مدة صلاحية الجلسة والتوكين: دائمة لمدى الحياة (10 سنوات = 3650 يوم) لتجنب تسجيل الخروج نهائياً
export const sessionMaxAge =
  Number(process.env.NEXTAUTH_SESSION_MAX_AGE) || (10 * 365 * 24 * 60 * 60); // 315,360,000 ثانية
 