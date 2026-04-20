'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'delivery_free_min_quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment:
        'Min quantity of this line for free delivery when хүргэлт; null = no per-product rule',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'delivery_free_min_quantity');
  },
};
