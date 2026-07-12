const express = require('express');
const usersCtrl = require("./users.controller");
const { isAuth } = require('../../middlewares/authCheck');
const { isAdmin } = require('../../middlewares/authGaurd');
const { validate, profileUpdateSchema, deleteAccountSchema } = require('../../utils/validation');
const upload = require('../../utils/upload');

const router = express.Router();

router.route("/").get(isAuth, isAdmin, usersCtrl.getAll);
router.route("/update").patch(isAuth, upload.single('profilePic'), validate(profileUpdateSchema), usersCtrl.update);
router.route("/remove-account").delete(isAuth, validate(deleteAccountSchema), usersCtrl.removeAccount);
router.route("/kick").delete(isAuth, isAdmin, usersCtrl.removeUser);

module.exports = router;
