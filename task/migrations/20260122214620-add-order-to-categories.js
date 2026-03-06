'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('categories');
    if (tableInfo && tableInfo.order) {
      // Column already exists (e.g. from previous run), skip add
      return;
    }

    await queryInterface.addColumn('categories', 'order', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });

    // Set initial order values for existing parent categories (PostgreSQL: use "order")
    const [results] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE parent_id IS NULL ORDER BY name ASC`
    );

    if (results && results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const id = results[i].id;
        await queryInterface.sequelize.query(
          `UPDATE categories SET "order" = ${i + 1} WHERE id = '${id}'`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('categories');
    if (tableInfo && tableInfo.order) {
      await queryInterface.removeColumn('categories', 'order');
    }
  }
};

