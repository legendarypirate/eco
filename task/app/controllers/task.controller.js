const db = require("../models");
const Task = db.tasks;
const Op = db.Sequelize.Op;
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
// ---------------------- CREATE ----------------------
exports.create = async (req, res) => {
  try {
    const { title, description, created_by, assigned_to, supervisor_id, priority, status, image, due_date, frequency_type, frequency_value } = req.body;

    if (!title) {
      return res.status(400).send({ success: false, message: "Гарчиг оруулна уу" });
    }

    const task = await Task.create({
      title,
      description,
      created_by: created_by || req.user?.userId || 1, // req.user байхгүй бол default утга
      assigned_to,
      supervisor_id,
      priority: priority || "normal",
      status: status || "pending",
      image,
      due_date,
      frequency_type: frequency_type || "none",
      frequency_value: frequency_type === "none" ? null : frequency_value
    });

    return res.send({ success: true, data: task });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ALL ----------------------
exports.findAll = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.send({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ONE ----------------------
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    return res.send({ success: true, data: task });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- UPDATE ----------------------
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Task.update(req.body, { where: { id } });
    if (result[0] === 0) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    return res.send({ success: true, message: "Амжилттай шинэчлэгдлээ" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ----------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Task.destroy({ where: { id } });
    if (!result) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    return res.send({ success: true, message: "Амжилттай устлаа" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ALL ----------------------
exports.deleteAll = async (req, res) => {
  try {
    const count = await Task.destroy({ where: {}, truncate: false });

    return res.send({
      success: true,
      message: `${count} таск устгагдлаа`,
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND PUBLISHED (optional) ----------------------
exports.findAllPublished = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { status: "done" },
    });

    return res.send({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// Add this function to your task.controller.js file

// Assign supervisor to task
exports.assignSupervisor = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { supervisor_id } = req.body;

    // Validate input
    if (!supervisor_id) {
      return res.status(400).json({
        success: false,
        message: "Supervisor ID is required"
      });
    }

    // First, verify that the supervisor exists and has the right role
    const db = require("../models");
    const User = db.users;

    const supervisor = await User.findByPk(supervisor_id);
    
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    // Check if user has supervisor role
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'Supervisor') {
      return res.status(400).json({
        success: false,
        message: "User is not a supervisor"
      });
    }

    // Update the task with supervisor_id
    const [updated] = await db.tasks.update(
      { supervisor_id },
      { where: { id: taskId } }
    );

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Fetch the updated task to return
    const updatedTask = await db.tasks.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'phone', 'role']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'full_name', 'phone', 'role']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'full_name', 'phone', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: "Supervisor assigned successfully",
      data: updatedTask
    });
  } catch (error) {
    console.error("Error assigning supervisor:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning supervisor",
      error: error.message
    });
  }
};

// ---------------------- UPDATE STATUS (KANBAN DRAG) ----------------------
exports.updateStatus = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "done", "verified", "cancelled"];
    if (!validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Буруу статус байна!" 
      });
    }

    const task = await Task.findByPk(id, { transaction: t });
    if (!task) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Даалгавар олдсонгүй" 
      });
    }

    const updateData = { status };

    // ✅ Only require image when status changes to "done"
    if (status === "done" && !req.file) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "'Дууссан' статус руу шилжихэд зураг шаардлагатай!" 
      });
    }

    // ✅ Handle image upload if file exists
    if (req.file) {
      // Create temporary file
      const tempPath = path.join(__dirname, `../tmp/${Date.now()}.png`);
      const tmpDir = path.dirname(tempPath);
      
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Write buffer to file
      fs.writeFileSync(tempPath, req.file.buffer);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(tempPath, {
        folder: "tasks",
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      updateData.image = result.secure_url;
    }

    // Update task
    await task.update(updateData, { transaction: t });
    
    await t.commit();

    res.status(200).json({ 
      success: true, 
      message: "Төлөв амжилттай шинэчлэгдлээ", 
      data: task 
    });

  } catch (err) {
    await t.rollback();
    console.error("🔥 Төлөв шинэчлэхэд алдаа гарлаа:", err);
    res.status(500).json({ 
      success: false, 
      message: "Серверийн алдаа: " + err.message 
    });
  }
};
// ---------------------- UPDATE EVENT DATES (calendar) ----------------------
exports.updateEventDates = async (req, res) => {
  try {
    const { id, due_date } = req.body;

    await Task.update({ due_date }, { where: { id } });

    return res.send({ success: true, message: "Огноо шинэчлэгдлээ" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- STATS ----------------------
exports.getStats = async (req, res) => {
  try {
    const total = await Task.count();
    const pending = await Task.count({ where: { status: "pending" } });
    const in_progress = await Task.count({ where: { status: "in_progress" } });
    const done = await Task.count({ where: { status: "done" } });
    const verified = await Task.count({ where: { status: "verified" } });
    const cancelled = await Task.count({ where: { status: "cancelled" } });

    return res.send({
      success: true,
      data: { total, pending, in_progress, done, verified, cancelled },
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- CALENDAR TASKS ----------------------
exports.getCalendarTasks = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Бүх task-уудыг авах
    const tasks = await Task.findAll();

    // Календарт харуулах task-уудыг бэлтгэх
    const calendarTasks = [];
    
    for (const task of tasks) {
      if (task.frequency_type === 'none') {
        // Энгийн task - due_date шалгах
        if (task.due_date && isDateInMonth(task.due_date, year, month)) {
          calendarTasks.push({
            ...task.toJSON(),
            is_generated: false
          });
        }
      } else {
        // Давтамжтай task - бүх өдрүүдэд үүсгэх
        const instances = generateTaskInstances(task, year, month);
        calendarTasks.push(...instances);
      }
    }

    res.json({
      success: true,
      data: calendarTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignToWorker = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assigned_to } = req.body;

    // Validate input
    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        message: "Ажилтны ID шаардлагатай"
      });
    }

    // Check if task exists
    const task = await db.tasks.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Даалгавар олдсонгүй"
      });
    }

    // Check if worker exists (optional but recommended)
    const worker = await db.users.findByPk(assigned_to);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Ажилтан олдсонгүй"
      });
    }

    // Update the task
    const updatedTask = await db.tasks.update(
      { assigned_to: assigned_to },
      {
        where: { id: taskId },
        returning: true // For PostgreSQL, for MySQL you might need to fetch separately
      }
    );

    
    return res.status(200).json({
      success: true,
      message: "Даалгавар амжилттай хуваарилагдлаа",
      data: updatedTask
    });

  } catch (error) {
    console.error("❌ Error assigning task to worker:", error);
    return res.status(500).json({
      success: false,
      message: "Даалгавар хуваарилахад алдаа гарлаа",
      error: error.message
    });
  }
};

// ---------------------- GENERATE RECURRING TASKS ----------------------
exports.generateRecurringTasks = async (req, res) => {
  try {
    const { year, month } = req.body;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Давтамжтай task-уудыг авах
    const recurringTasks = await Task.findAll({
      where: {
        frequency_type: { [Op.ne]: 'none' }
      }
    });

    const createdTasks = [];

    for (const template of recurringTasks) {
      const instances = generateTaskInstances(template, year, month);
      
      for (const instance of instances) {
        // Шалгах: энэ өдөр энэ task аль хэдийн үүссэн эсэх
        const existingTask = await Task.findOne({
          where: {
            title: instance.title,
            due_date: {
              [Op.between]: [
                new Date(instance.due_date.setHours(0, 0, 0, 0)),
                new Date(instance.due_date.setHours(23, 59, 59, 999))
              ]
            }
          }
        });

        if (!existingTask) {
          const task = await Task.create({
            title: instance.title,
            description: instance.description,
            created_by: req.user?.userId || 1, // req.user байхгүй бол default
            assigned_to: instance.assigned_to,
            supervisor_id: instance.supervisor_id,
            priority: instance.priority,
            status: 'pending',
            due_date: instance.due_date,
            frequency_type: 'none', // Үүссэн task нь энгийн болно
            frequency_value: null
          });
          createdTasks.push(task);
        }
      }
    }

    res.json({
      success: true,
      message: `${createdTasks.length} шинэ ажил үүслээ`,
      data: createdTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ---------------------- HELPER FUNCTIONS ----------------------

// Тухайн сард өдөр байгаа эсэхийг шалгах
function isDateInMonth(date, year, month) {
  const checkDate = new Date(date);
  return checkDate.getFullYear() === parseInt(year) && 
         checkDate.getMonth() === parseInt(month) - 1;
}

// Давтамжтай task-ийн instance үүсгэх
function generateTaskInstances(task, year, month) {
  const instances = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    let shouldCreate = false;

    switch (task.frequency_type) {
      case 'daily':
        shouldCreate = true;
        break;
        
      case 'weekly':
        if (currentDate.getDay() === task.frequency_value) {
          shouldCreate = true;
        }
        break;
        
      case 'monthly':
        if (currentDate.getDate() === task.frequency_value) {
          shouldCreate = true;
        }
        break;
    }

    if (shouldCreate) {
      instances.push({
        ...task.toJSON(),
        id: `${task.id}_${currentDate.getTime()}`, // Уникал ID
        due_date: new Date(currentDate),
        is_generated: true,
        original_task_id: task.id
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances; // Энэ мөрийг нэмэх
}