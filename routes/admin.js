const path = require("path");

const rootDir = require("../util/path");

const express = require("express");
const router = express.Router();

const products = [];

//use router instead of app.get

///admin/add-product
router.get("/add-product", (req, res, next) => {
  res.sendFile(path.join(rootDir, "views", "add-product.html"));
});

router.post("/add-product", (req, res, next) => {
  products.push({ title: req.body.title });
  res.redirect("/");
});

//export so we can import on app.js
exports.routes = router;
exports.products = products;
