import { Visit, Patient, Prescription, Drug } from '../models';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export class VisitsService {
  static async getVisitById(id: string, actorId: string) {
    const visit = await Visit.findById(id);
    if (!visit) throw new NotFoundError('Visit not found');

    const [patient, prescriptions] = await Promise.all([
      Patient.findById(visit.patientId).select(
        'id fullName phone gender dateOfBirth allergies chronicConditions generalNotes',
      ),
      Prescription.find({ visitId: visit.id }).sort({ versionNumber: -1 }),
    ]);

    await logAudit({
      userId: actorId,
      action: 'READ',
      entityType: 'Visit',
      entityId: id,
    });

    return {
      ...visit.toJSON(),
      patient: patient ? patient.toJSON() : null,
      prescriptions: prescriptions.map((p) => p.toJSON()),
      attachments: [],
    };
  }

  static async autosaveVisit(id: string, dto: any, actorId: string, ip = '') {
    const { version, complaint, diagnosis, notes, instructions, followUpDate, entExamination } = dto;

    let visit = await Visit.findById(id);
    if (!visit) {
      visit = await Visit.findOne({ appointmentId: id });
    }
    if (!visit) throw new NotFoundError('Visit not found');

    if (visit.status === 'CLOSED') {
      visit.status = 'OPEN';
      visit.closedAt = undefined;
    }

    if (version !== undefined && version !== null && Number(version) !== visit.version) {
      console.warn(
        `[VisitsService] Visit version mismatch: server=${visit.version}, client=${version}. Syncing to server version.`,
      );
    }

    const before = visit.toJSON();

    if (complaint !== undefined) visit.complaint = complaint;
    if (diagnosis !== undefined) visit.diagnosis = diagnosis;
    if (notes !== undefined) visit.notes = notes;
    if (instructions !== undefined) visit.instructions = instructions;
    if (entExamination !== undefined) visit.entExamination = entExamination;
    if (followUpDate !== undefined) {
      visit.followUpDate = followUpDate ? new Date(followUpDate) : undefined;
    }
    visit.version = visit.version + 1;

    await visit.save();

    // مزامنة استمارة الكشف لتصبح الاستمارة الرئيسية الدائمة للمريض (Master Examination)
    if (entExamination !== undefined && entExamination !== null) {
      try {
        await Patient.findByIdAndUpdate(visit.patientId, {
          masterExamination: entExamination,
        });
      } catch (pErr) {
        console.error('[VisitsService] Failed to sync masterExamination to Patient:', pErr);
      }
    }

    await logAudit({
      userId: actorId,
      action: 'UPDATE',
      entityType: 'Visit',
      entityId: id,
      before,
      after: visit.toJSON(),
      ip,
    });

    return {
      ...visit.toJSON(),
      version: visit.version,
    };
  }

  static async closeVisit(id: string, actorId: string, ip = '') {
    let visit = await Visit.findById(id);
    if (!visit) {
      visit = await Visit.findOne({ appointmentId: id });
    }
    if (!visit) throw new NotFoundError('Visit not found');

    if (visit.status === 'CLOSED') {
      return visit.toJSON();
    }

    visit.status = 'CLOSED';
    visit.closedAt = new Date();
    await visit.save();

    await logAudit({
      userId: actorId,
      action: 'CLOSE',
      entityType: 'Visit',
      entityId: id,
      ip,
    });

    return visit.toJSON();
  }

  static async reopenVisit(id: string, actorId: string, ip = '') {
    const visit = await Visit.findById(id);
    if (!visit) throw new NotFoundError('Visit not found');

    if (visit.status === 'OPEN') {
      return visit.toJSON();
    }

    visit.status = 'OPEN';
    visit.closedAt = undefined;
    await visit.save();

    await logAudit({
      userId: actorId,
      action: 'REOPEN',
      entityType: 'Visit',
      entityId: id,
      ip,
    });

    return visit.toJSON();
  }

  static async addPrescription(visitId: string, dto: any, actorId: string, ip = '') {
    const { items, notes } = dto;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Prescription items are required');
    }

    let visit = await Visit.findById(visitId);
    if (!visit) {
      visit = await Visit.findOne({ appointmentId: visitId });
    }
    if (!visit) throw new NotFoundError('Visit not found');

    const validItems = items.filter((item: any) => item && item.drugName && item.drugName.trim());
    if (validItems.length === 0) {
      throw new BadRequestError('Prescription items are required');
    }

    const latest = await Prescription.findOne({ visitId: visit.id }).sort({ versionNumber: -1 });
    const versionNumber = (latest?.versionNumber || 0) + 1;

    const formattedItems = validItems.map((item: any, idx: number) => ({
      drugName: item.drugName.trim(),
      form: item.form?.trim() || null,
      concentration: item.concentration?.trim() || null,
      dose: item.dose?.trim() || 'حسب الإرشاد',
      frequency: item.frequency?.trim() || 'يومياً',
      duration: item.duration?.trim() || 'أسبوع',
      instructions: item.instructions?.trim() || null,
      sortOrder: item.sortOrder ?? idx,
    }));

    const prescription = await Prescription.create({
      visitId: visit.id,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      versionNumber,
      supersedesId: latest?.id || null,
      notes: notes || null,
      items: formattedItems,
    });

    await Promise.all(
      formattedItems.map((item: any) => {
        const drugName = item.drugName.trim();
        return Drug.findOneAndUpdate(
          { name: drugName },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: { name: drugName },
            $set: {
              isActive: true,
              ...(item.form ? { form: item.form } : {}),
              ...(item.concentration ? { concentration: item.concentration } : {}),
              ...(item.dose ? { dose: item.dose } : {}),
              ...(item.frequency ? { frequency: item.frequency } : {}),
              ...(item.duration ? { duration: item.duration } : {}),
              ...(item.instructions ? { instructions: item.instructions } : {}),
            },
          },
          { upsert: true, new: true },
        );
      }),
    );

    await logAudit({
      userId: actorId,
      action: 'CREATE',
      entityType: 'Prescription',
      entityId: prescription.id,
      after: { versionNumber, itemsCount: formattedItems.length },
      ip,
    });

    return prescription.toJSON();
  }
}
