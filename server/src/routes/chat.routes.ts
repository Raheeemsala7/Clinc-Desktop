import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/messages', chatController.listMessages);
router.post('/messages', chatController.sendMessage);

export default router;

