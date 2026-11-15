import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { HomePageClient } from "@/features/home";

/**
 * الصفحة الرئيسية لعيادة د. إسلام عبدالله كريمة
 * إذا كان المستخدم مسجلاً دخوله مسبقاً، يتم توجيهه فوراً ومباشرة للوحة التحكم (/dashboard)
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/dashboard');
  }

  return <HomePageClient />;
}
