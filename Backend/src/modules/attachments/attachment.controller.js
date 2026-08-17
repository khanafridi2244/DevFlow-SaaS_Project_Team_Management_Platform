const service = require("./attachment.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { ApiError } = require("../../utils/apiError");
const { asyncHandler } = require("../../utils/asyncHandler");

const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }
  const attachment = await service.uploadAttachment(req.user.id, req.body.taskId, req.file);
  new ApiResponse(201, { attachment }, "File uploaded successfully").send(res);
});

const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await service.listAttachments(req.user.id, req.query.taskId);
  new ApiResponse(200, { attachments }, "Attachments fetched").send(res);
});

const deleteAttachment = asyncHandler(async (req, res) => {
  await service.deleteAttachment(req.params.attachmentId, req.user.id);
  new ApiResponse(200, null, "Attachment deleted").send(res);
});

module.exports = { 
    uploadAttachment, 
    listAttachments, 
    deleteAttachment 
};
