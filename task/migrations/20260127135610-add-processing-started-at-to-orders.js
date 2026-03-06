'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('orders');
    if (tableInfo && tableInfo.processing_started_at) {
      return; // column already exists
    }
    await queryInterface.addColumn('orders', 'processing_started_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('orders');
    if (tableInfo && tableInfo.processing_started_at) {
      await queryInterface.removeColumn('orders', 'processing_started_at');
    }
  }
};

