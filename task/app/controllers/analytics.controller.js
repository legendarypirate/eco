const db = require("../models");
const Order = db.orders;
const OrderVendor = db.order_vendors;
const Product = db.products;
const Vendor = db.vendors;
const FinancialTransaction = db.financial_transactions;
const Op = db.Sequelize.Op;

// Get sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const {
      vendor_id,
      start_date,
      end_date,
      group_by = 'day',
      category_id
    } = req.query;

    const where = {};
    const orderWhere = {};
    const productWhere = {};

    if (vendor_id) {
      where.vendor_id = vendor_id;
    }

    if (start_date) {
      orderWhere.created_at = {
        ...orderWhere.created_at,
        [Op.gte]: new Date(start_date)
      };
    }

    if (end_date) {
      orderWhere.created_at = {
        ...orderWhere.created_at,
        [Op.lte]: new Date(end_date)
      };
    }

    if (category_id) {
      productWhere.category_id = category_id;
    }

    // Get date format for grouping
    let dateFormat;
    if (group_by === 'hour') {
      dateFormat = db.sequelize.fn('DATE_TRUNC', 'hour', db.sequelize.col('orders.created_at'));
    } else if (group_by === 'day') {
      dateFormat = db.sequelize.fn('DATE', db.sequelize.col('orders.created_at'));
    } else if (group_by === 'week') {
      dateFormat = db.sequelize.fn('DATE_TRUNC', 'week', db.sequelize.col('orders.created_at'));
    } else if (group_by === 'month') {
      dateFormat = db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('orders.created_at'));
    } else {
      dateFormat = db.sequelize.fn('DATE', db.sequelize.col('orders.created_at'));
    }

    // Sales over time
    const salesOverTime = await OrderVendor.findAll({
      where: where,
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          where: productWhere,
          attributes: [],
          required: false
        }
      ],
      attributes: [
        [dateFormat, 'period'],
        [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'order_count'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.vendor_earnings')), 'vendor_earnings'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.commission_amount')), 'platform_commission']
      ],
      group: [dateFormat],
      order: [[dateFormat, 'ASC']],
      raw: true
    });

    // Top selling products
    const topProducts = await db.order_items.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: [],
          include: [
            {
              model: OrderVendor,
              as: 'vendorOrders',
              where: where,
              attributes: []
            }
          ]
        },
        {
          model: Product,
          as: 'product',
          where: productWhere,
          attributes: ['id', 'name', 'thumbnail', 'category']
        }
      ],
      attributes: [
        'product_id',
        [db.sequelize.fn('SUM', db.sequelize.col('order_items.quantity')), 'total_quantity'],
        [db.sequelize.fn('SUM', db.sequelize.literal('order_items.price * order_items.quantity')), 'total_revenue']
      ],
      group: ['product_id', 'product.id', 'product.name', 'product.thumbnail', 'product.category'],
      order: [[db.sequelize.literal('total_revenue'), 'DESC']],
      limit: 20
    });

    // Sales by category
    const salesByCategory = await db.order_items.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: [],
          include: [
            {
              model: OrderVendor,
              as: 'vendorOrders',
              where: where,
              attributes: []
            }
          ]
        },
        {
          model: Product,
          as: 'product',
          attributes: ['category']
        }
      ],
      attributes: [
        [db.sequelize.col('product.category'), 'category'],
        [db.sequelize.fn('COUNT', db.sequelize.col('order_items.id')), 'order_count'],
        [db.sequelize.fn('SUM', db.sequelize.literal('order_items.price * order_items.quantity')), 'total_revenue']
      ],
      group: [db.sequelize.col('product.category')],
      order: [[db.sequelize.literal('total_revenue'), 'DESC']]
    });

    // Sales by vendor (if not filtering by vendor)
    let salesByVendor = [];
    if (!vendor_id) {
      salesByVendor = await OrderVendor.findAll({
        where: where,
        include: [
          {
            model: Order,
            as: 'order',
            where: orderWhere,
            attributes: []
          },
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'store_name', 'logo']
          }
        ],
        attributes: [
          'vendor_id',
          [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'order_count'],
          [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales'],
          [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.vendor_earnings')), 'vendor_earnings']
        ],
        group: ['vendor_id', 'vendor.id', 'vendor.store_name', 'vendor.logo'],
        order: [[db.sequelize.literal('total_sales'), 'DESC']],
        limit: 10
      });
    }

    // Order status breakdown
    const orderStatusBreakdown = await OrderVendor.findAll({
      where: where,
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        }
      ],
      attributes: [
        [db.sequelize.col('order_vendors.fulfillment_status'), 'status'],
        [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales']
      ],
      group: [db.sequelize.col('order_vendors.fulfillment_status')],
      raw: true
    });

    // Payment method breakdown
    const paymentMethodBreakdown = await OrderVendor.findAll({
      where: where,
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        }
      ],
      attributes: [
        [db.sequelize.col('order.payment_method'), 'payment_method'],
        [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales']
      ],
      group: [db.sequelize.col('order.payment_method')],
      raw: true
    });

    // Summary statistics
    const summary = await OrderVendor.findAll({
      where: where,
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        }
      ],
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('order_vendors.id')), 'total_orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.total')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.vendor_earnings')), 'total_earnings'],
        [db.sequelize.fn('SUM', db.sequelize.col('order_vendors.commission_amount')), 'total_commission'],
        [db.sequelize.fn('AVG', db.sequelize.col('order_vendors.total')), 'average_order_value']
      ],
      raw: true
    });

    res.send({
      success: true,
      data: {
        sales_over_time: salesOverTime,
        top_products: topProducts,
        sales_by_category: salesByCategory,
        sales_by_vendor: salesByVendor,
        order_status_breakdown: orderStatusBreakdown,
        payment_method_breakdown: paymentMethodBreakdown,
        summary: summary[0] || {
          total_orders: 0,
          total_sales: 0,
          total_earnings: 0,
          total_commission: 0,
          average_order_value: 0
        }
      }
    });
  } catch (error) {
    console.error("Error getting sales analytics:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting sales analytics."
    });
  }
};

// Get real-time sales data
exports.getRealtimeSales = async (req, res) => {
  try {
    const { vendor_id } = req.query;
    const where = {};

    if (vendor_id) {
      where.vendor_id = vendor_id;
    }

    // Last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const realtimeData = await OrderVendor.findAll({
      where: {
        ...where,
        created_at: { [Op.gte]: last24Hours }
      },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'customer_name', 'payment_status', 'order_status']
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'logo']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Hourly breakdown for last 24 hours
    const hourlySales = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourData = await OrderVendor.findAll({
        where: {
          ...where,
          created_at: {
            [Op.between]: [hourStart, hourEnd]
          }
        },
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
          [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales']
        ],
        raw: true
      });

      hourlySales.push({
        hour: hourStart.toISOString(),
        orders: parseInt(hourData[0]?.orders || 0),
        sales: parseFloat(hourData[0]?.sales || 0)
      });
    }

    // Today's summary
    const todaySummary = await OrderVendor.findAll({
      where: {
        ...where,
        created_at: { [Op.gte]: today }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('vendor_earnings')), 'earnings']
      ],
      raw: true
    });

    res.send({
      success: true,
      data: {
        recent_orders: realtimeData,
        hourly_sales: hourlySales,
        today_summary: {
          orders: parseInt(todaySummary[0]?.orders || 0),
          sales: parseFloat(todaySummary[0]?.sales || 0),
          earnings: parseFloat(todaySummary[0]?.earnings || 0)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error getting real-time sales:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error getting real-time sales."
    });
  }
};

