const express = require('express');
const authCtrl = require("./auth.controller");
const { isAuth } = require("../../middlewares/authCheck");
const { validate, registerSchema, loginSchema } = require("../../utils/validation");
const upload = require("../../utils/upload");

const router = express.Router();

router.route("/register").post(upload.single('profilePic'), validate(registerSchema), authCtrl.register);
router.route("/login").post(validate(loginSchema), authCtrl.login);
router.route("/logout").post(isAuth, authCtrl.logout);
router.route("/me").get(isAuth, authCtrl.getMe);
router.route("/check").get(isAuth, authCtrl.checkAuth);
router.route("/refresh").post(authCtrl.refresh);


module.exports = router;
