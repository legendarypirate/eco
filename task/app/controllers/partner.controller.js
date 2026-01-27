const db = require("../models");
const Partner = db.partners;
const Op = db.Sequelize.Op;

// Create and save a new Partner
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name || !req.body.logo) {
      return res.status(400).send({
        message: "Name and logo are required"
      });
    }

    // Create a Partner
    const partner = {
      name: req.body.name,
      logo: req.body.logo,
      websiteUrl: req.body.websiteUrl || req.body.website_url || null,
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : (req.body.is_active !== undefined ? req.body.is_active : true)
    };

    // Save Partner in the database
    const createdPartner = await Partner.create(partner);
    res.send(createdPartner);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Partner."
    });
  }
};

// Retrieve all Partners from the database
exports.findAll = async (req, res) => {
  try {
    const { is_active, isActive } = req.query;
    const where = {};

    // Filter by active status
    if (is_active !== undefined || isActive !== undefined) {
      where.isActive = is_active === 'true' || isActive === 'true' || is_active === true || isActive === true;
    }

    const partners = await Partner.findAll({
      where: where,
      order: [['order', 'ASC'], ['created_at', 'DESC']]
    });

    res.send(partners);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving partners."
    });
  }
};

// Find a single Partner with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const partner = await Partner.findByPk(id);

    if (!partner) {
      return res.status(404).send({
        message: `Partner with id=${id} was not found.`
      });
    }

    res.send(partner);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Partner with id=${req.params.id}`
    });
  }
};

// Update a Partner by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const updateData = {};
    
    // Only include fields that are provided
    const fields = ['name', 'logo', 'websiteUrl', 'website_url', 'order', 'isActive', 'is_active'];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'website_url') {
          updateData.websiteUrl = req.body[field];
        } else if (field === 'is_active') {
          updateData.isActive = req.body[field];
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const [updated] = await Partner.update(updateData, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).send({
        message: `Cannot update Partner with id=${id}. Maybe Partner was not found!`
      });
    }

    // Return updated partner
    const updatedPartner = await Partner.findByPk(id);
    res.send(updatedPartner);
  } catch (err) {
    res.status(500).send({
      message: `Error updating Partner with id=${req.params.id}. Error: ${err.message}`
    });
  }
};

// Delete a Partner with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Partner.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).send({
        message: `Cannot delete Partner with id=${id}. Maybe Partner was not found!`
      });
    }

    res.send({
      message: "Partner was deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Partner with id=${req.params.id}`
    });
  }
};

// Get active partners for public display
exports.findActive = async (req, res) => {
  try {
    const partners = await Partner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['created_at', 'DESC']],
      attributes: ['id', 'name', 'logo', 'websiteUrl', 'order']
    });

    res.send(partners);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving active partners."
    });
  }
};

