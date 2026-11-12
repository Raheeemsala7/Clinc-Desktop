import { Drug, Prescription } from '../models';

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
}
