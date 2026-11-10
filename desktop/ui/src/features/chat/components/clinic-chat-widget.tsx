'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Sparkles,
  Stethoscope,
  KeyRound,
  Shield,
  Circle,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import {
  getChatMessagesAction,
  sendChatMessageAction,
  ChatMessageItem,
} from '../apis/chat.action';

export function ClinicChatWidget() {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role || 'DOCTOR';
  const currentUserId = (session?.user as any)?.id || '';
  const currentUserName = session?.user?.name || 'مستخدم';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // قوالب الرسائل السريعة
  const doctorQuickTemplates = [
    'أرسل المريض القادم 🩺',
    'محتاج ملف المريض 📋',
    'سأنتهي من الكشف بعد دقيقتين ⏱️',
    'استراحة 5 دقائق ☕',
    'يرجى تسوية حساب المريض 💳',
  ];

  const receptionQuickTemplates = [
    'المريض القادم في الانتظار 👤',
    'مريض استشارة مستعجل ⚠️',
    'المريض جاهز للكشف ✅',
    'تم تسجيل مريض جديد 📝',
    'يرجى التأكيد على إنهاء الكشف 🔍',
  ];

  const quickTemplates =
    currentUserRole === 'DOCTOR' ? doctorQuickTemplates : receptionQuickTemplates;

  // جلب الرسائل من الـ API
  const fetchMessages = useCallback(async () => {
    try {
      const res = await getChatMessagesAction();
      if (res.status && res.payload) {
        setMessages(res.payload);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // التمرير التلقائي لأسفل المحادثة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // الاتصال بـ Socket.IO للرسائل الفورية مع Polling احتياطي
  useEffect(() => {
    fetchMessages();

    // 1. Polling fallback كل 4 ثوانٍ
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 4000);

    // 2. محاولة الاتصال بـ Socket.io عبر Ticket
    let socket: Socket | null = null;
    const connectSocket = async () => {
      try {
        const ticketRes = await fetch('/api/realtime/ticket', { method: 'POST' });
        const ticketData = await ticketRes.json();
        const ticket = ticketData.payload?.ticket;

        // خادم Socket.IO يعمل على المنفذ 4000
        const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        const socketUrl = `http://${host}:4000`;

        socket = io(socketUrl, {
          auth: { ticket },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('chat:message', (newMsg: ChatMessageItem) => {
          setMessages((prev) => {
            // منع التكرار
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // زيادة العداد وتنبيه إذا كانت النافذة مغلقة
          if (!isOpen && newMsg.senderId !== currentUserId) {
            setUnreadCount((c) => c + 1);
            toast.info(`رسالة جديدة من ${newMsg.senderName}: "${newMsg.message.slice(0, 30)}..."`, {
              duration: 4000,
            });
          }
        });

        socketRef.current = socket;
      } catch (err) {
        // Fallback to polling only
      }
    };

    connectSocket();

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [fetchMessages, isOpen, currentUserId]);

  // إرسال رسالة
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputValue('');

    try {
      const res = await sendChatMessageAction(text);
      if (res.status && res.payload) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.payload!.id)) return prev;
          return [...prev, res.payload!];
        });
        scrollToBottom();
      } else {
        toast.error(res.message || 'فشل إرسال الرسالة');
      }
    } catch (err) {
      toast.error('تعذر إرسال الرسالة، يرجى التحقق من الاتصال');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 select-none print:hidden" dir="rtl">
      {/* نافذة الشات المفتوحة */}
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[360px] sm:w-[400px] h-[520px] flex flex-col overflow-hidden animate-in fade-in-50 slide-in-from-bottom-6">
          {/* 1. ترويسة الشات */}
          <div className="bg-[#0A164E] text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-white font-black">
                <MessageSquare className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm">محادثة العيادة الفورية</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" />
                    <span>{isConnected ? 'متصل' : 'تزامن نشط'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-bold">
                  بين عيادة الطبيب ومكتب الاستقبال
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="تصغير المحادثة"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* 2. قوالب الرسائل السريعة بضغطة واحدة */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>رسائل سريعة بضغطة واحدة:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(tmpl)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-[#0040D8] text-[11px] font-bold transition-all whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* 3. صندوق عرض الرسائل */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold">لا توجد رسائل بعد</p>
                <p className="text-[11px]">
                  ابدأ المحادثة الآن بين الطبيب والاستقبال لتنسيق دخول المرضى.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const isDoctor = msg.senderRole === 'DOCTOR';
                const isAdmin = msg.senderRole === 'ADMIN';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold mb-1 px-1">
                      {isDoctor ? (
                        <span className="flex items-center gap-0.5 text-[#0040D8]">
                          <Stethoscope className="w-3 h-3" />
                          <span>{msg.senderName} (طبيب)</span>
                        </span>
                      ) : isAdmin ? (
                        <span className="flex items-center gap-0.5 text-purple-700">
                          <Shield className="w-3 h-3" />
                          <span>{msg.senderName} (مدير)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-emerald-800">
                          <KeyRound className="w-3 h-3" />
                          <span>{msg.senderName} (استقبال)</span>
                        </span>
                      )}
                      <span>·</span>
                      <span className="font-mono text-slate-600">{formatMessageTime(msg.createdAt)}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-[#0040D8] text-white rounded-br-xs'
                          : isDoctor
                          ? 'bg-blue-50 text-slate-900 border border-blue-200 rounded-bl-xs'
                          : 'bg-emerald-50 text-slate-900 border border-emerald-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. حقل كتابة الرسالة */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="اكتب رسالة للاستقبال أو الطبيب..."
              className="flex-1 h-10 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0040D8] focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isSending}
              className="w-10 h-10 rounded-2xl bg-[#0040D8] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-40"
              title="إرسال"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </div>
        </div>
      ) : (
        /* زر الشات العائم المصغر */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0A164E] hover:bg-blue-900 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-blue-500/30 active:scale-95"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="font-black text-xs">
            محادثة العيادة {unreadCount > 0 ? `(${unreadCount})` : ''}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}
    </div>
  );
}

