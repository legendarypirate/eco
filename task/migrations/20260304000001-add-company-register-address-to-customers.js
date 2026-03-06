'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('customers');
    if (tableInfo && tableInfo.company_register) {
      return; // columns already exist
    }
    await queryInterface.addColumn('customers', 'company_register', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('customers', 'company_address', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'company_register');
    await queryInterface.removeColumn('customers', 'company_address');
  }
};
