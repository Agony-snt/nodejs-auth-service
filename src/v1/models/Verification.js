const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["phone", "email", "password"],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    newValue: {
        type: String,
        default: null  // For phone/email changes, stores the new value
    },
    expiresAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Auto-delete expired documents
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const model = mongoose.model("Verification", schema);

module.exports = model;
