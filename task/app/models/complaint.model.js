module.exports = (sequelize, Sequelize) => {
  const Complaint = sequelize.define("complaint", {
    employee_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    store_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    store_phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("pending", "in_progress", "resolved", "closed"),
      defaultValue: "pending",
    },
    resolved_comment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return Complaint;
};

