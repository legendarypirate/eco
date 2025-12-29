module.exports = (sequelize, Sequelize) => {
    const OrderItem = sequelize.define("order_items", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        product_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: "Product ID from products table"
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        name_mn: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        image: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
        sku: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        tableName: 'order_items',
        underscored: true,
        indexes: [
            {
                fields: ['order_id']
            },
            {
                fields: ['product_id']
            }
        ]
    });

    return OrderItem;
};