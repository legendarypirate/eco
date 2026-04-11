// models/financial_transaction.model.js
module.exports = (sequelize, Sequelize) => {
  const FinancialTransaction = sequelize.define("financial_transactions", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    vendor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id'
      },
      field: 'vendor_id'
    },
    order_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      },
      field: 'order_id'
    },
    transaction_type: {
      type: Sequelize.ENUM('sale', 'commission', 'payout', 'refund', 'adjustment', 'fee'),
      allowNull: false
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'MNT'
    },
    status: {
      type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    reference_number: {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    },
    payment_method: {
      type: Sequelize.ENUM('qpay', 'bank_transfer', 'cash', 'card', 'wallet'),
      allowNull: true
    },
    processed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'financial_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['vendor_id']
      },
      {
        fields: ['order_id']
      },
      {
        fields: ['transaction_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['reference_number'],
        where: {
          reference_number: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    ]
  });

  return FinancialTransaction;
};

