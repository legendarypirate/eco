module.exports = (app) => {
  const analytics = require("../controllers/analytics.controller.js");

  // Get sales analytics
  app.get("/api/analytics/sales", analytics.getSalesAnalytics);

  // Get real-time sales data
  app.get("/api/analytics/realtime", analytics.getRealtimeSales);
};

