const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const router = require("./router");
const { healthcheck, initDB } = require("./db_helpers");


let PORT = process.env.PORT || 9233;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.use("/uploads", express.static("uploads"));

app.use("/", router);

initDB()
    .then(() => {
        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

        const shutdown = () => {
            console.log("Shutting down server...");
            server.close(() => {
                console.log("Server closed. Exiting process.");
                process.exit(0);
            });
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    })
    .catch((err) => {
        console.error("Error starting the server:", err);
        process.exit(1);
    });