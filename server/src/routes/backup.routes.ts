import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRoles('ADMIN'));

router.post('/create', backupController.createBackup);
router.post('/restore', backupController.restoreBackup);

export default router;

