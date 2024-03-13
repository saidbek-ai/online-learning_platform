import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import databaseConnection from "./config/database.js";
import globalErrorHandler from "./handlers/globalErrorHandler.js";
import userRoute from "./routes/userRoute.js";
import courseRoute from "./routes/courseRoute.js";
import AppError from "./utils/appError.js";

const app = express();

const { NODE_ENV, PORT = 4001 } = process.env;
app.use(express.json());
app.use(cookieParser());

console.log("NODE_ENV: " + NODE_ENV);

databaseConnection();

app.use("/api/v1/user", userRoute);
app.use("/api/v1/courses", courseRoute);

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/*", (req, res, next) => {
  const url = req.originalUrl;

  return next(new AppError(`Sorry! ${url} not found in this server!`));
});

app.use(globalErrorHandler);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
