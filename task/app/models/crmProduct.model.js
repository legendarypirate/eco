module.exports = (sequelize, Sequelize) => {
  const CrmProduct = sequelize.define('crmProduct', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    price: { type: Sequelize.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'crm_products',
    underscored: true
  });
  return CrmProduct;
};
