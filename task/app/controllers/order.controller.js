const db = require("../models");
const Order = db.orders;
const OrderItem = db.order_items;
const { Op } = require("sequelize");

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${year}${month}${day}${random}`;
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