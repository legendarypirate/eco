const db = require("../models");
const TaskCrm = db.tasksCrm;
const Op = db.Sequelize.Op;

const validStatuses = ["pending", "completed"];

exports.create = async (req, res) => {
  try {
    const { customer_id, deal_id, title, description, assigned_to, due_date, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).send({ message: "Title is required." });
    }
    const task = await TaskCrm.create({
      customer_id: customer_id || null,
      deal_id: deal_id || null,
      title: title.trim(),
      description: description?.trim() || null,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      status: validStatuses.includes(status) ? status : "pending"
    });
    const withRels = await TaskCrm.findByPk(task.id, {
      include: [
        { model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] },
        { model: db.deals, as: "deal", attributes: ["id", "deal_name", "status"] }
      ]
    });
    res.send(withRels || task);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating task." });
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
    const { count, rows } = await TaskCrm.findAndCountAll({
      where,
      include: [
        { model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] },
        { model: db.deals, as: "deal", attributes: ["id", "deal_name", "status"] }
      ],
      order: [["due_date", "ASC"], ["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving tasks." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await TaskCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    if (!task) return res.status(404).send({ message: "Task not found." });
    res.send(task);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving task." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { customer_id, deal_id, title, description, assigned_to, due_date, status } = req.body;
    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id || null;
    if (deal_id !== undefined) updateData.deal_id = deal_id || null;
    if (title !== undefined) updateData.title = title?.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (status !== undefined && validStatuses.includes(status)) updateData.status = status;
    const [updated] = await TaskCrm.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Task not found." });
    const task = await TaskCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    res.send(task);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating task." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await TaskCrm.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Task not found." });
    res.send({ message: "Task deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting task." });
  }
};
