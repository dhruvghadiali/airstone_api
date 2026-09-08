const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("node:path");

const public_directory = require("@src/public_path");
const admin_router = require("@routes/admin");
const employee_router = require("@routes/employee");
const super_admin_router = require("@routes/super_admin");
const not_found_handler = require("@middlewares/not_found_handler");

const { error_handler } = require("@middlewares/error_handler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/assets", express.static(path.join(public_directory, "assets")));

app.use("/super-admin", super_admin_router);
app.use("/admin", admin_router);
app.use("/employee", employee_router);

app.use(not_found_handler);
app.use(error_handler);

module.exports = app;
