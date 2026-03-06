const db = require("../models");
const Customer = db.customers;
const Op = db.Sequelize.Op;
const multer = require("multer");
const xlsx = require("xlsx");

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("file");

const validateEmail = (email) => {
  if (!email) return true;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, address, company_name, company_contact_person, company_email, company_phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).send({ message: "Name is required." });
    }
    if (email && !validateEmail(email)) {
      return res.status(400).send({ message: "Invalid email." });
    }
    if (company_email && !validateEmail(company_email)) {
      return res.status(400).send({ message: "Invalid company email." });
    }
    const customer = await Customer.create({
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      company_name: company_name?.trim() || null,
      company_contact_person: company_contact_person?.trim() || null,
      company_email: company_email?.trim() || null,
      company_phone: company_phone?.trim() || null
    });
    res.send(customer);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating customer." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { company_name: { [Op.iLike]: term } }
      ];
    }
    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset
    });
    res.send({ data: rows, total: count, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving customers." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await Customer.findByPk(id, {
      include: [
        { model: db.contacts, as: "contacts" },
        { model: db.deals, as: "deals" }
      ]
    });
    if (!customer) return res.status(404).send({ message: "Customer not found." });
    res.send(customer);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving customer." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone, address, company_name, company_contact_person, company_email, company_phone } = req.body;
    if (email && !validateEmail(email)) {
      return res.status(400).send({ message: "Invalid email." });
    }
    if (company_email && !validateEmail(company_email)) {
      return res.status(400).send({ message: "Invalid company email." });
    }
    const [updated] = await Customer.update(
      {
        ...(name !== undefined && { name: name?.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(company_name !== undefined && { company_name: company_name?.trim() || null }),
        ...(company_contact_person !== undefined && { company_contact_person: company_contact_person?.trim() || null }),
        ...(company_email !== undefined && { company_email: company_email?.trim() || null }),
        ...(company_phone !== undefined && { company_phone: company_phone?.trim() || null })
      },
      { where: { id } }
    );
    if (updated === 0) return res.status(404).send({ message: "Customer not found." });
    const customer = await Customer.findByPk(id);
    res.send(customer);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating customer." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Customer.destroy({ where: { id } });
    if (!deleted) return res.status(404).send({ message: "Customer not found." });
    res.send({ message: "Customer deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting customer." });
  }
};

// Bulk import customers from Excel (first sheet)
exports.bulkImport = (req, res) => {
  uploadExcel(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).send({ message: err.message || "Error uploading file." });
      }

      if (!req.file) {
        return res.status(400).send({ message: "Excel file is required (field name: file)." });
      }

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).send({ message: "Excel file has no sheets." });
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        return res.status(400).send({ message: "Excel file is empty." });
      }

      const customersToCreate = [];

      for (const row of rows) {
        const normalized = {};
        Object.keys(row).forEach((key) => {
          if (!key) return;
          normalized[key.toString().trim().toLowerCase()] = row[key];
        });

        const name =
          normalized["name"] ||
          normalized["customer name"] ||
          normalized["customer"] ||
          "";

        if (!name || !name.toString().trim()) {
          continue; // skip rows without a name
        }

        const email = normalized["email"] || "";
        const companyEmail = normalized["company_email"] || normalized["company email"] || "";

        if (email && !validateEmail(email)) continue;
        if (companyEmail && !validateEmail(companyEmail)) continue;

        customersToCreate.push({
          name: name.toString().trim(),
          email: email ? email.toString().trim() : null,
          phone: (normalized["phone"] || "").toString().trim() || null,
          address: (normalized["address"] || "").toString().trim() || null,
          company_name: (normalized["company_name"] || normalized["company name"] || "").toString().trim() || null,
          company_contact_person: (normalized["company_contact_person"] || normalized["company contact person"] || "").toString().trim() || null,
          company_email: companyEmail ? companyEmail.toString().trim() : null,
          company_phone: (normalized["company_phone"] || normalized["company phone"] || "").toString().trim() || null,
        });
      }

      if (!customersToCreate.length) {
        return res.status(400).send({ message: "No valid rows found in Excel file." });
      }

      const created = await Customer.bulkCreate(customersToCreate);
      res.send({
        message: "Customers imported successfully.",
        imported: created.length,
      });
    } catch (e) {
      console.error("Bulk import error:", e);
      res.status(500).send({ message: e.message || "Error importing customers." });
    }
  });
};
