module.exports = (app) => {
  const controller = require("../../controllers/smsMessage.controller.js");
  const router = require("express").Router();
  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.get("/:id", controller.findOne);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);
  app.use("/api/crm/sms", router);
};
