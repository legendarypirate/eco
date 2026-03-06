const db = require("../models");
const InvoiceCrm = db.invoicesCrm;

const validStatuses = ["paid", "unpaid", "pending"];

exports.create = async (req, res) => {
  try {
    const { customer_id, deal_id, amount, status, issued_at } = req.body;
    if (!customer_id) {
      return res.status(400).send({ message: "Customer ID is required." });
    }
    const invoice = await InvoiceCrm.create({
      customer_id,
      deal_id: deal_id || null,
      amount: amount != null ? parseFloat(amount) : 0,
      status: validStatuses.includes(status) ? status : "pending",
      issued_at: issued_at ? new Date(issued_at) : new Date(),
      paid_at: status === "paid" ? new Date() : null
    });
    const withRels = await InvoiceCrm.findByPk(invoice.id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    res.send(withRels || invoice);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating invoice." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { customer_id, deal_id, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (deal_id) where.deal_id = deal_id;
    if (status && validStatuses.includes(status)) where.status = status;
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await InvoiceCrm.findAndCountAll({
      where,
      include: [
        { model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] },
        { model: db.deals, as: "deal", attributes: ["id", "deal_name"] }
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving invoices." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const invoice = await InvoiceCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    if (!invoice) return res.status(404).send({ message: "Invoice not found." });
    res.send(invoice);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving invoice." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { customer_id, deal_id, amount, status, issued_at, paid_at } = req.body;
    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (deal_id !== undefined) updateData.deal_id = deal_id || null;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined && validStatuses.includes(status)) {
      updateData.status = status;
      if (status === "paid") updateData.paid_at = new Date();
    }
    if (issued_at !== undefined) updateData.issued_at = issued_at ? new Date(issued_at) : null;
    if (paid_at !== undefined) updateData.paid_at = paid_at ? new Date(paid_at) : null;
    const [updated] = await InvoiceCrm.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Invoice not found." });
    const invoice = await InvoiceCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    res.send(invoice);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating invoice." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await InvoiceCrm.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Invoice not found." });
    res.send({ message: "Invoice deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting invoice." });
  }
};
