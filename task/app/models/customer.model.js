module.exports = (sequelize, Sequelize) => {
  const Customer = sequelize.define('customer', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: { type: Sequelize.STRING(255), allowNull: false },
    email: { type: Sequelize.STRING(255), allowNull: true },
    phone: { type: Sequelize.STRING(50), allowNull: true },
    address: { type: Sequelize.TEXT, allowNull: true },
    company_name: { type: Sequelize.STRING(255), allowNull: true },
    company_contact_person: { type: Sequelize.STRING(255), allowNull: true },
    company_email: { type: Sequelize.STRING(255), allowNull: true },
    company_phone: { type: Sequelize.STRING(50), allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'customers',
    underscored: true
  });
  return Customer;
};
