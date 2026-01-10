// models/user.model.js - COMPLETE RESET
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {  // ✅ Capital U - Sequelize conventions
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    
    email: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      validate: { isEmail: true }
    },
    
    full_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    avatar: Sequelize.STRING,
    
    google_id: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    
    provider: {
      type: Sequelize.STRING,
      defaultValue: 'local'
    },
    
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    
    role: {
      type: Sequelize.ENUM("director", "general_manager", "supervisor", "worker", "customer"),
      defaultValue: "customer",
    },
    
    phone: {
      type: Sequelize.STRING,
      allowNull: true
      // Removed unique constraint - phone numbers don't need to be unique
    },
    
    password: {
      type: Sequelize.STRING,
      allowNull: true
    },
    
    refresh_token: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    
    facebook_id: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    
    supervisor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      // Foreign key reference removed - not needed for ecommerce project
    },
    
    // username field removed - column doesn't exist in database
    // If needed, add the column to the database first
    
    // createdAt, updatedAt-ыг Sequelize автоматаар нэмнэ
    
  }, {
    tableName: 'users',
    timestamps: true, // ✅ createdAt, updatedAt
    underscored: false, // ❌ FALSE болгох! camelCase ашиглах
    freezeTableName: true,
    
    // ✅ createdAt, updatedAt-ыг тодорхой зааж өгөх
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Default scope to exclude non-existent columns
    defaultScope: {
      attributes: {
        exclude: ['username', 'end_date'] // Exclude columns that don't exist in database
      }
    }
  });

  return User;
};