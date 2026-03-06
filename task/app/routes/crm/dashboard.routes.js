module.exports = (app) => {
  const controller = require("../../controllers/crmDashboard.controller.js");
  const router = require("express").Router();
  router.get("/", controller.getStats);
  app.use("/api/crm/dashboard", router);
};
