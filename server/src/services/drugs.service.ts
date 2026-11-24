import { Drug, DrugForm, Prescription } from '../models';

const DEFAULT_DRUG_FORMS: Array<{ name: string; nameAr: string; defaultDose: string; isCustom: boolean }> = [
  { name: 'Tablet', nameAr: 'أقراص', defaultDose: 'قرص واحد', isCustom: false },
  { name: 'ODT', nameAr: 'أقراص تذوب في الفم', defaultDose: 'قرص واحد يذوب بالفم', isCustom: false },
  { name: 'ODF', nameAr: 'شرائط تذوب في الفم', defaultDose: 'شريط واحد يذوب على اللسان', isCustom: false },
  { name: 'Capsule', nameAr: 'كبسولات', defaultDose: '1 كبسولة', isCustom: false },
  { name: 'Syrup', nameAr: 'شراب', defaultDose: '5 سم (ملعقة صغيرة)', isCustom: false },
  { name: 'Suspension', nameAr: 'معلق', defaultDose: '5 سم (ملعقة صغيرة)', isCustom: false },
  { name: 'Oral Drops', nameAr: 'نقط بالفم', defaultDose: '5 نقط بالفم', isCustom: false },
  { name: 'Oral Solution', nameAr: 'محلول فموي', defaultDose: '10 سم بالفم', isCustom: false },
  { name: 'Effervescent Tablet', nameAr: 'أقراص فوارة', defaultDose: 'قرص فوار في نصف كوب ماء', isCustom: false },
  { name: 'Chewable Tablet', nameAr: 'أقراص للمضغ', defaultDose: 'قرص للمضغ', isCustom: false },
  { name: 'Sublingual Tablet', nameAr: 'أقراص تحت اللسان', defaultDose: 'قرص تحت اللسان', isCustom: false },
  { name: 'Injection', nameAr: 'حقن', defaultDose: 'حقنة واحدة', isCustom: false },
  { name: 'Ampoule', nameAr: 'أمبول', defaultDose: 'حقنة واحدة', isCustom: false },
  { name: 'Vial', nameAr: 'فيال', defaultDose: 'حقنة واحدة', isCustom: false },
  { name: 'Cream', nameAr: 'كريم', defaultDose: 'دهان موضعي طبقة رقيقة صباحاً ومساءً', isCustom: false },
  { name: 'Ointment', nameAr: 'مرهم', defaultDose: 'دهان موضعي خفيف على المنطقة المصابة', isCustom: false },
  { name: 'Gel', nameAr: 'جل موضعي', defaultDose: 'دهان جل موضعي طبقة رقيقة على المكان المصاب', isCustom: false },
  { name: 'Lotion', nameAr: 'لوشن', defaultDose: 'دهان لوشن موضعي مع التدليك الخفيف', isCustom: false },
  { name: 'Eye Drops', nameAr: 'نقط عين', defaultDose: 'نقطة واحدة بالعين المصابة', isCustom: false },
  { name: 'Eye Ointment', nameAr: 'مرهم عين', defaultDose: 'دهان مرهم داخل جفن العين ليلاً', isCustom: false },
  { name: 'Ear Drops', nameAr: 'نقط أذن', defaultDose: '3 نقط بالأذن المصابة', isCustom: false },
  { name: 'Ear Spray', nameAr: 'بخاخ أذن', defaultDose: 'بخة واحدة بالأذن', isCustom: false },
  { name: 'Nasal Drops', nameAr: 'نقط أنف', defaultDose: 'نقطتين في كل فتحة أنف', isCustom: false },
  { name: 'Nasal Spray', nameAr: 'بخاخ أنف', defaultDose: 'بخة واحدة في كل فتحة أنف', isCustom: false },
  { name: 'Nasal Gel', nameAr: 'جل أنف موضعي', defaultDose: 'دهان جل موضعي داخل الأنف طبقة رقيقة', isCustom: false },
  { name: 'Nasal Wash', nameAr: 'غسول تنظيف الأنف', defaultDose: 'غسيل وتشطيف الأنف بالمحلول', isCustom: false },
  { name: 'Inhaler', nameAr: 'بخاخ استنشاق', defaultDose: 'بختين استنشاق', isCustom: false },
  { name: 'Nebulizer Solution', nameAr: 'محلول جلسات استنشاق', defaultDose: 'أمبول واحد بجهاز الاستنشاق', isCustom: false },
  { name: 'Inhalation Solution', nameAr: 'محلول استنشاق', defaultDose: 'جلسة استنشاق واحدة', isCustom: false },
  { name: 'Suppository', nameAr: 'لبوس', defaultDose: 'لبوسة واحدة', isCustom: false },
  { name: 'Vaginal Suppository', nameAr: 'لبوس مهبلي', defaultDose: 'لبوسة مهبلية مساءً', isCustom: false },
  { name: 'Vaginal Cream', nameAr: 'كريم مهبلي', defaultDose: 'دهان موضعي مساءً', isCustom: false },
  { name: 'Powder', nameAr: 'مسحوق', defaultDose: 'كيس واحد في نصف كوب ماء', isCustom: false },
  { name: 'Sachet', nameAr: 'أكياس فوار', defaultDose: 'كيس واحد في نصف كوب ماء', isCustom: false },
  { name: 'Granules', nameAr: 'حبيبات فوارة', defaultDose: 'كيس واحد في نصف كوب ماء', isCustom: false },
  { name: 'Patch', nameAr: 'لصقات جلدية', defaultDose: 'لصقة واحدة موضعية تُغير يومياً', isCustom: false },
  { name: 'Mouthwash', nameAr: 'مضمضة وغسول فم', defaultDose: 'مضمضة وغرغرة 15 مل (بدون تخفيف لمدة دقيقة ثم تبصق)', isCustom: false },
  { name: 'Oral Spray', nameAr: 'بخاخ فم وحلق', defaultDose: 'بختين بالفم والحلق', isCustom: false },
  { name: 'Lozenges', nameAr: 'أقراص استحلاب', defaultDose: 'قرص استحلاب واحد', isCustom: false },
  { name: 'Gargle', nameAr: 'غرغرة ومطهر حلق', defaultDose: 'مضمضة وغرغرة 15 مل لمدة دقيقة ثم تبصق', isCustom: false },
];

export class DrugsService {
  static async searchDrugs(query = '', limit = 100) {
    const filter: any = { isActive: true };

    if (query.trim()) {
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safeQuery, $options: 'i' };
    }

    const drugs = await Drug.find(filter)
      .sort({ usageCount: -1, name: 1 })
      .limit(limit);

    return drugs.map((d) => ({
      id: d.id,
      name: d.name,
      form: d.form || 'Tablet',
      concentration: d.concentration || '',
      dose: d.dose || '',
      frequency: d.frequency || '',
      duration: d.duration || '',
      instructions: d.instructions || '',
      usageCount: d.usageCount || 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  static async deleteDrug(id: string) {
    await Drug.findByIdAndDelete(id);
    return { success: true };
  }

  static async saveDrug(dto: {
    name: string;
    form?: string;
    concentration?: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    incrementUsage?: boolean;
  }) {
    const name = dto.name.trim();
    if (!name) return null;

    const updateOps: any = {
      $setOnInsert: { name },
      $set: {
        isActive: true,
        form: dto.form || 'Tablet',
        concentration: dto.concentration || '',
        dose: dto.dose || '',
        frequency: dto.frequency || '',
        duration: dto.duration || '',
        instructions: dto.instructions || '',
      },
    };

    if (dto.incrementUsage !== false) {
      updateOps.$inc = { usageCount: 1 };
    }

    const drug = await Drug.findOneAndUpdate(
      { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      updateOps,
      { upsert: true, new: true }
    );

    return drug.toJSON();
  }

  static async updateDrug(
    id: string,
    dto: {
      name?: string;
      form?: string;
      concentration?: string;
      dose?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }
  ) {
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.form !== undefined) updateData.form = dto.form;
    if (dto.concentration !== undefined) updateData.concentration = dto.concentration;
    if (dto.dose !== undefined) updateData.dose = dto.dose;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.instructions !== undefined) updateData.instructions = dto.instructions;

    const updated = await Drug.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    return updated ? updated.toJSON() : null;
  }

  static async getDrugAnalytics(query: {
    period?: 'month' | '6months' | '1year' | 'custom';
    startDate?: string;
    endDate?: string;
  }) {
    const now = new Date();
    let from: Date | null = null;
    let to: Date = now;

    if (query.startDate && query.endDate) {
      from = new Date(query.startDate + 'T00:00:00.000Z');
      to = new Date(query.endDate + 'T23:59:59.999Z');
    } else if (query.period === '6months') {
      from = new Date();
      from.setMonth(from.getMonth() - 6);
    } else if (query.period === '1year') {
      from = new Date();
      from.setFullYear(from.getFullYear() - 1);
    } else {
      // Default: last 30 days / month
      from = new Date();
      from.setMonth(from.getMonth() - 1);
    }

    const match: any = {};
    if (from) {
      match.createdAt = { $gte: from, $lte: to };
    }

    // 1. تجميع الأدوية الأكثر وصفاً من الروشتات الصادرة في هذه الفترة
    const aggregated = await Prescription.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $toLower: '$items.drugName' },
          name: { $first: '$items.drugName' },
          form: { $first: '$items.form' },
          concentration: { $first: '$items.concentration' },
          count: { $sum: 1 },
          lastPrescribed: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    // 2. إذا لم يكن هناك روشتات في الفترة، نستعين بالأدوية الأكثر استخداماً المسجلة في قاعدة البيانات
    if (aggregated.length === 0) {
      const topDrugs = await Drug.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(20);

      const items = topDrugs.map((d) => ({
        name: d.name,
        form: d.form || 'Tablet',
        concentration: d.concentration || '',
        count: d.usageCount || 0,
        lastPrescribed: d.updatedAt || d.createdAt,
      }));

      const totalPrescribed = items.reduce((sum, item) => sum + item.count, 0);

      return {
        period: query.period || 'month',
        from: from?.toISOString(),
        to: to.toISOString(),
        totalPrescriptions: 0,
        totalItemsPrescribed: totalPrescribed,
        items,
      };
    }

    const totalItemsPrescribed = aggregated.reduce((sum, a) => sum + a.count, 0);

    return {
      period: query.period || 'month',
      from: from?.toISOString(),
      to: to.toISOString(),
      totalPrescriptions: await Prescription.countDocuments(match),
      totalItemsPrescribed,
      items: aggregated.map((a) => ({
        name: a.name,
        form: a.form || 'Tablet',
        concentration: a.concentration || '',
        count: a.count,
        lastPrescribed: a.lastPrescribed,
      })),
    };
  }

  static async getForms() {
    const count = await DrugForm.countDocuments();
    if (count === 0) {
      try {
        await DrugForm.insertMany(DEFAULT_DRUG_FORMS, { ordered: false });
      } catch {
        // ignore duplicate seed errors
      }
    }
    const customForms = await DrugForm.find().sort({ isCustom: -1, createdAt: 1 });
    return customForms.map((f) => ({
      id: f.id,
      name: f.name,
      nameAr: f.nameAr,
      defaultDose: f.defaultDose || '',
      defaultInstructions: f.defaultInstructions || '',
      isCustom: Boolean(f.isCustom),
    }));
  }

  static async saveForm(dto: {
    name: string;
    nameAr: string;
    defaultDose?: string;
    defaultInstructions?: string;
  }) {
    const name = dto.name.trim();
    const nameAr = dto.nameAr.trim();

    const form = await DrugForm.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          nameAr,
          defaultDose: dto.defaultDose || '',
          defaultInstructions: dto.defaultInstructions || '',
          isCustom: true,
        },
      },
      { upsert: true, new: true }
    );

    return {
      id: form.id,
      name: form.name,
      nameAr: form.nameAr,
      defaultDose: form.defaultDose || '',
      defaultInstructions: form.defaultInstructions || '',
      isCustom: Boolean(form.isCustom),
    };
  }

  static async updateForm(
    id: string,
    dto: {
      name?: string;
      nameAr?: string;
      defaultDose?: string;
      defaultInstructions?: string;
    }
  ) {
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr.trim();
    if (dto.defaultDose !== undefined) updateData.defaultDose = dto.defaultDose.trim();
    if (dto.defaultInstructions !== undefined) updateData.defaultInstructions = dto.defaultInstructions.trim();

    const form = await DrugForm.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!form) return null;

    return {
      id: form.id,
      name: form.name,
      nameAr: form.nameAr,
      defaultDose: form.defaultDose || '',
      defaultInstructions: form.defaultInstructions || '',
      isCustom: Boolean(form.isCustom),
    };
  }

  static async deleteForm(id: string) {
    await DrugForm.findByIdAndDelete(id);
    return { success: true };
  }
}
