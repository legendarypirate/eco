const db = require("../models");
const Order = db.orders;
const OrderItem = db.order_items;
const Address = db.addresses;
const axios = require('axios');

// QPay credentials - should be in environment variables
const QPAY_LOGIN = process.env.QPAY_LOGIN || 'KONO';
const QPAY_PASSWORD = process.env.QPAY_PASSWORD || '8zcSjp5u';
const QPAY_BASE_URL = 'https://merchant.qpay.mn/v2';

// Helper function to save address from order (only for authenticated users, non-pickup orders)
const saveAddressFromOrder = async (order) => {
  try {
    // Only save if user is authenticated (not guest) and not pickup
    if (!order.user_id || order.user_id.startsWith('guest_')) {
      return { success: false, reason: 'guest_user' };
    }

    // Skip if pickup order
    if (!order.shipping_address || order.shipping_address === 'Ирж авах' || order.shipping_address.trim() === '') {
      return { success: false, reason: 'pickup_order' };
    }

    // Parse shipping address string to extract components
    // Format: "Улаанбаатар, Дүүрэг: Баянзүрх, Хороо: 15-р хороо, Байр, орц, давхар, тоот"
    const addressParts = order.shipping_address.split(',').map(part => part.trim());
    
    let city = '';
    let district = null;
    let khoroo = null;
    let address = '';

    // First part is usually the city
    if (addressParts.length > 0) {
      city = addressParts[0];
    }

    // Find district (Дүүрэг: ...)
    const districtIndex = addressParts.findIndex(part => part.startsWith('Дүүрэг:'));
    if (districtIndex !== -1) {
      district = addressParts[districtIndex].replace('Дүүрэг:', '').trim();
    }

    // Find khoroo (Хороо: ...)
    const khorooIndex = addressParts.findIndex(part => part.startsWith('Хороо:'));
    if (khorooIndex !== -1) {
      khoroo = addressParts[khorooIndex].replace('Хороо:', '').trim();
    }

    // Everything after district/khoroo is the detailed address
    const addressStartIndex = Math.max(
      districtIndex !== -1 ? districtIndex + 1 : 0,
      khorooIndex !== -1 ? khorooIndex + 1 : 0,
      1 // At least start from index 1 (after city)
    );
    
    if (addressParts.length > addressStartIndex) {
      address = addressParts.slice(addressStartIndex).join(', ').trim();
    } else {
      // Fallback: if no detailed address found, use the full string minus city/district/khoroo
      address = order.shipping_address;
    }

    // Validate we have at least city and address
    if (!city || !address) {
      return { success: false, reason: 'invalid_address_format' };
    }

    // Normalize address data for comparison
    const normalizedAddress = {
      city: city.trim(),
      district: district ? district.trim() : null,
      khoroo: khoroo ? khoroo.trim() : null,
      address: address.trim()
    };

    // Check if address already exists for this user
    const whereClause = {
      user_id: order.user_id,
      city: normalizedAddress.city,
      address: normalizedAddress.address,
      district: normalizedAddress.district || null,
      khoroo: normalizedAddress.khoroo || null
    };

    const existingAddress = await Address.findOne({
      where: whereClause
    });

    if (existingAddress) {
      // Address already exists, return success without creating duplicate
      return { 
        success: true, 
        address: existingAddress, 
        isDuplicate: true 
      };
    }

    // Create new address (not set as default)
    const newAddress = await Address.create({
      user_id: order.user_id,
      city: normalizedAddress.city,
      district: normalizedAddress.district,
      khoroo: normalizedAddress.khoroo,
      address: normalizedAddress.address,
      is_default: false
    });

    return { 
      success: true, 
      address: newAddress, 
      isDuplicate: false 
    };
  } catch (error) {
    console.error('Error saving address from order:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Helper function to call e-chuchu API
const callChuchuAPI = async (order, options = {}) => {
  try {
    // Check if order has delivery address (not pickup)
    const shippingAddress = options.address || order.shipping_address;
    if (!shippingAddress || shippingAddress === 'Ирж авах' || shippingAddress.trim() === '') {
      console.log(`Skipping chuchu API for order ${order.id} - pickup order or no address`);
      return { success: false, reason: 'pickup_or_no_address' };
    }

    // Check if order has items
    if (!order.items || order.items.length === 0) {
      console.log(`Skipping chuchu API for order ${order.id} - no items`);
      return { success: false, reason: 'no_items' };
    }

    // Prepare parcel info for chuchu
    const parcelInfo = order.items.map(item => 
      `${item.name_mn || item.name} x${item.quantity}`
    ).join(", ");

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Call chuchu API
    const chuchuUrl = "https://e-chuchu.mn/api/v1/tsaas/delivery/create";
    const chuchuData = {
      order_code: order.order_number,
      receivername: order.customer_name || options.phone || order.phone_number,
      parcel_info: parcelInfo,
      phone: options.phone || order.phone_number,
      phone2: "",
      address: shippingAddress,
      comment: options.comment || options.khoroo || "",
      number: totalItems,
      price: order.grand_total.toString(),
      track: order.id.toString()
    };

    console.log('Calling e-chuchu API for order:', order.order_number, chuchuData);
    
    const chuchuResponse = await axios.post(chuchuUrl, chuchuData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('e-chuchu API response for order', order.order_number, ':', chuchuResponse.data);
    
    return {
      success: true,
      data: chuchuResponse.data
    };
  } catch (error) {
    console.error('e-chuchu API error for order', order.id, ':', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

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

    // Create invoice in QPay with timeout and error handling
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
        },
        timeout: 30000 // 30 second timeout to prevent hanging
      }
    );

    if (!invoiceResponse.data || !invoiceResponse.data.invoice_id) {
      throw new Error('Failed to create QPay invoice');
    }

    const invoiceData = invoiceResponse.data;

    // Optimize QR image: Only store if it's a URL (not base64), or limit base64 size
    // Never store large base64 images in database to prevent memory issues
    let qrImageToStore = null;
    try {
      if (invoiceData.qr_image && typeof invoiceData.qr_image === 'string') {
        // If it's a URL, store it (most memory efficient)
        if (invoiceData.qr_image.startsWith('http://') || invoiceData.qr_image.startsWith('https://')) {
          qrImageToStore = invoiceData.qr_image;
        } 
        // If it's base64, only store if it's very small (less than 30KB base64 = ~22KB image)
        // Base64 is ~33% larger than binary, so 30KB base64 ≈ 22KB image
        else if (invoiceData.qr_image.length < 30000) {
          qrImageToStore = invoiceData.qr_image;
        } else {
          // For large base64 images, don't store - we'll use qr_text to generate QR instead
          console.warn(`QR image too large (${invoiceData.qr_image.length} chars), not storing. Will use qr_text instead.`);
          qrImageToStore = null;
        }
      }
    } catch (qrError) {
      console.error('Error processing QR image:', qrError);
      qrImageToStore = null; // Don't store if there's any error
    }

    // Update order with QPay invoice information
    // Use try-catch to prevent database update from crashing
    try {
      await order.update({
        invoice_id: invoiceData.invoice_id,
        qr_image: qrImageToStore,
        qr_text: invoiceData.qr_text || null,
        updated_at: new Date()
      });
    } catch (updateError) {
      console.error('Error updating order with QR image:', updateError);
      // Try updating without qr_image if update fails
      try {
        await order.update({
          invoice_id: invoiceData.invoice_id,
          qr_text: invoiceData.qr_text || null,
          updated_at: new Date()
        });
      } catch (retryError) {
        console.error('Error updating order without QR image:', retryError);
        throw retryError;
      }
    }

    // Reload order to get updated data (exclude qr_image from response to save memory)
    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: 'items' }],
      attributes: {
        exclude: ['qr_image'] // Exclude large qr_image from order response
      }
    });

    // Convert order to plain object and ensure qr_image is not included
    const orderData = updatedOrder ? updatedOrder.toJSON() : null;
    if (orderData) {
      delete orderData.qr_image; // Ensure it's not in the response
    }

    // Only include qr_image in invoice if it's a URL or small enough
    // Use try-catch to prevent response from crashing
    let qrImageForResponse = null;
    try {
      if (invoiceData.qr_image && typeof invoiceData.qr_image === 'string') {
        if (invoiceData.qr_image.startsWith('http://') || invoiceData.qr_image.startsWith('https://')) {
          qrImageForResponse = invoiceData.qr_image;
        } else if (invoiceData.qr_image.length < 30000) {
          qrImageForResponse = invoiceData.qr_image;
        }
        // If larger, don't include - frontend will generate from qr_text
      }
    } catch (qrResponseError) {
      console.error('Error processing QR image for response:', qrResponseError);
      qrImageForResponse = null; // Don't include if there's any error
    }

    // Ensure qr_text is always included for fallback QR generation
    const qrText = invoiceData.qr_text || null;

    res.json({
      success: true,
      order: orderData,
      invoice: {
        invoice_id: invoiceData.invoice_id,
        qr_image: qrImageForResponse, // Only include if URL or small base64
        qr_text: qrText, // Always include for fallback QR generation
        qr_code: invoiceData.qr_code || null,
        urls: invoiceData.urls || []
      }
    });
  } catch (error) {
    console.error('Create checkout invoice error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create invoice';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // If order was created but invoice creation failed, still return order info
    // so frontend can handle gracefully
    if (req.body.orderId) {
      try {
        const order = await Order.findOne({
          where: { id: req.body.orderId },
          include: [{ model: OrderItem, as: 'items' }],
          attributes: {
            exclude: ['qr_image']
          }
        });
        
        if (order) {
          const orderData = order.toJSON();
          delete orderData.qr_image;
          
          return res.status(500).json({
            success: false,
            error: 'Failed to create invoice',
            message: errorMessage,
            order: orderData // Include order so frontend can retry
          });
        }
      } catch (orderError) {
        console.error('Error fetching order after invoice failure:', orderError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      message: errorMessage
    });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID (exclude qr_image to save memory)
    const order = await Order.findOne({
      where: { invoice_id: invoiceId },
      include: [{ model: OrderItem, as: 'items' }],
      attributes: {
        exclude: ['qr_image'] // Exclude large qr_image from response
      }
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

      // Call e-chuchu API for delivery orders after payment success
      // Reload order with items for chuchu API call
      const orderWithItems = await Order.findOne({
        where: { id: order.id },
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (orderWithItems && orderWithItems.items && orderWithItems.items.length > 0) {
        // Call e-chuchu API for delivery orders after payment success
        // Only skip if it's explicitly a pickup order or address is missing
        const shippingAddress = orderWithItems.shipping_address || '';
        if (!shippingAddress || shippingAddress === 'Ирж авах' || shippingAddress.trim() === '') {
          console.log(`Order ${order.id} is pickup order or has no address, skipping chuchu API. Will try again when invoice is downloaded.`);
        } else {
          // Call chuchu API with the address from the order
          const chuchuResult = await callChuchuAPI(orderWithItems, {
            address: shippingAddress,
            phone: orderWithItems.phone_number || '',
            comment: ""
          });
          if (chuchuResult.success) {
            console.log(`e-chuchu API called successfully for order ${order.id} after QPay payment`);
          } else {
            // Log warning but don't fail the payment - chuchu API call is not critical
            // It will be retried when invoice is downloaded
            console.warn(`e-chuchu API call failed for order ${order.id}:`, chuchuResult.error || chuchuResult.reason);
          }
        }
      } else {
        console.warn(`Order ${order.id} has no items, skipping chuchu API`);
      }

        // Save address when QPay payment is successful (for authenticated users, non-pickup orders)
        saveAddressFromOrder(orderWithItems).then(result => {
          if (result.success) {
            if (result.isDuplicate) {
              console.log('Address already exists for user when QPay payment succeeded for order:', order.order_number);
            } else {
              console.log('Address saved successfully when QPay payment succeeded for order:', order.order_number);
            }
          } else {
            // Only log if it's not a guest user or pickup order (expected cases)
            if (result.reason !== 'guest_user' && result.reason !== 'pickup_order') {
              console.warn('Failed to save address when QPay payment succeeded for order:', order.order_number, result.reason || result.error);
            }
          }
        }).catch(err => {
          console.error('Error saving address when QPay payment succeeded:', err);
        });
    }

    // Convert order to plain object and ensure qr_image is not included
    const orderData = order ? order.toJSON() : null;
    if (orderData) {
      delete orderData.qr_image; // Ensure it's not in the response
    }

    res.json({
      success: true,
      order: orderData,
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

    // Find order by invoice ID (exclude qr_image to save memory)
    const order = await Order.findOne({
      where: { invoice_id: object_id },
      attributes: {
        exclude: ['qr_image'] // Exclude large qr_image from response
      }
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

      // Call e-chuchu API for delivery orders after payment success via webhook
      const orderWithItems = await Order.findOne({
        where: { id: order.id },
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (orderWithItems && orderWithItems.items && orderWithItems.items.length > 0) {
        // Call e-chuchu API for delivery orders after payment success via webhook
        // Only skip if it's explicitly a pickup order or address is missing
        const shippingAddress = orderWithItems.shipping_address || '';
        if (!shippingAddress || shippingAddress === 'Ирж авах' || shippingAddress.trim() === '') {
          console.log(`Order ${order.id} is pickup order or has no address, skipping chuchu API. Will try again when invoice is downloaded.`);
        } else {
          // Call chuchu API with the address from the order
          const chuchuResult = await callChuchuAPI(orderWithItems, {
            address: shippingAddress,
            phone: orderWithItems.phone_number || '',
            comment: ""
          });
          if (chuchuResult.success) {
            console.log(`e-chuchu API called successfully for order ${order.id} via QPay webhook`);
          } else {
            // Log warning but don't fail the payment - chuchu API call is not critical
            // It will be retried when invoice is downloaded
            console.warn(`e-chuchu API call failed for order ${order.id} via webhook:`, chuchuResult.error || chuchuResult.reason);
          }
        }
      } else {
        console.warn(`Order ${order.id} has no items, skipping chuchu API`);
      }

        // Save address when QPay payment is successful via webhook (for authenticated users, non-pickup orders)
        saveAddressFromOrder(orderWithItems).then(result => {
          if (result.success) {
            if (result.isDuplicate) {
              console.log('Address already exists for user when QPay payment succeeded via webhook for order:', order.order_number);
            } else {
              console.log('Address saved successfully when QPay payment succeeded via webhook for order:', order.order_number);
            }
          } else {
            // Only log if it's not a guest user or pickup order (expected cases)
            if (result.reason !== 'guest_user' && result.reason !== 'pickup_order') {
              console.warn('Failed to save address when QPay payment succeeded via webhook for order:', order.order_number, result.reason || result.error);
            }
          }
        }).catch(err => {
          console.error('Error saving address when QPay payment succeeded via webhook:', err);
        });
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

    // Find order by invoice ID (exclude qr_image to save memory)
    const order = await Order.findOne({
      where: { invoice_id: invoiceId },
      include: [{ model: OrderItem, as: 'items' }],
      attributes: {
        exclude: ['qr_image'] // Exclude large qr_image from response
      }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Convert order to plain object and ensure qr_image is not included
    const orderData = order ? order.toJSON() : null;
    if (orderData) {
      delete orderData.qr_image; // Ensure it's not in the response
    }

    res.json({
      success: true,
      order: orderData
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

// Get all QPay payments (orders with invoice_id)
exports.getAllPayments = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { page = 1, limit = 1000, status } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {
      [Op.and]: [
        { invoice_id: { [Op.ne]: null } },
        { invoice_id: { [Op.ne]: '' } }
      ]
    };

    // Map status filter to payment_status
    if (status === 'paid') {
      whereCondition.payment_status = 1;
    } else if (status === 'pending') {
      whereCondition.payment_status = 0;
    } else if (status === 'cancelled') {
      whereCondition.payment_status = 2;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereCondition,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: {
        exclude: ['qr_image'] // Exclude large qr_image to save memory
      }
    });

    // Map orders to QPay payment format
    const payments = rows.map(order => {
      const orderData = order.toJSON();
      
      // Determine status based on payment_status and order age
      let paymentStatus = 'pending';
      if (orderData.payment_status === 1) {
        paymentStatus = 'paid';
      } else if (orderData.payment_status === 2) {
        paymentStatus = 'cancelled';
      } else {
        // Check if invoice is expired (older than 30 minutes)
        const createdAt = new Date(orderData.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / (1000 * 60);
        if (diffMinutes > 30) {
          paymentStatus = 'expired';
        }
      }

      // Get description from order items
      const description = orderData.items && orderData.items.length > 0
        ? orderData.items.map(item => `${item.name_mn || item.name} x${item.quantity}`).join(', ')
        : 'Захиалга';

      return {
        id: orderData.id.toString(),
        invoice_id: orderData.invoice_id || orderData.order_number,
        amount: parseFloat(orderData.grand_total) || 0,
        status: paymentStatus,
        description: description,
        customer_name: orderData.customer_name || 'Хэрэглэгч',
        customer_phone: orderData.phone_number || '',
        created_at: orderData.created_at ? new Date(orderData.created_at).toLocaleString('mn-MN') : '',
        paid_at: orderData.payment_status === 1 && orderData.updated_at 
          ? new Date(orderData.updated_at).toLocaleString('mn-MN') 
          : null,
        qpay_invoice_id: orderData.invoice_id || '',
        payment_url: orderData.invoice_id ? `https://qpay.mn/pay/${orderData.invoice_id}` : '',
        qr_image: orderData.qr_text ? `data:image/png;base64,${orderData.qr_text}` : '/api/placeholder/100/100',
        order_number: orderData.order_number
      };
    });

    res.json({
      success: true,
      payments: payments,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get all QPay payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payments',
      message: error.message
    });
  }
};

