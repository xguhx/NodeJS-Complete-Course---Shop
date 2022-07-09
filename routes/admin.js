const path = require("path");

const rootDir = require("../util/path");

const express = require("express");
const router = express.Router();

//use router instead of app.get

///admin/add-product
router.get("/add-product", (req, res, next) => {
  res.sendFile(path.join(rootDir, "views", "add-product.html"));
});

router.post("/add-product", (req, res, next) => {
  console.log(req.body);
  res.redirect("/");
});

//export so we can import on app.js
module.exports = router;
