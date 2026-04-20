'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'pack_quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Units inside one sold package (1, 50, 100, ...)'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'pack_quantity');
  }
};
