const multer = require("multer");
const { ApiError } = require("../utils/apiError");

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer stores the file in memory (as a Buffer) rather than writing it
// to disk first — since we're immediately streaming it up to Cloudinary,
// there's no reason to touch the local filesystem at all.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`File type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
