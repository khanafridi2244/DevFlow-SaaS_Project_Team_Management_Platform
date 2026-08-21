const { getClient } = require("../../config/anthropic");
const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { assertOrgMembership } = require("../projects/project.service");
const { env } = require("../../config/env");

function requireClient() {
  const client = getClient();
  if (!client) {
    throw ApiError.badRequest(
      "AI features are not configured. Set ANTHROPIC_API_KEY to enable them."
    );
  }
  return client;
}

// Every AI call goes through this so callers don't repeat the same
// try/catch and JSON-parsing boilerplate. Asks Claude to return only
// JSON, then parses it — if the model ever wraps it in prose or
// markdown fences despite instructions, this strips that out rather
// than crashing.
async function askForJson(prompt, maxTokens = 1024) {
  const client = requireClient();

  const response = await client.messages.create({
    model: env.anthropic.model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const cleaned = text.replace(/```json\s*|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw ApiError.internal("AI returned an unexpected response format");
  }
}

// "Build an e-commerce website" -> structured project plan with phases
// and tasks, matching the shape shown in your spec.
async function generateProjectPlan(organizationId, userId, description) {
  await assertOrgMembership(organizationId, userId);

  const prompt = `You are a project planning assistant for a software team.
Given a project description, break it into 3-6 phases, each with 2-6 concrete tasks.

Project description: "${description}"

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "phases": [
    { "name": "string", "tasks": ["string", "string"] }
  ]
}`;

  return askForJson(prompt, 1500);
}

// "Create 5 backend tasks for an e-commerce project" -> array of
// { title, description, priority } ready to be created as real tasks.
async function generateTasks(projectId, userId, instruction) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound("Project not found");
  await assertOrgMembership(project.organizationId, userId);

  const prompt = `You are helping plan tasks for a software project called "${project.name}".
${project.description ? `Project description: ${project.description}` : ""}

Instruction: "${instruction}"

Generate a list of concrete tasks based on this instruction. Respond with ONLY valid JSON, no other text:
{
  "tasks": [
    { "title": "string", "description": "string", "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT" }
  ]
}`;

  return askForJson(prompt, 1200);
}

// Summarizes a task's comment thread — "Summarize the discussion on this task."
async function summarizeTaskDiscussion(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      comments: {
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!task) throw ApiError.notFound("Task not found");
  await assertOrgMembership(task.project.organizationId, userId);

  if (task.comments.length === 0) {
    return { summary: "No comments yet on this task." };
  }

  const thread = task.comments
    .map((c) => `${c.author.firstName} ${c.author.lastName}: ${c.body}`)
    .join("\n");

  const prompt = `Summarize this task discussion in 2-4 sentences, focused on decisions made and current status.

Task: "${task.title}"

Discussion:
${thread}

Respond with ONLY valid JSON, no other text: { "summary": "string" }`;

  return askForJson(prompt, 400);
}

// "Generate a technical description for this task" — given just a title.
async function generateTaskDescription(title, projectContext) {
  const prompt = `Write a clear, technical task description (2-4 sentences) for a software development task.

Task title: "${title}"
${projectContext ? `Project context: ${projectContext}` : ""}

Respond with ONLY valid JSON, no other text: { "description": "string" }`;

  return askForJson(prompt, 300);
}

// "Which tasks are likely to delay this project?" — looks at real data
// (overdue tasks, unassigned high-priority tasks, workload imbalance)
// rather than asking the model to hallucinate risk from nothing.
async function analyzeProjectRisk(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound("Project not found");
  await assertOrgMembership(project.organizationId, userId);

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: { select: { firstName: true, lastName: true } } },
  });

  const now = new Date();
  const overdue = tasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < now);
  const unassignedUrgent = tasks.filter(
    (t) => t.status !== "DONE" && t.priority === "URGENT" && !t.assigneeId
  );
  const noDueDate = tasks.filter((t) => t.status !== "DONE" && !t.dueDate);

  const dataSnapshot = {
    totalTasks: tasks.length,
    overdueCount: overdue.length,
    overdueTasks: overdue.map((t) => t.title),
    unassignedUrgentCount: unassignedUrgent.length,
    unassignedUrgentTasks: unassignedUrgent.map((t) => t.title),
    tasksWithNoDueDate: noDueDate.length,
  };

  const prompt = `You are a project risk analyst. Given this real data snapshot from a project management tool, identify the top 3 risks to the project's timeline and suggest one concrete action for each.

Data:
${JSON.stringify(dataSnapshot, null, 2)}

Respond with ONLY valid JSON, no other text:
{
  "risks": [
    { "risk": "string", "severity": "LOW" | "MEDIUM" | "HIGH", "suggestedAction": "string" }
  ]
}`;

  return askForJson(prompt, 800);
}

module.exports = {
  generateProjectPlan,
  generateTasks,
  summarizeTaskDiscussion,
  generateTaskDescription,
  analyzeProjectRisk,
};