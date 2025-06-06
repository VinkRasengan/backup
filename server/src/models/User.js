module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true, // NULL for Firebase users
      field: 'password_hash'
    },
    firebaseUid: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'firebase_uid'
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name'
    },
    displayName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'display_name'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    authProvider: {
      type: DataTypes.STRING(20),
      defaultValue: 'backend',
      field: 'auth_provider',
      validate: {
        isIn: [['firebase', 'backend']]
      }
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    },
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        linksChecked: 0,
        chatMessages: 0
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['firebase_uid']
      },
      {
        fields: ['auth_provider']
      }
    ]
  });

  // Instance methods
  User.prototype.getFullName = function() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.displayName || this.email.split('@')[0];
  };

  User.prototype.updateStats = async function(statType, increment = 1) {
    const currentStats = this.stats || {};
    currentStats[statType] = (currentStats[statType] || 0) + increment;
    
    await this.update({ stats: currentStats });
    return currentStats;
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.passwordHash;
    delete values.firebaseUid;
    return values;
  };

  // Class methods
  User.findByEmail = async function(email) {
    return await this.findOne({ where: { email } });
  };

  User.findByFirebaseUid = async function(firebaseUid) {
    return await this.findOne({ where: { firebaseUid } });
  };

  User.createFromFirebase = async function(firebaseUser) {
    return await this.create({
      email: firebaseUser.email,
      firebaseUid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      avatarUrl: firebaseUser.photoURL,
      isVerified: firebaseUser.emailVerified,
      authProvider: 'firebase'
    });
  };

  return User;
};
