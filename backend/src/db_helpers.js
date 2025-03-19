const { Sequelize, DataTypes } = require("sequelize");
const { user_db } = require("./config");
const bcrypt = require("bcrypt");

const sequelize = new Sequelize(user_db.database, user_db.username, user_db.password, {
    host: user_db.host,
    port: user_db.port,
    dialect: "postgres",
    logging: false,
});

const User = sequelize.define("User", {
    uid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fullname: DataTypes.STRING,
    created_at: DataTypes.DATE,
    email: DataTypes.STRING,
    profile_pic: DataTypes.TEXT,
    hash_password: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    identify_no: DataTypes.STRING,
}, { tableName: "users", timestamps: false });

const Bank = sequelize.define("Bank", {
    bID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    bankname: DataTypes.STRING,
    bankno: DataTypes.STRING,
}, { tableName: "banks", timestamps: false });

const Fund = sequelize.define("Fund", {
    fid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uid: DataTypes.INTEGER,
    target_money: DataTypes.DECIMAL,
    current_money: DataTypes.DECIMAL,
    created_at: DataTypes.DATE,
    categories: DataTypes.STRING,
    title: DataTypes.TEXT,
}, { tableName: "funds", timestamps: false });

const FundAttachment = sequelize.define("FundAttachment", {
    fid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: DataTypes.STRING,
    path: DataTypes.STRING,
}, { tableName: "fund_attachment", timestamps: false });

const Donation = sequelize.define("Donation", {
    dID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    donate_at: DataTypes.DATE,
    amount: DataTypes.DECIMAL,
    bID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    money_after: DataTypes.DECIMAL,
}, { tableName: "donation", timestamps: false });

const Withdrawal = sequelize.define("Withdrawal", {
    wID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: DataTypes.DECIMAL,
    withdraw_at: DataTypes.DATE,
    bID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reason: DataTypes.TEXT,
    money_after: DataTypes.DECIMAL,
}, { tableName: "withdrawal", timestamps: false });

User.hasMany(Bank, { foreignKey: "uid" });
Bank.belongsTo(User, { foreignKey: "uid" });

User.hasMany(Fund, { foreignKey: "uid" });
Fund.belongsTo(User, { foreignKey: "uid" });

Fund.hasMany(FundAttachment, { foreignKey: "fid" });
FundAttachment.belongsTo(Fund, { foreignKey: "fid" });

Fund.hasMany(Donation, { foreignKey: "fID" });
Donation.belongsTo(Fund, { foreignKey: "fID" });

User.hasMany(Donation, { foreignKey: "uid" });
Donation.belongsTo(User, { foreignKey: "uid" });

Bank.hasMany(Donation, { foreignKey: "bID" });
Donation.belongsTo(Bank, { foreignKey: "bID" });

Fund.hasMany(Withdrawal, { foreignKey: "fID" });
Withdrawal.belongsTo(Fund, { foreignKey: "fID" });

Bank.hasMany(Withdrawal, { foreignKey: "bID" });
Withdrawal.belongsTo(Bank, { foreignKey: "bID" });

async function initDB() {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database & tables created!");
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

async function createUser(fullname, email, password, phone_no, identify_no, profile_pic = null) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullname,
            email,
            hash_password: hashedPassword,
            phone_no,
            identify_no,
            profile_pic,
            created_at: new Date(),
        });

        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

module.exports = { 
    sequelize,
    User,
    Bank,
    Fund,
    FundAttachment,
    Donation,
    Withdrawal,
    initDB,
    createUser,
    getUserByEmail,
    healthcheck
};