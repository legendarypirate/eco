module.exports = app => {
  const qpay = require("../controllers/qpay.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Create QPay invoice for checkout order
  router.post("/checkout/invoice", qpay.createCheckoutInvoice);

  // Check payment status by invoice ID
  router.get("/check/:invoiceId", qpay.checkPaymentStatus);

  // Get order by invoice ID
  router.get("/order/:invoiceId", qpay.getOrderByInvoice);

  // Webhook endpoint for QPay payment notifications
  router.post("/webhook", qpay.paymentWebhook);

  app.use('/api/qpay', router);
};

