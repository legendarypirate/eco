module.exports = app => {
  const giftSetting = require("../controllers/gift_setting.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Public endpoint - check gift eligibility
  router.post("/check-eligibility", giftSetting.checkGiftEligibility);

  // Admin endpoints - require authentication
  router.get("/", auth.verifyToken, giftSetting.get);
  router.post("/", auth.verifyToken, giftSetting.createOrUpdate);
  router.put("/", auth.verifyToken, giftSetting.createOrUpdate);

  app.use('/api/gift-settings', router);
};

