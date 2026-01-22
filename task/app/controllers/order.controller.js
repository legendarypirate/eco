const db = require("../models");
const Order = db.orders;
const OrderItem = db.order_items;
const Address = db.addresses;
const { Op } = require("sequelize");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${year}${month}${day}${random}`;
};

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
    // Get shipping address (use provided address or order address, default to "Ирж авах" if empty)
    const shippingAddress = options.address || order.shipping_address || 'Ирж авах';
    
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

// Create and Save a new Order
exports.create = (req, res) => {
  // Validate request
  if (!req.body.items || !req.body.items.length) {
    res.status(400).json({
      success: false,
      message: "Захиалгын бараа хоосон байна!"
    });
    return;
  }

  // Create an Order
  const transaction = db.sequelize.transaction().then(t => {
    const orderData = {
      order_number: generateOrderNumber(),
      user_id: req.body.userId || `guest_${Date.now()}`,
      subtotal: req.body.subtotal || 0,
      shipping_cost: req.body.shippingCost || 5000,
      tax: req.body.tax || 0,
      grand_total: req.body.grandTotal || 0,
      payment_method: req.body.paymentMethod || 0,
      payment_status: 0,
      order_status: 0,
      shipping_address: req.body.shippingAddress || "Хаяг оруулна уу",
      phone_number: req.body.phoneNumber || "Утасны дугаар оруулна уу",
      customer_name: req.body.customerName || "Хэрэглэгч",
      notes: req.body.notes,
      invoice_data: req.body.invoiceData ? JSON.stringify(req.body.invoiceData) : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    return Order.create(orderData, { transaction: t })
      .then(order => {
        // Create order items
        const orderItems = req.body.items.map(item => ({
          order_id: order.id,
          product_id: item.productId || "",
          name: item.name || "Бараа",
          name_mn: item.nameMn || item.name || "Бараа",
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || null,
          sku: item.sku || null,
          created_at: new Date()
        }));

        return OrderItem.bulkCreate(orderItems, { transaction: t })
          .then(() => {
            return Order.findOne({
              where: { id: order.id },
              include: [{ model: OrderItem, as: "items" }],
              transaction: t
            });
          })
          .then(fullOrder => {
            return t.commit().then(() => fullOrder);
          });
      })
      .then(order => {
        res.json({
          success: true,
          message: "Захиалга амжилттай үүслээ!",
          order: order
        });
      })
      .catch(err => {
        return t.rollback().then(() => {
          throw err;
        });
      });
  }).catch(err => {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Захиалга үүсгэхэд алдаа гарлаа."
    });
  });
};

// Retrieve all Orders from the database by user ID
exports.findAllByUserId = (req, res) => {
  // Get userId from authenticated user (set by verifyToken middleware)
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Нэвтрэх шаардлагатай!"
    });
    return;
  }

  Order.findAll({
    where: { user_id: userId },
    include: [{ model: OrderItem, as: "items" }],
    order: [["created_at", "DESC"]]
  })
    .then(data => {
      res.json({
        success: true,
        orders: data
      });
    })
    .catch(err => {
      console.error("Find orders by user error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Захиалгуудыг авахад алдаа гарлаа."
      });
    });
};

// Find a single Order with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Order.findOne({
    where: { id: id },
    include: [{ model: OrderItem, as: "items" }]
  })
    .then(data => {
      if (data) {
        res.json({
          success: true,
          order: data
        });
      } else {
        res.status(404).json({
          success: false,
          message: `ID-тай захиалга олдсонгүй: ${id}`
        });
      }
    })
    .catch(err => {
      console.error("Find order error:", err);
      res.status(500).json({
        success: false,
        message: `ID-тай захиалгыг авахад алдаа гарлаа: ${id}`
      });
    });
};

// Find Order by order number
exports.findByOrderNumber = (req, res) => {
  const orderNumber = req.params.orderNumber;

  Order.findOne({
    where: { order_number: orderNumber },
    include: [{ model: OrderItem, as: "items" }]
  })
    .then(data => {
      if (data) {
        res.json({
          success: true,
          order: data
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Захиалгын дугаартай захиалга олдсонгүй: ${orderNumber}`
        });
      }
    })
    .catch(err => {
      console.error("Find order by number error:", err);
      res.status(500).json({
        success: false,
        message: `Захиалгын дугаартай захиалгыг авахад алдаа гарлаа: ${orderNumber}`
      });
    });
};

// Update a Order by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Order.findByPk(id)
    .then(order => {
      if (!order) {
        res.status(404).json({
          success: false,
          message: `ID-тай захиалга олдсонгүй: ${id}`
        });
        return null;
      }

      const updateData = {
        updated_at: new Date()
      };

      // Only update fields that are provided
      if (req.body.order_status !== undefined) {
        updateData.order_status = req.body.order_status;
      }
      if (req.body.payment_status !== undefined) {
        updateData.payment_status = req.body.payment_status;
      }
      if (req.body.shipping_address !== undefined) {
        updateData.shipping_address = req.body.shipping_address;
      }
      if (req.body.phone_number !== undefined) {
        updateData.phone_number = req.body.phone_number;
      }
      if (req.body.customer_name !== undefined) {
        updateData.customer_name = req.body.customer_name;
      }
      if (req.body.notes !== undefined) {
        updateData.notes = req.body.notes;
      }

      return order.update(updateData);
    })
    .then(updatedOrder => {
      if (updatedOrder) {
        res.json({
          success: true,
          message: "Захиалга амжилттай шинэчлэгдлээ.",
          order: updatedOrder
        });
      }
    })
    .catch(err => {
      console.error("Update order error:", err);
      res.status(500).json({
        success: false,
        message: err.message || `ID-тай захиалга шинэчлэхэд алдаа гарлаа: ${id}`
      });
    });
};

// Update order status only
exports.updateStatus = (req, res) => {
  const id = req.params.id;

  if (req.body.order_status === undefined) {
    res.status(400).json({
      success: false,
      message: "Захиалгын төлөв шаардлагатай!"
    });
    return;
  }

  Order.findByPk(id)
    .then(order => {
      if (!order) {
        res.status(404).json({
          success: false,
          message: `ID-тай захиалга олдсонгүй: ${id}`
        });
        return null;
      }

      return order.update({
        order_status: req.body.order_status,
        updated_at: new Date()
      });
    })
    .then(updatedOrder => {
      if (updatedOrder) {
        res.json({
          success: true,
          message: "Захиалгын төлөв амжилттай шинэчлэгдлээ.",
          order: updatedOrder
        });
      }
    })
    .catch(err => {
      console.error("Update order status error:", err);
      res.status(500).json({
        success: false,
        message: err.message || `Захиалгын төлөв шинэчлэхэд алдаа гарлаа: ${id}`
      });
    });
};

// Update payment status only
exports.updatePaymentStatus = (req, res) => {
  const id = req.params.id;

  if (req.body.payment_status === undefined) {
    res.status(400).json({
      success: false,
      message: "Төлбөрийн төлөв шаардлагатай!"
    });
    return;
  }

  Order.findByPk(id)
    .then(order => {
      if (!order) {
        res.status(404).json({
          success: false,
          message: `ID-тай захиалга олдсонгүй: ${id}`
        });
        return null;
      }

      return order.update({
        payment_status: req.body.payment_status,
        updated_at: new Date()
      });
    })
    .then(updatedOrder => {
      if (updatedOrder) {
        res.json({
          success: true,
          message: "Төлбөрийн төлөв амжилттай шинэчлэгдлээ.",
          order: updatedOrder
        });
      }
    })
    .catch(err => {
      console.error("Update payment status error:", err);
      res.status(500).json({
        success: false,
        message: err.message || `Төлбөрийн төлөв шинэчлэхэд алдаа гарлаа: ${id}`
      });
    });
};

// Delete a Order with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  const transaction = db.sequelize.transaction().then(t => {
    return OrderItem.destroy({
      where: { order_id: id },
      transaction: t
    })
      .then(() => {
        return Order.destroy({
          where: { id: id },
          transaction: t
        });
      })
      .then(num => {
        if (num == 1) {
          return t.commit().then(() => num);
        } else {
          return t.rollback().then(() => 0);
        }
      });
  }).then(num => {
    if (num == 1) {
      res.json({
        success: true,
        message: "Захиалга амжилттай устгагдлаа!"
      });
    } else {
      res.status(404).json({
        success: false,
        message: `ID-тай захиалга олдсонгүй: ${id}`
      });
    }
  }).catch(err => {
    console.error("Delete order error:", err);
    res.status(500).json({
      success: false,
      message: err.message || `ID-тай захиалга устгахад алдаа гарлаа: ${id}`
    });
  });
};

// Find all Orders (admin)
exports.findAll = (req, res) => {
  const { page = 1, limit = 20, order_status, payment_status } = req.query;
  const offset = (page - 1) * limit;

  const whereCondition = {};

  if (order_status !== undefined) {
    whereCondition.order_status = order_status;
  }

  if (payment_status !== undefined) {
    whereCondition.payment_status = payment_status;
  }

  Order.findAndCountAll({
    where: whereCondition,
    include: [{ model: OrderItem, as: "items" }],
    order: [["created_at", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  })
    .then(data => {
      res.json({
        success: true,
        orders: data.rows,
        total: data.count,
        page: parseInt(page),
        totalPages: Math.ceil(data.count / limit)
      });
    })
    .catch(err => {
      console.error("Find all orders error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Захиалгуудыг авахад алдаа гарлаа."
      });
    });
};

// Create invoice and call chuchu API
exports.createInvoiceWithChuchu = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { address, khoroo, phone, invoiceData } = req.body;

    // Find the order
    const order = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: "items" }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Захиалга олдсонгүй"
      });
    }

    // Update order with address and phone if provided
    const updateData = {
      updated_at: new Date()
    };
    
    if (address) {
      updateData.shipping_address = address;
    }
    
    if (phone) {
      updateData.phone_number = phone;
    }
    
    if (invoiceData) {
      updateData.invoice_data = JSON.stringify(invoiceData);
    }
    
    // Update order payment status to indicate invoice created
    updateData.payment_status = 1; // Mark as paid for invoice orders
    
    await order.update(updateData);

    // Reload order to get updated data
    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: "items" }]
    });

    // Call e-chuchu API when invoice is created (with address and phone from request)
    if (updatedOrder) {
      const chuchuOptions = {
        address: address || updatedOrder.shipping_address,
        phone: phone || updatedOrder.phone_number,
        comment: khoroo || ""
      };
      
      callChuchuAPI(updatedOrder, chuchuOptions).then(result => {
        if (result.success) {
          console.log('e-chuchu record created successfully when invoice was created for order:', updatedOrder.order_number);
        } else {
          console.warn('e-chuchu API call failed when invoice was created for order:', updatedOrder.order_number, result.error || result.reason);
        }
      }).catch(err => {
        console.error('Error calling e-chuchu API when invoice was created:', err);
      });
    }

    // Save address when invoice is created (PDF will be downloaded client-side right after)
    // Call asynchronously so it doesn't block the response
    if (updatedOrder) {
      saveAddressFromOrder(updatedOrder).then(result => {
        if (result.success) {
          if (result.isDuplicate) {
            console.log('Address already exists for user when invoice was created for order:', order.order_number);
          } else {
            console.log('Address saved successfully when invoice was created for order:', order.order_number);
          }
        } else {
          // Only log if it's not a guest user or pickup order (expected cases)
          if (result.reason !== 'guest_user' && result.reason !== 'pickup_order') {
            console.warn('Failed to save address when invoice was created for order:', order.order_number, result.reason || result.error);
          }
        }
      }).catch(err => {
        console.error('Error saving address when invoice was created:', err);
      });
    }

    res.json({
      success: true,
      message: "Нэхэмжлэх амжилттай үүслээ",
      order: updatedOrder || order
    });
  } catch (error) {
    console.error("Create invoice with chuchu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Нэхэмжлэх үүсгэхэд алдаа гарлаа"
    });
  }
};

// Generate invoice PDF
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order
    const order = await Order.findOne({
      where: { id: id },
      include: [{ model: OrderItem, as: "items" }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Захиалга олдсонгүй"
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.order_number}.pdf`);

    // Register font that supports Cyrillic/Mongolian characters
    // Try to use system fonts that support Cyrillic, or fallback to Helvetica
    try {
      // Try common system fonts that support Cyrillic
      const fontPaths = [
        path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'),
        path.join(__dirname, '../assets/fonts/arial.ttf'),
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/arialuni.ttf',
      ];
      
      let fontRegistered = false;
      for (const fontPath of fontPaths) {
        try {
          if (fs.existsSync(fontPath)) {
            doc.registerFont('CyrillicFont', fontPath);
            doc.font('CyrillicFont');
            fontRegistered = true;
            break;
          }
        } catch (e) {
          // Continue to next font
          continue;
        }
      }
      
      // If no font found, use Helvetica (will show some characters but may have issues with Cyrillic)
      if (!fontRegistered) {
        console.warn('No Cyrillic-supporting font found, using default font. Consider adding DejaVuSans.ttf to app/assets/fonts/');
        doc.font('Helvetica');
      }
    } catch (fontError) {
      console.error('Font registration error:', fontError);
      // Fallback to default font
      doc.font('Helvetica');
    }

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('НЭХЭМЖЛЭЛ', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Нэхэмжлэлийн дугаар: ${order.id}`, { align: 'left' });
    doc.text(`Захиалгын дугаар: ${order.order_number}`, { align: 'left' });
    doc.moveDown();

    // Company info
    doc.text('Нэхэмжлэгч:', { continued: false });
    doc.text('Байгууллагын нэр: ТЭРГҮҮН ГЭРЭГЭ ХХК', { indent: 20 });
    doc.text('Регистерийн дугаар: 6002536', { indent: 20 });
    doc.text('Хаяг: ХУД, 2-р хороо, Дунд Гол гудамж, Хийморь хотхон, 34 р байр', { indent: 20 });
    doc.text('Утас: 7000-5060, 98015060', { indent: 20 });
    doc.text('Банкны нэр: M банк', { indent: 20 });
    doc.text('Дансны дугаар: 9006002536', { indent: 20 });
    doc.text(`Гүйлгээний утга: ${order.order_number}`, { indent: 20 });
    doc.moveDown();

    // Customer info - use invoice data if available
    let invoiceData = null;
    if (order.invoice_data) {
      try {
        invoiceData = JSON.parse(order.invoice_data);
      } catch (e) {
        console.error('Error parsing invoice_data:', e);
      }
    }
    
    doc.text('Төлөгч тал:', { continued: false });
    
    // Only show organization name if provided in invoice data, leave blank otherwise
    if (invoiceData?.name) {
      doc.text(`Байгууллагын нэр: ${invoiceData.name}`, { indent: 20 });
    } else {
      doc.text('Байгууллагын нэр: ', { indent: 20 });
    }
    
    // Only show address if not pickup
    if (order.shipping_address && order.shipping_address !== 'Ирж авах') {
      doc.text(`Хаяг: ${order.shipping_address}`, { indent: 20 });
    }
    
    // Only show register number if available from invoice data (leave blank if not)
    if (invoiceData?.register) {
      doc.text(`Регистрийн дугаар: ${invoiceData.register}`, { indent: 20 });
    } else {
      doc.text('Регистрийн дугаар: ', { indent: 20 });
    }
    
    // Show email if available from invoice data
    if (invoiceData?.email) {
      doc.text(`Цахим шуудан: ${invoiceData.email}`, { indent: 20 });
    }
    
    doc.text(`Утас: ${invoiceData?.phone || order.phone_number}`, { indent: 20 });
    doc.text(`Нэхэмжилсэн огноо: ${new Date(order.created_at).toLocaleDateString('mn-MN')}`, { indent: 20 });
    doc.moveDown();

    // Items table
    let startY = doc.y;
    doc.fontSize(10);
    
    // Table header
    doc.text('№', 50, startY);
    doc.text('Бүтээгдэхүүн', 80, startY);
    doc.text('Үнийн дүн', 300, startY);
    doc.text('Тоо ширхэг', 380, startY);
    doc.text('Нийт', 450, startY);
    
    startY += 20;
    doc.moveTo(50, startY).lineTo(550, startY).stroke();
    startY += 10;

    // Table rows
    let itemNumber = 1;
    order.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      doc.text(itemNumber.toString(), 50, startY);
      doc.text(item.name_mn || item.name, 80, startY, { width: 200 });
      doc.text(item.price.toLocaleString() + '₮', 300, startY);
      doc.text(item.quantity.toString() + 'ш', 380, startY);
      doc.text(itemTotal.toLocaleString() + '₮', 450, startY);
      startY += 20;
      itemNumber++;
    });

    startY += 10;
    doc.moveTo(50, startY).lineTo(550, startY).stroke();
    startY += 20;

    // Totals
    doc.text('Дүн:', 350, startY);
    doc.text(order.subtotal.toLocaleString() + '₮', 450, startY);
    startY += 20;

    if (order.shipping_cost > 0) {
      doc.text('Хүргэлт:', 350, startY);
      doc.text(order.shipping_cost.toLocaleString() + '₮', 450, startY);
      startY += 20;
    }

    doc.fontSize(12);
    doc.text('Нийт дүн:', 350, startY);
    doc.text(order.grand_total.toLocaleString() + '₮', 450, startY);

    // Call e-chuchu API when PDF is downloaded (for all orders including pickup)
    // Call asynchronously so it doesn't block PDF generation
    // Use order data which should already have address and phone from invoice creation
    callChuchuAPI(order, {
      address: order.shipping_address,
      phone: order.phone_number,
      comment: ""
    }).then(result => {
      if (result.success) {
        console.log('e-chuchu record created successfully when PDF was downloaded for order:', order.order_number);
      } else {
        console.warn('e-chuchu API call failed when PDF was downloaded for order:', order.order_number, result.error || result.reason);
      }
    }).catch(err => {
      console.error('Error calling e-chuchu API when PDF was downloaded:', err);
    });

    // Save address when PDF is downloaded (for authenticated users, non-pickup orders)
    // Call asynchronously so it doesn't block PDF generation
    saveAddressFromOrder(order).then(result => {
      if (result.success) {
        if (result.isDuplicate) {
          console.log('Address already exists for user when PDF was downloaded for order:', order.order_number);
        } else {
          console.log('Address saved successfully when PDF was downloaded for order:', order.order_number);
        }
      } else {
        // Only log if it's not a guest user or pickup order (expected cases)
        if (result.reason !== 'guest_user' && result.reason !== 'pickup_order') {
          console.warn('Failed to save address when PDF was downloaded for order:', order.order_number, result.reason || result.error);
        }
      }
    }).catch(err => {
      console.error('Error saving address when PDF was downloaded:', err);
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Generate PDF error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "PDF үүсгэхэд алдаа гарлаа"
    });
  }
};

// Call chuchu API for delivery (used after payment success)
exports.createChuchuDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findOne({
      where: { id: orderId },
      include: [{ model: OrderItem, as: "items" }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Захиалга олдсонгүй"
      });
    }

    // Check if order has items
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Захиалгад бүтээгдэхүүн байхгүй байна"
      });
    }

    // Use the helper function to call e-chuchu API (for all orders including pickup)
    const chuchuResult = await callChuchuAPI(order, {
      address: order.shipping_address,
      phone: order.phone_number,
      comment: ""
    });

    if (!chuchuResult.success) {
      // Don't return error for pickup orders or no items (expected cases)
      if (chuchuResult.reason === 'pickup_or_no_address' || chuchuResult.reason === 'no_items') {
        return res.status(400).json({
          success: false,
          message: chuchuResult.reason === 'pickup_or_no_address' 
            ? "Ирж авах захиалга эсвэл хаяг байхгүй" 
            : "Захиалгад бүтээгдэхүүн байхгүй байна",
          reason: chuchuResult.reason
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Хүргэлтийн мэдээлэл илгээхэд алдаа гарлаа",
        error: chuchuResult.error || chuchuResult.reason
      });
    }

    res.json({
      success: true,
      message: "Хүргэлтийн мэдээлэл амжилттай илгээгдлээ",
      chuchuResponse: chuchuResult.data
    });
  } catch (error) {
    console.error("Create chuchu delivery error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Хүргэлтийн мэдээлэл илгээхэд алдаа гарлаа"
    });
  }
};