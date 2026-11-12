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

  /**
   * 🔍 البحث الطبي السريري الشامل عبر كافة استمارات الكشف والروشتات
   * يتيح للطبيب كتابة أي كلمة (مثال: x-ray, Augmentin, انحراف حاجز) والحصول على قائمة المرضى فوراً
   */
  static async clinicalSearch(query: string, actorId: string) {
    const term = (query || '').trim();
    if (!term || term.length < 1) {
      return [];
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    // 1. البحث في الروشتات والأدوية
    const matchingPrescriptions = await Prescription.find({
      $or: [
        { 'items.drugName': regex },
        { 'items.instructions': regex },
        { 'items.dose': regex },
        { 'items.form': regex },
        { 'items.concentration': regex },
        { notes: regex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // 2. البحث في استمارات وزيارات الكشف (الشكوى، التشخيص، الملاحظات، استمارة ENT)
    const matchingVisits = await Visit.find({
      $or: [
        { complaint: regex },
        { diagnosis: regex },
        { notes: regex },
        { instructions: regex },
        { 'entExamination.complaint': regex },
        { 'entExamination.diagnosis': regex },
        { 'entExamination.historyOfPresentIllness': regex },
        { 'entExamination.investigations': regex },
        { 'entExamination.treatmentNotes': regex },
        { 'entExamination.operationNeeded': regex },
        { 'entExamination.operativeData': regex },
        { 'entExamination.secondVisitNotes': regex },
        { 'entExamination.thirdVisitNotes': regex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // 3. جمع كافة معرّفات المرضى المكتشفين
    const patientIds = Array.from(
      new Set([
        ...matchingPrescriptions.map((p) => p.patientId),
        ...matchingVisits.map((v) => v.patientId),
      ]),
    );

    if (patientIds.length === 0) {
      return [];
    }

    const patients = await Patient.find({ _id: { $in: patientIds } }).select(
      'id fullName phone age gender fileNumber dateOfBirth allergies chronicConditions',
    );
    const patientMap = new Map<string, any>(patients.map((p) => [p.id || p._id.toString(), p]));

    const resultsMap = new Map<string, any>();

    for (const v of matchingVisits) {
      const p = patientMap.get(v.patientId);
      if (!p) continue;

      const visitMatches: Array<{ category: string; field: string; text: string }> = [];

      if (v.diagnosis && regex.test(v.diagnosis)) {
        visitMatches.push({ category: 'DIAGNOSIS', field: 'التشخيص الطبي', text: v.diagnosis });
      }
      if (v.complaint && regex.test(v.complaint)) {
        visitMatches.push({ category: 'COMPLAINT', field: 'الشكوى الرئيسية', text: v.complaint });
      }
      if (v.notes && regex.test(v.notes)) {
        visitMatches.push({ category: 'NOTES', field: 'ملاحظات الكشف', text: v.notes });
      }
      if (v.instructions && regex.test(v.instructions)) {
        visitMatches.push({ category: 'INSTRUCTIONS', field: 'التعليمات', text: v.instructions });
      }
      if (v.entExamination) {
        const ent = v.entExamination as Record<string, any>;
        if (ent.historyOfPresentIllness && regex.test(ent.historyOfPresentIllness)) {
          visitMatches.push({
            category: 'HISTORY',
            field: 'تاريخ المرض الحالي (History)',
            text: ent.historyOfPresentIllness,
          });
        }
        if (ent.investigations && regex.test(ent.investigations)) {
          visitMatches.push({
            category: 'INVESTIGATIONS',
            field: 'الفحوصات والأشعة (Investigations)',
            text: ent.investigations,
          });
        }
        if (ent.treatmentNotes && regex.test(ent.treatmentNotes)) {
          visitMatches.push({
            category: 'TREATMENT',
            field: 'تعليمات وإرشادات العلاج',
            text: ent.treatmentNotes,
          });
        }
        if (ent.operationNeeded && regex.test(ent.operationNeeded)) {
          visitMatches.push({
            category: 'OPERATION',
            field: 'العملية المطلوبة',
            text: ent.operationNeeded,
          });
        }
      }

      if (visitMatches.length > 0) {
        const key = `${v.patientId}_${v.id}`;
        resultsMap.set(key, {
          patientId: p.id || p._id,
          patientName: p.fullName,
          patientPhone: p.phone,
          patientAge: p.age,
          patientGender: p.gender,
          fileNumber: p.fileNumber || p.id?.slice(0, 8),
          appointmentId: v.appointmentId,
          visitId: v.id || v._id,
          visitDate: v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : '',
          matches: visitMatches,
        });
      }
    }

    for (const rx of matchingPrescriptions) {
      const p = patientMap.get(rx.patientId);
      if (!p) continue;

      const rxMatches: Array<{ category: string; field: string; text: string }> = [];

      for (const item of rx.items || []) {
        if (regex.test(item.drugName)) {
          rxMatches.push({
            category: 'DRUG',
            field: 'اسم الدواء بالروشتة',
            text: `${item.drugName} ${item.concentration || ''} ${item.form || ''} - ${item.dose || ''} (${item.frequency || ''})`,
          });
        } else if (item.instructions && regex.test(item.instructions)) {
          rxMatches.push({
            category: 'DRUG_INSTRUCTIONS',
            field: 'إرشادات الدواء',
            text: `${item.drugName}: ${item.instructions}`,
          });
        }
      }

      if (rx.notes && regex.test(rx.notes)) {
        rxMatches.push({ category: 'RX_NOTES', field: 'ملاحظات الروشتة', text: rx.notes });
      }

      if (rxMatches.length > 0) {
        const key = `${rx.patientId}_${rx.visitId || rx.id}`;
        const existing = resultsMap.get(key);
        if (existing) {
          existing.matches = [...existing.matches, ...rxMatches];
        } else {
          resultsMap.set(key, {
            patientId: p.id || p._id,
            patientName: p.fullName,
            patientPhone: p.phone,
            patientAge: p.age,
            patientGender: p.gender,
            fileNumber: p.fileNumber || p.id?.slice(0, 8),
            appointmentId: rx.visitId,
            visitId: rx.visitId,
            visitDate: rx.createdAt ? new Date(rx.createdAt).toISOString().slice(0, 10) : '',
            matches: rxMatches,
          });
        }
      }
    }

    return Array.from(resultsMap.values());
  }
}
