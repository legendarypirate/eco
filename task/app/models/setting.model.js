module.exports = (sequelize, Sequelize) => {
    const Setting = sequelize.define("setting", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        title: {
            type: Sequelize.STRING,
            defaultValue: 'Outdoorworld'
        },
        logo: {
            type: Sequelize.STRING,
            defaultValue: '/assets/logo.png'
        },
        footerText: {
            type: Sequelize.TEXT,
            defaultValue: '© 2025 Outdoorworld Дэлгүүр. Монголын онлайн дэлгүүр.'
        },
        contactEmail: {
            type: Sequelize.STRING,
            defaultValue: 'info@outdoorworld.mn'
        },
        contactPhone: {
            type: Sequelize.STRING,
            defaultValue: '+976 11-344488'
        },
        address: {
            type: Sequelize.STRING,
            defaultValue: 'Улаанбаатар хот'
        }
    });

    return Setting;
};
