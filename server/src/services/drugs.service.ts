import { Drug } from '../models';

export class DrugsService {
  static async searchDrugs(query = '') {
    const filter: any = { isActive: true };

    if (query.trim()) {
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safeQuery, $options: 'i' };
    }

    const drugs = await Drug.find(filter)
      .sort({ usageCount: -1, name: 1 })
      .limit(50);

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
  }) {
    const name = dto.name.trim();
    if (!name) return null;

    const drug = await Drug.findOneAndUpdate(
      { name },
      {
        $inc: { usageCount: 1 },
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
      },
      { upsert: true, new: true },
    );

    return drug.toJSON();
  }
}
