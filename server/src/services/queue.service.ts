import { Appointment, DoctorStatus, Patient, Visit, User } from '../models';
import { getTodayClinicDate } from '../utils/clinic-date';
import { BadRequestError, ValidationError } from '../utils/errors';

export class QueueService {
  static async getTodayQueue(doctorId?: string, includeCompleted = false) {
    const today = getTodayClinicDate();

    // إذا طُلبت كشوفات اليوم كاملة (بما فيها المكتملة)، نجلب كافة كشوفات اليوم غير الملغاة
    let filter: any;
    if (includeCompleted) {
      filter = {
        clinicDate: today,
        status: { $ne: 'CANCELLED' },
      };
    } else {
      // نتحقق من كشوفات اليوم النشطة، وأيضاً أي كشوفات سابقة لم تكتمل بعد (حجوزات قديمة متبقية)
      filter = {
        $or: [
          // 1. كشوفات اليوم (نشطة، بانتظار المحاسبة، أو مكتملة لليوم، مع استبعاد الملغاة فقط)
          {
            clinicDate: today,
            status: { $ne: 'CANCELLED' },
          },
          // 2. الحجوزات السابقة التي لم تكتمل بعد (حجوزات قديمة متبقية من أيام سابقة)
          {
            clinicDate: { $lt: today },
            status: { $in: ['WAITING', 'IN_PROGRESS', 'BOOKED'] },
          },
        ],
      };
    }

    // إذا تم تمرير معرف طبيب محدد وليس 'all'، يتم الفلترة عليه
    if (doctorId && doctorId !== 'all') {
      filter.doctorId = doctorId;
    }

    const appointments = await Appointment.find(filter).sort({
      clinicDate: 1,
      queueOrder: 1,
      arrivedAt: 1,
      createdAt: 1,
    });

    const now = Date.now();
    return Promise.all(
      appointments.map(async (appt) => {
        const [patient, doctor, visit] = await Promise.all([
          Patient.findById(appt.patientId).select('id fullName phone gender age dateOfBirth fileNumber'),
          User.findById(appt.doctorId).select('id name'),
          Visit.findOne({ appointmentId: appt.id }).select('id status'),
        ]);

        // حساب وقت الانتظار بالاستقبال:
        // نعتمد arrivedAt، فإن لم تكن مسجلة نعتمد وقت تسجيل الحجز بالاستقبال (createdAt)
        const arrivalTime = appt.arrivedAt || appt.createdAt;
        const waitingMinutes = arrivalTime
          ? Math.max(0, Math.floor((now - new Date(arrivalTime).getTime()) / 60000))
          : 0;

        const isPastAppointment = appt.clinicDate < today;

        const remaining = Boolean(appt.isExempt) ? 0 : Math.max(0, appt.remainingAmount || 0);
        const isPaid = Boolean(appt.isExempt) || appt.paymentStatus === 'PAID' || (appt.totalAmount > 0 && remaining === 0);
        const hasRem = !appt.isExempt && remaining > 0;

        // إذا كان الموعد عليه متبقي وتم إنهاء كشفه، يظهر في حالة PENDING_CHECKOUT لحين تحصيل الاستقبال
        const effectiveStatus =
          (appt.status === 'COMPLETED' && hasRem)
            ? 'PENDING_CHECKOUT'
            : appt.status;

        return {
          id: appt.id,
          queueNumber: appt.queueNumber,
          queueOrder: appt.queueOrder,
          clinicDate: appt.clinicDate,
          isPastAppointment,
          status: effectiveStatus,
          source: appt.source,
          type: appt.type,
          startTime: appt.startTime,
          scheduledAt: appt.scheduledAt,
          arrivedAt: appt.arrivedAt,
          waitingSince: arrivalTime ? new Date(arrivalTime).toISOString() : null,
          postponedCount: appt.postponedCount || 0,
          patientId: appt.patientId,
          patientName: patient?.fullName || 'Unknown',
          patientFileNumber: (patient as any)?.fileNumber || '',
          fileNumber: (patient as any)?.fileNumber || '',
          patientPhone: patient?.phone || '',
          patientGender: patient?.gender,
          patientAge: patient?.age,
          doctorId: appt.doctorId,
          doctorName: doctor?.name
            ? doctor.name.startsWith('د.') || doctor.name.startsWith('Dr.')
              ? doctor.name
              : `د. ${doctor.name}`
            : 'د. إسلام عبدالله',
          visitId: visit?.id || null,
          waitingMinutes,
          totalAmount: appt.totalAmount || 0,
          paidAmount: appt.paidAmount || 0,
          remainingAmount: remaining,
          paymentStatus: appt.paymentStatus || 'UNPAID',
          isFullyPaid: isPaid,
          hasRemaining: hasRem,
          isExempt: Boolean(appt.isExempt),
        };
      }),
    );
  }

  static async getDoctorStatus(doctorId?: string) {
    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const activeDoctor = await User.findOne({
        $or: [
          { role: 'DOCTOR' },
          { role: 'ADMIN', name: { $regex: /(د\.|دكتور|doctor|dr\.|إسلام|eslam)/i } },
        ],
        isActive: true,
        deletedAt: null,
      });
      if (activeDoctor) {
        targetDoctorId = activeDoctor.id;
      }
    }

    if (!targetDoctorId) {
      return {
        doctorId: '',
        status: 'AVAILABLE',
        updatedAt: new Date().toISOString(),
      };
    }

    const docStatus = await DoctorStatus.findById(targetDoctorId);
    if (!docStatus) {
      return {
        doctorId: targetDoctorId,
        status: 'AVAILABLE',
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      doctorId: targetDoctorId,
      status: docStatus.status,
      updatedAt: docStatus.updatedAt ? docStatus.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  static async setDoctorStatus(doctorId: string, status?: string) {
    if (!status || !['AVAILABLE', 'BREAK'].includes(status)) {
      throw new ValidationError('Validation failed', [
        { path: 'status', message: 'Status must be AVAILABLE or BREAK' },
      ]);
    }

    const docStatus = await DoctorStatus.findByIdAndUpdate(
      doctorId,
      { _id: doctorId, status },
      { upsert: true, returnDocument: 'after' },
    );

    return {
      doctorId,
      status: docStatus.status,
      updatedAt: docStatus.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
