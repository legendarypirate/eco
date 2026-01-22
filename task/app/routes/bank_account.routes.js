module.exports = app => {
  const bankAccount = require("../controllers/bank_account.controller.js");
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  // Public endpoint - get all active bank accounts
  router.get("/active", bankAccount.getAllActive);

  // Admin endpoints - require authentication
  router.get("/", auth.verifyToken, bankAccount.getAll);
  router.get("/:id", auth.verifyToken, bankAccount.getById);
  router.post("/", auth.verifyToken, bankAccount.create);
  router.put("/:id", auth.verifyToken, bankAccount.update);
  router.delete("/:id", auth.verifyToken, bankAccount.delete);

  app.use('/api/bank-accounts', router);
};

