require("dotenv").config();
const compression = require("compression");
const express = require("express");
const { default: helmet } = require("helmet");
const morgan = require("morgan");
const app = express();

//int middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// test pub, sub redis
// require("./test/inventory.test");
// const productTest = require("./test/product.test");
// productTest.purchaseProduct("product:001", 10);

//init mongodb
require("./dbs/init.mongodb");

//init routes
app.use("/", require("./routes"));

// handle error
app.use((req, res, next) => {
  const error = new Error(`Not Found`);
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    stack: error.stack,
    message: error.message || "Internal Server Error",
  });
});

module.exports = app;
