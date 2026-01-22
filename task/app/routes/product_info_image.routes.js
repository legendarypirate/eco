module.exports = app => {
  const productInfoImages = require("../controllers/product_info_image.controller");

  var router = require("express").Router();

  // Create a new ProductInfoImage
  router.post("/", productInfoImages.create);

  // Bulk create ProductInfoImages
  router.post("/bulk", productInfoImages.bulkCreate);

  // Retrieve all ProductInfoImages for a product
  router.get("/product/:productId", productInfoImages.findByProduct);

  // Update a ProductInfoImage with id
  router.patch("/:id", productInfoImages.update);

  // Delete a ProductInfoImage with id
  router.delete("/:id", productInfoImages.delete);

  // Delete all ProductInfoImages for a product
  router.delete("/product/:productId", productInfoImages.deleteByProduct);

  app.use('/api/product-info-images', router);
};

