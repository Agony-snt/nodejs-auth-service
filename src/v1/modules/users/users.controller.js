const { isValidObjectId } = require("mongoose");
const bcrypt = require("bcrypt");
const usersModel = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/responses");
const fs = require("fs");
const path = require("path");

// Helper function to save base64 image
function saveBase64Image(base64Data, filename) {
    return new Promise((resolve, reject) => {
        const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            reject(new Error('Invalid base64 image'));
            return;
        }

        const imageBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(__dirname, '../../../../uploads');

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

// Helper function to delete old profile picture
function deleteProfilePicture(profilePicPath) {
    if (!profilePicPath || !profilePicPath.startsWith('/uploads/')) return;

    const filepath = path.join(__dirname, '../../../../', profilePicPath);
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) console.error('Failed to delete old profile picture:', err);
        });
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const users = await usersModel.find({}).lean();

        return successResponse(res, 200, "Users retrieved succesfully", users);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        // Fields that require verification flow
        const verificationRequired = ["password", "phone", "email"];

        // Check if any verification-required field is being changed
        const requiresVerification = verificationRequired.filter(field => updates[field]);

        if (requiresVerification.length > 0) {
            // Get current user to check available verification methods
            const currentUser = await usersModel.findById(userId).lean();

            const availableMethods = [];
            if (currentUser.phone) availableMethods.push("phone");
            if (currentUser.email) availableMethods.push("email");

            return errorResponse(res, 403,
                "Verification required to change these fields", {
                requiredFields: requiresVerification,
                availableVerificationMethods: availableMethods
            });
        }

        // Only allow these fields to be updated directly
        const allowedFields = ["firstname", "lastname"];
        const updateData = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        // Handle profile picture from multer or base64
        if (req.file) {
            updateData.profilePic = `/uploads/${req.file.filename}`;
        } else if (req.body.profilePic && req.body.profilePic.startsWith('data:image')) {
            const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            updateData.profilePic = await saveBase64Image(req.body.profilePic, filename);
        }

        if (Object.keys(updateData).length === 0 && !req.file && !req.body.profilePic) {
            return errorResponse(res, 400, "No valid fields to update");
        }

        // Get current user to delete old profile picture
        const currentUser = await usersModel.findById(userId);

        // Apply update directly
        const user = await usersModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        // Delete old profile picture after successful update
        if ((req.file || req.body.profilePic) && currentUser.profilePic) {
            deleteProfilePicture(currentUser.profilePic);
        }

        return successResponse(res, 200, "User updated successfully", user);

    } catch (err) {
        next(err);
    }
};

exports.removeAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { password } = req.body;
        const user = await usersModel.findById(userId);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return errorResponse(res, 400, "Incorrect password");

        // Delete profile picture if exists
        if (user.profilePic) {
            deleteProfilePicture(user.profilePic);
        }

        await usersModel.findByIdAndDelete(userId);

        return successResponse(res, 200, "Account deleted successfully");

    } catch (err) {
        next(err);
    }
};

exports.removeUser = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!isValidObjectId(userId)) {
            return errorResponse(res, 400, "Invalid Object ID !");
        }

        if (!userId) {
            return errorResponse(res, 400, "User ID is required");
        }

        if (userId === req.user.id) {
            return errorResponse(res, 400, "Cannot delete your own account");
        }

        const userToDelete = await usersModel.findById(userId);
        if (!userToDelete) {
            return errorResponse(res, 404, "No user found with this ID !");
        }

        // Delete profile picture if exists
        if (userToDelete.profilePic) {
            deleteProfilePicture(userToDelete.profilePic);
        }

        await usersModel.findByIdAndDelete(userId);

        return successResponse(res, 200, "User deleted successfully");

    } catch (err) {
        next(err);
    }
};
