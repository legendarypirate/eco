'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add is_gift column to products table
    await queryInterface.addColumn('products', 'is_gift', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the product is a gift'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove is_gift column
    await queryInterface.removeColumn('products', 'is_gift');
  }
};

