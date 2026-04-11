const db = require("../models");
const FinancialTransaction = db.financial_transactions;
const Vendor = db.vendors;
const Order = db.orders;
const OrderVendor = db.order_vendors;
const VendorPayout = db.vendor_payouts;
const Op = db.Sequelize.Op;

// Get financial reports
exports.getReports = async (req, res) => {
  try {
    const {
      vendor_id,
      start_date,
      end_date,
      transaction_type,
      status,
      group_by = 'day'
    } = req.query;

    const where = {};
    const transactionWhere = {};

    if (vendor_id) {
      where.vendor_id = vendor_id;
      transactionWhere.vendor_id = vendor_id;
    }

    if (start_date) {
      transactionWhere.created_at = {
        ...transactionWhere.created_at,
        [Op.gte]: new Date(start_date)
      };
    }

    if (end_date) {
      transactionWhere.created_at = {
        ...transactionWhere.created_at,
        [Op.lte]: new Date(end_date)
      };
    }

    if (transaction_type) {
      transactionWhere.transaction_type = transaction_type;
    }

    if (status) {
      transactionWhere.status = status;
    }

    // Get transaction summary
    const transactionSummary = await FinancialTransaction.findAll({
      where: transactionWhere,
      attributes: [
        'transaction_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_amount']
      ],
      group: ['transaction_type'],
      raw: true
    });

    // Get daily/weekly/monthly breakdown
    let dateFormat;
    if (group_by === 'day') {
      dateFormat = db.sequelize.fn('DATE', db.sequelize.col('created_at'));
    } else if (group_by === 'week') {
      dateFormat = db.sequelize.fn('DATE_TRUNC', 'week', db.sequelize.col('created_at'));
    } else if (group_by === 'month') {
      dateFormat = db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'));
    } else {
      dateFormat = db.sequelize.fn('DATE', db.sequelize.col('created_at'));
    }

    const timeSeries = await FinancialTransaction.findAll({
      where: transactionWhere,
      attributes: [
        [dateFormat, 'period'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_amount']
      ],
      group: [dateFormat],
      order: [[dateFormat, 'ASC']],
      raw: true
    });

    // Get top vendors by sales
    const topVendors = await OrderVendor.findAll({
      where: vendor_id ? { vendor_id } : {},
      attributes: [
        'vendor_id',
        [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'order_count'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.vendor_earnings')), 'total_earnings']
      ],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'logo']
        }
      ],
      group: ['vendor_id', 'vendor.id', 'vendor.store_name', 'vendor.logo'],
      order: [[db.sequelize.literal('total_sales'), 'DESC']],
      limit: 10
    });

    // Calculate totals
    const totals = await FinancialTransaction.findAll({
      where: transactionWhere,
      attributes: [
        [db.sequelize.fn('SUM', 
          db.sequelize.literal(`CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END`)
        ), 'total_sales'],
        [db.sequelize.fn('SUM',
          db.sequelize.literal(`CASE WHEN transaction_type = 'commission' THEN ABS(amount) ELSE 0 END`)
        ), 'total_commission'],
        [db.sequelize.fn('SUM',
          db.sequelize.literal(`CASE WHEN transaction_type = 'payout' THEN ABS(amount) ELSE 0 END`)
        ), 'total_payouts'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'transaction_count']
      ],
      raw: true
    });

    res.send({
      success: true,
      data: {
        summary: transactionSummary,
        time_series: timeSeries,
        top_vendors: topVendors,
        totals: totals[0] || {
          total_sales: 0,
          total_commission: 0,
          total_payouts: 0,
          transaction_count: 0
        }
      }
    });
  } catch (error) {
    console.error("Error getting financial reports:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting financial reports."
    });
  }
};

// Get vendor financial dashboard
exports.getVendorDashboard = async (req, res) => {
  try {
    const vendor_id = req.params.vendorId;

    if (!vendor_id) {
      return res.status(400).send({
        success: false,
        message: "Vendor ID is required!"
      });
    }

    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(404).send({
        success: false,
        message: "Vendor not found!"
      });
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Today's stats
    const todayStats = await OrderVendor.findAll({
      where: {
        vendor_id,
        created_at: { [Op.gte]: today }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'earnings']
      ],
      raw: true
    });

    // This week's stats
    const weekStats = await OrderVendor.findAll({
      where: {
        vendor_id,
        created_at: { [Op.gte]: thisWeek }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'earnings']
      ],
      raw: true
    });

    // This month's stats
    const monthStats = await OrderVendor.findAll({
      where: {
        vendor_id,
        created_at: { [Op.gte]: thisMonth }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'earnings']
      ],
      raw: true
    });

    // This year's stats
    const yearStats = await OrderVendor.findAll({
      where: {
        vendor_id,
        created_at: { [Op.gte]: thisYear }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'earnings']
      ],
      raw: true
    });

    // Recent transactions
    const recentTransactions = await FinancialTransaction.findAll({
      where: { vendor_id },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'customer_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // Pending payout
    const pendingPayout = await VendorPayout.sum('amount', {
      where: {
        vendor_id,
        status: { [Op.in]: ['pending', 'processing'] }
      }
    }) || 0;

    // Monthly sales chart data (last 12 months)
    const monthlySales = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthData = await OrderVendor.findAll({
        where: {
          vendor_id,
          created_at: {
            [Op.between]: [monthStart, monthEnd]
          }
        },
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders']
        ],
        raw: true
      });

      monthlySales.push({
        month: monthStart.toISOString().slice(0, 7),
        sales: parseFloat(monthData[0]?.sales || 0),
        orders: parseInt(monthData[0]?.orders || 0)
      });
    }

    res.send({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          store_name: vendor.store_name,
          commission_rate: vendor.commission_rate
        },
        stats: {
          today: {
            orders: parseInt(todayStats[0]?.orders || 0),
            sales: parseFloat(todayStats[0]?.sales || 0),
            earnings: parseFloat(todayStats[0]?.earnings || 0)
          },
          week: {
            orders: parseInt(weekStats[0]?.orders || 0),
            sales: parseFloat(weekStats[0]?.sales || 0),
            earnings: parseFloat(weekStats[0]?.earnings || 0)
          },
          month: {
            orders: parseInt(monthStats[0]?.orders || 0),
            sales: parseFloat(monthStats[0]?.sales || 0),
            earnings: parseFloat(monthStats[0]?.earnings || 0)
          },
          year: {
            orders: parseInt(yearStats[0]?.orders || 0),
            sales: parseFloat(yearStats[0]?.sales || 0),
            earnings: parseFloat(yearStats[0]?.earnings || 0)
          }
        },
        pending_payout: parseFloat(pendingPayout),
        recent_transactions: recentTransactions,
        monthly_sales: monthlySales
      }
    });
  } catch (error) {
    console.error("Error getting vendor dashboard:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting vendor dashboard."
    });
  }
};

// Create payout request
exports.createPayout = async (req, res) => {
  try {
    const { vendor_id, amount, payout_method, bank_account_id, notes } = req.body;

    if (!vendor_id || !amount || !payout_method) {
      return res.status(400).send({
        success: false,
        message: "Vendor ID, amount, and payout method are required!"
      });
    }

    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(404).send({
        success: false,
        message: "Vendor not found!"
      });
    }

    // Calculate available balance (total earnings - pending payouts)
    const totalEarnings = parseFloat(vendor.total_earnings || 0);
    const pendingPayouts = await VendorPayout.sum('amount', {
      where: {
        vendor_id,
        status: { [Op.in]: ['pending', 'processing'] }
      }
    }) || 0;
    const availableBalance = totalEarnings - pendingPayouts;

    if (amount > availableBalance) {
      return res.status(400).send({
        success: false,
        message: `Insufficient balance. Available: ${availableBalance.toFixed(2)}`
      });
    }

    // Get bank account if provided
    let bankAccount = null;
    if (bank_account_id) {
      bankAccount = await db.bank_accounts.findByPk(bank_account_id);
    } else if (vendor.bank_account_id) {
      bankAccount = await db.bank_accounts.findByPk(vendor.bank_account_id);
    }

    const payoutData = {
      vendor_id,
      amount: parseFloat(amount),
      currency: 'MNT',
      status: 'pending',
      payout_method,
      bank_account_id: bankAccount?.id || null,
      account_number: bankAccount?.account_number || null,
      account_holder_name: bankAccount?.account_holder_name || null,
      bank_name: bankAccount?.bank_name || null,
      notes: notes || null
    };

    const payout = await VendorPayout.create(payoutData);

    // Create financial transaction
    const transaction = await FinancialTransaction.create({
      vendor_id,
      transaction_type: 'payout',
      amount: -parseFloat(amount), // Negative for payout
      currency: 'MNT',
      status: 'pending',
      description: `Payout request #${payout.id}`,
      reference_number: `PAYOUT-${payout.id}`,
      payment_method: payout_method,
      metadata: { payout_id: payout.id }
    });

    // Update payout with transaction ID
    await payout.update({ transaction_id: transaction.id });

    res.send({
      success: true,
      message: "Payout request created successfully!",
      data: {
        payout,
        transaction
      }
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error creating payout."
    });
  }
};

// Process payout (admin only)
exports.processPayout = async (req, res) => {
  try {
    const payout_id = req.params.payoutId;
    const { status, reference_number, notes } = req.body;

    const payout = await VendorPayout.findByPk(payout_id, {
      include: [
        {
          model: Vendor,
          as: 'vendor'
        },
        {
          model: FinancialTransaction,
          as: 'transaction'
        }
      ]
    });

    if (!payout) {
      return res.status(404).send({
        success: false,
        message: "Payout not found!"
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (reference_number) updates.reference_number = reference_number;
    if (notes) updates.notes = notes;

    if (status === 'completed') {
      updates.processed_at = new Date();
      
      // Update transaction status
      if (payout.transaction) {
        await payout.transaction.update({
          status: 'completed',
          processed_at: new Date(),
          reference_number: reference_number || payout.reference_number
        });
      }
    } else if (status === 'failed') {
      // Update transaction status
      if (payout.transaction) {
        await payout.transaction.update({
          status: 'failed'
        });
      }
    }

    await payout.update(updates);

    res.send({
      success: true,
      message: "Payout processed successfully!",
      data: payout
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error processing payout."
    });
  }
};

// Get all payouts
exports.getPayouts = async (req, res) => {
  try {
    const {
      vendor_id,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    if (vendor_id) where.vendor_id = vendor_id;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await VendorPayout.findAndCountAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'logo']
        },
        {
          model: FinancialTransaction,
          as: 'transaction',
          attributes: ['id', 'status', 'processed_at']
        }
      ],
      order: [['created_at', 'DESC']],
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
    console.error("Error getting payouts:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting payouts."
    });
  }
};

