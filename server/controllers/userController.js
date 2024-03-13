import multer from "multer";
import sharp from "sharp";
import * as url from "url"; // Import the entire 'url' module
import path from "path";
import { promises as fs } from "fs";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

// const userImageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "upload/user-image/");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

const userImageStorage = multer.memoryStorage();

const photoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Uploaded file is not image!", 400), false);
  }
};

const upload = multer({
  storage: userImageStorage,
  fileFilter: photoFilter,
});

export const uploadUserImage = upload.single("image");

export const resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.${"jpeg"}`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`uploads/user-image/${req.file.filename}`);

  next();
});

export const getUserImage = async (req, res, next) => {
  const { imageName } = req.params;
  const __filename = url.fileURLToPath(import.meta.url);
  const imagePath = path.join(
    path.dirname(__filename),
    "./../uploads/user-image",
    imageName
  );

  // const imagePath = path.join(path.dirname(), "uploads/user-image", imageName);

  try {
    const image = await fs.readFile(imagePath);

    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(image, "binary");
  } catch (error) {
    res.status(404).json({ message: "Image not found!" });
  }
};

export const getMe = catchAsync((req, res, next) => {
  const currentUser = req.user;

  if (!currentUser) return next(new AppError("You are not logged in!", 403));

  res.status(200).json({ status: "success", user: currentUser });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  const { fName, lName, bio } = req.body;
  let image;
  // skipping this middleware if there is no photo
  if (req.file) image = req.file.filename;

  // console.log(req.body);
  if (!currentUser) return next(new AppError("You are not logged in!", 403));

  const user = await User.findByIdAndUpdate(
    currentUser._id,
    {
      fName,
      lName,
      image,
      bio,
    },
    { new: true, runValidators: true }
  );

  res.status(201).json({ user });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  const currentUser = req.user;

  if (!currentUser) return next(new AppError("You are not logged in!", 403));

  await User.findByIdAndUpdate(currentUser._id, {
    isActive: false,
    accountDeactivatedDate: Date.now(),
  });

  res.status(203).json({ message: "Account deleted successfully!" });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("+password");

  if (!users) {
    return next(new AppError("Users not found!", 404));
  }

  res.status(200).json({ results: users.length, users });
});

// to clean automatically!
export const clearDeletedUsers = catchAsync(async (req, res, next) => {
  const deletedUsers = User.deleteMany({
    isActive: false,
    accountDeactivatedDate: {
      $lt: this.accountDeactivatedDate + 1000 * 60 * 60 * 24 * 14,
    },
  });

  if (!deletedUsers) {
    return next(new AppError("Users not found!", 404));
  }

  res.status(203).json({
    message: "Users deleted successfully!",
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next("User not found!", 404);
  }

  res.status(200).json({ user });
});

export const deleteUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return next("User not found!", 404);
  }

  res.status(200).json({ message: "User successfully deleted!" });
});
