'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add processing_started_at column to orders table
    await queryInterface.addColumn('orders', 'processing_started_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when order status changed to processing (боловсруулж байна)'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove processing_started_at column
    await queryInterface.removeColumn('orders', 'processing_started_at');
  }
};

