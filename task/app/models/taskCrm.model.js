module.exports = (sequelize, Sequelize) => {
  const TaskCrm = sequelize.define('taskCrm', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: true },
    deal_id: { type: Sequelize.INTEGER, allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    assigned_to: { type: Sequelize.UUID, allowNull: true },
    due_date: { type: Sequelize.DATEONLY, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'tasks_crm',
    underscored: true
  });
  return TaskCrm;
};
