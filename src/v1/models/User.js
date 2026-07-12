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
        required: false
    }
}, { timestamps: true });

schema.pre("save", async function () {
    try {
        this.password = await bcrypt.hash(this.password, 10);
        return;
    } catch (err) {
        return err;
    }
});

schema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.refresh_token;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
    }
});


const model = mongoose.model("User", schema);

module.exports = model;