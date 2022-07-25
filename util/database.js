const mongodb = require("mongodb");
require("dotenv").config();
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    `mongodb+srv://xguhx:${process.env.dbpassword}@cluster0.sa2p8.mongodb.net/shop?retryWrites=true&w=majority`
  )
    .then((client) => {
      console.log("Connected!");
      _db = client.db();
      callback(client);
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) return _db;

  throw "No DB Found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
