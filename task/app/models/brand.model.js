module.exports = (sequelize, Sequelize) => {
    const Brand = sequelize.define("brands", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        slug: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        logo: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: "/assets/brand/default-brand.png"
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
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
        tableName: 'brands',
        timestamps: true,
        underscored: true
    });

    return Brand;
};
