module.exports = (app) => {
  const callSalesActivities = require("../controllers/call_sales_activity.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Create a new Call Sales Activity
  router.post("/", callSalesActivities.create);

  // Retrieve all Call Sales Activities
  router.get("/", callSalesActivities.findAll);

  // Get statistics
  router.get("/statistics", callSalesActivities.getStatistics);

  // Retrieve a single Call Sales Activity with id
  router.get("/:id", callSalesActivities.findOne);

  // Update a Call Sales Activity with id
  router.put("/:id", callSalesActivities.update);

  // Delete a Call Sales Activity with id
  router.delete("/:id", callSalesActivities.delete);

  // Delete all Call Sales Activities
  router.delete("/", callSalesActivities.deleteAll);

  app.use("/api/call-sales-activities", router);
};

