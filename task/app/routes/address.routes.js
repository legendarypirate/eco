module.exports = app => {
  const address = require("../controllers/address.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Get all addresses for authenticated user
  router.get("/", auth.verifyToken, address.getUserAddresses);

  // Create a new address for authenticated user
  router.post("/", auth.verifyToken, address.createAddress);

  // Update an address by id
  router.put("/:id", auth.verifyToken, address.updateAddress);

  // Delete an address by id
  router.delete("/:id", auth.verifyToken, address.deleteAddress);

  app.use('/api/user/addresses', router);
};

