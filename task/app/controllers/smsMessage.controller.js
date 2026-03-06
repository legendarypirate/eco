const db = require("../models");
const SmsMessage = db.smsMessages;

const validStatuses = ["sent", "pending", "failed"];

exports.create = async (req, res) => {
  try {
    const { customer_id, message, status } = req.body;
    if (!customer_id || !message || !message.trim()) {
      return res.status(400).send({ message: "Customer ID and message are required." });
    }
    const sms = await SmsMessage.create({
      customer_id,
      message: message.trim(),
      status: validStatuses.includes(status) ? status : "pending",
      sent_at: status === "sent" ? new Date() : null
    });
    const withCustomer = await SmsMessage.findByPk(sms.id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(withCustomer || sms);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating SMS message." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { customer_id, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (status && validStatuses.includes(status)) where.status = status;
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await SmsMessage.findAndCountAll({
      where,
      include: [{ model: db.customers, as: "customer", attributes: ["id", "name", "phone", "company_name"] }],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving SMS messages." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const sms = await SmsMessage.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    if (!sms) return res.status(404).send({ message: "SMS message not found." });
    res.send(sms);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving SMS message." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { message, status } = req.body;
    const updateData = {};
    if (message !== undefined) updateData.message = message?.trim();
    if (status !== undefined && validStatuses.includes(status)) {
      updateData.status = status;
      if (status === "sent") updateData.sent_at = new Date();
    }
    const [updated] = await SmsMessage.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "SMS message not found." });
    const sms = await SmsMessage.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(sms);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating SMS message." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await SmsMessage.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "SMS message not found." });
    res.send({ message: "SMS message deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting SMS message." });
  }
};
