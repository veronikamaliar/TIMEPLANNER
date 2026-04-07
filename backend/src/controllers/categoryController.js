const prisma = require('../prisma');
const { validationResult } = require("express-validator");

const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'name', order = 'asc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [
        { userId: null },
        { userId: req.user.id },
      ]
    };

    if (search) {
      where.AND = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: { _count: { select: { tasks: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
      }),
      prisma.category.count({ where }),
    ]);

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      taskCount: cat._count.tasks,
      isGlobal: cat.userId === null,
    }));

    res.json({
      data: categoriesWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + categories.length < total,
      }
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        tasks: { take: 10, orderBy: { createdAt: "desc" } },
        _count: { select: { tasks: true } },
      },
    });

    if (!category) return res.status(404).json({ error: "Category not found" });

    // Перевірка доступу
    if (category.userId !== null && category.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Немає доступу" });
    }

    res.json({ ...category, taskCount: category._count.tasks });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, isGlobal } = req.body;

    // Глобальну може створити тільки адмін
    const userId = (isGlobal && req.user.role === 'ADMIN') ? null : req.user.id;

    const category = await prisma.category.create({
      data: { name, userId },
    });

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Редагувати може тільки власник або адмін
    if (category.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Немає прав" });
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
      include: { _count: { select: { tasks: true } } },
    });

    res.json({ message: "Category updated successfully", category: { ...updated, taskCount: updated._count.tasks } });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Видаляти може тільки власник або адмін
    if (category.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Немає прав" });
    }

    const tasksCount = await prisma.task.count({ where: { categoryId: parseInt(id) } });
    if (tasksCount > 0) {
      return res.status(400).json({
        error: "Cannot delete category with existing tasks",
        message: `This category contains ${tasksCount} tasks.`,
      });
    }

    await prisma.category.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };