module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    linkId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'links',
        key: 'id'
      },
      field: 'link_id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000] // Comment length between 1-1000 characters
      }
    }
  }, {
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['link_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Class methods
  Comment.findByLinkId = async function(linkId, limit = 50, offset = 0) {
    return await this.findAll({
      where: { linkId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'displayName', 'avatarUrl']
      }]
    });
  };

  Comment.createComment = async function(userId, linkId, content) {
    return await this.create({
      userId,
      linkId,
      content: content.trim()
    });
  };

  Comment.getCountForLink = async function(linkId) {
    return await this.count({
      where: { linkId }
    });
  };

  Comment.findByUserId = async function(userId, limit = 20) {
    return await this.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.Link,
        as: 'link',
        attributes: ['id', 'url', 'title']
      }]
    });
  };

  return Comment;
};
