const compression = require("compression");
const express = require("express");
const { default: helmet } = require("helmet");
const morgan = require("morgan");
const app = express();

morgan;

//int middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());

//init routes
app.get("/", (req, res, next) => {
  const asd = "hello js tips";

  return res.status(200).json({
    message: "Welcome js tips",
    medata: asd.replace(10000),
  });
  ``;
});

// handle errpr

module.exports = app;
