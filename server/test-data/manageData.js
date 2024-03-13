import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import fs from "fs";
import * as url from "url"; // Import the entire 'url' module
import path from "path";

import Course from "../models/courseModel.js";
import Lesson from "../models/lessonModel.js";
import User from "../models/userModel.js";
import Section from "../models/sectionModel.js";

await mongoose
  .connect(process.env.LOCAL_DB_ADDRESS)
  .then(() => console.log("DB connected!"));

const getFullPath = (fileUrl) => {
  const __filename = url.fileURLToPath(import.meta.url);
  return path.join(path.dirname(__filename), fileUrl);
};

console.log(getFullPath("course-data.json"));

// READY json FILE
const courses = JSON.parse(
  fs.readFileSync(getFullPath("course-data.json"), "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(getFullPath("user-data.json"), "utf-8")
);
const sections = JSON.parse(
  fs.readFileSync(getFullPath("section-data.json"), "utf-8")
);

const uploadData = async function () {
  try {
    console.log("Uploading Data...");

    //Hash passwords
    users.map((user) => {
      user.password = bcrypt.hashSync(user.password, 12);
      return user;
    });

    await User.create(users);
    await Course.create(courses);
    await Section.create(sections);

    console.log("Data uploaded successfully!");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async function () {
  try {
    console.log("Deleting all Data... ");

    await User.deleteMany();
    await Course.deleteMany();
    await Lesson.deleteMany();
    // await User.deleteMany();
    // await User.deleteMany();

    console.log("Data deleted successfully!");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

if (process.argv[2] === "--upload") {
  uploadData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
