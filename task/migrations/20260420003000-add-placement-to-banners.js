'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('banners', 'placement', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'hero',
      comment: 'Banner placement: hero or popup'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('banners', 'placement');
  }
};
