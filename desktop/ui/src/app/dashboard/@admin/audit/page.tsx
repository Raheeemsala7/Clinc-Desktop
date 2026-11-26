'use client';

import React, { useState, useMemo } from 'react';
import { History, Search, CheckCircle2 } from 'lucide-react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
}

export default function AdminAuditPage() {
  const { isAr, dir, tr } = useAppLocale();
  const [searchTerm, setSearchTerm] = useState('');

  const logs = useMemo<AuditLogItem[]>(
    () =>
      isAr
        ? [
            {
              id: '1',
              action: 'إنهاء كشف طبي وكتابة روشتة',
              actor: 'د. إسلام عبدالله كريمة',
              actorRole: 'DOCTOR',
              details: 'فحص مريض (محمد السيد) واعتماد روشتة 3 أصناف علاجية',
              timestamp: 'منذ 10 دقائق',
              status: 'SUCCESS',
            },
            {
              id: '2',
              action: 'تحصيل باقي مبلغ الكشف',
              actor: 'موظف الاستقبال',
              actorRole: 'RECEPTIONIST',
              details: 'تحصيل 270 ج.م نقداً إيصال رقم #8493',
              timestamp: 'منذ 25 دقيقة',
              status: 'SUCCESS',
            },
            {
              id: '3',
              action: 'تسجيل حجز كشف جديد',
              actor: 'موظف الاستقبال',
              actorRole: 'RECEPTIONIST',
              details: 'حجز كشف أنف وأذن وحنجرة للمريض (أحمد حسن) مع سداد عربون 50 ج.م',
              timestamp: 'منذ 40 دقيقة',
              status: 'SUCCESS',
            },
            {
              id: '4',
              action: 'اعتماد مصروف عيادة',
              actor: 'المدير العام (Admin)',
              actorRole: 'ADMIN',
              details: 'اعتماد شراء مستلزمات طبية وشاش بقيمة 350 ج.م',
              timestamp: 'منذ ساعتين',
              status: 'SUCCESS',
            },
            {
              id: '5',
              action: 'الإغلاق اليومي للصندوق',
              actor: 'موظف الاستقبال',
              actorRole: 'RECEPTIONIST',
              details: 'إغلاق الخزينة ومطابقة النقد الفعلي (1,500 ج.م) بنجاح',
              timestamp: 'أمس 09:30 م',
              status: 'SUCCESS',
            },
            {
              id: '6',
              action: 'محاولة تسجيل دخول',
              actor: 'admin@clinic.com',
              actorRole: 'ADMIN',
              details: 'تسجيل دخول ناجح إلى لوحة تحكم المدير',
              timestamp: 'أمس 08:00 ص',
              status: 'INFO',
            },
          ]
        : [
            {
              id: '1',
              action: 'Completed examination & issued prescription',
              actor: 'Dr. Eslam Abdallah Kareema',
              actorRole: 'DOCTOR',
              details: 'Examined patient (Mohamed El-Sayed) and approved a 3-item prescription',
              timestamp: '10 minutes ago',
              status: 'SUCCESS',
            },
            {
              id: '2',
              action: 'Collected remaining consultation fee',
              actor: 'Receptionist',
              actorRole: 'RECEPTIONIST',
              details: 'Collected 270 EGP in cash — Receipt #8493',
              timestamp: '25 minutes ago',
              status: 'SUCCESS',
            },
            {
              id: '3',
              action: 'Created new examination booking',
              actor: 'Receptionist',
              actorRole: 'RECEPTIONIST',
              details: 'Booked ENT consultation for patient (Ahmed Hassan) with 50 EGP deposit',
              timestamp: '40 minutes ago',
              status: 'SUCCESS',
            },
            {
              id: '4',
              action: 'Approved clinic expense',
              actor: 'System Admin',
              actorRole: 'ADMIN',
              details: 'Approved medical supplies and gauze purchase of 350 EGP',
              timestamp: '2 hours ago',
              status: 'SUCCESS',
            },
            {
              id: '5',
              action: 'Daily register closing',
              actor: 'Receptionist',
              actorRole: 'RECEPTIONIST',
              details: 'Closed cash drawer and matched actual cash (1,500 EGP) successfully',
              timestamp: 'Yesterday 09:30 PM',
              status: 'SUCCESS',
            },
            {
              id: '6',
              action: 'Sign-in attempt',
              actor: 'admin@clinic.com',
              actorRole: 'ADMIN',
              details: 'Successful sign-in to Admin dashboard',
              timestamp: 'Yesterday 08:00 AM',
              status: 'INFO',
            },
          ],
    [isAr]
  );

  const filteredLogs = logs.filter((l) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir={dir}>
      {/* 1. الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#E3F5EE] text-[#0B7B5E]">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#074C3A] tracking-tight">
              {tr('سجل العمليات والأنشطة (Audit Log)', 'Activity & Audit Log')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {tr(
              'تتبع دقيق لكافة الحركات والعمليات المالية والطبية المنفذة في النظام',
              'Detailed tracking of all financial and clinical actions performed in the system'
            )}
          </p>
        </div>
      </div>

      {/* 2. شريط البحث */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tr(
              'بحث في سجل العمليات (العملية، المستخدم، التفاصيل)...',
              'Search audit log (action, user, details)...'
            )}
            className="w-full h-10 ps-10 pe-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold focus:outline-none focus:border-[#0B7B5E]"
          />
        </div>
      </div>

      {/* 3. قائمة الأنشطة التتابعية */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-black text-[#074C3A] pb-3 border-b border-slate-100">
          {tr('أحدث الحركات والعمليات المسجلة', 'Recent Recorded Activities')}
        </h2>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-[#E3F5EE]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#074C3A]">{log.action}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EE] text-[#0B7B5E]">
                    {log.actorRole}
                  </span>
                </div>
                <p className="text-slate-600 font-bold">{log.details}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>
                    {tr('المستخدم:', 'User:')} <strong className="text-slate-700">{log.actor}</strong>
                  </span>
                  <span>•</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{tr('تمت بنجاح', 'Completed')}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
