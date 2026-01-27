// models/partner.model.js
module.exports = (sequelize, Sequelize) => {
    const Partner = sequelize.define("partner", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'name',
            comment: 'Partner company name'
        },
        logo: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'logo',
            comment: 'Logo image URL'
        },
        websiteUrl: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'website_url',
            comment: 'Optional website URL'
        },
        order: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'order',
            comment: 'Display order'
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
            comment: 'Whether partner is active'
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
        tableName: 'partners',
        underscored: true
    });

    return Partner;
};

