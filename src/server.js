const mongoose = require("mongoose");
const configs = require("./configs");
const app = require("./app");
const { log } = require("console")

const connectToDataBase = async () => {
    try {
        await mongoose.connect(configs.db_uri);
        log("Connected to data base successfully.");
        return;
    } catch (err) {
        return log("Data base connection error !!\nError: ", err);
    };
};

const startServer = () => {
    try {
        app.listen(configs.port, () => {
            log(`Server's running successfully on port ${configs.port}...\nYou can visit web view at << http://localhost:${configs.port} >>`);
            return;
        });
    } catch (err) {
        return log("Server error !!\nError:", err);
    }
};

const run = () => {
    startServer();
    connectToDataBase();
};

run();