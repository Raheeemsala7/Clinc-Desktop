import { ChatMessage, IChatMessage } from '../models';
import { RealtimeService } from '../realtime/socket.server';
import { BadRequestError } from '../utils/errors';

export class ChatService {
  static async listRecentMessages(limit = 50): Promise<IChatMessage[]> {
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse();
  }

  static async sendMessage(
    sender: { id: string; name: string; role: string },
    messageText: string
  ): Promise<IChatMessage> {
    const text = (messageText || '').trim();
    if (!text) {
      throw new BadRequestError('نص الرسالة مطلوب');
    }

    const senderRole =
      sender.role === 'ADMIN'
        ? 'ADMIN'
        : sender.role === 'DOCTOR'
        ? 'DOCTOR'
        : 'RECEPTION';

    const newMsg = await ChatMessage.create({
      senderId: sender.id,
      senderName: sender.name || 'مستخدم',
      senderRole,
      message: text,
      isRead: false,
    });

    const msgJson = newMsg.toJSON();

    // بث الرسالة في الوقت الفعلي لكل الأجهزة المتصلة
    RealtimeService.emitChatMessage(msgJson);

    return newMsg;
  }
}

