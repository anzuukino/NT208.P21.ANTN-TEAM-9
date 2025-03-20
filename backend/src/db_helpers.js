const { Sequelize, DataTypes } = require("sequelize");
const { user_db } = require("./config");
const bcrypt = require("bcrypt");
const crypto = require('crypto');

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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    profile_pic: DataTypes.TEXT,
    hash_password: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    identify_no: DataTypes.STRING,
    cash: DataTypes.DECIMAL,
}, { tableName: "users", timestamps: false });

const Bill = sequelize.define("Bill", {
    uid: {
        type: DataTypes.INTEGER,
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
    done: DataTypes.BOOLEAN,
    deadline: DataTypes.DATE,
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
    fID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    billID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, { tableName: "withdrawal", timestamps: false });


User.hasMany(Bill, { foreignKey: "uid" });
Bill.belongsTo(User, { foreignKey: "uid" });

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

User.hasMany(Withdrawal, { foreignKey: "uid" });
Withdrawal.belongsTo(User, { foreignKey: "uid" });

// Bank.hasMany(Bill, { foreignKey: "billID" });
// Bill.belongsTo(Bank, { foreignKey: "billID" });

Bill.hasOne(Donation, { foreignKey: "billID" });
Donation.belongsTo(Bill, { foreignKey: "billID" });

Bill.hasOne(Withdrawal, { foreignKey: "billID" });
Withdrawal.belongsTo(Bill, { foreignKey: "billID" });

Fund.hasMany(Withdrawal, { foreignKey: "fID" });
Withdrawal.belongsTo(Fund, { foreignKey: "fID" });

Fund.hasMany(Donation, { foreignKey: "fID" });
Donation.belongsTo(Fund, { foreignKey: "fID" });


async function createAdminUser() {
    try {
        const adminUser = await User.create({
            fullname: "Admin",
            email: "admin@example.com",
            created_at: new Date(),
            profile_pic: null,
            hash_password: "$2a$10$FTOi2lllxzOh4Ej44rNbhedSQH6m.WnwPIEaGKJbkISIv3W34W1Ne", // Hash this in a real app
            phone_no: "1234567890",
            identify_no: "ADMIN123",
            cash: 10000000
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
            cash: 0,
        });

        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        return false;
    }
}

async function createFund(userid, title, description, goal, deadline) {
    try {
        const fund = await Fund.create({
            uid: userid,
            target_money: goal,
            current_money: 0,
            created_at: new Date(),
            categories: description,
            title,
            done: false,
            deadline,
        });
        
        return fund;
    }catch (error) {
        console.error("Error creating fund:", error);
        return false
    }
}

async function donateFund(userid, fundid, amount) {
    const transaction = await sequelize.transaction();
    try {
        const fund = await Fund.findOne({
            where: { fid: fundid },
            lock: transaction.LOCK.UPDATE,
            transaction, 
        });
    
        if (!fund) {
            await transaction.rollback();
            console.log("Fund not found");
            return false;
        }
    
        const user = await User.findOne({ 
            where: { uid: userid },
            lock: transaction.LOCK.UPDATE,
            transaction
        });
    
        if (!user) {
            await transaction.rollback();
            console.log("User not found");
            return false;
        }
    
        if (user.cash < amount) {
            await transaction.rollback();
            console.log(user.cash, amount);
            console.log("Insufficient funds");
            return false;
        }
    
        await User.update(
            { cash: user.cash - amount },
            { where: { uid: userid }, transaction }
        );
    
        await Fund.update(
            { current_money: fund.current_money + amount },
            { where: { fid: fundid }, transaction }
        );

        const date = new Date();

        const bill = await Bill.create({
            amount: amount,
            transaction_type: "donation",
            uid: userid,
            billID: crypto.randomUUID(),
            created_at: date,
            reason: "Donation",
            money_after: user.cash - amount,
        }, { transaction });

        const donation = await Donation.create({
            fID: fundid,
            uid: userid,
            billID: bill.billID,
        }, { transaction });

        
    
        await transaction.commit();
        return bill;
    } catch (error) {
        console.error("Error donating:", error);
        await transaction.rollback();
        return false;
    }
    
}

async function withdrawFund(userid, fundid,  reason) {
    const transaction = await sequelize.transaction();
    try {
        const fund = await Fund.findOne({
            where: { fid: fundid },
            lock: transaction.LOCK.UPDATE,
            transaction,
        });

        if (!fund) {
            await transaction.rollback();
            return false;
        }

        if (fund.uid !== userid || fund.current_money < fund.target_money) {
            await transaction.rollback();
            return false;
        }

        let total_donation = fund.current_money;

        const user = await User.findOne({
            where: { uid: userid },
            lock: transaction.LOCK.UPDATE,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return false;
        }

        await Fund.update(
            { done: true },
            { where: { fid: fundid }, transaction }
        );

        await User.update(
            { cash: user.cash + total_donation },
            { where: { uid: userid }, transaction }
        );

        let date = new Date();

        const bill = await Bill.create({
            amount: total_donation,
            transaction_type: "withdrawal",
            uid: userid,
            billID: crypto.randomUUID(),
            created_at: date,
            reason: reason,
            money_after: user.cash + total_donation,
        }, { transaction });

        const withdrawing = await Withdrawal.create({
            fID: fundid,
            billID: bill.billID,
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

async function getBills(userid){
    return await Bill.findAll({
        where: { uid: userid },
    })
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
    healthcheck,
    donateFund,
    withdrawFund,
    createFund,
    getBills,
};