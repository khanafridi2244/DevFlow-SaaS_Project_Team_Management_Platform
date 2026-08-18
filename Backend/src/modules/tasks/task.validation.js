const { z } = require("zod");

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "projectId is required"),
    title: z.string().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().max(5000).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    labels: z.array(z.string().min(1).max(30)).max(10).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  }),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
  query: z.object({}).optional(),
});

// Separate, narrower schema for the Kanban drag-and-drop action —
// this is the single most frequent write the frontend will make,
// so it gets its own lightweight endpoint instead of going through
// the general-purpose update.
const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: "Invalid status" }) }),
  }),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
  query: z.object({}).optional(),
});

const taskIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
  query: z.object({}).optional(),
});

const listTasksQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    projectId: z.string().min(1, "projectId is required"),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeId: z.string().optional(),
    label: z.string().optional(),
    search: z.string().max(200).optional(),
  }),
});

const addLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Label name is required").max(30),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code like #6366f1")
      .optional(),
  }),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
  query: z.object({}).optional(),
});

const removeLabelSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
    labelId: z.string().min(1, "labelId is required"),
  }),
  query: z.object({}).optional(),
});

const calendarQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format"),
  }),
});

const searchTasksQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeId: z.string().optional(),
    label: z.string().optional(),
    search: z.string().max(200).optional(),
  }),
});

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
  addLabelSchema,
  removeLabelSchema,
  calendarQuerySchema,
  searchTasksQuerySchema,
};