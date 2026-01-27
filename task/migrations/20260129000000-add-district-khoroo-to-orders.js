'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'district', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Дүүрэг (District)'
    });

    await queryInterface.addColumn('orders', 'khoroo', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Хороо (Khoroo)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'district');
    await queryInterface.removeColumn('orders', 'khoroo');
  }
};

