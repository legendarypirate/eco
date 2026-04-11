const { Server } = require('socket.io');
const db = require('../models');
const Order = db.orders;
const OrderVendor = db.order_vendors;
const Vendor = db.vendors;
const FinancialTransaction = db.financial_transactions;
const { Op } = require('sequelize');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3002", "https://label.mn", "https://www.label.mn", "https://admin.label.mn"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join vendor room
    socket.on('join-vendor', (vendorId) => {
      socket.join(`vendor-${vendorId}`);
      console.log(`Socket ${socket.id} joined vendor-${vendorId}`);
    });

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined admin room`);
    });

    // Join user room
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user-${userId}`);
    });

    // Subscribe to real-time sales updates
    socket.on('subscribe-sales', (data) => {
      const { vendorId } = data || {};
      if (vendorId) {
        socket.join(`sales-vendor-${vendorId}`);
      } else {
        socket.join('sales-admin');
      }
    });

    // Subscribe to financial updates
    socket.on('subscribe-financial', (vendorId) => {
      if (vendorId) {
        socket.join(`financial-vendor-${vendorId}`);
      } else {
        socket.join('financial-admin');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

// Emit new order notification
function emitNewOrder(order) {
  if (!io) return;

  // Notify admin
  io.to('admin').emit('new-order', {
    type: 'new-order',
    data: order,
    timestamp: new Date().toISOString()
  });

  // Notify specific vendors if order has vendor items
  if (order.vendorOrders && order.vendorOrders.length > 0) {
    order.vendorOrders.forEach(orderVendor => {
      if (orderVendor.vendor_id) {
        io.to(`vendor-${orderVendor.vendor_id}`).emit('new-order', {
          type: 'new-order',
          data: {
            order: order,
            vendorOrder: orderVendor
          },
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}

// Emit order status update
function emitOrderStatusUpdate(orderId, status, vendorId = null) {
  if (!io) return;

  const update = {
    type: 'order-status-update',
    orderId: orderId,
    status: status,
    timestamp: new Date().toISOString()
  };

  // Notify admin
  io.to('admin').emit('order-update', update);

  // Notify vendor if specified
  if (vendorId) {
    io.to(`vendor-${vendorId}`).emit('order-update', update);
  }

  // Notify user (if we have user_id from order)
  // This would require fetching the order first
}

// Emit payment status update
function emitPaymentStatusUpdate(orderId, paymentStatus, vendorId = null) {
  if (!io) return;

  const update = {
    type: 'payment-status-update',
    orderId: orderId,
    paymentStatus: paymentStatus,
    timestamp: new Date().toISOString()
  };

  io.to('admin').emit('payment-update', update);
  if (vendorId) {
    io.to(`vendor-${vendorId}`).emit('payment-update', update);
  }
}

// Emit financial transaction
function emitFinancialTransaction(transaction) {
  if (!io) return;

  const update = {
    type: 'financial-transaction',
    data: transaction,
    timestamp: new Date().toISOString()
  };

  // Notify admin
  io.to('financial-admin').emit('financial-update', update);

  // Notify vendor if transaction is vendor-specific
  if (transaction.vendor_id) {
    io.to(`financial-vendor-${transaction.vendor_id}`).emit('financial-update', update);
  }
}

// Emit sales update
function emitSalesUpdate(vendorId = null) {
  if (!io) return;

  // This would typically fetch latest sales data and emit
  // For now, just emit a notification that data should be refreshed
  const update = {
    type: 'sales-update',
    timestamp: new Date().toISOString()
  };

  if (vendorId) {
    io.to(`sales-vendor-${vendorId}`).emit('sales-update', update);
  } else {
    io.to('sales-admin').emit('sales-update', update);
  }
}

// Emit payout update
function emitPayoutUpdate(payout) {
  if (!io) return;

  const update = {
    type: 'payout-update',
    data: payout,
    timestamp: new Date().toISOString()
  };

  io.to('admin').emit('payout-update', update);
  
  if (payout.vendor_id) {
    io.to(`vendor-${payout.vendor_id}`).emit('payout-update', update);
    io.to(`financial-vendor-${payout.vendor_id}`).emit('payout-update', update);
  }
}

// Start real-time sales polling (optional - can be called periodically)
async function startSalesPolling(intervalMs = 30000) {
  if (!io) return;

  setInterval(async () => {
    try {
      // Get recent orders (last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentOrders = await OrderVendor.findAll({
        where: {
          created_at: { [Op.gte]: fiveMinutesAgo }
        },
        include: [
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'order_number', 'customer_name', 'payment_status']
          },
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'store_name']
          }
        ],
        limit: 50,
        order: [['created_at', 'DESC']]
      });

      // Emit to admin
      io.to('sales-admin').emit('realtime-sales', {
        type: 'realtime-sales',
        data: recentOrders,
        timestamp: new Date().toISOString()
      });

      // Emit to individual vendors
      const vendorGroups = {};
      recentOrders.forEach(orderVendor => {
        if (orderVendor.vendor_id) {
          if (!vendorGroups[orderVendor.vendor_id]) {
            vendorGroups[orderVendor.vendor_id] = [];
          }
          vendorGroups[orderVendor.vendor_id].push(orderVendor);
        }
      });

      Object.keys(vendorGroups).forEach(vendorId => {
        io.to(`sales-vendor-${vendorId}`).emit('realtime-sales', {
          type: 'realtime-sales',
          data: vendorGroups[vendorId],
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Error in sales polling:', error);
    }
  }, intervalMs);
}

module.exports = {
  initializeSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitPaymentStatusUpdate,
  emitFinancialTransaction,
  emitSalesUpdate,
  emitPayoutUpdate,
  startSalesPolling
};

