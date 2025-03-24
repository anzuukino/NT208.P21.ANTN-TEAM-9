const express = require("express");
const jwt = require("jsonwebtoken");
const { signJWT } = require("./jwt_helpers");
const bcrypt = require("bcrypt");
const {getAllfund,getUserByIDpublic, getUserByIDprivate, getUserByEmail, createUser, healthcheck, donateFund, getBills, createFund,withdrawFund, createAttachment, getFund } = require("./db_helpers");
const auth = require("./middleware/auth");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const randomName = crypto.randomUUID();
        cb(null, `${randomName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (JPG, PNG, GIF, WEBP) are allowed."), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
}).single("file");

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
        return res.status(401).json({error:"Invalid email or password"});
    }
    const token = signJWT({ uid: user.uid, email: user.email });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
});

router.post("/api/register", async (req, res) => {
    try {

        const requiredFields = ["firstname","lastname" , "postalcode", "email", "password", "phone_no", "identify_no"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const { firstname, lastname, postalcode, email, password, phone_no, identify_no } = req.body;

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = await createUser(firstname, lastname, email, password, phone_no, identify_no, postalcode);

        if (!newUser) {
            return res.status(500).json({ error: "User registration failed" });
        }

        res.status(200).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/api/create-fund", auth, upload, async (req, res) => {
    try {
        const requiredFields = ["title", "description", "goal", "deadline"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: "Attachment is required." });
        }

        let { title, description, goal, deadline } = req.body;
        goal = parseFloat(goal);
        if (!Number.isFinite(goal) || goal <= 0) {
            return res.status(400).json({ error: "Goal must be a positive number." });
          }


        const newFund = await createFund(req.user.uid, title, description, goal, deadline);

        if (!newFund) {
            return res.status(500).json({ error: "Fund creation failed" });
        }

        const attachment = await createAttachment({
            fundID: newFund.fundID, 
            type: path.extname(req.file.originalname).toLowerCase(),
            path: req.file.path, 
        });

        if (!attachment) {
            return res.status(500).json({ error: "Attachment creation failed" });
        }

        return res.status(200).json({
            message: "Fund created successfully",
            fund: newFund,
            attachment: attachment,
        });
    } catch (error) {
        console.error("Fund creation error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/api/donate", auth, async (req, res) => {
    try{
        const requiredFields = ["fund_id", "amount"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        let { fund_id, amount } = req.body;

        amount = parseFloat(amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: "Amount must be a positive number." });
          }

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

router.get("/api/fund/:fund_id", auth, async (req, res) => {
    const fund = await getFund(req.params.fund_id);
    if (!fund) {
        return res.status(404).json({ error: "Fund not found" });
    }
    return res.json(fund);
});

router.get("/api/user/:uid", async (req, res) => {
    const user = await getUserByIDpublic(req.params.uid);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
});

router.get("/api/user/auth/:uid", auth, async (req, res) => {
    if (req.user.uid !== req.params.uid) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const user = await getUserByIDprivate(req.params.uid);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
});

router.post("/api/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/", 
    });

    return res.status(200).json({ message: "Logged out successfully" });
});


router.get("/api/bills", auth, async (req, res) => {
    const bills = await getBills(req.user.uid);
    return res.json(bills);
});

router.get("/api/user", auth, async (req, res) => {
    return res.json({uid: req.user.uid});
})

router.get("/api/funds", async (req, res) => {
    const funds = await getAllfund();
    return res.json(funds);
});

module.exports = router;