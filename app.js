const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const commonRouter = require("./routes/common");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.all("*", commonRouter);

module.exports = app;
