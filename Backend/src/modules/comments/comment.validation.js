const { z } = require("zod");

const createCommentSchema = z.object({
  body: z.object({
    taskId: z.string().min(1, "taskId is required"),
    body: z.string().min(1, "Comment cannot be empty").max(3000),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCommentSchema = z.object({
  body: z.object({
    body: z.string().min(1, "Comment cannot be empty").max(3000),
  }),
  params: z.object({
    commentId: z.string().min(1, "commentId is required"),
  }),
  query: z.object({}).optional(),
});

const commentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    commentId: z.string().min(1, "commentId is required"),
  }),
  query: z.object({}).optional(),
});

const listCommentsQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    taskId: z.string().min(1, "taskId is required"),
  }),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  listCommentsQuerySchema,
};