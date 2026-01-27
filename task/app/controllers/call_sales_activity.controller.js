const db = require("../models");
const CallSalesActivity = db.call_sales_activities;
const User = db.users;
const Order = db.orders;
const Op = db.Sequelize.Op;

// ---------------------- CREATE ----------------------
exports.create = async (req, res) => {
  try {
    const {
      sales_manager_id,
      customer_id,
      customer_name,
      phone_number,
      call_type,
      call_date,
      call_time,
      call_duration_sec,
      call_result,
      interest_level,
      sale_status,
      product,
      quantity,
      price_offer,
      sale_amount,
      order_id,
      next_call_date,
      next_action,
      follow_up_status,
      note
    } = req.body;

    // Validate required fields
    if (!sales_manager_id) {
      return res.status(400).send({ success: false, message: "Борлуулалтын менежерийн ID оруулна уу" });
    }
    if (!phone_number) {
      return res.status(400).send({ success: false, message: "Утасны дугаар оруулна уу" });
    }
    if (!call_type) {
      return res.status(400).send({ success: false, message: "Залгалтын төрөл оруулна уу" });
    }
    if (!call_date) {
      return res.status(400).send({ success: false, message: "Залгалтын огноо оруулна уу" });
    }

    const activity = await CallSalesActivity.create({
      sales_manager_id,
      customer_id: customer_id || null,
      customer_name: customer_name || null,
      phone_number,
      call_type: call_type || "outgoing",
      call_date,
      call_time: call_time || null,
      call_duration_sec: call_duration_sec || 0,
      call_result: call_result || null,
      interest_level: interest_level || null,
      sale_status: sale_status || null,
      product: product || null,
      quantity: quantity || null,
      price_offer: price_offer || null,
      sale_amount: sale_amount || null,
      order_id: order_id || null,
      next_call_date: next_call_date || null,
      next_action: next_action || null,
      follow_up_status: follow_up_status || "pending",
      note: note || null,
    });

    // Fetch with relations for response
    const activityWithRelations = await CallSalesActivity.findByPk(activity.id, {
      include: [
        {
          model: User,
          as: 'sales_manager',
          attributes: ['id', 'full_name', 'phone', 'role']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'grand_total'],
          required: false
        }
      ]
    });

    return res.send({
      success: true,
      data: activityWithRelations || activity,
      id: activity.id,
      created_at: activity.createdAt,
      updated_at: activity.updatedAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ALL ----------------------
exports.findAll = async (req, res) => {
  try {
    const { 
      sales_manager_id, 
      customer_id, 
      sale_status, 
      follow_up_status,
      call_date_from,
      call_date_to,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    const where = {};
    
    if (sales_manager_id) {
      where.sales_manager_id = sales_manager_id;
    }
    if (customer_id) {
      where.customer_id = customer_id;
    }
    if (sale_status) {
      where.sale_status = sale_status;
    }
    if (follow_up_status) {
      where.follow_up_status = follow_up_status;
    }
    if (call_date_from || call_date_to) {
      where.call_date = {};
      if (call_date_from) {
        where.call_date[Op.gte] = call_date_from;
      }
      if (call_date_to) {
        where.call_date[Op.lte] = call_date_to;
      }
    }

    const { count, rows: activities } = await CallSalesActivity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sales_manager',
          attributes: ['id', 'full_name', 'phone', 'role'],
          required: false
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'grand_total'],
          required: false
        }
      ],
      order: [['call_date', 'DESC'], ['created_at', 'DESC']],
      limit: maxLimit,
      offset: offset,
      distinct: true
    });

    return res.send({
      success: true,
      data: activities,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: maxLimit,
        totalPages: Math.ceil(count / maxLimit)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ONE ----------------------
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const activity = await CallSalesActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'sales_manager',
          attributes: ['id', 'full_name', 'phone', 'role']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'grand_total'],
          required: false
        }
      ]
    });

    if (!activity) {
      return res.status(404).send({ success: false, message: "Утасны харилцаа олдсонгүй" });
    }

    return res.send({ success: true, data: activity });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- UPDATE ----------------------
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      sales_manager_id,
      customer_id,
      customer_name,
      phone_number,
      call_type,
      call_date,
      call_time,
      call_duration_sec,
      call_result,
      interest_level,
      sale_status,
      product,
      quantity,
      price_offer,
      sale_amount,
      order_id,
      next_call_date,
      next_action,
      follow_up_status,
      note
    } = req.body;

    const activity = await CallSalesActivity.findByPk(id);
    if (!activity) {
      return res.status(404).send({ success: false, message: "Утасны харилцаа олдсонгүй" });
    }

    // Update fields
    if (sales_manager_id !== undefined) activity.sales_manager_id = sales_manager_id;
    if (customer_id !== undefined) activity.customer_id = customer_id;
    if (customer_name !== undefined) activity.customer_name = customer_name;
    if (phone_number !== undefined) activity.phone_number = phone_number;
    if (call_type !== undefined) {
      const validCallTypes = ["outgoing", "incoming"];
      if (validCallTypes.includes(call_type)) {
        activity.call_type = call_type;
      } else {
        return res.status(400).send({ success: false, message: "Буруу залгалтын төрөл байна" });
      }
    }
    if (call_date !== undefined) activity.call_date = call_date;
    if (call_time !== undefined) activity.call_time = call_time;
    if (call_duration_sec !== undefined) activity.call_duration_sec = call_duration_sec;
    if (call_result !== undefined) {
      const validCallResults = ["answered", "no_answer", "busy", "rejected"];
      if (validCallResults.includes(call_result)) {
        activity.call_result = call_result;
      } else {
        return res.status(400).send({ success: false, message: "Буруу залгалтын үр дүн байна" });
      }
    }
    if (interest_level !== undefined) {
      const validInterestLevels = ["high", "medium", "low"];
      if (validInterestLevels.includes(interest_level)) {
        activity.interest_level = interest_level;
      } else {
        return res.status(400).send({ success: false, message: "Буруу сонирхлын түвшин байна" });
      }
    }
    if (sale_status !== undefined) {
      const validSaleStatuses = ["sold", "follow_up", "not_interested"];
      if (validSaleStatuses.includes(sale_status)) {
        activity.sale_status = sale_status;
      } else {
        return res.status(400).send({ success: false, message: "Буруу борлуулалтын статус байна" });
      }
    }
    if (product !== undefined) activity.product = product;
    if (quantity !== undefined) activity.quantity = quantity;
    if (price_offer !== undefined) activity.price_offer = price_offer;
    if (sale_amount !== undefined) activity.sale_amount = sale_amount;
    if (order_id !== undefined) activity.order_id = order_id;
    if (next_call_date !== undefined) activity.next_call_date = next_call_date;
    if (next_action !== undefined) {
      const validNextActions = ["call_back", "send_price", "meeting"];
      if (validNextActions.includes(next_action)) {
        activity.next_action = next_action;
      } else {
        return res.status(400).send({ success: false, message: "Буруу дараагийн үйлдэл байна" });
      }
    }
    if (follow_up_status !== undefined) {
      const validFollowUpStatuses = ["pending", "done"];
      if (validFollowUpStatuses.includes(follow_up_status)) {
        activity.follow_up_status = follow_up_status;
      } else {
        return res.status(400).send({ success: false, message: "Буруу follow-up статус байна" });
      }
    }
    if (note !== undefined) activity.note = note;

    await activity.save();

    // Fetch with relations for response
    const activityWithRelations = await CallSalesActivity.findByPk(activity.id, {
      include: [
        {
          model: User,
          as: 'sales_manager',
          attributes: ['id', 'full_name', 'phone', 'role']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'grand_total'],
          required: false
        }
      ]
    });

    return res.send({
      success: true,
      message: "Амжилттай шинэчлэгдлээ",
      data: activityWithRelations || activity,
      id: activity.id,
      updated_at: activity.updatedAt
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ----------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await CallSalesActivity.destroy({ where: { id } });
    if (!result) {
      return res.status(404).send({ success: false, message: "Утасны харилцаа олдсонгүй" });
    }

    return res.send({ success: true, message: "Амжилттай устлаа" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ALL ----------------------
exports.deleteAll = async (req, res) => {
  try {
    const count = await CallSalesActivity.destroy({ where: {}, truncate: false });

    return res.send({
      success: true,
      message: `${count} утасны харилцаа устгагдлаа`,
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- STATISTICS ----------------------
exports.getStatistics = async (req, res) => {
  try {
    const { sales_manager_id, call_date_from, call_date_to } = req.query;

    const where = {};
    if (sales_manager_id) {
      where.sales_manager_id = sales_manager_id;
    }
    if (call_date_from || call_date_to) {
      where.call_date = {};
      if (call_date_from) {
        where.call_date[Op.gte] = call_date_from;
      }
      if (call_date_to) {
        where.call_date[Op.lte] = call_date_to;
      }
    }

    const totalCalls = await CallSalesActivity.count({ where });
    const answeredCalls = await CallSalesActivity.count({ where: { ...where, call_result: 'answered' } });
    const soldCalls = await CallSalesActivity.count({ where: { ...where, sale_status: 'sold' } });
    const followUpCalls = await CallSalesActivity.count({ where: { ...where, follow_up_status: 'pending' } });
    
    const totalSaleAmount = await CallSalesActivity.sum('sale_amount', { where: { ...where, sale_status: 'sold' } }) || 0;

    return res.send({
      success: true,
      data: {
        total_calls: totalCalls,
        answered_calls: answeredCalls,
        sold_calls: soldCalls,
        follow_up_calls: followUpCalls,
        total_sale_amount: parseFloat(totalSaleAmount)
      }
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

