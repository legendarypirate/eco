module.exports = (sequelize, Sequelize) => {
  const NoteCrm = sequelize.define('noteCrm', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: true },
    deal_id: { type: Sequelize.INTEGER, allowNull: true },
    user_id: { type: Sequelize.UUID, allowNull: true },
    note_text: { type: Sequelize.TEXT, allowNull: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'notes_crm',
    underscored: true
  });
  return NoteCrm;
};
