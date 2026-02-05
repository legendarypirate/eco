'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add isDeleted column to orders table
    await queryInterface.addColumn('orders', 'isDeleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Soft delete flag - true if order is deleted'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove isDeleted column
    await queryInterface.removeColumn('orders', 'isDeleted');
  }
};

