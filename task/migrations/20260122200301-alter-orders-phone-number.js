'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change phone_number from VARCHAR(20) to VARCHAR(50)
    await queryInterface.changeColumn('orders', 'phone_number', {
      type: Sequelize.STRING(50),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to VARCHAR(20)
    await queryInterface.changeColumn('orders', 'phone_number', {
      type: Sequelize.STRING(20),
      allowNull: false
    });
  }
};

