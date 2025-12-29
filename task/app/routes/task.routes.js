module.exports = (app) => {
  const task = require("../controllers/task.controller.js");

  var router = require("express").Router();

  router.get("/calendar/:year/:month", task.getCalendarTasks);
router.post("/generate-recurring", task.generateRecurringTasks);
  // Kanban column change (status update)
  router.patch("/:id/status", task.updateStatus);

    router.patch("/:id/assign", task.assignToWorker);

      router.patch("/:id/assign-supervisor", task.assignSupervisor);


  // Update calendar event dates
  router.post("/update-event", task.updateEventDates);

  // Get stats
  router.get("/stats", task.getStats);

  // Create task
  router.post("/", task.create);

  // Find all tasks
  router.get("/", task.findAll);

  // Get published tasks (if needed)
  router.get("/published", task.findAllPublished);

  // Find one
  router.get("/:id", task.findOne);

  // Update task
  router.put("/:id", task.update);

  // Delete task
  router.delete("/:id", task.delete);

  // Delete all
  router.delete("/", task.deleteAll);

  app.use("/api/task", router);
};
