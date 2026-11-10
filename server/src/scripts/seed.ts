import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import argon2 from 'argon2';
import { connectDB } from '../db/connection';
import { User, Setting, ExpenseCategory, Drug, DoctorStatus } from '../models';

export async function ensureSeedData() {
  console.log('--- Ensuring MongoDB Database Seed Data ---');

  // 1. Seed Users
  const usersToSeed = [
    {
      username: (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase().trim(),
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
      name: 'System Administrator',
      role: 'ADMIN',
    },
    {
      username: (process.env.SEED_DOCTOR_USERNAME || 'doctor').toLowerCase().trim(),
      password: process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123456',
      name: 'Dr. Ahmed Mostafa',
      role: 'DOCTOR',
    },
    {
      username: (process.env.SEED_RECEPTION_USERNAME || 'reception').toLowerCase().trim(),
      password: process.env.SEED_RECEPTION_PASSWORD || 'Reception@123456',
      name: 'Reception Staff',
      role: 'RECEPTION',
    },
  ];

  for (const u of usersToSeed) {
    const existing = await User.findOne({ username: u.username });
    const passwordHash = await argon2.hash(u.password);

    if (!existing) {
      const user = await User.create({
        name: u.name,
        username: u.username,
        passwordHash,
        role: u.role,
        isActive: true,
      });
      console.log(`Created user: ${u.username} (${u.role}) [ID: ${user.id}]`);

      if (u.role === 'DOCTOR') {
        await DoctorStatus.findByIdAndUpdate(
          user.id,
          { _id: user.id, status: 'AVAILABLE' },
          { upsert: true },
        );
      }
    } else {
      existing.passwordHash = passwordHash;
      existing.isActive = true;
      existing.name = u.name;
      existing.role = u.role as any;
      await existing.save();
      console.log(`Updated existing user: ${u.username} (${u.role}) [ID: ${existing.id}]`);

      if (u.role === 'DOCTOR') {
        await DoctorStatus.findByIdAndUpdate(
          existing.id,
          { _id: existing.id, status: 'AVAILABLE' },
          { upsert: true },
        );
      }
    }
  }

  // 2. Seed Settings
  const settingsToSeed: Record<string, string> = {
    clinicName: 'عيادة النور التخصصية',
    doctorDisplayName: 'د. أحمد مصطفى',
    specialty: 'العيادات التخصصية',
    address: 'القاهرة - مصر',
    phone: '01000000000',
    workingHoursText: 'السبت - الخميس: ٩ صباحاً - ٩ مساءً',
    defaultConsultationFee: '250',
    currencyCode: 'EGP',
    receptionMonthlyExpenseLimit: '1000',
  };

  for (const [key, value] of Object.entries(settingsToSeed)) {
    await Setting.findByIdAndUpdate(
      key,
      { _id: key, value },
      { upsert: true },
    );
  }

  // 3. Seed Expense Categories
  const categories = [
    'مستلزمات طبية وأدوية',
    'أدوات مكتبية ومطبوعات',
    'صيانة ونظافة',
    'كهرباء ومياه وإنترنت',
    'مصروفات نثرية وضيافة',
  ];

  for (const catName of categories) {
    await ExpenseCategory.findOneAndUpdate(
      { name: catName },
      { name: catName, isActive: true },
      { upsert: true },
    );
  }

  // 4. Seed Popular Drugs
  const drugs = [
    'Panadol Extra 500mg',
    'Augmentin 1g',
    'Cataflam 50mg',
    'Brufen 400mg',
    'Amoxil 500mg',
    'Antinal 200mg',
    'Flagyl 500mg',
    'Voltaren 75mg',
    'Congestal',
    'Tobrex Eye Drops',
  ];

  for (const drugName of drugs) {
    await Drug.findOneAndUpdate(
      { name: drugName.toLowerCase().trim() },
      { name: drugName.toLowerCase().trim(), isActive: true, $setOnInsert: { usageCount: 5 } },
      { upsert: true },
    );
  }

  console.log('✅ [SEED] Database Seed Verified & Ready.');
}

export default ensureSeedData;

// Run directly from CLI only if explicitly executing the seed script
if (require.main === module && process.argv[1] && path.basename(process.argv[1]).toLowerCase().includes('seed')) {
  (async () => {
    await connectDB();
    await ensureSeedData();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
