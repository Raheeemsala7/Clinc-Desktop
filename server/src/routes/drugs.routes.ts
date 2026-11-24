import { Router } from 'express';
import { drugsController } from '../controllers/drugs.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/analytics', requireRoles('ADMIN', 'DOCTOR'), drugsController.getAnalytics);
router.get('/forms', requireRoles('ADMIN', 'DOCTOR'), drugsController.getForms);
router.post('/forms', requireRoles('ADMIN', 'DOCTOR'), drugsController.saveForm);
router.put('/forms/:id', requireRoles('ADMIN', 'DOCTOR'), drugsController.updateForm);
router.delete('/forms/:id', requireRoles('ADMIN', 'DOCTOR'), drugsController.deleteForm);
router.get('/', requireRoles('ADMIN', 'DOCTOR'), drugsController.searchDrugs);
router.post('/', requireRoles('ADMIN', 'DOCTOR'), drugsController.saveDrug);
router.put('/:id', requireRoles('ADMIN', 'DOCTOR'), drugsController.updateDrug);
router.delete('/:id', requireRoles('ADMIN', 'DOCTOR'), drugsController.deleteDrug);

export default router;
