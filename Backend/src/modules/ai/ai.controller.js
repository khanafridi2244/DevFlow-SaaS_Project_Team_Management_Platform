const aiService = require("./ai.service");

async function generateProjectPlan(req, res, next) {
  try {
    const { description } = req.body;

    const result = await aiService.generateProjectPlan(
      req.user.organizationId,
      req.user.id,
      description
    );

    return res.status(200).json({
      success: true,
      message: "Project plan generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function generateTasks(req, res, next) {
  try {
    const { projectId, instruction } = req.body;

    const result = await aiService.generateTasks(
      projectId,
      req.user.id,
      instruction
    );

    return res.status(200).json({
      success: true,
      message: "Tasks generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function summarizeTaskDiscussion(req, res, next) {
  try {
    const { taskId } = req.params;

    const result = await aiService.summarizeTaskDiscussion(
      taskId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Task discussion summarized successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function generateTaskDescription(req, res, next) {
  try {
    const { title, projectContext } = req.body;

    const result = await aiService.generateTaskDescription(
      title,
      projectContext
    );

    return res.status(200).json({
      success: true,
      message: "Task description generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function analyzeProjectRisk(req, res, next) {
  try {
    const { projectId } = req.params;

    const result = await aiService.analyzeProjectRisk(
      projectId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Project risk analysis completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateProjectPlan,
  generateTasks,
  summarizeTaskDiscussion,
  generateTaskDescription,
  analyzeProjectRisk,
};