// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections, admin } = firebaseConfig;
const openaiService = require('../services/openaiService');

class ChatController {
  // Send message to security chatbot
  async sendMessage(req, res, next) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user.userId;

      // Validate message
      const validation = openaiService.validateMessage(message);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          code: 'INVALID_MESSAGE'
        });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
        if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
          return res.status(404).json({
            error: 'Cuộc trò chuyện không tồn tại',
            code: 'CONVERSATION_NOT_FOUND'
          });
        }
        conversation = { id: conversationId, ...conversationDoc.data() };
      } else {
        // Create new conversation
        const newConversation = {
          userId,
          title: validation.message.substring(0, 50) + (validation.message.length > 50 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0
        };
        
        const conversationRef = await db.collection(collections.CONVERSATIONS).add(newConversation);
        conversation = { id: conversationRef.id, ...newConversation };
      }

      // Get conversation history
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversation.id)
        .orderBy('createdAt', 'asc')
        .limit(20)
        .get();

      const conversationHistory = messagesQuery.docs.map(doc => {
        const data = doc.data();
        return {
          role: data.role,
          content: data.content
        };
      });

      // Send message to OpenAI
      const aiResponse = await openaiService.sendMessage(validation.message, conversationHistory);

      if (!aiResponse.success) {
        return res.status(500).json({
          error: aiResponse.error,
          code: 'AI_SERVICE_ERROR'
        });
      }

      // Save user message
      const userMessage = {
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: validation.message,
        createdAt: new Date().toISOString()
      };
      await db.collection(collections.CHAT_MESSAGES).add(userMessage);

      // Save AI response
      const assistantMessage = {
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: aiResponse.message,
        createdAt: new Date().toISOString(),
        metadata: {
          model: aiResponse.model,
          usage: aiResponse.usage
        }
      };
      await db.collection(collections.CHAT_MESSAGES).add(assistantMessage);

      // Update conversation
      await db.collection(collections.CONVERSATIONS).doc(conversation.id).update({
        updatedAt: new Date().toISOString(),
        messageCount: admin.firestore.FieldValue.increment(2),
        lastMessage: validation.message
      });

      // Update user stats
      await db.collection(collections.USERS).doc(userId).update({
        'stats.chatMessages': admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      res.json({
        message: 'Tin nhắn đã được gửi thành công',
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        response: {
          content: aiResponse.message,
          createdAt: assistantMessage.createdAt
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get conversation history
  async getConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;

      // Get conversation
      const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
      if (!conversationDoc.exists) {
        return res.status(404).json({
          error: 'Cuộc trò chuyện không tồn tại',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const conversation = conversationDoc.data();
      if (conversation.userId !== userId) {
        return res.status(403).json({
          error: 'Không có quyền truy cập',
          code: 'ACCESS_DENIED'
        });
      }

      // Get messages
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'asc')
        .get();

      const messages = messagesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        conversation: {
          id: conversationId,
          ...conversation
        },
        messages
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user's conversations list
  async getConversations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      // Get conversations
      let query = db.collection(collections.CONVERSATIONS)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(parseInt(limit));

      if (offset > 0) {
        const previousQuery = await db.collection(collections.CONVERSATIONS)
          .where('userId', '==', userId)
          .orderBy('updatedAt', 'desc')
          .limit(offset)
          .get();

        if (!previousQuery.empty) {
          const lastDoc = previousQuery.docs[previousQuery.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const conversationsQuery = await query.get();

      const conversations = conversationsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count
      const totalQuery = await db.collection(collections.CONVERSATIONS)
        .where('userId', '==', userId)
        .get();

      const totalCount = totalQuery.size;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete conversation
  async deleteConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;

      // Check if conversation exists and belongs to user
      const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
      if (!conversationDoc.exists) {
        return res.status(404).json({
          error: 'Cuộc trò chuyện không tồn tại',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const conversation = conversationDoc.data();
      if (conversation.userId !== userId) {
        return res.status(403).json({
          error: 'Không có quyền truy cập',
          code: 'ACCESS_DENIED'
        });
      }

      // Delete all messages in conversation
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversationId)
        .get();

      const batch = db.batch();
      messagesQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete conversation
      batch.delete(conversationDoc.ref);

      await batch.commit();

      res.json({
        message: 'Cuộc trò chuyện đã được xóa thành công'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get conversation starters
  async getConversationStarters(req, res, next) {
    try {
      const starters = openaiService.getConversationStarters();
      
      res.json({
        starters
      });

    } catch (error) {
      next(error);
    }
  }

  // Get security tips
  async getSecurityTips(req, res, next) {
    try {
      const { category = 'general' } = req.query;
      
      const response = await openaiService.getSecurityTips(category);
      
      if (!response.success) {
        return res.status(500).json({
          error: response.error,
          code: 'AI_SERVICE_ERROR'
        });
      }

      res.json({
        category,
        tips: response.message
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
