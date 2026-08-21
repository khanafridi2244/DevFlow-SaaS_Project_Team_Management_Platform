const service = require("./comment.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const createComment = asyncHandler(async (req, res) => {
  const comment = await service.createComment(req.user.id, req.body);
  new ApiResponse(201, { comment }, "Comment added").send(res);
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await service.listComments(req.user.id, req.query.taskId);
  new ApiResponse(200, { comments }, "Comments fetched").send(res);
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await service.updateComment(req.params.commentId, req.user.id, req.body.body);
  new ApiResponse(200, { comment }, "Comment updated").send(res);
});

const deleteComment = asyncHandler(async (req, res) => {
  await service.deleteComment(req.params.commentId, req.user.id);
  new ApiResponse(200, null, "Comment deleted").send(res);
});

module.exports = { createComment, listComments, updateComment, deleteComment };