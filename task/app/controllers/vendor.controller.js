const db = require("../models");
const { DEFAULT_VENDOR_COMMISSION_PERCENT } = require("../config/marketplace");
const Vendor = db.vendors;
const User = db.users;
const Product = db.products;
const Order = db.orders;
const OrderVendor = db.order_vendors;
const FinancialTransaction = db.financial_transactions;
const Op = db.Sequelize.Op;

// Create and Save a new Vendor
exports.create = async (req, res) => {
  try {
    if (!req.body.user_id || !req.body.store_name) {
      return res.status(400).send({
        success: false,
        message: "User ID and store name are required!"
      });
    }

    // Check if user exists
    const user = await User.findByPk(req.body.user_id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found!"
      });
    }

    // Check if user already has a vendor account
    const existingVendor = await Vendor.findOne({
      where: { user_id: req.body.user_id }
    });
    if (existingVendor) {
      return res.status(400).send({
        success: false,
        message: "User already has a vendor account!"
      });
    }

    // Generate slug from store name
    const storeSlug = req.body.store_slug || 
      req.body.store_name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Check if slug is unique
    const slugExists = await Vendor.findOne({
      where: { store_slug: storeSlug }
    });
    if (slugExists) {
      return res.status(400).send({
        success: false,
        message: "Store slug already exists!"
      });
    }

    const vendorData = {
      user_id: req.body.user_id,
      store_name: req.body.store_name,
      store_slug: storeSlug,
      description: req.body.description || null,
      logo: req.body.logo || null,
      banner: req.body.banner || null,
      contact_email: req.body.contact_email || user.email,
      contact_phone: req.body.contact_phone || user.phone,
      address: req.body.address || null,
      city: req.body.city || null,
      country: req.body.country || 'Mongolia',
      commission_rate:
        req.body.commission_rate != null
          ? parseFloat(req.body.commission_rate)
          : DEFAULT_VENDOR_COMMISSION_PERCENT,
      status: req.body.status || 'pending',
      verification_status: req.body.verification_status || 'unverified',
      verification_documents: req.body.verification_documents || [],
      bank_account_id: req.body.bank_account_id || null,
      settings: req.body.settings || {},
      metadata: req.body.metadata || {}
    };

    const vendor = await Vendor.create(vendorData);

    res.send({
      success: true,
      message: "Vendor created successfully!",
      data: vendor
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error creating vendor."
    });
  }
};

// Retrieve all Vendors with filters
exports.findAll = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      verification_status, 
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (search) {
      where[Op.or] = [
        { store_name: { [Op.iLike]: `%${search}%` } },
        { store_slug: { [Op.iLike]: `%${search}%` } },
        { contact_email: { [Op.iLike]: `%${search}%` } },
        { contact_phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (verification_status) {
      where.verification_status = verification_status;
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'phone']
        },
        {
          model: db.bank_accounts,
          as: 'bankAccount',
          attributes: ['id', 'bank_name', 'account_number']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    res.send({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error retrieving vendors:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error retrieving vendors."
    });
  }
};

// Find a single Vendor by id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'phone', 'avatar']
        },
        {
          model: db.bank_accounts,
          as: 'bankAccount',
          attributes: ['id', 'bank_name', 'account_number', 'account_holder_name']
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'thumbnail', 'inStock', 'sales'],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (vendor) {
      res.send({
        success: true,
        data: vendor
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Vendor with id=${id} not found.`
      });
    }
  } catch (error) {
    console.error("Error retrieving vendor:", error);
    res.status(500).send({
      success: false,
      message: "Error retrieving vendor: " + req.params.id
    });
  }
};

// Find vendor by user_id
exports.findByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const vendor = await Vendor.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'phone', 'avatar']
        },
        {
          model: db.bank_accounts,
          as: 'bankAccount'
        }
      ]
    });

    if (vendor) {
      res.send({
        success: true,
        data: vendor
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Vendor for user id=${userId} not found.`
      });
    }
  } catch (error) {
    console.error("Error retrieving vendor by user ID:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error retrieving vendor."
    });
  }
};

// Update a Vendor by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      return res.status(404).send({
        success: false,
        message: `Vendor with id=${id} not found.`
      });
    }

    // If updating store_slug, check uniqueness
    if (req.body.store_slug && req.body.store_slug !== vendor.store_slug) {
      const slugExists = await Vendor.findOne({
        where: { 
          store_slug: req.body.store_slug,
          id: { [Op.ne]: id }
        }
      });
      if (slugExists) {
        return res.status(400).send({
          success: false,
          message: "Store slug already exists!"
        });
      }
    }

    const updates = {};
    const allowedFields = [
      'store_name', 'store_slug', 'description', 'logo', 'banner',
      'contact_email', 'contact_phone', 'address', 'city', 'country',
      'commission_rate', 'status', 'verification_status', 
      'verification_documents', 'bank_account_id', 'settings', 'metadata'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await Vendor.update(updates, {
      where: { id: id }
    });

    const updatedVendor = await Vendor.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'phone']
        }
      ]
    });

    res.send({
      success: true,
      message: "Vendor updated successfully!",
      data: updatedVendor
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error updating vendor."
    });
  }
};

// Delete a Vendor by id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if vendor has active products or orders
    const productCount = await Product.count({
      where: { vendor_id: id }
    });

    const orderCount = await OrderVendor.count({
      where: { vendor_id: id }
    });

    if (productCount > 0 || orderCount > 0) {
      return res.status(400).send({
        success: false,
        message: `Cannot delete vendor. Has ${productCount} products and ${orderCount} orders.`
      });
    }

    const deleted = await Vendor.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        success: true,
        message: "Vendor deleted successfully!"
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Vendor with id=${id} not found.`
      });
    }
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error deleting vendor."
    });
  }
};

// Get vendor statistics
exports.getStats = async (req, res) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      return res.status(404).send({
        success: false,
        message: `Vendor with id=${id} not found.`
      });
    }

    // Get product count
    const productCount = await Product.count({
      where: { vendor_id: id }
    });

    // Get order statistics
    const orderStats = await OrderVendor.findAll({
      where: { vendor_id: id },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'total_earnings'],
        [db.sequelize.fn('SUM', db.sequelize.col('commission_amount')), 'total_commission']
      ],
      raw: true
    });

    // Get recent transactions
    const recentTransactions = await FinancialTransaction.findAll({
      where: { vendor_id: id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get pending payout amount
    const pendingPayout = await db.vendor_payouts.sum('amount', {
      where: {
        vendor_id: id,
        status: { [Op.in]: ['pending', 'processing'] }
      }
    }) || 0;

    res.send({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          store_name: vendor.store_name,
          status: vendor.status,
          commission_rate: vendor.commission_rate
        },
        products: {
          total: productCount
        },
        orders: {
          total: parseInt(orderStats[0]?.total_orders || 0),
          total_sales: parseFloat(orderStats[0]?.total_sales || 0),
          total_earnings: parseFloat(orderStats[0]?.total_earnings || 0),
          total_commission: parseFloat(orderStats[0]?.total_commission || 0)
        },
        financials: {
          pending_payout: parseFloat(pendingPayout),
          recent_transactions: recentTransactions
        }
      }
    });
  } catch (error) {
    console.error("Error getting vendor stats:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting vendor statistics."
    });
  }
};

