import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinic-management',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'clinic_dev_access_secret_super_secure_key_12345678901234567890',
    accessTtl: Number(process.env.JWT_ACCESS_TTL) || 315360000, // 10 سنوات (مدى الحياة) لعدم تسجيل الخروج نهائياً
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'clinic_dev_refresh_secret_super_secure_key_12345678901234567890',
    refreshTtl: Number(process.env.JWT_REFRESH_TTL) || 315360000, // 10 سنوات
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localPath: process.env.LOCAL_STORAGE_PATH || 'D:/ClinicData/uploads',
    endpoint: process.env.AWS_ENDPOINT_URL_S3 || 'https://t3.storage.dev',
    region: process.env.AWS_REGION || 'auto',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_BUCKET_NAME || 'clinic-uploads-bucket',
  },
  seed: {
    adminUsername: (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase().trim(),
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    doctorUsername: (process.env.SEED_DOCTOR_USERNAME || 'doctor').toLowerCase().trim(),
    doctorPassword: process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123456',
    receptionUsername: (process.env.SEED_RECEPTION_USERNAME || 'reception').toLowerCase().trim(),
    receptionPassword: process.env.SEED_RECEPTION_PASSWORD || 'Reception@123456',
  },
};
