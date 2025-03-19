const express = require("express");
const jwt = require("jsonwebtoken");
const { signJWT } = require("./jwt_helpers");
const bcrypt = require("bcrypt");
const {getUserByEmail, createUser, healthcheck } = require("./db_helpers");
const auth = require("./middleware/auth");

const router = express.Router();

router.get('/api/healthcheck', async (req, res) => {
    var check = await healthcheck();
    if (check) {
        return res.status(200).send('Database is connected');
    } else {
        return res.status(500).send('Database connection failed');
    }
});


router.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.hash_password)) {
        return res.status(401).send("Invalid email or password");
    }
    const token = signJWT({ email });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
});

router.post("/api/register", async (req, res) => {
    try {

        const requiredFields = ["fullname", "email", "password", "phone_no", "identify_no"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const { fullname, email, password, phone_no, identify_no, profile_pic } = req.body;

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = await createUser(fullname, email, password, phone_no, identify_no, profile_pic);

        if (!newUser) {
            return res.status(500).json({ error: "User registration failed" });
        }

        res.status(200).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

router.get("/api", auth, async (req, res) => {
    return res.send(req.user);
})

module.exports = router;