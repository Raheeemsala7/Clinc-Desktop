import { Payment, Expense, Visit, Appointment, Patient } from '../models';
import { getTodayClinicDate } from '../utils/clinic-date';

export class ReportsService {
  async getSummary(fromQuery?: string, toQuery?: string) {
    const today = getTodayClinicDate();
    const from = fromQuery || today.slice(0, 7) + '-01';
    const to = toQuery || today;

    // Find appointments in date range
    const appointments = await Appointment.find({
      clinicDate: { $gte: from, $lte: to },
    }).select('_id');
    const apptIds = appointments.map((a) => a.id);

    const startOfFrom = new Date(`${from}T00:00:00.000Z`);
    const endOfTo = new Date(`${to}T23:59:59.999Z`);

    const [paymentsSum, expensesSum, visitCount] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            appointmentId: { $in: apptIds },
            status: 'RECORDED',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            status: 'APPROVED',
            spentAt: { $gte: startOfFrom, $lte: endOfTo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Visit.countDocuments({
        appointmentId: { $in: apptIds },
      }),
    ]);

    const income = paymentsSum[0]?.total || 0;
    const expenses = expensesSum[0]?.total || 0;
    const net = income - expenses;
    const avgPerVisit = visitCount > 0 ? (income / visitCount).toFixed(2) : '0.00';

    return {
      from,
      to,
      income: String(income),
      expenses: String(expenses),
      net: String(net),
      visitCount,
      avgPerVisit,
    };
  }

  async getIncomeByDay(fromQuery?: string, toQuery?: string) {
    const today = getTodayClinicDate();
    const from = fromQuery || today.slice(0, 7) + '-01';
    const to = toQuery || today;

    const result = await Payment.aggregate([
      {
        $match: { status: 'RECORDED' },
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment',
        },
      },
      { $unwind: '$appointment' },
      {
        $match: {
          'appointment.clinicDate': { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$appointment.clinicDate',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r) => ({
      day: r._id,
      total: String(r.total),
    }));
  }

  async getExpensesByCategory(fromQuery?: string, toQuery?: string) {
    const today = getTodayClinicDate();
    const from = fromQuery || today.slice(0, 7) + '-01';
    const to = toQuery || today;

    const startOfFrom = new Date(`${from}T00:00:00.000Z`);
    const endOfTo = new Date(`${to}T23:59:59.999Z`);

    const result = await Expense.aggregate([
      {
        $match: {
          status: 'APPROVED',
          spentAt: { $gte: startOfFrom, $lte: endOfTo },
        },
      },
      {
        $lookup: {
          from: 'expensecategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result.map((r) => ({
      category: r._id,
      total: String(r.total),
    }));
  }

  async getPaymentsByMethod(fromQuery?: string, toQuery?: string) {
    const today = getTodayClinicDate();
    const from = fromQuery || today.slice(0, 7) + '-01';
    const to = toQuery || today;

    const result = await Payment.aggregate([
      {
        $match: { status: 'RECORDED' },
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment',
        },
      },
      { $unwind: '$appointment' },
      {
        $match: {
          'appointment.clinicDate': { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return result.map((r) => ({
      method: r._id,
      total: String(r.total),
      count: String(r.count),
    }));
  }

  async getDoctorRevenue(fromQuery?: string, toQuery?: string, doctorId?: string) {
    const today = getTodayClinicDate();
    const from = fromQuery || today.slice(0, 7) + '-01';
    const to = toQuery || today;

    const filter: any = {
      clinicDate: { $gte: from, $lte: to },
    };
    if (doctorId) {
      filter.doctorId = doctorId;
    }

    const appointments = await Appointment.find(filter)
      .sort({ clinicDate: -1, queueNumber: 1 })
      .lean();

    const apptIds = appointments.map((a: any) => a._id);

    const payments = await Payment.find({
      appointmentId: { $in: apptIds },
      status: 'RECORDED',
    }).lean();

    const paymentsByAppt: Record<string, number> = {};
    payments.forEach((p: any) => {
      const aId = String(p.appointmentId);
      paymentsByAppt[aId] = (paymentsByAppt[aId] || 0) + (Number(p.amount) || 0);
    });

    const patientIds = Array.from(new Set(appointments.map((a: any) => a.patientId).filter(Boolean)));
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select('name phone fileNumber')
      .lean();
    const patientMap = new Map(patients.map((p: any) => [p._id.toString(), p]));

    let totalConsultations = appointments.length;
    let completedVisits = 0;
    let totalFees = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let freeCount = 0;

    const typeBreakdown: Record<string, { count: number; totalFees: number; totalPaid: number }> = {};

    const items = appointments.map((appt: any) => {
      const p = patientMap.get(String(appt.patientId));
      const fee = Number(appt.totalAmount) || 0;
      const paid = paymentsByAppt[String(appt._id)] ?? (Number(appt.paidAmount) || 0);
      const remaining = Math.max(0, fee - paid);
      const isExempt = Boolean(appt.isExempt || appt.paymentStatus === 'EXEMPT');

      totalFees += fee;
      totalPaid += paid;
      totalRemaining += remaining;
      if (isExempt) freeCount++;
      if (appt.status === 'COMPLETED' || appt.status === 'IN_PROGRESS') completedVisits++;

      const typeKey = appt.type || 'EXAMINATION';
      if (!typeBreakdown[typeKey]) {
        typeBreakdown[typeKey] = { count: 0, totalFees: 0, totalPaid: 0 };
      }
      typeBreakdown[typeKey].count++;
      typeBreakdown[typeKey].totalFees += fee;
      typeBreakdown[typeKey].totalPaid += paid;

      return {
        id: String(appt._id),
        appointmentId: String(appt._id),
        patientId: String(appt.patientId),
        patientName: p?.name || 'مريض غير محدد',
        patientPhone: p?.phone || '',
        fileNumber: p?.fileNumber || '',
        clinicDate: appt.clinicDate,
        scheduledAt: appt.scheduledAt,
        startTime: appt.startTime,
        endTime: appt.endTime,
        type: appt.type,
        status: appt.status,
        queueNumber: appt.queueNumber,
        originalFee: appt.originalFee || fee,
        discount: appt.discount || 0,
        fee,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentStatus: isExempt ? 'EXEMPT' : remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
        isExempt,
      };
    });

    return {
      from,
      to,
      doctorId: doctorId || null,
      summary: {
        totalConsultations,
        completedVisits,
        totalFees,
        totalPaid,
        totalRemaining,
        freeCount,
        collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 100,
      },
      typeBreakdown,
      consultations: items,
    };
  }
}

export const reportsService = new ReportsService();
