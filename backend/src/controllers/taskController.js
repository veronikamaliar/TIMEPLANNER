const prisma = require('../prisma');
const { validationResult } = require("express-validator");
const redis = require("../redisClient");

// Отримати всі завдання
const getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId, priority, completed, sortBy = 'createdAt', order = 'desc' } = req.query

    const where = {}

    if (req.user.role !== 'ADMIN') {
      where.userId = req.user.id
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (categoryId) where.categoryId = Number(categoryId)
    if (priority)   where.priority = priority
    if (completed !== undefined) where.completed = completed === 'true'

const [data, total] = await Promise.all([
  prisma.task.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    orderBy: { [sortBy]: order },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
      files: true,
    },
  }),
  prisma.task.count({ where }),
])

    res.json({ data, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}



// Отримати завдання за ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { category: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Створити завдання
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, dueDate, priority, completed, timeSpent, files, categoryId } = req.body;
const userId = req.user.id;
const timeSpentNumber = timeSpent ? parseFloat(timeSpent) : 0;


    const task = await prisma.task.create({
  data: {
    title,
    description: description || '',
    dueDate: dueDate ? new Date(dueDate) : null,
    priority,
    completed: completed ?? false,
    timeSpent: timeSpentNumber,
    files: files?.length ? { create: files.map(f => ({ url: f })) } : undefined,
    user: { connect: { id: userId } },
    category: categoryId ? { connect: { id: Number(categoryId) } } : undefined,
  },
})

const keys = await redis.keys('tasks:*');
if (keys.length > 0) {
  await redis.del(keys);
}

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Оновити завдання
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, completed, timeSpent, categoryId } = req.body;

    const data = {
      title,
      description: description || "",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      completed,
      timeSpent: timeSpent || 0
    };

    if (categoryId) {
      data.category = { connect: { id: Number(categoryId) } };
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data,
      include: { category: true }
    });

    const keys = await redis.keys('tasks:*');
if (keys.length > 0) {
  await redis.del(keys);
}

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateTask };

// Видалити завдання
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Task not found" });
    res.status(500).json({ error: "Internal server error" });
  }
};

const toggleTaskCompletion = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { completed: !task.completed },
    });

    res.json({ message: "Task completion toggled", task: updatedTask });
  } catch (error) {
    console.error("Toggle task completion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
};
