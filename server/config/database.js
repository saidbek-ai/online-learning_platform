import mongoose from "mongoose";
import AppError from "../utils/appError.js";

export default async () => {
  try {
    const { NODE_ENV, LOCAL_DB_ADDRESS, DB_ADDRESS } = process.env;

    await mongoose.connect(
      NODE_ENV === "production" ? DB_ADDRESS : LOCAL_DB_ADDRESS
    );
    console.log(`Database connected successfully!`);
  } catch (error) {
    return new AppError(error.message, 500);
  }
};
