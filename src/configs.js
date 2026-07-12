require("dotenv").config();

module.exports = {
    db_uri: process.env.DB_URI,
    port: process.env.PORT,
    auth: {
        accessSecret: process.env.ACCESS_TOKEN_SECRET,
        accessExp: process.env.ACCESS_EXPIRE_TIME,
        refreshSecret: process.env.REFRESH_TOKEN_SECRET,
        refreshExp: process.env.REFRESH_EXPIRE_TIME
    }
};