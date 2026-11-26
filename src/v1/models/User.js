const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null,
        required: false
    },
    password: {
        type: String,
        select: false,
        required: true
    },
    profilePic: {
        type: String,
        default: null,
        required: false
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    refresh_token: {
        type: String,
        default: null,
        select: false,
        required: false
    }
}, { timestamps: true });

schema.pre("save", async function () {
    if (!this.isModified("password")) return;

    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (err) {
        throw err;
    }
});

schema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
    }
});


const model = mongoose.model("User", schema);

module.exports = model;