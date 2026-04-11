// models/attribute.model.js
module.exports = (sequelize, Sequelize) => {
    const Attribute = sequelize.define("attribute", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        nameMn: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'name_mn'
        },
        values: {
            type: Sequelize.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('values');
                return rawValue ? rawValue.split(',').map(v => v.trim()) : [];
            },
            set(val) {
                this.setDataValue('values', Array.isArray(val) ? val.join(',') : val);
            }
        }
    }, {
        tableName: 'attributes',
        timestamps: true,
        underscored: true
    });

    return Attribute;
};
