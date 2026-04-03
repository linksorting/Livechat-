// routes/chat.js
import { Router } from 'express';
import { websiteChatMessage, getConversationMessages } from '../controllers/chat.controller.js';

const router = Router();

// Website chat endpoint
router.post('/website-chat', websiteChatMessage);
router.get('/messages/:conversationId', getConversationMessages);

export default router;