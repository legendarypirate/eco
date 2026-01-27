module.exports = app => {
  const coupon = require("../controllers/coupon.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Public endpoint - validate coupon
  router.post("/validate", coupon.validate);

  // Admin endpoints - require authentication
  router.get("/stats", auth.verifyToken, coupon.getStatistics);
  router.get("/", auth.verifyToken, coupon.getAll);
  router.get("/:id", auth.verifyToken, coupon.getById);
  router.post("/", auth.verifyToken, coupon.create);
  router.put("/:id", auth.verifyToken, coupon.update);
  router.delete("/:id", auth.verifyToken, coupon.delete);

  app.use('/api/coupons', router);
};

