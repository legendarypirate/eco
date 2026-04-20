module.exports = (sequelize, Sequelize) => {
  const PopupBanner = sequelize.define("popup_banner", {
    text: {
      type: Sequelize.STRING,
      allowNull: true
    },
    image: {
      type: Sequelize.STRING,
      allowNull: false
    },
    link: {
      type: Sequelize.STRING,
      allowNull: true
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'popup_banners',
    underscored: true
  });

  return PopupBanner;
};
