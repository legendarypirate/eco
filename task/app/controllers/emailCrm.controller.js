const db = require("../models");
const EmailCrm = db.emailsCrm;

const validStatuses = ["sent", "failed", "draft"];

exports.create = async (req, res) => {
  try {
    const { customer_id, subject, body, status } = req.body;
    if (!customer_id) {
      return res.status(400).send({ message: "Customer ID is required." });
    }
    const email = await EmailCrm.create({
      customer_id,
      subject: subject?.trim() || null,
      body: body?.trim() || null,
      status: validStatuses.includes(status) ? status : "draft",
      sent_at: status === "sent" ? new Date() : null
    });
    const withCustomer = await EmailCrm.findByPk(email.id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(withCustomer || email);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating email." });
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
    const { count, rows } = await EmailCrm.findAndCountAll({
      where,
      include: [{ model: db.customers, as: "customer", attributes: ["id", "name", "email", "company_name"] }],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving emails." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const email = await EmailCrm.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    if (!email) return res.status(404).send({ message: "Email not found." });
    res.send(email);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving email." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { subject, body, status } = req.body;
    const updateData = {};
    if (subject !== undefined) updateData.subject = subject?.trim() || null;
    if (body !== undefined) updateData.body = body?.trim() || null;
    if (status !== undefined && validStatuses.includes(status)) {
      updateData.status = status;
      if (status === "sent") updateData.sent_at = new Date();
    }
    const [updated] = await EmailCrm.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Email not found." });
    const email = await EmailCrm.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(email);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating email." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await EmailCrm.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Email not found." });
    res.send({ message: "Email deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting email." });
  }
};
