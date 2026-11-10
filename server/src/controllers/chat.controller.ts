import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class ChatController {
  listMessages = asyncHandler(async (_req: Request, res: Response) => {
    const messages = await ChatService.listRecentMessages(50);
    sendSuccess(res, messages);
  });

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const sender = {
      id: req.user!.id,
      name: (req.user as any)?.name || (req.user as any)?.username || 'مستخدم',
      role: req.user!.role,
    };
    const message = await ChatService.sendMessage(sender, req.body.message);
    sendSuccess(res, message, { code: 201, message: 'Message sent successfully' });
  });
}

export const chatController = new ChatController();

