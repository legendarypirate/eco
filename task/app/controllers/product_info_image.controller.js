const db = require("../models");
const ProductInfoImage = db.product_info_images;
const Op = db.Sequelize.Op;

// Create and Save a new ProductInfoImage
exports.create = async (req, res) => {
  try {
    if (!req.body.productId || !req.body.imageUrl) {
      return res.status(400).send({
        message: "Product ID and image URL are required!"
      });
    }

    // Check if product already has 5 images
    const existingCount = await ProductInfoImage.count({
      where: { productId: req.body.productId }
    });

    if (existingCount >= 5) {
      return res.status(400).send({
        message: "Maximum 5 info images allowed per product!"
      });
    }

    const productInfoImage = {
      productId: req.body.productId,
      imageUrl: req.body.imageUrl,
      order: req.body.order || existingCount
    };

    const createdImage = await ProductInfoImage.create(productInfoImage);
    res.send(createdImage);
  } catch (err) {
    console.error('Error creating product info image:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Product Info Image."
    });
  }
};

// Retrieve all ProductInfoImages for a product
exports.findByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const images = await ProductInfoImage.findAll({
      where: { productId: productId },
      order: [['order', 'ASC'], ['created_at', 'ASC']]
    });

    res.send(images);
  } catch (err) {
    console.error('Error retrieving product info images:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving product info images."
    });
  }
};

// Update a ProductInfoImage by the id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const updateData = {};
    if (req.body.imageUrl) updateData.imageUrl = req.body.imageUrl;
    if (req.body.order !== undefined) updateData.order = req.body.order;

    const [updated] = await ProductInfoImage.update(updateData, {
      where: { id: id }
    });

    if (updated) {
      const updatedImage = await ProductInfoImage.findByPk(id);
      res.send(updatedImage);
    } else {
      res.status(404).send({
        message: `Cannot update ProductInfoImage with id=${id}. Maybe it was not found!`
      });
    }
  } catch (err) {
    console.error('Error updating product info image:', err);
    res.status(500).send({
      message: "Error updating ProductInfoImage with id=" + req.params.id
    });
  }
};

// Delete a ProductInfoImage with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await ProductInfoImage.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "ProductInfoImage was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete ProductInfoImage with id=${id}. Maybe it was not found!`
      });
    }
  } catch (err) {
    console.error('Error deleting product info image:', err);
    res.status(500).send({
      message: "Could not delete ProductInfoImage with id=" + req.params.id
    });
  }
};

// Delete all ProductInfoImages for a product
exports.deleteByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const deleted = await ProductInfoImage.destroy({
      where: { productId: productId }
    });

    res.send({
      message: `${deleted} ProductInfoImages were deleted successfully!`
    });
  } catch (err) {
    console.error('Error deleting product info images:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while removing all product info images."
    });
  }
};

// Bulk create ProductInfoImages
exports.bulkCreate = async (req, res) => {
  try {
    if (!req.body.productId || !req.body.images || !Array.isArray(req.body.images)) {
      return res.status(400).send({
        message: "Product ID and images array are required!"
      });
    }

    // Enforce maximum 5 images per product
    if (req.body.images.length > 5) {
      return res.status(400).send({
        message: "Maximum 5 info images allowed per product!"
      });
    }

    const productId = req.body.productId;
    
    // Limit to 5 images
    const limitedImages = req.body.images.slice(0, 5);
    
    const images = limitedImages.map((imageUrl, index) => ({
      productId: productId,
      imageUrl: imageUrl,
      order: index
    }));

    const createdImages = await ProductInfoImage.bulkCreate(images);
    res.send(createdImages);
  } catch (err) {
    console.error('Error bulk creating product info images:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while creating product info images."
    });
  }
};

