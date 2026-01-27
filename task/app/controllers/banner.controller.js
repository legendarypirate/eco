const db = require("../models");
const Banner = db.banners;
const Op = db.Sequelize.Op;

// Create and Save a new Banner
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.image) {
      return res.status(400).send({
        message: "Image URL is required!"
      });
    }

    // Validate Cloudinary URL
    if (!req.body.image.includes('cloudinary.com')) {
      return res.status(400).send({
        message: "Image must be uploaded to Cloudinary!"
      });
    }

    // Get the max order value
    const maxOrderBanner = await Banner.findOne({
      order: [['order', 'DESC']],
      attributes: ['order']
    });
    
    const order = maxOrderBanner && maxOrderBanner.order !== null 
      ? maxOrderBanner.order + 1 
      : 1;

    const banner = {
      text: req.body.text || "",
      link: req.body.link || "",
      image: req.body.image,
      order: order,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const data = await Banner.create(banner);
    res.send(data);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating the Banner."
    });
  }
};

// Retrieve all Banners
exports.findAll = async (req, res) => {
  try {
    const data = await Banner.findAll({
      order: [['order', 'ASC']]
    });
    res.send(data);
  } catch (error) {
    console.error("Error retrieving banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving banners."
    });
  }
};

// Retrieve all active Banners (for public API)
exports.findAllPublished = async (req, res) => {
  try {
    const data = await Banner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']],
      attributes: ['id', 'text', 'link', 'image', 'order']
    });
    res.send(data);
  } catch (error) {
    console.error("Error retrieving active banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving active banners."
    });
  }
};

// Find a single Banner with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Banner.findByPk(id);
    
    if (!data) {
      return res.status(404).send({
        message: `Banner with id=${id} was not found.`
      });
    }
    
    res.send(data);
  } catch (error) {
    console.error("Error retrieving banner:", error);
    res.status(500).send({
      message: error.message || `Error retrieving Banner with id=${req.params.id}`
    });
  }
};

// Update a Banner by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate Cloudinary URL if image is being updated
    if (req.body.image && !req.body.image.includes('cloudinary.com')) {
      return res.status(400).send({
        message: "Image must be uploaded to Cloudinary!"
      });
    }

    const [updated] = await Banner.update(req.body, {
      where: { id: id }
    });

    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot update Banner with id=${id}. Banner was not found!`
      });
    }

    const data = await Banner.findByPk(id);
    res.send({
      message: "Banner was updated successfully.",
      data: data
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).send({
      message: error.message || `Error updating Banner with id=${req.params.id}`
    });
  }
};

// Delete a Banner with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Banner.destroy({
      where: { id: id }
    });

    if (deleted === 0) {
      return res.status(404).send({
        message: `Cannot delete Banner with id=${id}. Banner was not found!`
      });
    }

    res.send({
      message: "Banner was deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).send({
      message: error.message || `Could not delete Banner with id=${id}`
    });
  }
};

// Delete all Banners from the database
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await Banner.destroy({
      where: {},
      truncate: false
    });

    res.send({
      message: `${deleted} Banners were deleted successfully!`
    });
  } catch (error) {
    console.error("Error deleting all banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while removing all banners."
    });
  }
};

