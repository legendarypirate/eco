module.exports = (sequelize, Sequelize) => {
  const BankAccount = sequelize.define("bank_accounts", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bank_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: "Bank name (e.g., Хаан банк, Голомт банк)"
    },
    account_number: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: "Bank account number"
    },
    account_name: {
      type: Sequelize.STRING(200),
      allowNull: false,
      comment: "Account holder name"
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: "Whether this bank account is active and should be displayed"
    },
    display_order: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: "Order in which to display bank accounts"
    },
    color_scheme: {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'blue',
      comment: "Color scheme for the card (blue, green, etc.)"
    }
  }, {
    tableName: 'bank_accounts',
    timestamps: true,
    underscored: true
  });

  return BankAccount;
};

