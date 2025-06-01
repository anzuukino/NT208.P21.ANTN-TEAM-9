const { Sequelize, DataTypes } = require("sequelize");
const { user_db } = require("./config");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require("path");

const sequelize = new Sequelize(user_db.database, user_db.username, user_db.password, {
    host: user_db.host,
    port: user_db.port,
    dialect: "postgres",
    logging: false,
});

const User = sequelize.define("User", {
    uid: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    created_at: DataTypes.DATE,
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    hash_password: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    identify_no: DataTypes.STRING,
    cash: DataTypes.DECIMAL,
    postal_code: DataTypes.STRING,
    is_oauth: DataTypes.BOOLEAN,
}, { tableName: "users", timestamps: false });

const Bill = sequelize.define("Bill", {
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: DataTypes.DECIMAL,
    transaction_type: DataTypes.STRING,
    billID: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    created_at: DataTypes.DATE,
    reason: DataTypes.STRING,
    money_after: DataTypes.DECIMAL,
}, { tableName: "bills", timestamps: false });

const Bank = sequelize.define("Bank", {
    bID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    bankname: DataTypes.STRING,
    bankno: DataTypes.STRING,
}, { tableName: "banks", timestamps: false });

const Fund = sequelize.define("Fund", {
    fundID: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    target_money: DataTypes.DECIMAL,
    current_money: DataTypes.DECIMAL,
    created_at: DataTypes.DATE,
    category: DataTypes.STRING,
    title: DataTypes.TEXT,
    done: DataTypes.BOOLEAN,
    deadline: DataTypes.DATE,
    description: DataTypes.TEXT,
}, { tableName: "funds", timestamps: false });

const DonationPlan = sequelize.define("DonationPlan", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fundID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
}, { tableName: "donation_plans", timestamps: false });

const FundAttachment = sequelize.define("FundAttachment", {
    fundID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    type: DataTypes.STRING,
    path: DataTypes.STRING,
}, { tableName: "fund_attachment", timestamps: false });

const ProfileImage = sequelize.define("ProfileImage", {
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    type: DataTypes.STRING,
    path: DataTypes.STRING,
}, { tableName: "profile_image", timestamps: false });

const Donation = sequelize.define("Donation", {
    dID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fundID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    billID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, { tableName: "donation", timestamps: false });

const Withdrawal = sequelize.define("Withdrawal", {
    wID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fundID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    billID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
}, { tableName: "withdrawal", timestamps: false });


// Relationships
User.hasMany(Bill, { foreignKey: "uid" });
Bill.belongsTo(User, { foreignKey: "uid" });

// User.hasMany(Bank, { foreignKey: "uid" });
// Bank.belongsTo(User, { foreignKey: "uid" });

User.hasMany(Fund, { foreignKey: "uid" });
Fund.belongsTo(User, { foreignKey: "uid" });

User.hasOne(ProfileImage, { foreignKey: "uid" });
ProfileImage.belongsTo(User, { foreignKey: "uid" });

Fund.hasMany(FundAttachment, { foreignKey: "fundID" });
FundAttachment.belongsTo(Fund, { foreignKey: "fundID" });

Fund.hasMany(DonationPlan, { foreignKey: "fundID" });
DonationPlan.belongsTo(Fund, { foreignKey: "fundID" });

Fund.hasMany(Donation, { foreignKey: "fundID" });
Donation.belongsTo(Fund, { foreignKey: "fundID" });

User.hasMany(Donation, { foreignKey: "uid" });
Donation.belongsTo(User, { foreignKey: "uid" });

User.hasMany(Withdrawal, { foreignKey: "uid" });
Withdrawal.belongsTo(User, { foreignKey: "uid" });

Bill.hasOne(Donation, { foreignKey: "billID" });
Donation.belongsTo(Bill, { foreignKey: "billID" });

Bill.hasOne(Withdrawal, { foreignKey: "billID" });
Withdrawal.belongsTo(Bill, { foreignKey: "billID" });

Fund.hasMany(Withdrawal, { foreignKey: "fundID" });
Withdrawal.belongsTo(Fund, { foreignKey: "fundID" });


async function createAdminUser() {
    try {
        const adminUser = await User.create({
            uid: crypto.randomUUID(),
            firstname: "Admin",
            lastname: "User",
            email: "admin@example.com",
            created_at: new Date(),
            profile_pic: null,
            hash_password: "$2a$10$FTOi2lllxzOh4Ej44rNbhedSQH6m.WnwPIEaGKJbkISIv3W34W1Ne", // Hash this in a real app
            phone_no: "1234567890",
            identify_no: "ADMIN123",
            cash: 10000000,
            is_oauth: false,
        });

        console.log("Admin user created:", adminUser);
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

async function initDB() {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database & tables created!");
        await createAdminUser();
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}

async function healthcheck(){
    try {
        await sequelize.authenticate();
        return true;
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        return false;
    }
}

async function getUserByEmail(email) {
    return await User.findOne({ where: { email } });
}

async function createUser(firstname, lastname, email, password, phone_no, identify_no, postal_code, profile_pic = null, is_oauth = false) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            uid: crypto.randomUUID(),
            firstname,
            lastname,
            email,
            hash_password: hashedPassword,
            phone_no,
            identify_no,
            profile_pic,
            created_at: new Date(),
            cash: 0,
            postal_code,
            is_oauth
        });

        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        return false;
    }
}

async function createFund(userid, title, category, description, goal, deadline, donationPlan) {
    try {
        const fund = await Fund.create({
            uid: userid,
            target_money: goal,
            current_money: 0,
            created_at: new Date(),
            category: category,
            description: description,
            title,
            done: false,
            deadline,
            fundID: crypto.randomUUID(),
        });

        return fund;
    } catch (error) {
        console.error("Error creating fund:", error);
        return false;
    }
}

async function createAttachment(fundID, type, path) {
    try {
        const attachment = await FundAttachment.create(
            fundID,
            type,
            path,
        );

        return attachment;
    } catch (error) {
        console.error("Error creating attachment:", error);
        return false;
    }
}

async function donateFund(userid, fundid, amount) {
    const transaction = await sequelize.transaction();
    try {
        const fund = await Fund.findOne({
            where: { fundID: fundid },
            lock: { level: transaction.LOCK.UPDATE, of: Fund },
            transaction,
        });

        if (!fund) {
            await transaction.rollback();
            console.log("Fund not found");
            return false;
        }

        const user = await User.findOne({
            where: { uid: userid },
            lock: { level: transaction.LOCK.UPDATE, of: User },
            transaction
        });

        if (!user) {
            await transaction.rollback();
            console.log("User not found");
            return false;
        }

        if (user.cash < amount) {
            await transaction.rollback();
            console.log("Insufficient funds");
            return false;
        }

        await User.update(
            { cash: user.cash - amount },
            { where: { uid: userid }, transaction }
        );

        await Fund.update(
            { current_money: Number(fund.current_money) + Number(amount) },
            { where: { fundID: fundid }, transaction }
        );

        const date = new Date();
        const billID = crypto.randomUUID();

        const bill = await Bill.create({
            amount: amount,
            transaction_type: "donation",
            uid: userid,
            billID,
            created_at: date,
            reason: "Donation",
            money_after: user.cash - amount,
        }, { transaction });

        await Donation.create({
            fundID: fundid,
            uid: userid,
            billID,
        }, { transaction });

        await transaction.commit();
        return bill;
    } catch (error) {
        console.error("Error donating:", error);
        await transaction.rollback();
        return false;
    }
}

async function withdrawFund(userid, fundid, reason) {
    const transaction = await sequelize.transaction();
    try {
        const fund = await Fund.findOne({
            where: { fundID: fundid },
            lock: { level: transaction.LOCK.UPDATE, of: Fund },
            transaction,
        });

        if (!fund) {
            await transaction.rollback();
            console.log("Fund not found");
            return false;
        }

        if (fund.uid !== userid) {
            await transaction.rollback();
            console.log("User is not the fund owner");
            return false;
        }

        if (fund.current_money < fund.target_money) {
            await transaction.rollback();
            console.log("Fund goal not reached");
            return false;
        }

        const user = await User.findOne({
            where: { uid: userid },
            lock: { level: transaction.LOCK.UPDATE, of: User },
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            console.log("User not found");
            return false;
        }

        const total_donation = fund.current_money;

        await Fund.update(
            { done: true },
            { where: { fundID: fundid }, transaction }
        );

        await User.update(
            { cash: user.cash + total_donation },
            { where: { uid: userid }, transaction }
        );

        const date = new Date();
        const billID = crypto.randomUUID();

        const bill = await Bill.create({
            amount: total_donation,
            transaction_type: "withdrawal",
            uid: userid,
            billID,
            created_at: date,
            reason: reason,
            money_after: user.cash + total_donation,
        }, { transaction });

        await Withdrawal.create({
            fundID: fundid,
            billID,
            uid: userid,
        }, { transaction });

        await transaction.commit();
        return bill;
    } catch (error) {
        console.error("Error withdrawing:", error);
        await transaction.rollback();
        return false;
    }
}

async function getFund(fundid) {
    try {
        const fund = await Fund.findOne({
            where: { fundID: fundid },
            include: [
                {
                    model: FundAttachment,
                    attributes: ["type", "path"]
                }
            ]
        });

        return fund;
    } catch (error) {
        console.error("Error fetching fund details:", error);
        return null;
    }
}

async function getBills(userid) {
    try {
        return await Bill.findAll({
            where: { uid: userid },
            include: [
                {
                    model: Donation,
                    attributes: ["fundID"]
                },
                {
                    model: Withdrawal,
                    attributes: ["fundID"]
                }
            ]
        });
    } catch (error) {
        console.error("Error fetching bills:", error);
        return null;
    }
}

async function getUserByIDpublic(userid) {
    try {
        return await User.findOne({
            where: { uid: userid },
            attributes: ["firstname", "lastname"],
        });
    } catch (error) {
        console.error("Error fetching public user data:", error);
        return null;
    }
}

async function getUserByIDprivate(userid) {
    try {
        return await User.findOne({
            where: { uid: userid },
            attributes: { exclude: ["hash_password"] },
            include: [
                {
                    model: ProfileImage,
                    attributes: ["type", "path"]
                }
            ]
        });
    } catch (error) {
        console.error("Error fetching private user data:", error);
        return null;
    }
}

async function getAllfund() {
    try {
        return await Fund.findAll();
    } catch (error) {
        console.error("Error fetching all funds:", error);
        return [];
    }
}

async function getLimitedFunds(limit) {
    try {
        return await Fund.findAll({
            limit: limit,
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: FundAttachment,
                    attributes: ["type", "path"]
                }
            ]
        });
    } catch (error) {
        console.error("Error fetching limited funds:", error);
        return [];
    }
}

async function UpdateUser(userid, firstname, lastname,  phone_no, identify_no, postal_code, profile_pic) {
    try {
        const user = await User.findOne({ where: { uid: userid } });
        if (!user) {
            console.log("User not found");
            return false;
        }

        await User.update(
            { firstname, lastname, phone_no, identify_no, postal_code, profile_pic },
            { where: { uid: userid } }
        );

        return true;
    } catch (error) {
        console.error("Error updating user:", error);
        return false;
    }
}

async function createProfileImage(userid, type, filepath) {
    try {
        await ProfileImage.destroy({ where: { uid: userid } });

        const image = await ProfileImage.create({
            uid: userid,
            type,
            path: filepath,
        }, {
            attributes: { exclude: ['id'] }
        });

        return image;
    } catch (error) {
        console.error("Error creating profile image:", error);
        return false;
    }
}

async function saveDonationPlan(fundID, donationPlan) {
    try {
        const planItems = donationPlan.map(item => ({
            fundID,
            date: new Date(item.date),
            amount: item.amount,
        }));

        await DonationPlan.bulkCreate(planItems);
        return true;
    } catch (error) {
        console.error("Error saving donation plan:", error);
        return false;
    }
}

async function updateFund(fundID, updates) {
    try {
        const fundExists = await Fund.count({ where: { fundID } });
        if (fundExists === 0) {
            
            return false;
        }

        const allowedFieldsToUpdate = ['title', 'category', 'description'];

        const [numberOfAffectedRows] = await Fund.update(updates, {
            where: { fundID },
            fields: allowedFieldsToUpdate
        });

        if (numberOfAffectedRows > 0) {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        return false;
    }
}

async function filterbyCategory(category) {
    try {
        return await Fund.findAll({
            where: { category },
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: FundAttachment,
                    attributes: ["type", "path"]
                }
            ]
        });
    } catch (error) {
        console.error("Error filtering funds by category:", error);
        return [];
    }
}

module.exports = {
    getUserByIDprivate,
    getUserByIDpublic,
    healthcheck,
    initDB,
    getUserByEmail,
    createUser,
    createFund,
    donateFund,
    withdrawFund,
    getFund,
    getBills,
    createAttachment,
    getAllfund,
    getLimitedFunds,
    UpdateUser,
    createProfileImage,
    saveDonationPlan,
    updateFund,
    filterbyCategory
};