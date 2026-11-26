"use client";

import { searchPatients } from "@/features/patient/services/patients.service";
import { getDoctorsList, getDoctorAvailableSlots } from "../services/doctors.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CreateAppointmentPayload } from "../types/booking";
import { TodayQueueItem } from "../apis/appointment.api";
import {
  createQuickPatientAction,
  admitAppointmentAction,
  finishExamAppointmentAction,
  checkoutAppointmentAction,
  refundAppointmentAction,
  postponeAppointmentAction,
  cancelAppointmentAction,
  updateDoctorStatusAction,
} from "../apis/appointment.action";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useAppLocale } from "@/shared/hooks/use-app-locale";

export const patientKeys = {
    all: ["patients"] as const,
    search: (query: string) =>
        [...patientKeys.all, "search", query] as const,
};

export const doctorKeys = {
    all: ["doctors"] as const,
    lists: () => [...doctorKeys.all, "list"] as const,
    slots: (doctorId: string, date: string) =>
        [...doctorKeys.all, "slots", doctorId, date] as const,
};

export const queueKeys = {
    all: ["queue"] as const,
    today: (doctorId?: string) =>
        [...queueKeys.all, "today", doctorId || "all"] as const,
};

export const doctorStatusKeys = {
    all: ["doctor-status"] as const,
    detail: (doctorId?: string) =>
        [...doctorStatusKeys.all, doctorId || "current"] as const,
};

export const appointmentKeys = {
    all: ["appointments"] as const,
};

function isAuthErrorMessage(message?: string): boolean {
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
        message.includes("صلاحية") ||
        message.includes("401") ||
        lower.includes("session") ||
        lower.includes("expired") ||
        lower.includes("unauthorized")
    );
}

/**
 * هوك للبحث في قائمة المرضى
 */
export function useSearchPatients(query: string) {
    return useQuery({
        queryKey: patientKeys.search(query),
        queryFn: ({ signal }) => searchPatients(query, signal),
        enabled: query.length >= 2,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error: any) => {
            if (isAuthErrorMessage(error?.message)) {
                return false;
            }
            return failureCount < 1;
        },
    });
}

/**
 * هوك جلب الأطباء مع التخزين المؤقت الطويل (Cache)
 * نادراً ما تتغير قائمة الأطباء لذلك يتم عمل كاش لمدة 24 ساعة
 */
export function useDoctorsQuery() {
    return useQuery({
        queryKey: doctorKeys.lists(),
        queryFn: ({ signal }) => getDoctorsList(signal),
        staleTime: 1000 * 60 * 60 * 24, // 24 ساعة
        gcTime: 1000 * 60 * 60 * 24 * 7, // أسبوع
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: (failureCount, error: any) => {
            if (isAuthErrorMessage(error?.message)) {
                return false;
            }
            return failureCount < 1;
        },
    });
}

/**
 * هوك جلب المواعيد المتاحة لدكتور محدد في تاريخ معين
 */
export function useDoctorAvailableSlotsQuery(doctorId?: string, date?: string) {
    return useQuery({
        queryKey: doctorKeys.slots(doctorId || "", date || ""),
        queryFn: ({ signal }) => getDoctorAvailableSlots(doctorId!, date!, signal),
        enabled: Boolean(doctorId && date),
        staleTime: 1000 * 60 * 2, // دقيقتان لتفادي الطلبات المتكررة مع الحفاظ على حداثة الحجوزات
        gcTime: 1000 * 60 * 10,
        retry: (failureCount, error: any) => {
            if (isAuthErrorMessage(error?.message)) {
                return false;
            }
            return failureCount < 1;
        },
    });
}



export function useCreateAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (payload: CreateAppointmentPayload) => {
            const res = await createQuickPatientAction(payload);

            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى", "Session expired, please log in again"));
            }

            if (!res.status) {
                throw new Error(res.message || tr("فشل تسجيل الموعد", "Failed to book appointment"));
            }

            return res;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            queryClient.invalidateQueries({ queryKey: doctorKeys.all });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success(data.message || tr("تم تسجيل الموعد بنجاح", "Appointment booked successfully"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لإدخال المريض لغرفة الكشف (Admit)
 */
export function useAdmitAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await admitAppointmentAction(appointmentId);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل إدخال المريض", "Failed to admit patient"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            queryClient.invalidateQueries({ queryKey: doctorKeys.all });
            toast.success(tr("تم إدخال المريض لغرفة الكشف", "Patient admitted to examination room"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لإنهاء الكشف من جانب الطبيب (Finish Exam -> Pending Checkout)
 */
export function useFinishExamAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await finishExamAppointmentAction(appointmentId);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل إنهاء الكشف", "Failed to finish examination"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            toast.info(tr("انتهى كشف المريض، وأصبح بانتظار المحاسبة بالاستقبال", "Examination finished; patient is pending checkout at reception"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لتسوية الحساب وإنهاء الزيارة وخروج المريض (Checkout & Settle)
 */
export function useCheckoutAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string;
            payload?: {
                method?: "CASH" | "CARD" | "WALLET";
                amount?: number;
                notes?: string;
                settlementType?: 'FULL' | 'PARTIAL' | 'EXEMPT';
                isExempt?: boolean;
                exemptionReason?: string;
            };
        }) => {
            const res = await checkoutAppointmentAction(id, payload);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل إنهاء الزيارة وتسوية الحساب", "Failed to settle payment and complete visit"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success(tr("تم تسوية الحساب وإنهاء الزيارة بنجاح", "Payment settled and visit completed successfully"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لاسترجاع جزء أو كامل المبلغ للمريض (Refund)
 */
export function useRefundAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string;
            payload: {
                amount?: number;
                reason?: string;
                method?: "CASH" | "CARD" | "WALLET";
            };
        }) => {
            const res = await refundAppointmentAction(id, payload);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل استرجاع المبلغ للمريض", "Failed to refund payment"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success(tr("تم استرجاع المبلغ للمريض بنجاح", "Payment refunded successfully"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لتأجيل دور المريض
 */
export function usePostponeAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await postponeAppointmentAction(appointmentId);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل تأجيل الموعد", "Failed to postpone appointment"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            toast.info(tr("تم تأجيل دور المريض في قائمة الانتظار", "Patient turn postponed in waiting queue"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

/**
 * هوك React Query لإلغاء الموعد
 */
export function useCancelAppointmentMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await cancelAppointmentAction(appointmentId);
            if (res.code === 401) {
                await signOut({ callbackUrl: "/auth/login?expired=true" });
                throw new Error(tr("انتهت صلاحية الجلسة", "Session expired"));
            }
            if (!res.status) {
                throw new Error(res.message || tr("فشل إلغاء الموعد", "Failed to cancel appointment"));
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queueKeys.all });
            toast.error(tr("تم إلغاء الموعد", "Appointment cancelled"));
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}


/**
 * هوك React Query لجلب طابور الانتظار اليومي الحي
 */
export function useTodayQueueQuery(initialData?: TodayQueueItem[], doctorId?: string) {
    const { tr } = useAppLocale();

    return useQuery({
        queryKey: queueKeys.today(doctorId),
        queryFn: async (): Promise<TodayQueueItem[]> => {
            const qp = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
            const res = await fetch(`/api/queue/today${qp}`, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                throw new Error(tr('فشل جلب قائمة الانتظار', 'Failed to fetch waiting queue'));
            }
            const data = await res.json();
            return (data.payload || data.data || []) as TodayQueueItem[];
        },
        initialData,
        refetchInterval: 10_000,
        refetchIntervalInBackground: false,
        staleTime: 5_000,
    });
}

/**
 * هوك React Query لجلب حالة الطبيب الحالية
 */
export function useDoctorStatusQuery(doctorId?: string) {
    const { tr } = useAppLocale();

    return useQuery({
        queryKey: doctorStatusKeys.detail(doctorId),
        queryFn: async (): Promise<{ doctorId: string; status: 'AVAILABLE' | 'BREAK'; updatedAt?: string }> => {
            const qp = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
            const res = await fetch(`/api/doctor-status${qp}`, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                throw new Error(tr('فشل جلب حالة الطبيب', 'Failed to fetch doctor status'));
            }
            const data = await res.json();
            return data.payload || data.data || { status: 'AVAILABLE' };
        },
        staleTime: 10_000,
        refetchInterval: 15_000,
    });
}

/**
 * هوك React Query لتحديث حالة الطبيب (متاح / في استراحة)
 */
export function useUpdateDoctorStatusMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { tr } = useAppLocale();

    return useMutation({
        mutationFn: async (status: 'AVAILABLE' | 'BREAK') => {
            const res = await updateDoctorStatusAction(status);
            if (res.code === 401) {
                await signOut({ callbackUrl: '/auth/login?expired=true' });
                throw new Error(tr('انتهت صلاحية الجلسة', 'Session expired'));
            }
            if (!res.status) {
                throw new Error(res.message || tr('فشل تحديث حالة الطبيب', 'Failed to update doctor status'));
            }
            return res;
        },
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: doctorStatusKeys.all });
            toast.success(
                status === 'AVAILABLE'
                    ? tr('تم ضبط الحالة: متاح', 'Status set to: Available')
                    : tr('تم ضبط الحالة: في استراحة', 'Status set to: On Break')
            );
            router.refresh();
        },
        onError: (err: any) => {
            toast.error(err.message || tr('حدث خطأ أثناء تحديث حالة الطبيب', 'An error occurred while updating doctor status'));
        },
    });
}
