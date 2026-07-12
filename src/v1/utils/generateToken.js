const jwt = require('jsonwebtoken');
const configs = require('../../configs');

exports.generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role },
        configs.auth.accessSecret,
        { expiresIn: configs.auth.accessExp }
    );
};

exports.generateRefreshToken = (id, role) => {
    return jwt.sign(
        { id, role },
        configs.auth.refreshSecret,
        { expiresIn: configs.auth.refreshExp }
    );
};