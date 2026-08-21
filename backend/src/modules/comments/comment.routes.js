const { Router } = require("express");
const controller = require("./comment.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  listCommentsQuerySchema,
} = require("./comment.validation");

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createCommentSchema), controller.createComment);
router.get("/", validate(listCommentsQuerySchema), controller.listComments);
router.patch("/:commentId", validate(updateCommentSchema), controller.updateComment);
router.delete("/:commentId", validate(commentIdParamSchema), controller.deleteComment);

module.exports = router;