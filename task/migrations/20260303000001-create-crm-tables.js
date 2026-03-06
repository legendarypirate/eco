'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Customers (company info included)
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(50), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      company_contact_person: { type: Sequelize.STRING(255), allowNull: true },
      company_email: { type: Sequelize.STRING(255), allowNull: true },
      company_phone: { type: Sequelize.STRING(50), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('customers', ['name']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['company_name']);

    // 2. Contacts
    await queryInterface.createTable('contacts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(50), allowNull: true },
      position: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('contacts', ['customer_id']);

    // 3. Deals
    await queryInterface.createTable('deals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      deal_name: { type: Sequelize.STRING(255), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'open' }, // open, won, lost
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('deals', ['customer_id']);
    await queryInterface.addIndex('deals', ['status']);

    // 4. Tasks (assigned_to references users.id UUID)
    await queryInterface.createTable('tasks_crm', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      deal_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'deals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      assigned_to: { type: Sequelize.UUID, allowNull: true }, // references users(id)
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' }, // pending, completed
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('tasks_crm', ['customer_id']);
    await queryInterface.addIndex('tasks_crm', ['deal_id']);
    await queryInterface.addIndex('tasks_crm', ['status']);
    await queryInterface.addIndex('tasks_crm', ['due_date']);

    // 5. Notes (user_id references users.id)
    await queryInterface.createTable('notes_crm', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      deal_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'deals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: true }, // references users(id)
      note_text: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('notes_crm', ['customer_id']);
    await queryInterface.addIndex('notes_crm', ['deal_id']);

    // 6. SMS messages
    await queryInterface.createTable('sms_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      message: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' }, // sent, pending, failed
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('sms_messages', ['customer_id']);
    await queryInterface.addIndex('sms_messages', ['status']);

    // 7. Emails
    await queryInterface.createTable('emails_crm', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      subject: { type: Sequelize.STRING(500), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'draft' }, // sent, failed, draft
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('emails_crm', ['customer_id']);
    await queryInterface.addIndex('emails_crm', ['status']);

    // 8. Invoices
    await queryInterface.createTable('invoices_crm', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      deal_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'deals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' }, // paid, unpaid, pending
      issued_at: { type: Sequelize.DATE, allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('invoices_crm', ['customer_id']);
    await queryInterface.addIndex('invoices_crm', ['deal_id']);
    await queryInterface.addIndex('invoices_crm', ['status']);

    // 9. CRM Products (optional inventory for deals)
    await queryInterface.createTable('crm_products', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('crm_products');
    await queryInterface.dropTable('invoices_crm');
    await queryInterface.dropTable('emails_crm');
    await queryInterface.dropTable('sms_messages');
    await queryInterface.dropTable('notes_crm');
    await queryInterface.dropTable('tasks_crm');
    await queryInterface.dropTable('deals');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('customers');
  }
};
