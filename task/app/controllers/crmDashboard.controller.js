const db = require("../models");
const { Sequelize } = db;
const Op = db.Sequelize.Op;

exports.getStats = async (req, res) => {
  try {
    const [dealsWon, dealsLost, dealsOpen, totalCustomers, pendingTasks, recentSms, recentEmails] = await Promise.all([
      db.deals.count({ where: { status: "won" } }),
      db.deals.count({ where: { status: "lost" } }),
      db.deals.count({ where: { status: "open" } }),
      db.customers.count(),
      db.tasksCrm.count({ where: { status: "pending" } }),
      db.smsMessages.findAll({
        limit: 5,
        order: [["created_at", "DESC"]],
        include: [{ model: db.customers, as: "customer", attributes: ["id", "name"] }]
      }),
      db.emailsCrm.findAll({
        limit: 5,
        order: [["created_at", "DESC"]],
        include: [{ model: db.customers, as: "customer", attributes: ["id", "name"] }]
      })
    ]);

    const dealsWonAmount = await db.deals.sum("amount", { where: { status: "won" } });
    const dealsOpenAmount = await db.deals.sum("amount", { where: { status: "open" } });

    res.send({
      deals: { won: dealsWon, lost: dealsLost, open: dealsOpen, wonAmount: dealsWonAmount || 0, openAmount: dealsOpenAmount || 0 },
      totalCustomers,
      pendingTasks,
      recentSms,
      recentEmails
    });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error loading CRM dashboard." });
  }
};
