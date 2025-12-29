module.exports = app => {
  const orders = require("../controllers/order.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Create a new Order
  router.post("/", orders.create);

  // Retrieve all Orders by user ID (requires authentication)
  router.get("/", auth.verifyToken, orders.findAllByUserId);

  // Retrieve a single Order with id
  router.get("/:id", orders.findOne);

  // Retrieve Order by order number
  router.get("/number/:orderNumber", orders.findByOrderNumber);

  // Update an Order with id
  router.patch("/:id", orders.update);

  // Delete an Order with id
  router.delete("/:id", orders.delete);

  // Get all orders (admin)
  router.get("/admin/all", orders.findAll);

  // Update order status
  router.patch("/:id/status", orders.updateStatus);

  // Update payment status
  router.patch("/:id/payment", orders.updatePaymentStatus);

  app.use('/api/order', router);
};