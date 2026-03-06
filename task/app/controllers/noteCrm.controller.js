const db = require("../models");
const NoteCrm = db.notesCrm;

exports.create = async (req, res) => {
  try {
    const { customer_id, deal_id, user_id, note_text } = req.body;
    if (!note_text || !note_text.trim()) {
      return res.status(400).send({ message: "Note text is required." });
    }
    const note = await NoteCrm.create({
      customer_id: customer_id || null,
      deal_id: deal_id || null,
      user_id: user_id || null,
      note_text: note_text.trim()
    });
    const withRels = await NoteCrm.findByPk(note.id, {
      include: [
        { model: db.customers, as: "customer", attributes: ["id", "name", "company_name"] },
        { model: db.deals, as: "deal", attributes: ["id", "deal_name"] }
      ]
    });
    res.send(withRels || note);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating note." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { customer_id, deal_id, page = 1, limit = 20 } = req.query;
    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (deal_id) where.deal_id = deal_id;
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await NoteCrm.findAndCountAll({
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
    res.status(500).send({ message: err.message || "Error retrieving notes." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const note = await NoteCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    if (!note) return res.status(404).send({ message: "Note not found." });
    res.send(note);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving note." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { note_text } = req.body;
    if (note_text !== undefined && !note_text?.trim()) {
      return res.status(400).send({ message: "Note text is required." });
    }
    const updateData = {};
    if (note_text !== undefined) updateData.note_text = note_text.trim();
    const [updated] = await NoteCrm.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Note not found." });
    const note = await NoteCrm.findByPk(id, {
      include: [
        { model: db.customers, as: "customer" },
        { model: db.deals, as: "deal" }
      ]
    });
    res.send(note);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating note." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await NoteCrm.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Note not found." });
    res.send({ message: "Note deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting note." });
  }
};
