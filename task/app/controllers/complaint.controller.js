const db = require("../models");
const Complaint = db.complaints;
const Op = db.Sequelize.Op;

// ---------------------- CREATE ----------------------
exports.create = async (req, res) => {
  try {
    const { employee_name, store_name, store_phone, content, status, resolved_comment } = req.body;

    // Validate required fields
    if (!employee_name) {
      return res.status(400).send({ success: false, message: "Ажилтны нэр оруулна уу" });
    }
    if (!store_name) {
      return res.status(400).send({ success: false, message: "Дэлгүүрийн нэр оруулна уу" });
    }
    if (!store_phone) {
      return res.status(400).send({ success: false, message: "Дэлгүүрийн утас оруулна уу" });
    }
    if (!content) {
      return res.status(400).send({ success: false, message: "Гомдлын агуулга оруулна уу" });
    }

    const complaint = await Complaint.create({
      employee_name,
      store_name,
      store_phone,
      content,
      status: status || "pending",
      resolved_comment: resolved_comment || null,
    });

    return res.send({ 
      success: true, 
      data: complaint,
      id: complaint.id,
      created_at: complaint.createdAt,
      updated_at: complaint.updatedAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ALL ----------------------
exports.findAll = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.send({ success: true, data: complaints });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ONE ----------------------
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const complaint = await Complaint.findByPk(id);

    if (!complaint) {
      return res.status(404).send({ success: false, message: "Гомдол олдсонгүй" });
    }

    return res.send({ success: true, data: complaint });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- UPDATE ----------------------
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { employee_name, store_name, store_phone, content, status, resolved_comment } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).send({ success: false, message: "Гомдол олдсонгүй" });
    }

    // Update fields
    if (employee_name !== undefined) complaint.employee_name = employee_name;
    if (store_name !== undefined) complaint.store_name = store_name;
    if (store_phone !== undefined) complaint.store_phone = store_phone;
    if (content !== undefined) complaint.content = content;
    if (status !== undefined) {
      const validStatuses = ["pending", "in_progress", "resolved", "closed"];
      if (validStatuses.includes(status)) {
        complaint.status = status;
      } else {
        return res.status(400).send({ success: false, message: "Буруу статус байна" });
      }
    }
    if (resolved_comment !== undefined) complaint.resolved_comment = resolved_comment;

    await complaint.save();

    return res.send({ 
      success: true, 
      message: "Амжилттай шинэчлэгдлээ",
      data: complaint,
      id: complaint.id,
      updated_at: complaint.updatedAt
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ----------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Complaint.destroy({ where: { id } });
    if (!result) {
      return res.status(404).send({ success: false, message: "Гомдол олдсонгүй" });
    }

    return res.send({ success: true, message: "Амжилттай устлаа" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ALL ----------------------
exports.deleteAll = async (req, res) => {
  try {
    const count = await Complaint.destroy({ where: {}, truncate: false });

    return res.send({
      success: true,
      message: `${count} гомдол устгагдлаа`,
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

