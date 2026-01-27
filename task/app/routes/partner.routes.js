module.exports = app => {
  const partners = require("../controllers/partner.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Public endpoint - get active partners
  router.get("/active", partners.findActive);

  // Admin endpoints - require authentication
  router.post("/", auth.verifyToken, partners.create);
  router.get("/", auth.verifyToken, partners.findAll);
  router.get("/:id", auth.verifyToken, partners.findOne);
  router.patch("/:id", auth.verifyToken, partners.update);
  router.delete("/:id", auth.verifyToken, partners.delete);

  app.use('/api/partners', router);
};

