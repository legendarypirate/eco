module.exports = (sequelize, Sequelize) => {
  const Contact = sequelize.define('contact', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(255), allowNull: false },
    email: { type: Sequelize.STRING(255), allowNull: true },
    phone: { type: Sequelize.STRING(50), allowNull: true },
    position: { type: Sequelize.STRING(255), allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'contacts',
    underscored: true
  });
  return Contact;
};
