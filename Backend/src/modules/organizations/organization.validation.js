const { z } = require("zod");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    logoUrl: z.string().url().optional(),
  }),
  params: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
  }),
  query: z.object({}).optional(),
});

const organizationIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
  }),
  query: z.object({}).optional(),
});

const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
  }),
  params: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
  }),
  query: z.object({}).optional(),
});

const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
  }),
  params: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    memberId: z.string().min(1, "memberId is required"),
  }),
  query: z.object({}).optional(),
});

const removeMemberSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    organizationId: z.string().min(1, "organizationId is required"),
    memberId: z.string().min(1, "memberId is required"),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  slugify,
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationIdParamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
};