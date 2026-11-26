'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ExternalLink, Copy, RefreshCw, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { openInNewWindow } from '../utils/open-window';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  url: string | null;
  linkText: string | null;
  selectedText: string | null;
  patientCode: string | null;
}

export function GlobalContextMenu() {
  const { isAr, dir, tr } = useAppLocale();
  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    url: null,
    linkText: null,
    selectedText: null,
    patientCode: null,
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => {
    setMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // إذا كان النقر الأيمن داخل حقل إدخال أو نص للكتابة، نترك القائمة الأصلية للمتصفح
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      e.preventDefault();

      // البحث عن أقرب رابط أو عنصر قابل للفتح
      const linkEl = target?.closest('a[href]') as HTMLAnchorElement | null;
      const url = linkEl ? linkEl.href : null;
      const linkText = linkEl ? linkEl.textContent?.trim() || null : null;

      // النص المحدد
      const selectedText = window.getSelection()?.toString().trim() || null;

      // البحث عن كود المريض إن وجد في أقرب سطر أو كارت
      const patientEl = target?.closest('[data-patient-code], [data-patient-id], tr, [data-row]') as HTMLElement | null;
      const codeMatch = patientEl?.textContent?.match(/#([A-Za-z0-9-]+)/);
      const patientCode = codeMatch ? codeMatch[1] : null;

      // ضبط إحداثيات القائمة لتظل داخل الشاشة
      const menuWidth = 230;
      const menuHeight = 220;
      const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
      const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

      setMenu({
        isOpen: true,
        x,
        y,
        url,
        linkText,
        selectedText,
        patientCode,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu]);

  if (!menu.isOpen) return null;

  const handleOpenNewWindow = () => {
    if (menu.url) {
      openInNewWindow(menu.url);
    } else {
      openInNewWindow(window.location.href);
    }
    closeMenu();
  };

  const handleCopyLink = () => {
    const textToCopy = menu.url || window.location.href;
    navigator.clipboard.writeText(textToCopy);
    toast.success(tr('تم نسخ الرابط بنجاح', 'Link copied'));
    closeMenu();
  };

  const handleCopyText = (text: string, labelAr = 'النص', labelEn = 'Text') => {
    navigator.clipboard.writeText(text);
    toast.success(tr(`تم نسخ ${labelAr} بنجاح`, `${labelEn} copied`));
    closeMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${menu.y}px`, left: `${menu.x}px` }}
      className="fixed z-99999 w-60 bg-white/95 border border-slate-200/90 rounded-2xl shadow-xl p-1.5 text-xs text-[#074C3A] select-none animate-in fade-in-50 zoom-in-95 backdrop-blur-md"
      dir={dir}
    >
      <div className="space-y-0.5">
        {/* فتح في نافذة مستقلة جديدة */}
        <button
          type="button"
          onClick={handleOpenNewWindow}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-start font-bold text-[#0B7B5E] hover:bg-emerald-50 transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-[#0B7B5E] group-hover:scale-110 transition-transform" />
            <span>
              {menu.url
                ? tr('فتح الرابط في نافذة جديدة', 'Open link in new window')
                : tr('فتح الصفحة في نافذة جديدة', 'Open page in new window')}
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">⌘N</span>
        </button>

        {/* نسخ الرابط إذا كان النقر فوق رابط */}
        {menu.url && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start font-bold hover:bg-emerald-50/70 transition-colors cursor-pointer text-[#074C3A]"
          >
            <Copy className="w-4 h-4 text-[#0B7B5E]" />
            <span>{tr('نسخ رابط الصفحة', 'Copy page link')}</span>
          </button>
        )}

        {/* نسخ كود المريض إن وُجد */}
        {menu.patientCode && (
          <button
            type="button"
            onClick={() => handleCopyText(menu.patientCode!, 'كود المريض', 'Patient code')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start font-bold hover:bg-emerald-50/70 transition-colors cursor-pointer text-[#074C3A]"
          >
            <FileText className="w-4 h-4 text-[#0B7B5E]" />
            <span>{tr(`نسخ كود المريض (#${menu.patientCode})`, `Copy patient code (#${menu.patientCode})`)}</span>
          </button>
        )}

        {/* نسخ النص المحدد */}
        {menu.selectedText && (
          <button
            type="button"
            onClick={() => handleCopyText(menu.selectedText!, 'النص المحدد', 'Selected text')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start font-bold hover:bg-emerald-50/70 transition-colors cursor-pointer text-[#074C3A]"
          >
            <Copy className="w-4 h-4 text-slate-400" />
            <span>{tr('نسخ النص المحدد', 'Copy selected text')}</span>
          </button>
        )}

        <div className="h-px bg-slate-100 my-1" />

        {/* تحديث الصفحة */}
        <button
          type="button"
          onClick={() => {
            window.location.reload();
            closeMenu();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-start font-bold hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
        >
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>{tr('تحديث الشاشة', 'Refresh page')}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">F5</span>
        </button>

        {/* الرجوع للخلف */}
        <button
          type="button"
          onClick={() => {
            window.history.back();
            closeMenu();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start font-bold hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{tr('الرجوع للصفحة السابقة', 'Go back')}</span>
        </button>
      </div>
    </div>
  );
}
