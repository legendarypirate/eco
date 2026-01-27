module.exports = (app) => {
  const complaints = require("../controllers/complaint.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Create a new Complaint
  router.post("/", complaints.create);

  // Retrieve all Complaints
  router.get("/", complaints.findAll);

  // Retrieve a single Complaint with id
  router.get("/:id", complaints.findOne);

  // Update a Complaint with id
  router.put("/:id", complaints.update);

  // Delete a Complaint with id
  router.delete("/:id", complaints.delete);

  // Delete all Complaints
  router.delete("/", complaints.deleteAll);

  app.use("/api/complaints", router);
};

