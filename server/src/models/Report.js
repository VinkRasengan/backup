module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['spam', 'misinformation', 'inappropriate', 'fake', 'other']]
      }
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'reviewed', 'resolved', 'dismissed']]
      }
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes'
    }
  }, {
    tableName: 'reports',
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
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Class methods
  Report.createReport = async function(userId, linkId, type, reason, description = null) {
    return await this.create({
      userId,
      linkId,
      type,
      reason: reason.trim(),
      description: description ? description.trim() : null
    });
  };

  Report.findByStatus = async function(status = 'pending', limit = 50, offset = 0) {
    return await this.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'displayName', 'email']
        },
        {
          model: sequelize.models.Link,
          as: 'link',
          attributes: ['id', 'url', 'title']
        }
      ]
    });
  };

  Report.findByLinkId = async function(linkId) {
    return await this.findAll({
      where: { linkId },
      order: [['created_at', 'DESC']],
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'displayName']
      }]
    });
  };

  Report.updateStatus = async function(reportId, status, adminNotes = null) {
    const report = await this.findByPk(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    await report.update({
      status,
      adminNotes: adminNotes ? adminNotes.trim() : report.adminNotes
    });

    return report;
  };

  Report.getStatistics = async function() {
    const stats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    const result = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      total: 0
    };

    stats.forEach(stat => {
      const status = stat.getDataValue('status');
      const count = parseInt(stat.getDataValue('count'));
      result[status] = count;
      result.total += count;
    });

    return result;
  };

  return Report;
};
