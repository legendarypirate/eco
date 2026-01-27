// models/gift_setting.model.js
module.exports = (sequelize, Sequelize) => {
    const GiftSetting = sequelize.define("gift_setting", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        threshold_type: {
            type: Sequelize.ENUM("amount", "count"),
            allowNull: false,
            defaultValue: "amount",
            field: 'threshold_type',
            comment: "Type of threshold: 'amount' for total amount, 'count' for item count"
        },
        threshold_value: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'threshold_value',
            comment: "Threshold value - amount in MNT or number of items"
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'created_at'
        },
        updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'updated_at'
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'gift_settings',
        underscored: true
    });

    return GiftSetting;
};

