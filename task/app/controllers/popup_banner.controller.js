const db = require("../models");
const PopupBanner = db.popup_banners;

// Create and Save a new Popup Banner
exports.create = async (req, res) => {
  try {
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
    const maxOrderBanner = await PopupBanner.findOne({
      order: [['order', 'DESC']],
      attributes: ['order']
    });
    
    const order = maxOrderBanner && maxOrderBanner.order !== null 
      ? maxOrderBanner.order + 1 
      : 1;

    const popupBanner = {
      text: req.body.text || "",
      link: req.body.link || "",
      image: req.body.image,
      order: order,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const data = await PopupBanner.create(popupBanner);
    res.send(data);
  } catch (error) {
    console.error("Error creating popup banner:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating the Popup Banner."
    });
  }
};

// Retrieve all Popup Banners
exports.findAll = async (req, res) => {
  try {
    const data = await PopupBanner.findAll({
      order: [['order', 'ASC']]
    });
    res.send(data);
  } catch (error) {
    console.error("Error retrieving popup banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving popup banners."
    });
  }
};

// Retrieve all active Popup Banners (for public API)
exports.findAllPublished = async (req, res) => {
  try {
    const data = await PopupBanner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']],
      attributes: ['id', 'text', 'link', 'image', 'order']
    });
    res.send(data);
  } catch (error) {
    console.error("Error retrieving active popup banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving active popup banners."
    });
  }
};

// Find a single Popup Banner with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await PopupBanner.findByPk(id);
    
    if (!data) {
      return res.status(404).send({
        message: `Popup Banner with id=${id} was not found.`
      });
    }
    
    res.send(data);
  } catch (error) {
    console.error("Error retrieving popup banner:", error);
    res.status(500).send({
      message: error.message || `Error retrieving Popup Banner with id=${req.params.id}`
    });
  }
};

// Update a Popup Banner by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate Cloudinary URL if image is being updated
    if (req.body.image && !req.body.image.includes('cloudinary.com')) {
      return res.status(400).send({
        message: "Image must be uploaded to Cloudinary!"
      });
    }

    const [updated] = await PopupBanner.update(req.body, {
      where: { id: id }
    });

    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot update Popup Banner with id=${id}. Popup Banner was not found!`
      });
    }

    const data = await PopupBanner.findByPk(id);
    res.send({
      message: "Popup Banner was updated successfully.",
      data: data
    });
  } catch (error) {
    console.error("Error updating popup banner:", error);
    res.status(500).send({
      message: error.message || `Error updating Popup Banner with id=${req.params.id}`
    });
  }
};

// Delete a Popup Banner with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await PopupBanner.destroy({
      where: { id: id }
    });

    if (deleted === 0) {
      return res.status(404).send({
        message: `Cannot delete Popup Banner with id=${id}. Popup Banner was not found!`
      });
    }

    res.send({
      message: "Popup Banner was deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting popup banner:", error);
    res.status(500).send({
      message: error.message || `Could not delete Popup Banner with id=${id}`
    });
  }
};

// Delete all Popup Banners from the database
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await PopupBanner.destroy({
      where: {},
      truncate: false
    });

    res.send({
      message: `${deleted} Popup Banners were deleted successfully!`
    });
  } catch (error) {
    console.error("Error deleting all popup banners:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while removing all popup banners."
    });
  }
};

