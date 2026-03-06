module.exports = (sequelize, Sequelize) => {
  const InvoiceCrm = sequelize.define('invoiceCrm', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    deal_id: { type: Sequelize.INTEGER, allowNull: true },
    amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
    issued_at: { type: Sequelize.DATE, allowNull: true },
    paid_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'invoices_crm',
    underscored: true
  });
  return InvoiceCrm;
};
