const { z } = require("zod");

const PROJECT_STATUSES = ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"];

const createProjectSchema = z.object({
  body: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    name: z.string().min(2, "Project name must be at least 2 characters").max(150),
    description: z.string().max(2000).optional(),
    startDate: z.string().datetime().optional(),
    deadline: z.string().datetime().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    startDate: z.string().datetime().optional(),
    deadline: z.string().datetime().optional(),
  }),
  params: z.object({
    projectId: z.string().min(1, "projectId is required"),
  }),
  query: z.object({}).optional(),
});

const projectIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    projectId: z.string().min(1, "projectId is required"),
  }),
  query: z.object({}).optional(),
});

const listProjectsQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    status: z.enum(PROJECT_STATUSES).optional(),
  }),
});

const addProjectMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
  params: z.object({
    projectId: z.string().min(1, "projectId is required"),
  }),
  query: z.object({}).optional(),
});

const removeProjectMemberSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    projectId: z.string().min(1, "projectId is required"),
    userId: z.string().min(1, "userId is required"),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  PROJECT_STATUSES,
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  listProjectsQuerySchema,
  addProjectMemberSchema,
  removeProjectMemberSchema,
};