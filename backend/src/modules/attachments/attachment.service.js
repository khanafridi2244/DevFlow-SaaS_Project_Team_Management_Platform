const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { assertOrgMembership } = require("../projects/project.service");
const { cloudinary } = require("../../config/cloudinary");
const { logActivity } = require("../activities/activity.service");

async function getTaskWithOrg(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  return task;
}

// Streams a buffer (from Multer's memory storage) up to Cloudinary
// without ever touching the local filesystem.
function uploadBufferToCloudinary(buffer, fileName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "devflow/attachments",
        public_id: fileName.replace(/\.[^/.]+$/, ""), // strip extension, Cloudinary adds its own
        resource_type: "auto", // lets Cloudinary handle images, PDFs, docs correctly
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function uploadAttachment(userId, taskId, file) {
  const task = await getTaskWithOrg(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  const result = await uploadBufferToCloudinary(file.buffer, file.originalname);

  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      uploadedById: userId,
      url: result.secure_url,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  await logActivity({
    organizationId: task.project.organizationId,
    projectId: task.projectId,
    actorId: userId,
    action: "ATTACHMENT_UPLOADED",
    metadata: { taskId, fileName: file.originalname, attachmentId: attachment.id },
  });

  return attachment;
}

async function listAttachments(userId, taskId) {
  const task = await getTaskWithOrg(taskId);
  await assertOrgMembership(task.project.organizationId, userId);

  return prisma.attachment.findMany({
    where: { taskId },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function deleteAttachment(attachmentId, userId) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { task: { include: { project: true } } },
  });
  if (!attachment) {
    throw ApiError.notFound("Attachment not found");
  }

  const membership = await assertOrgMembership(attachment.task.project.organizationId, userId);

  const canDelete =
    attachment.uploadedById === userId || ["ADMIN", "OWNER"].includes(membership.role);
  if (!canDelete) {
    throw ApiError.forbidden("Only the uploader or an org admin can delete this attachment");
  }

  // Best-effort cleanup on Cloudinary — if this fails, we still remove
  // the DB record rather than leaving a broken attachment the user
  // can't get rid of. An orphaned file in Cloudinary is a much smaller
  // problem than a task the user can never clean up.
  try {
    const publicId = extractPublicIdFromUrl(attachment.url);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete file from Cloudinary:", err);
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
}

function extractPublicIdFromUrl(url) {
  const match = url.match(/\/devflow\/attachments\/([^./]+)/);
  return match ? `devflow/attachments/${match[1]}` : null;
}

module.exports = { uploadAttachment, listAttachments, deleteAttachment };