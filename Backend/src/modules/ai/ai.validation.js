const { z } = require("zod");

const generatePlanSchema = z.object({
  body: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    description: z.string().min(5, "Description must be at least 5 characters").max(1000),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const generateTasksSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "projectId is required"),
    instruction: z.string().min(5, "Instruction must be at least 5 characters").max(500),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const summarizeTaskSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
  query: z.object({}).optional(),
});

const generateDescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title is required").max(200),
    projectContext: z.string().max(500).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const analyzeRiskSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    projectId: z.string().min(1, "projectId is required"),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  generatePlanSchema,
  generateTasksSchema,
  summarizeTaskSchema,
  generateDescriptionSchema,
  analyzeRiskSchema,
};