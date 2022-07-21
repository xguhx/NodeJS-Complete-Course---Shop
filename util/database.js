const Sequelize = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(
  "node-complete",
  "root",
  process.env.dbpassword,
  {
    dialect: "mysql",
    host: "localhost",
  }
);

module.exports = sequelize;
