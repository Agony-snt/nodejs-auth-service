const usersModel = require("../../models/User");
const path = require("path");
const fs = require("fs");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../../utils/responses");
const configs = require("../../../configs");

// Helper function to save base64 image
function saveBase64Image(base64Data, filename) {
    return new Promise((resolve, reject) => {
        const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            reject(new Error('Invalid base64 image'));
            return;
        }

        const imageBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(__dirname, '../../../uploads');

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFile(filepath, imageBuffer, (err) => {
            if (err) reject(err);
            else resolve(`/uploads/${filename}`);
        });
    });
}

exports.register = async (req, res, next) => {
    try {
        const { firstname, lastname, username, phone, email, password } = req.body;

        // Handle profile picture - from multer or base64
        let profilePic = null;
        if (req.file) {
            profilePic = `/uploads/${req.file.filename}`;
        } else if (req.body.profilePic && req.body.profilePic.startsWith('data:image')) {
            const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            profilePic = await saveBase64Image(req.body.profilePic, filename);
        }

        const isUsernameExits = await usersModel.findOne({ username });
        if (isUsernameExits) {
            return errorResponse(res, 409, "Username already exists !");
        }

        const isPhoneNumberExists = await usersModel.findOne({ phone });
        if (isPhoneNumberExists) {
            return errorResponse(res, 409, "Phone number already exists !");
        }

        if (email) {
            const isEmailExists = await usersModel.findOne({ email });
            if (isEmailExists) {
                return errorResponse(res, 409, "Email address already exists !");
            }
        }

        const usersCount = await usersModel.find({}).countDocuments();

        let user = await usersModel({
            firstname,
            lastname,
            username,
            phone,
            email: email || null,
            password,
            profilePic
        });
        if (usersCount === 0) {
            user.role = "admin";
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
        user.refresh_token = hashedRefreshToken;

        res.cookie("access-token", accessToken, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000
        });
        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await user.save();

        return successResponse(res, 201, "Signed up successfully", user);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        const user = await usersModel.findOne({ $or: [{ username: identifier }, { phone: identifier }] });
        if (!user) {
            return errorResponse(res, 400, "Invalid credentials !");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return errorResponse(res, 400, "Invalid credentials !");
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

        res.cookie("access-token", accessToken, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000
        });
        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await usersModel.updateOne({ _id: user._id }, { $set: { refresh_token: hashedRefreshToken } });

        return successResponse(res, 200, "Signed in successfully");
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        await usersModel.updateOne({ _id: req.user._id }, { $set: { refresh_token: null } });
        res.clearCookie("access-token");
        res.clearCookie("refresh-token");

        return successResponse(res, 200, "Logged out successfully");
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = req.user;
        return successResponse(res, 202, "User retrieved successfully", user);
    } catch (err) {
        next(err);
    }
};

exports.checkAuth = async (req, res, next) => {
    try {
        return successResponse(res, 202, "User is authenticated")
    } catch (err) {
        next(err);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies["refresh-token"];
        if (!refreshToken) {
            return errorResponse(res, 401, "Login required !");
        }

        const isVerified = jwt.verify(refreshToken, configs.auth.refreshSecret);
        if (!isVerified) {
            return errorResponse(res, 401, "Login required !");
        }

        const user = await usersModel.findById(isVerified.id);
        if (!user) {
            return errorResponse(res, 401, "Login required !");
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
        if (!isMatch) {
            return errorResponse(res, 401, "Login required !");
        }

        const accessToken = generateAccessToken(user._id, user.role);
        res.cookie("access-token", accessToken, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000
        });

        return successResponse(res, 200, "Token got refreshed successfully");
    } catch (err) {
        next(err);
    }
};