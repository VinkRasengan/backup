module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for anonymous conversations
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    messageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'message_count'
    },
    lastMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_message'
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Conversation.prototype.updateLastMessage = async function(messageContent) {
    await this.update({
      lastMessage: messageContent.substring(0, 200), // Truncate to 200 chars
      messageCount: this.messageCount + 1
    });
  };

  Conversation.prototype.generateTitle = async function() {
    if (this.title) return this.title;

    // Get first user message to generate title
    const ChatMessage = sequelize.models.ChatMessage;
    const firstMessage = await ChatMessage.findOne({
      where: {
        conversationId: this.id,
        role: 'user'
      },
      order: [['created_at', 'ASC']]
    });

    if (firstMessage) {
      // Generate title from first message (first 50 chars)
      const title = firstMessage.content.substring(0, 50).trim();
      await this.update({ title: title + (firstMessage.content.length > 50 ? '...' : '') });
      return this.title;
    }

    return 'New Conversation';
  };

  // Class methods
  Conversation.findByUserId = async function(userId, limit = 20) {
    return await this.findAll({
      where: { userId },
      order: [['updated_at', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.ChatMessage,
        as: 'messages',
        limit: 1,
        order: [['created_at', 'DESC']]
      }]
    });
  };

  Conversation.createForUser = async function(userId = null) {
    return await this.create({
      userId,
      title: null,
      messageCount: 0
    });
  };

  return Conversation;
};
