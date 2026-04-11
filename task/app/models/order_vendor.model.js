// models/order_vendor.model.js - Tracks vendor-specific order items and commissions
module.exports = (sequelize, Sequelize) => {
  const OrderVendor = sequelize.define("order_vendors", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      field: 'order_id'
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
    subtotal: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Subtotal for this vendor's items in the order"
    },
    shipping_cost: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Shipping cost allocated to this vendor"
    },
    tax: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Tax amount for this vendor's items"
    },
    total: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Total amount for this vendor's items"
    },
    commission_rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      comment: "Commission rate applied at time of order"
    },
    commission_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Platform commission amount"
    },
    vendor_earnings: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Vendor earnings after commission (total - commission_amount)"
    },
    fulfillment_status: {
      type: Sequelize.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    tracking_number: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    shipped_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    delivered_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'order_vendors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['vendor_id']
      },
      {
        fields: ['fulfillment_status']
      },
      {
        unique: true,
        fields: ['order_id', 'vendor_id'],
        name: 'unique_order_vendor'
      }
    ]
  });

  return OrderVendor;
};

