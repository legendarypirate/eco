module.exports = app => {
  const footer = require("../controllers/footer.controller.js");

  var router = require("express").Router();

  // Get footer data
  router.get("/", footer.findOne);

  // Create or update footer (upsert)
  router.post("/", footer.createOrUpdate);

  // Update footer
  router.patch("/:id", footer.update);

  app.use('/api/footer', router);
};

