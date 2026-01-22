const db = require("../models");
const BankAccount = db.bank_accounts;

// Get all active bank accounts (public endpoint)
exports.getAllActive = async (req, res) => {
  try {
    const bankAccounts = await BankAccount.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: bankAccounts
    });
  } catch (error) {
    console.error('Get all active bank accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bank accounts',
      message: error.message
    });
  }
};

// Get all bank accounts (admin endpoint)
exports.getAll = async (req, res) => {
  try {
    const bankAccounts = await BankAccount.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: bankAccounts
    });
  } catch (error) {
    console.error('Get all bank accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bank accounts',
      message: error.message
    });
  }
};

// Get bank account by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    res.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error('Get bank account by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bank account',
      message: error.message
    });
  }
};

// Create new bank account
exports.create = async (req, res) => {
  try {
    const { bank_name, account_number, account_name, is_active, display_order, color_scheme } = req.body;

    if (!bank_name || !account_number || !account_name) {
      return res.status(400).json({
        success: false,
        error: 'Bank name, account number, and account name are required'
      });
    }

    const bankAccount = await BankAccount.create({
      bank_name,
      account_number,
      account_name,
      is_active: is_active !== undefined ? is_active : true,
      display_order: display_order || 0,
      color_scheme: color_scheme || 'blue'
    });

    res.status(201).json({
      success: true,
      data: bankAccount,
      message: 'Bank account created successfully'
    });
  } catch (error) {
    console.error('Create bank account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bank account',
      message: error.message
    });
  }
};

// Update bank account
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, account_number, account_name, is_active, display_order, color_scheme } = req.body;

    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    // Update fields
    if (bank_name !== undefined) bankAccount.bank_name = bank_name;
    if (account_number !== undefined) bankAccount.account_number = account_number;
    if (account_name !== undefined) bankAccount.account_name = account_name;
    if (is_active !== undefined) bankAccount.is_active = is_active;
    if (display_order !== undefined) bankAccount.display_order = display_order;
    if (color_scheme !== undefined) bankAccount.color_scheme = color_scheme;

    await bankAccount.save();

    res.json({
      success: true,
      data: bankAccount,
      message: 'Bank account updated successfully'
    });
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bank account',
      message: error.message
    });
  }
};

// Delete bank account
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    await bankAccount.destroy();

    res.json({
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bank account',
      message: error.message
    });
  }
};

