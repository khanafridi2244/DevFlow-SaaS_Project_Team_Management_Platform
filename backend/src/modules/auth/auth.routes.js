const { Router } = require("express");
const controller = require("./auth.controller");
const { validate } = require("../../middleware/validate.middleware");
const { verifyJWT } = require("../../middleware/auth.middleware");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} = require("./auth.validation");

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);
router.post("/verify-email", validate(verifyEmailSchema), controller.verifyEmail);

// Protected routes (require a valid access token)
router.post("/logout", verifyJWT, controller.logout);
router.get("/me", verifyJWT, controller.me);
router.post(
  "/change-password",
  verifyJWT,
  validate(changePasswordSchema),
  controller.changePassword
);

module.exports = router;