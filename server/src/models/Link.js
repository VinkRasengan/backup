module.exports = (sequelize, DataTypes) => {
  const Link = sequelize.define('Link', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow anonymous link checking
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    securityScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      field: 'security_score'
    },
    isSafe: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_safe'
    },
    threats: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    analysisResult: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      field: 'analysis_result'
    }
  }, {
    tableName: 'links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['url']
      },
      {
        fields: ['security_score']
      },
      {
        fields: ['is_safe']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Hooks
  Link.addHook('afterCreate', async (link) => {
    // Update user stats if user exists
    if (link.userId) {
      const user = await sequelize.models.User.findByPk(link.userId);
      if (user) {
        await user.updateStats('linksChecked');
      }
    }
  });

  // Instance methods
  Link.prototype.getVoteSummary = async function() {
    const Vote = sequelize.models.Vote;
    const votes = await Vote.findAll({
      where: { linkId: this.id },
      attributes: [
        'vote_type',
        [sequelize.fn('COUNT', sequelize.col('vote_type')), 'count']
      ],
      group: ['vote_type']
    });

    const summary = {
      safe: 0,
      unsafe: 0,
      suspicious: 0,
      total: 0
    };

    votes.forEach(vote => {
      const type = vote.getDataValue('vote_type');
      const count = parseInt(vote.getDataValue('count'));
      summary[type] = count;
      summary.total += count;
    });

    return summary;
  };

  Link.prototype.getUserVote = async function(userId) {
    if (!userId) return null;
    
    const Vote = sequelize.models.Vote;
    const vote = await Vote.findOne({
      where: {
        linkId: this.id,
        userId
      }
    });

    return vote ? vote.voteType : null;
  };

  Link.prototype.getCommentsCount = async function() {
    const Comment = sequelize.models.Comment;
    return await Comment.count({
      where: { linkId: this.id }
    });
  };

  Link.prototype.toPublicJSON = async function(userId = null) {
    const data = this.toJSON();
    
    // Add vote summary
    data.voteSummary = await this.getVoteSummary();
    
    // Add user's vote if userId provided
    if (userId) {
      data.userVote = await this.getUserVote(userId);
    }
    
    // Add comments count
    data.commentsCount = await this.getCommentsCount();
    
    return data;
  };

  // Class methods
  Link.findByUrl = async function(url) {
    return await this.findOne({ where: { url } });
  };

  Link.getTrending = async function(limit = 10) {
    return await this.findAll({
      order: [['created_at', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'displayName']
      }]
    });
  };

  Link.getBySecurityScore = async function(minScore = 0, maxScore = 100, limit = 20) {
    return await this.findAll({
      where: {
        securityScore: {
          [sequelize.Op.between]: [minScore, maxScore]
        }
      },
      order: [['security_score', 'DESC']],
      limit
    });
  };

  Link.createWithAnalysis = async function(data) {
    const { url, userId, analysisResult } = data;
    
    return await this.create({
      url,
      userId,
      title: analysisResult?.title,
      description: analysisResult?.description,
      securityScore: analysisResult?.securityScore,
      isSafe: analysisResult?.isSafe,
      threats: analysisResult?.threats || {},
      analysisResult: analysisResult || {}
    });
  };

  return Link;
};
