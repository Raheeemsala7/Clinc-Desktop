import { Router } from 'express';
import { visitsController } from '../controllers/visits.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// البحث الطبي السريري الشامل
router.get(
  '/clinical/search',
  requireRoles('ADMIN', 'DOCTOR', 'RECEPTION'),
  visitsController.clinicalSearch,
);

router.get('/:id', requireRoles('ADMIN', 'DOCTOR'), visitsController.getVisitById);
router.patch('/:id', requireRoles('ADMIN', 'DOCTOR'), visitsController.autosaveVisit);
router.post('/:id/close', requireRoles('ADMIN', 'DOCTOR'), visitsController.closeVisit);
router.post('/:id/reopen', requireRoles('ADMIN', 'DOCTOR'), visitsController.reopenVisit);
router.post(
  '/:visitId/prescriptions',
  requireRoles('ADMIN', 'DOCTOR'),
  visitsController.addPrescription,
);

export default router;
