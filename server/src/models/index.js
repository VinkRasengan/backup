const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Conversation = require('./Conversation')(sequelize, DataTypes);
const ChatMessage = require('./ChatMessage')(sequelize, DataTypes);
const Link = require('./Link')(sequelize, DataTypes);
const Vote = require('./Vote')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);
const Report = require('./Report')(sequelize, DataTypes);

// Define associations
const models = {
  User,
  Conversation,
  ChatMessage,
  Link,
  Vote,
  Comment,
  Report
};

// User associations
User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'messages' });
User.hasMany(Link, { foreignKey: 'userId', as: 'links' });
User.hasMany(Vote, { foreignKey: 'userId', as: 'votes' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });

// Conversation associations
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Conversation.hasMany(ChatMessage, { foreignKey: 'conversationId', as: 'messages' });

// ChatMessage associations
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ChatMessage.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Link associations
Link.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Link.hasMany(Vote, { foreignKey: 'linkId', as: 'votes' });
Link.hasMany(Comment, { foreignKey: 'linkId', as: 'comments' });
Link.hasMany(Report, { foreignKey: 'linkId', as: 'reports' });

// Vote associations
Vote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Vote.belongsTo(Link, { foreignKey: 'linkId', as: 'link' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Link, { foreignKey: 'linkId', as: 'link' });

// Report associations
Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Report.belongsTo(Link, { foreignKey: 'linkId', as: 'link' });

// Sync database
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully');
  } catch (error) {
    console.error('❌ Model synchronization failed:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  models,
  syncDatabase,
  ...models
};
