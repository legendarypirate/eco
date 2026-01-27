'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partners', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Partner company name'
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Logo image URL'
      },
      website_url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Optional website URL'
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether partner is active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add index for ordering
    await queryInterface.addIndex('partners', ['order']);
    await queryInterface.addIndex('partners', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('partners');
  }
};

