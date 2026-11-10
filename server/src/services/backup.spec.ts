import { BackupService } from './backup.service';
import { AttachmentsService } from './attachments.service';
import { connectDB } from '../db/connection';
import { Patient } from '../models';
import AdmZip from 'adm-zip';
import fs from 'fs';
import mongoose from 'mongoose';

describe('Unified Backup and Disaster Recovery Tests (Phase 5.7)', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('1. Should create a complete zip backup with database collections and upload files', async () => {
    // 1. Ensure test data exists
    await Patient.create({
      fullName: 'أحمد سعيد محمد علي',
      searchName: 'احمد سعيد محمد علي',
      phone: '01012345678',
      gender: 'MALE',
      createdById: 'adm-test-id',
    });

    // 2. Ensure test attachment exists
    const validPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await AttachmentsService.saveFile('backup-test.png', validPngBase64, 'reports');

    // 3. Create Backup
    const backup = await BackupService.createBackup();

    expect(backup.success).toBe(true);
    expect(fs.existsSync(backup.archivePath)).toBe(true);
    expect(backup.recordsCount).toBeGreaterThan(0);
    expect(backup.sha256).toBeDefined();

    // 4. Verify Archive Internals
    const zip = new AdmZip(backup.archivePath);
    const manifestEntry = zip.getEntry('manifest.json');
    expect(manifestEntry).toBeDefined();

    const manifest = JSON.parse(zip.readAsText(manifestEntry!));
    expect(manifest.system).toBe('Clinic Management System Desktop');
    expect(manifest.database.recordsCount).toBe(backup.recordsCount);

    const patientsEntry = zip.getEntry('database/patients.json');
    expect(patientsEntry).toBeDefined();

    // 5. Test Restoration
    const restoreResult = await BackupService.restoreBackup(backup.archivePath);
    expect(restoreResult.success).toBe(true);

    // Verify patient still exists in database after restoration
    const restoredPatient = await Patient.findOne({ phone: '01012345678' });
    expect(restoredPatient).toBeDefined();
    expect(restoredPatient?.fullName).toBe('أحمد سعيد محمد علي');
  }, 30000);
});
