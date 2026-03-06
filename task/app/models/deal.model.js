module.exports = (sequelize, Sequelize) => {
  const Deal = sequelize.define('deal', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    deal_name: { type: Sequelize.STRING(255), allowNull: false },
    amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'open' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'deals',
    underscored: true
  });
  return Deal;
};
