const db = require("../models");
const Order = db.orders;
const OrderItem = db.order_items;
const axios = require('axios');

// QPay credentials - should be in environment variables
const QPAY_LOGIN = process.env.QPAY_LOGIN || 'KONO';
const QPAY_PASSWORD = process.env.QPAY_PASSWORD || '8zcSjp5u';
const QPAY_BASE_URL = 'https://merchant.qpay.mn/v2';

// Get QPay access token
async function getQPayToken() {
  try {
    const response = await axios.post(
      `${QPAY_BASE_URL}/auth/token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${QPAY_LOGIN}:${QPAY_PASSWORD}`).toString('base64')}`
        }
      }
    );

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    }
    throw new Error('Failed to get QPay token');
  } catch (error) {
    console.error('QPay token error:', error.response?.data || error.message);
    throw new Error(`QPay authentication failed: ${error.response?.data?.message || error.message}`);
  }
}

// Create QPay invoice for checkout order
exports.createCheckoutInvoice = async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID and amount are required' 
      });
    }

    // Find the order
    const order = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Generate unique invoice number
    const senderInvoiceNo = `ECO_${order.order_number}_${Date.now()}`;
    const invoiceCode = process.env.QPAY_INVOICE_CODE || 'KONO_INVOICE';
    const invoiceReceiverCode = process.env.QPAY_RECEIVER_CODE || 'DEFAULT_COM_ID';

    // Create invoice in QPay
    const invoiceResponse = await axios.post(
      `${QPAY_BASE_URL}/invoice`,
      {
        invoice_code: invoiceCode,
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: invoiceReceiverCode,
        invoice_description: description || `Захиалга - ${order.order_number}`,
        amount: parseFloat(amount)
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!invoiceResponse.data || !invoiceResponse.data.invoice_id) {
      throw new Error('Failed to create QPay invoice');
    }

    const invoiceData = invoiceResponse.data;

    // Update order with QPay invoice information
    await order.update({
      invoice_id: invoiceData.invoice_id,
      qr_image: invoiceData.qr_image || null,
      qr_text: invoiceData.qr_text || null,
      updated_at: new Date()
    });

    // Reload order to get updated data
    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: 'items' }]
    });

    res.json({
      success: true,
      order: updatedOrder,
      invoice: {
        invoice_id: invoiceData.invoice_id,
        qr_image: invoiceData.qr_image,
        qr_text: invoiceData.qr_text,
        qr_code: invoiceData.qr_code,
        urls: invoiceData.urls
      }
    });
  } catch (error) {
    console.error('Create checkout invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      message: error.response?.data?.message || error.message
    });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID
    const order = await Order.findOne({
      where: { invoice_id: invoiceId },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Check payment status in QPay
    const checkResponse = await axios.post(
      `${QPAY_BASE_URL}/payment/check`,
      {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100
        }
      },
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = checkResponse.data;
    let paymentStatus = 'PENDING';
    let isPaid = false;

    if (paymentData.rows && paymentData.rows.length > 0) {
      const payment = paymentData.rows[0];
      paymentStatus = payment.payment_status || 'PENDING';
      isPaid = paymentStatus === 'PAID';
    }

    // Update order status if paid
    if (isPaid && order.payment_status !== 1) {
      await order.update({ 
        payment_status: 1, // 1 = Paid
        updated_at: new Date()
      });
      order.payment_status = 1;
    }

    res.json({
      success: true,
      order: order,
      payment: {
        status: paymentStatus,
        isPaid,
        data: paymentData
      }
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status',
      message: error.response?.data?.message || error.message
    });
  }
};

// Webhook endpoint for QPay payment notifications
exports.paymentWebhook = async (req, res) => {
  try {
    const { object_type, object_id, payment_status } = req.body;

    if (object_type !== 'INVOICE' || !object_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid webhook data' 
      });
    }

    // Find order by invoice ID
    const order = await Order.findOne({
      where: { invoice_id: object_id }
    });

    if (!order) {
      console.warn(`Order not found for invoice ID: ${object_id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Update order status based on payment status
    if (payment_status === 'PAID' && order.payment_status !== 1) {
      await order.update({ 
        payment_status: 1, // 1 = Paid
        updated_at: new Date()
      });
      console.log(`Order ${order.id} marked as paid via webhook`);
    } else if (payment_status === 'CANCELLED' && order.payment_status !== 2) {
      await order.update({ 
        payment_status: 2, // 2 = Failed/Cancelled
        updated_at: new Date()
      });
      console.log(`Order ${order.id} marked as cancelled via webhook`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: order.id,
      status: order.payment_status
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message
    });
  }
};

// Get order by invoice ID
exports.getOrderByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID
    const order = await Order.findOne({
      where: { invoice_id: invoiceId },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Get order by invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
      message: error.message
    });
  }
};

