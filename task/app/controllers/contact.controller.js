const db = require("../models");
const Contact = db.contacts;
const Op = db.Sequelize.Op;

const validateEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.create = async (req, res) => {
  try {
    const { customer_id, name, email, phone, position } = req.body;
    if (!customer_id || !name || !name.trim()) {
      return res.status(400).send({ message: "Customer ID and name are required." });
    }
    if (email && !validateEmail(email)) {
      return res.status(400).send({ message: "Invalid email." });
    }
    const contact = await Contact.create({
      customer_id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      position: position?.trim() || null
    });
    const withCustomer = await Contact.findByPk(contact.id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(withCustomer || contact);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating contact." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { customer_id, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customer_id) where.customer_id = customer_id;
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await Contact.findAndCountAll({
      where,
      include: [{ model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] }],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving contacts." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const contact = await Contact.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    if (!contact) return res.status(404).send({ message: "Contact not found." });
    res.send(contact);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving contact." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { customer_id, name, email, phone, position } = req.body;
    if (email && !validateEmail(email)) {
      return res.status(400).send({ message: "Invalid email." });
    }
    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (name !== undefined) updateData.name = name?.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (position !== undefined) updateData.position = position?.trim() || null;
    const [updated] = await Contact.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Contact not found." });
    const contact = await Contact.findByPk(id, { include: [{ model: db.customers, as: "customer" }] });
    res.send(contact);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating contact." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Contact.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Contact not found." });
    res.send({ message: "Contact deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting contact." });
  }
};
