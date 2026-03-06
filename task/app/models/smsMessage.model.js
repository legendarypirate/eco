module.exports = (sequelize, Sequelize) => {
  const SmsMessage = sequelize.define('smsMessage', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    message: { type: Sequelize.TEXT, allowNull: false },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
    sent_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'sms_messages',
    underscored: true
  });
  return SmsMessage;
};
