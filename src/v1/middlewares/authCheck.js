const jwt = require("jsonwebtoken");
const configs = require('../../configs');
const usersModel = require("../models/User");
const { errorResponse } = require("../utils/responses");

exports.isAuth = async (req, res, next) => {
    try {
        const token = req.cookies["access-token"];
        if (!token) {
            return errorResponse(res, 401, "Login required !");
        }

        const payload = jwt.verify(token, configs.auth.accessSecret);
        if (!payload) {
            return errorResponse(res, 401, "Login required !");
        }

        const user = await usersModel.findById(payload.id);
        if (!user) {
            return errorResponse(res, 401, "Login required !");
        }

        req.user = user;
        return next();
    } catch (err) {
        next(err);
    }
};