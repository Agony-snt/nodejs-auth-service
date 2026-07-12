const usersModel = require("../../models/User");
const verificationModel = require("../../models/Verification");
const { successResponse, errorResponse } = require("../../utils/responses");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Generate 6-digit code
const generateCode = () => crypto.randomInt(100000, 999999).toString();

// Send verification code
exports.sendCode = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, newValue } = req.body;

        // Validate type
        if (!["phone", "email", "password"].includes(type)) {
            return errorResponse(res, 400, "Invalid verification type");
        }

        // For phone/email changes, newValue is required
        if ((type === "phone" || type === "email") && !newValue) {
            return errorResponse(res, 400, `New ${type} is required`);
        }

        // Get current user
        const user = await usersModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }

        // Check if new phone/email already exists
        if (type === "phone" && newValue) {
            const existingPhone = await usersModel.findOne({ phone: newValue });
            if (existingPhone) {
                return errorResponse(res, 409, "Phone number already in use");
            }
        }

        if (type === "email" && newValue) {
            const existingEmail = await usersModel.findOne({ email: newValue });
            if (existingEmail) {
                return errorResponse(res, 409, "Email already in use");
            }
        }

        // Generate code
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing pending verifications for this user/type
        await verificationModel.deleteMany({ userId, type, used: false });

        // Save verification
        const verification = await verificationModel.create({
            userId,
            type,
            code,
            newValue: newValue || null,
            expiresAt
        });

        // TODO: Send actual code via SMS/Email
        // For now, return code in response (remove in production!)
        console.log(`[VERIFICATION CODE] ${type} for user ${userId}: ${code}`);

        return successResponse(res, 200, "Verification code sent", {
            verificationId: verification._id,
            expiresIn: "10 minutes",
            // TODO: Remove this in production - only for testing
            _code: code
        });

    } catch (err) {
        next(err);
    }
};

// Verify code and apply update
exports.verifyAndUpdate = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { verificationId, code } = req.body;

        if (!verificationId || !code) {
            return errorResponse(res, 400, "Verification ID and code are required");
        }

        // Find verification
        const verification = await verificationModel.findOne({
            _id: verificationId,
            userId,
            used: false
        });

        if (!verification) {
            return errorResponse(res, 400, "Invalid or expired verification");
        }

        if (new Date() > verification.expiresAt) {
            await verificationModel.deleteOne({ _id: verificationId });
            return errorResponse(res, 400, "Verification code expired");
        }

        // Verify code
        if (verification.code !== code) {
            return errorResponse(res, 400, "Invalid verification code");
        }

        // Apply update based on type
        const updateData = {};
        let message = "";

        switch (verification.type) {
            case "phone":
                updateData.phone = verification.newValue;
                message = "Phone updated successfully";
                break;
            case "email":
                updateData.email = verification.newValue;
                message = "Email updated successfully";
                break;
            case "password":
                // For password change, new password should be sent with verification
                // You might want to include password in sendCode or add it here
                message = "Password verified (apply password change)";
                break;
        }

        if (Object.keys(updateData).length > 0) {
            await usersModel.findByIdAndUpdate(userId, updateData);
        }

        // Mark verification as used
        verification.used = true;
        await verification.save();

        // Get updated user
        const updatedUser = await usersModel.findById(userId);

        return successResponse(res, 200, message, { user: updatedUser });

    } catch (err) {
        next(err);
    }
};

// Change password (requires current password verification)
exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 400, "Current and new password are required");
        }

        if (newPassword.length < 8) {
            return errorResponse(res, 400, "Password must be at least 8 characters");
        }

        const user = await usersModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return errorResponse(res, 400, "Current password is incorrect");
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        // Optionally: invalidate all refresh tokens for security
        await usersModel.findByIdAndUpdate(userId, { $set: { refresh_token: null } });

        return successResponse(res, 200, "Password changed successfully");

    } catch (err) {
        next(err);
    }
};

// Get available verification methods for a user
exports.getVerificationMethods = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await usersModel.findById(userId).lean();
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }

        const methods = [];

        if (user.phone) {
            methods.push({
                type: "phone",
                masked: maskString(user.phone, 3, 4) // Show last 4 digits
            });
        }

        if (user.email) {
            methods.push({
                type: "email",
                masked: maskString(user.email, 3, 4) // Show last 4 chars
            });
        }

        return successResponse(res, 200, "Available verification methods", {
            methods,
            canChangePassword: user.phone || user.email
        });

    } catch (err) {
        next(err);
    }
};

// Helper to mask sensitive strings
function maskString(str, start, end) {
    if (!str || str.length <= start + end) return str;
    return str.slice(0, start) + "***" + str.slice(-end);
}

// Add email without verification (when no email exists)
exports.addEmail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 400, "Email is required");
        }

        // Check if user already has email
        const user = await usersModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, "User not found");
        }

        if (user.email) {
            return errorResponse(res, 400, "You already have an email. Use change email flow.");
        }

        // Check if email already exists
        const existingEmail = await usersModel.findOne({ email });
        if (existingEmail) {
            return errorResponse(res, 409, "Email already in use");
        }

        // Update email
        user.email = email;
        await user.save();

        return successResponse(res, 200, "Email added successfully", { user });

    } catch (err) {
        next(err);
    }
};
