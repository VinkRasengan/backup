module.exports = (sequelize, DataTypes) => {
  const Vote = sequelize.define('Vote', {
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
    voteType: {
      type: DataTypes.ENUM('safe', 'unsafe', 'suspicious'),
      allowNull: false,
      field: 'vote_type'
    }
  }, {
    tableName: 'votes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Votes don't need updated_at
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'link_id']
      },
      {
        fields: ['link_id']
      },
      {
        fields: ['vote_type']
      }
    ]
  });

  // Class methods
  Vote.createOrUpdate = async function(userId, linkId, voteType) {
    const [vote, created] = await this.findOrCreate({
      where: { userId, linkId },
      defaults: { voteType }
    });

    if (!created && vote.voteType !== voteType) {
      await vote.update({ voteType });
    }

    return vote;
  };

  Vote.getVoteSummaryForLink = async function(linkId) {
    const votes = await this.findAll({
      where: { linkId },
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

  Vote.getUserVoteForLink = async function(userId, linkId) {
    const vote = await this.findOne({
      where: { userId, linkId }
    });
    return vote ? vote.voteType : null;
  };

  Vote.removeVote = async function(userId, linkId) {
    return await this.destroy({
      where: { userId, linkId }
    });
  };

  return Vote;
};
