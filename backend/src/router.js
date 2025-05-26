const express = require("express");
const jwt = require("jsonwebtoken");
const { signJWT } = require("./jwt_helpers");
const bcrypt = require("bcrypt");
const {
    getAllfund,
    getUserByIDpublic, 
    getUserByIDprivate, 
    getUserByEmail, 
    createUser, 
    healthcheck, 
    donateFund, 
    getBills, 
    createFund,
    withdrawFund, 
    createAttachment, 
    getFund,
    getLimitedFunds,
    UpdateUser,
    createProfileImage,
    saveDonationPlan ,
    updateFund
} = require("./db_helpers");
const auth = require("./middleware/auth");
const { GoogleClientID, GoogleClientSecret } = require("./config");
const { OAuth2Client } = require("google-auth-library");
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
}).array("files", 10); // Limit to 10 files

router.get('/api/healthcheck', async (req, res) => {
    var check = await healthcheck();
    if (check) {
        return res.status(200).send('Database is connected');
    } else {
        return res.status(500).send('Database connection failed');
    }
});

router.get("/api/auth/google", async (req, res) => {
    const code = req.query.code;
    try {
        const redirectURL = "http://localhost:3000/api/auth/google"
        const client = new OAuth2Client(
            GoogleClientID,
            GoogleClientSecret,
            redirectURL
        );
        const { tokens } = await client.getToken(code);
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        const profile = await userInfoResponse.json();

        if (!profile.email) {
            return res.status(400).json({ error: "No email found in profile" });
        }

        const email = profile.email;
        const firstname = profile.given_name || "";
        const lastname = profile.family_name || "";
        const postalcode = "";
        const phone_no = "";
        const identify_no = "";

        let user = await getUserByEmail(email);
        if (!user) {
            user = await createUser(
                firstname, lastname, email, "", phone_no, identify_no, postalcode, null, true);
            if (!user) {
                return res.status(500).json({ error: "User registration failed" });
            }
        }
    

        const jwtToken = signJWT({ uid: user.uid, email: user.email });
        res.cookie("token", jwtToken, { httpOnly: true });
        res.redirect("/");
    } catch (error) {
        console.error("Error during Google authentication:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

});

router.post("/api/oauth", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Referrer-Policy", "no-referrer-when-downgrade");

    const redirectURL = "http://localhost:3000/api/auth/google"

    const client = new OAuth2Client(
        GoogleClientID,
        GoogleClientSecret,
        redirectURL
    );

    const authorizeUrl = client.generateAuthUrl({
        access_type: "online",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        prompt: "consent",
    });

    return res.json({ url: authorizeUrl });
    
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
        const requiredFields = ["title", "category", "description", "goal", "deadline", "donationPlan"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "At least one image is required." });
        }

        let { title, category, description, goal, deadline, donationPlan } = req.body;
        
        // Parse and validate goal
        goal = parseFloat(goal);
        if (!Number.isFinite(goal) || goal <= 0) {
            return res.status(400).json({ error: "Goal must be a positive number." });
        }

        // Parse and validate deadline
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        if (isNaN(deadlineDate.getTime())) {
            return res.status(400).json({ error: "Invalid deadline date." });
        }

        if (deadlineDate <= today) {
            return res.status(400).json({ error: "Deadline must be at least 1 day from today." });
        }

        // Parse donation plan
        let parsedDonationPlan;
        try {
            parsedDonationPlan = JSON.parse(donationPlan);
            if (!Array.isArray(parsedDonationPlan)) {
                throw new Error("Invalid donation plan format");
            }
        } catch (e) {
            return res.status(400).json({ error: "Invalid donation plan format" });
        }

        // Create the fund
        const newFund = await createFund(
            req.user.uid, 
            title,
            category, 
            description, 
            goal, 
            deadline,
            parsedDonationPlan
        );

        if (!newFund) {
            return res.status(500).json({ error: "Fund creation failed" });
        }

        // Save all attachments
        const attachments = await Promise.all(
            req.files.map(async (file) => {
                return await createAttachment({
                    fundID: newFund.fundID, 
                    type: path.extname(file.originalname).toLowerCase(),
                    path: file.path,
                });
            })
        );

        if (attachments.some(att => !att)) {
            return res.status(500).json({ error: "Some attachments failed to save" });
        }

        const donationPlanSaved = await saveDonationPlan(newFund.fundID, parsedDonationPlan);
        if (!donationPlanSaved) {
            return res.status(500).json({ error: "Failed to save donation plan" });
        }

        return res.status(200).json({
            message: "Fund created successfully",
            fund: newFund,
            attachments: attachments,
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

router.get("/api/funds/all", async (req, res) => {
    const funds = await getAllfund();
    return res.json(funds);
});

router.get("/api/funds/limited", async (req, res) => {
    const funds = await getLimitedFunds(9);
    return res.json(funds);
});

router.get("/api/check-information", auth, async (req, res) => {
    const user = await getUserByIDprivate(req.user.uid);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_oauth){
        return res.status(200).json({ message: "User information is complete" });
    }

    const requiredFields = ["postal_code", "phone_no", "identify_no"];
    const missingFields = requiredFields.filter(field => !user[field] || user[field].trim() === "");
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}. Please complete your profile at /profile.` });
    }
    return res.status(200).json({ message: "User information is complete" });
});

router.post("/api/edit-profile", auth, async (req, res) => {
    const { postal_code, phone_no, identify_no } = req.body;

    try {
        const user = await getUserByIDprivate(req.user.uid);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updateFields = {};
        if (postal_code !== undefined) updateFields.postal_code = postal_code;
        if (phone_no !== undefined) updateFields.phone_no = phone_no;
        if (identify_no !== undefined) updateFields.identify_no = identify_no;

        if (Object.keys(updateFields).length > 0) {
            await user.update(updateFields);
        }

        return res.status(200).json({ message: "Profile updated successfully", user });

    } catch (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/api/upload-profile-image", auth, upload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const profileImage = await createProfileImage(
            req.user.uid,
            path.extname(req.file.originalname).toLowerCase(),
            req.file.path
        );

        if (!profileImage) {
            return res.status(500).json({ error: "Failed to save profile image" });
        }

        return res.status(200).json({ message: "Profile image uploaded successfully", profileImage });

    } catch (err) {
        console.error("Error uploading profile image:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/api/update-fund", auth, async (req, res) => {
    const { fundID, title, category, description } = req.body;
    if (!fundID || !title || !category || !description) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const updated = { title, category, description };
    try {
        const updatedFund = await updateFund(fundID, updated);
        if (!updatedFund) {
            return res.status(404).json({ error: "Fund not found or update failed" });
        }
        return res.status(200).json({ message: "Fund updated successfully"});
    } catch (error) {
        console.error("Error updating fund:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;