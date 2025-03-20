const express = require("express");
const jwt = require("jsonwebtoken");
const { signJWT } = require("./jwt_helpers");
const bcrypt = require("bcrypt");
const {getUserByEmail, createUser, healthcheck, donateFund, getBills, createFund,withdrawFund } = require("./db_helpers");
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

router.post("/api/create-fund", auth, async (req, res) => {
    try {
        const requiredFields = ["title", "description", "goal", "deadline"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const { title, description, goal, deadline } = req.body;

        const newFund = await createFund(req.user.uid, title, description, goal, deadline);

        if (!newFund) {
            return res.status(500).json({ error: "Fund creation failed" });
        }

        res.status(200).json({ message: "Fund created successfully", fund: newFund });
    } catch (error) {
        console.error("Fund creation error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/api/donate", auth, async (req, res) => {
    try{
        const requiredFields = ["fund_id", "amount"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const { fund_id, amount } = req.body;

        const donate = await donateFund(req.user.uid, fund_id, amount);

        if (!donate) {
            return res.status(500).json({ error: "Donation failed" });
        }

        res.status(200).json({ message: "Donation successful", donation: donate });


    } catch(error){
        console.error("Donation error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

});

router.post("/api/withdraw", auth, async (req, res) => {
    try{
        const requiredFields = ["fund_id", "reason"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const { fund_id, reason } = req.body;

        const withdraw = await withdrawFund(req.user.uid, fund_id, reason);

        if (!withdraw) {
            return res.status(500).json({ error: "Withdraw failed" });
        }

        res.status(200).json({ message: "Withdraw successful", withdraw: withdraw });
    } catch(error){
        console.error("Withdraw error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

router.get("/api/bills", auth, async (req, res) => {
    const bills = await getBills(req.user.uid);
    res.json(bills);
});

router.get("/api/user", auth, async (req, res) => {
    return res.json(req.user);
})

module.exports = router;