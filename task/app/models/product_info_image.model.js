// models/product_info_image.model.js
module.exports = (sequelize, Sequelize) => {
    const ProductInfoImage = sequelize.define("product_info_image", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        productId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'product_id',
            references: {
                model: 'products',
                key: 'id'
            }
        },
        imageUrl: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'image_url'
        },
        order: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'order'
        },
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'updated_at'
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'product_info_images',
        underscored: true
    });

    return ProductInfoImage;
};

