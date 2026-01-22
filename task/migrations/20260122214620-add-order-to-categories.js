'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'order', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Order for first-level parent categories only'
    });

    // Set initial order values for existing parent categories
    const [results] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE parent_id IS NULL ORDER BY name ASC`
    );
    
    if (results && results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        await queryInterface.sequelize.query(
          `UPDATE categories SET \`order\` = ${i + 1} WHERE id = '${results[i].id}'`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'order');
  }
};

