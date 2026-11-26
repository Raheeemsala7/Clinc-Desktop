'use client';

import React, { useState, useTransition } from 'react';
import { Plus, MessageSquare, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAppLocale } from '@/shared/hooks/use-app-locale';
import { PatientNoteItem } from '../types/patient';

interface PatientNotesCardProps {
  notes?: PatientNoteItem[];
  patientId: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function PatientNotesCard({ notes = [], patientId }: PatientNotesCardProps) {
  const { dir, tr } = useAppLocale();
  const router = useRouter();
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [localNotes, setLocalNotes] = useState<PatientNoteItem[]>(notes);
  const [isPending, startTransition] = useTransition();

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    startTransition(() => {
      const newNote: PatientNoteItem = {
        id: Math.random().toString(),
        content: noteText.trim(),
        date: new Date().toISOString(),
        authorRole: 'RECEPTION',
        authorName: tr('الاستقبال', 'Reception'),
      };

      setLocalNotes([newNote, ...localNotes]);
      setNoteText('');
      setIsOpenAdd(false);
      toast.success(tr('تمت إضافة الملاحظة بنجاح', 'Note added successfully'));
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs text-start select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h3 className="text-base font-black text-[#074C3A]">
          {tr('ملاحظات الطبيب والاستقبال', 'Doctor & Reception Notes')}
        </h3>
        <button
          type="button"
          onClick={() => setIsOpenAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tr('إضافة', 'Add')}</span>
        </button>
      </div>

      {localNotes.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs">
          <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p>{tr('لا توجد ملاحظات مسجلة بعد لهذا المريض', 'No notes recorded yet for this patient')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {localNotes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <p className="font-bold text-[#074C3A] leading-relaxed">
                {note.content}
              </p>
              <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1.5">
                <span>
                  {tr('بتاريخ', 'Date:')} <span dir="ltr">{formatDate(note.date)}</span>
                </span>
                <span>·</span>
                <span className="font-bold text-slate-600">{note.authorName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة إضافة ملاحظة جديدة */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-start animate-in zoom-in-95"
            dir={dir}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-base font-black text-[#074C3A]">{tr('إضافة ملاحظة جديدة', 'Add New Note')}</h4>
              <button
                type="button"
                onClick={() => setIsOpenAdd(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {tr('نص الملاحظة', 'Note Content')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={tr('أدخل ملاحظات حول حالة المريض أو تفاصيل الزيارة...', 'Enter notes about patient condition or visit details...')}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#074C3A] font-bold focus:outline-none focus:border-[#0B7B5E] focus:ring-3 focus:ring-[#0B7B5E]/15 transition-all placeholder:text-slate-400 placeholder:font-normal resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 rounded-xl bg-[#0B7B5E] hover:bg-[#09634C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{tr('حفظ الملاحظة', 'Save Note')}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpenAdd(false)}
                  className="px-4 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {tr('إلغاء', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

