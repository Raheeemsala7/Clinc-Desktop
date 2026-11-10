import { AttachmentsService } from './attachments.service';
import { StorageService } from './storage.service';
import fs from 'fs';
import path from 'path';

describe('Local File Storage System Tests (Phase 5.1)', () => {
  // 1x1 transparent PNG file bytes
  const validPngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('1. Should save a valid PNG file to local disk with unique UUID filename and return metadata', async () => {
    const attachment = await AttachmentsService.saveFile('test-patient-scan.png', validPngBase64, 'reports');

    expect(attachment).toBeDefined();
    expect(attachment.id).toBeDefined();
    expect(attachment.fileName).toBe('test-patient-scan.png');
    expect(attachment.mimeType).toBe('image/png');
    expect(attachment.url).toMatch(/^\/api\/v1\/attachments\/file\/[a-f0-9-]+\.png$/);

    // Verify file actually exists on local disk
    const fileInfo = AttachmentsService.getFilePath(path.basename(attachment.url));
    expect(fs.existsSync(fileInfo.filePath)).toBe(true);
    expect(fileInfo.mimeType).toBe('image/png');
  });

  it('2. Should reject forged file extension when magic bytes do not match', async () => {
    // Plain text masquerading as PNG
    const fakePng = Buffer.from('THIS IS NOT A REAL PNG FILE HEADER');

    await expect(
      AttachmentsService.saveFile('malicious.png', fakePng, 'appointments')
    ).rejects.toThrow('نوع الملف غير صالح أو تم التلاعب به');
  });

  it('3. Should prevent directory traversal in getFilePath', async () => {
    expect(() => {
      AttachmentsService.getFilePath('../../windows/system32/cmd.exe');
    }).toThrow('File not found');
  });
});

