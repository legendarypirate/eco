module.exports = (app) => {
  const financial = require("../controllers/financial.controller.js");

  // Get financial reports
  app.get("/api/financial/reports", financial.getReports);

  // Get vendor financial dashboard
  app.get("/api/financial/vendor/:vendorId/dashboard", financial.getVendorDashboard);

  // Create payout request
  app.post("/api/financial/payouts", financial.createPayout);

  // Get all payouts
  app.get("/api/financial/payouts", financial.getPayouts);

  // Process payout (admin)
  app.put("/api/financial/payouts/:payoutId/process", financial.processPayout);
};

