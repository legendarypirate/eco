module.exports = (app) => {
  const vendors = require("../controllers/vendor.controller.js");

  // Create a new Vendor
  app.post("/api/vendors", vendors.create);

  // Retrieve all Vendors
  app.get("/api/vendors", vendors.findAll);

  // Retrieve a single Vendor with id
  app.get("/api/vendors/:id", vendors.findOne);

  // Retrieve vendor by user_id
  app.get("/api/vendors/user/:userId", vendors.findByUserId);

  // Get vendor statistics
  app.get("/api/vendors/:id/stats", vendors.getStats);

  // Update a Vendor with id
  app.put("/api/vendors/:id", vendors.update);

  // Delete a Vendor with id
  app.delete("/api/vendors/:id", vendors.delete);
};

