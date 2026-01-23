module.exports = (sequelize, Sequelize) => {
    const Coupon = sequelize.define("coupons", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: Sequelize.STRING(6),
            allowNull: false,
            unique: true,
            validate: {
                is: {
                    args: /^[A-Z]{6}$/,
                    msg: "Coupon code must be exactly 6 uppercase letters"
                }
            }
        },
        discount_percentage: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            validate: {
                min: 0,
                max: 100
            },
            comment: "Discount percentage (e.g., 10.00 for 10%)"
        },
        expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: "Expiration date and time"
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: "Whether the coupon is active"
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        tableName: 'coupons',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['code']
            },
            {
                fields: ['expires_at']
            },
            {
                fields: ['is_active']
            }
        ]
    });

    return Coupon;
};

