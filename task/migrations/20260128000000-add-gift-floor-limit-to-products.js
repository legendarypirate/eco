'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add gift_floor_limit column to products table
    await queryInterface.addColumn('products', 'gift_floor_limit', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Minimum cart total amount (in MNT) required to qualify for this gift product'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove gift_floor_limit column
    await queryInterface.removeColumn('products', 'gift_floor_limit');
  }
};

