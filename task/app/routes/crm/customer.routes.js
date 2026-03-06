module.exports = (app) => {
  const controller = require("../../controllers/customer.controller.js");
  const router = require("express").Router();

  // Bulk import (Excel)
  router.post("/import", controller.bulkImport);

  // Download Excel template
  router.get("/template", controller.downloadTemplate);

  // CRUD
  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.get("/:id", controller.findOne);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);

  app.use("/api/crm/customers", router);
};
