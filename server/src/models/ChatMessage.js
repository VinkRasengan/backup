module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      },
      field: 'conversation_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for anonymous users
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['user', 'assistant']]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Messages don't need updated_at
    indexes: [
      {
        fields: ['conversation_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Hooks
  ChatMessage.addHook('afterCreate', async (message) => {
    // Update conversation's last message and count
    const conversation = await sequelize.models.Conversation.findByPk(message.conversationId);
    if (conversation) {
      await conversation.updateLastMessage(message.content);
      
      // Generate title if this is the first user message
      if (message.role === 'user' && conversation.messageCount === 1) {
        await conversation.generateTitle();
      }
    }

    // Update user stats if user exists
    if (message.userId) {
      const user = await sequelize.models.User.findByPk(message.userId);
      if (user) {
        await user.updateStats('chatMessages');
      }
    }
  });

  // Instance methods
  ChatMessage.prototype.toOpenAIFormat = function() {
    return {
      role: this.role,
      content: this.content
    };
  };

  // Class methods
  ChatMessage.findByConversationId = async function(conversationId, limit = 50) {
    return await this.findAll({
      where: { conversationId },
      order: [['created_at', 'ASC']],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'displayName', 'email']
      }]
    });
  };

  ChatMessage.createUserMessage = async function(conversationId, userId, content, metadata = {}) {
    return await this.create({
      conversationId,
      userId,
      role: 'user',
      content,
      metadata
    });
  };

  ChatMessage.createAssistantMessage = async function(conversationId, content, metadata = {}) {
    return await this.create({
      conversationId,
      userId: null, // Assistant messages don't have userId
      role: 'assistant',
      content,
      metadata
    });
  };

  ChatMessage.getConversationHistory = async function(conversationId, limit = 20) {
    const messages = await this.findByConversationId(conversationId, limit);
    return messages.map(msg => msg.toOpenAIFormat());
  };

  return ChatMessage;
};
