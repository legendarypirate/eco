module.exports = (sequelize, Sequelize) => {
    const CouponUsage = sequelize.define("coupon_usage", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        coupon_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'coupons',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: "Reference to coupons table"
        },
        user_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: "User ID (can be UUID or guest ID)"
        },
        order_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: "Reference to orders table (optional)"
        },
        discount_amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: "The discount amount applied"
        },
        used_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            comment: "When the coupon was used"
        }
    }, {
        timestamps: false,
        tableName: 'coupon_usage',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['coupon_id', 'user_id'],
                name: 'unique_coupon_user'
            },
            {
                fields: ['coupon_id']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['order_id']
            }
        ]
    });

    return CouponUsage;
};

