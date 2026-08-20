const Joi = require("joi");

const generateProjectPlanSchema = Joi.object({
  description: Joi.string().trim().min(10).max(5000).required(),
});

const generateTasksSchema = Joi.object({
  projectId: Joi.string().required(),
  instruction: Joi.string().trim().min(5).max(3000).required(),
});

const generateTaskDescriptionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(300).required(),
  projectContext: Joi.string().trim().max(3000).allow("", null),
});

const taskIdParamSchema = Joi.object({
  taskId: Joi.string().required(),
});

const projectIdParamSchema = Joi.object({
  projectId: Joi.string().required(),
});

module.exports = {
  generateProjectPlanSchema,
  generateTasksSchema,
  generateTaskDescriptionSchema,
  taskIdParamSchema,
  projectIdParamSchema,
};