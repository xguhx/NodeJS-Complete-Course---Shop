//import routes from routes folder
const adminRoute = require("./routes/admin");
const shopRoute = require("./routes/shop");

const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

//set the routes as middlewares
//outsource routes

//Only routes starting with /admin
app.use("/admin", adminRoute);

app.use(shopRoute);

//Adding 404 for undefined routes
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "views", "notFound.html"));
});

app.listen(3000);
