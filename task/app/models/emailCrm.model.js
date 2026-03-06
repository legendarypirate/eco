module.exports = (sequelize, Sequelize) => {
  const EmailCrm = sequelize.define('emailCrm', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    subject: { type: Sequelize.STRING(500), allowNull: true },
    body: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'draft' },
    sent_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'emails_crm',
    underscored: true
  });
  return EmailCrm;
};
