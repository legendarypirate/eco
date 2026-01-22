// models/address.model.js
module.exports = (sequelize, Sequelize) => {
  const Address = sequelize.define("Address", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    city: {
      type: Sequelize.STRING,
      allowNull: false
    },
    
    district: {
      type: Sequelize.STRING,
      allowNull: true
    },
    
    khoroo: {
      type: Sequelize.STRING,
      allowNull: true
    },
    
    address: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    
    is_default: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
    
  }, {
    tableName: 'addresses',
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Address;
};

