// models/vendor_payout.model.js
module.exports = (sequelize, Sequelize) => {
  const VendorPayout = sequelize.define("vendor_payouts", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    vendor_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id'
      },
      field: 'vendor_id'
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      comment: "Payout amount"
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'MNT'
    },
    status: {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payout_method: {
      type: Sequelize.ENUM('bank_transfer', 'qpay', 'wallet'),
      allowNull: false,
      defaultValue: 'bank_transfer'
    },
    bank_account_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'bank_accounts',
        key: 'id'
      },
      field: 'bank_account_id'
    },
    account_number: {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "Bank account number or wallet ID"
    },
    account_holder_name: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    bank_name: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    transaction_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'financial_transactions',
        key: 'id'
      },
      field: 'transaction_id'
    },
    reference_number: {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "External payout reference (bank transfer ID, etc.)"
    },
    processed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    period_start: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Start date of the payout period"
    },
    period_end: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "End date of the payout period"
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'vendor_payouts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['vendor_id']
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

  return VendorPayout;
};

