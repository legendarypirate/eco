const db = require("../models");
const Deal = db.deals;
const Op = db.Sequelize.Op;

const validStatuses = ["open", "won", "lost"];

exports.create = async (req, res) => {
  try {
    const { customer_id, deal_name, amount, status } = req.body;
    if (!customer_id || !deal_name || !deal_name.trim()) {
      return res.status(400).send({ message: "Customer ID and deal name are required." });
    }
    const deal = await Deal.create({
      customer_id,
      deal_name: deal_name.trim(),
      amount: amount != null ? parseFloat(amount) : 0,
      status: validStatuses.includes(status) ? status : "open"
    });
    const withCustomer = await Deal.findByPk(deal.id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(withCustomer || deal);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating deal." });
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
    const { count, rows } = await Deal.findAndCountAll({
      where,
      include: [{ model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] }],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving deals." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const deal = await Deal.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.tasksCrm, as: "tasks" },
        { model: db.notesCrm, as: "notes" }
      ]
    });
    if (!deal) return res.status(404).send({ message: "Deal not found." });
    res.send(deal);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving deal." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { customer_id, deal_name, amount, status } = req.body;
    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (deal_name !== undefined) updateData.deal_name = deal_name?.trim();
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined && validStatuses.includes(status)) updateData.status = status;
    const [updated] = await Deal.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Deal not found." });
    const deal = await Deal.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(deal);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating deal." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Deal.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Deal not found." });
    res.send({ message: "Deal deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting deal." });
  }
};
