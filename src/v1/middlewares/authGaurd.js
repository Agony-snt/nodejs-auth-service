const { errorResponse } = require("../utils/responses");

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return errorResponse(res, 403, "Don't have access to this route !!");
    }

    return next();
};