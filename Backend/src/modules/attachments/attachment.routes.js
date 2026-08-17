const { Router } = require("express");
const controller = require("./attachment.controller");
const { verifyJWT } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");

const router = Router();

router.use(verifyJWT);

// multipart/form-data: field name "file" for the file itself, plus a
// "taskId" text field in the same form — no JSON body validation
// middleware here since multer parses the body, not express.json().
router.post("/", upload.single("file"), controller.uploadAttachment);
router.get("/", controller.listAttachments);
router.delete("/:attachmentId", controller.deleteAttachment);

module.exports = router;