const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
function createSequelizeInstance() {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.warn('⚠️ DATABASE_URL not found, Sequelize will be disabled');
      return null;
    }

    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { 
          require: true,
          rejectUnauthorized: false 
        } : false
      }
    });

    console.log('✅ Sequelize instance created');
    return sequelize;
    
  } catch (error) {
    console.error('❌ Failed to create Sequelize instance:', error.message);
    return null;
  }
}

// Export singleton instance
const sequelize = createSequelizeInstance();

module.exports = sequelize;
