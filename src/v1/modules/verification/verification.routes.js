const express = require("express");
const verificationCtrl = require("./verification.controller");
const { isAuth } = require("../../middlewares/authCheck");
const { validate, changePasswordSchema, verificationSchema, sendCodeSchema, addEmailSchema } = require("../../utils/validation");

const router = express.Router();

// Get available verification methods
router.route("/methods").get(isAuth, verificationCtrl.getVerificationMethods);

// Send verification code
router.route("/send-code").post(isAuth, validate(sendCodeSchema), verificationCtrl.sendCode);

// Verify code and apply update
router.route("/verify").post(isAuth, validate(verificationSchema), verificationCtrl.verifyAndUpdate);

// Change password (with current password verification)
router.route("/change-password").post(isAuth, validate(changePasswordSchema), verificationCtrl.changePassword);

// Add email without verification (when no email exists)
router.route("/add-email").post(isAuth, validate(addEmailSchema), verificationCtrl.addEmail);

module.exports = router;
