const db = require("../models");
const CrmProduct = db.crmProducts;

exports.create = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).send({ message: "Name is required." });
    }
    const product = await CrmProduct.create({
      name: name.trim(),
      description: description?.trim() || null,
      price: price != null ? parseFloat(price) : 0
    });
    res.send(product);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating product." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};
    if (search && search.trim()) {
      where.name = { [db.Sequelize.Op.iLike]: `%${search.trim()}%` };
    }
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await CrmProduct.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving products." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await CrmProduct.findByPk(id);
    if (!product) return res.status(404).send({ message: "Product not found." });
    res.send(product);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving product." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name?.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (price !== undefined) updateData.price = parseFloat(price);
    const [updated] = await CrmProduct.update(updateData, { where: { id } });
    if (updated === 0) return res.status(404).send({ message: "Product not found." });
    const product = await CrmProduct.findByPk(id);
    res.send(product);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating product." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await CrmProduct.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Product not found." });
    res.send({ message: "Product deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting product." });
  }
};
