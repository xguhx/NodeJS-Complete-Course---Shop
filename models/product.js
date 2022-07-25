const getDb = require("../util/database").getDb;
const mongoDb = require("mongodb");

class Product {
  constructor(title, price, description, imageUrl, id, userID) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id;
    this.userID = userID;
  }

  save() {
    const db = getDb();
    let dbOperation;
    if (this._id) {
      //update the product

      dbOperation = db
        .collection("products")
        .updateOne({ _id: mongoDb.ObjectId(this._id) }, { $set: this });
    } else {
      //update it
      dbOperation = db.collection("products").insertOne(this);
    }

    return dbOperation
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection("products")
      .find()
      .toArray()
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static findById(id) {
    const db = getDb();

    return db
      .collection("products")
      .find({ _id: mongoDb.ObjectId(id) })
      .next()
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static deleteById(id) {
    const db = getDb();

    return db
      .collection("products")
      .deleteOne({ _id: mongoDb.ObjectId(id) })
      .then((result) => {
        console.log("Product Deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Product;
