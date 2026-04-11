// models/vendor.model.js
module.exports = (sequelize, Sequelize) => {
  const Vendor = sequelize.define("vendors", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    store_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    },
    store_slug: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    logo: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    banner: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    contact_email: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    contact_phone: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    address: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    city: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    country: {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: 'Mongolia'
    },
    commission_rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 3.00,
      comment: "Platform commission % on product sales (e.g., 3.00 = 3% of line subtotal)"
    },
    status: {
      type: Sequelize.ENUM('pending', 'active', 'suspended', 'inactive'),
      allowNull: false,
      defaultValue: 'pending'
    },
    verification_status: {
      type: Sequelize.ENUM('unverified', 'pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'unverified'
    },
    verification_documents: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Array of document URLs for verification"
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
    total_sales: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Total sales amount (before commission)"
    },
    total_earnings: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Total earnings after commission deduction"
    },
    total_orders: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rating: {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.00,
      comment: "Average vendor rating (0-5)"
    },
    review_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    settings: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
      comment: "Vendor-specific settings (auto_fulfill, notification_preferences, etc.)"
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'vendors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['store_slug']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verification_status']
      }
    ]
  });

  return Vendor;
};

