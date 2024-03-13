import { Router } from "express";
import {
  register,
  login,
  checkIsVerified,
  verifyUser,
  protect,
  restrictTo,
  logout,
} from "../controllers/authController.js";
import {
  deleteMe,
  deleteUserById,
  getAllUsers,
  getUser,
  getMe,
  updateMe,
  resizeUserImage,
  uploadUserImage,
  getUserImage,
} from "../controllers/userController.js";
import User from "../models/userModel.js";

const router = Router();

router.delete("/deleteAllUsers", async (req, res) => {
  await User.deleteMany();

  console.log("USERS DELETED");

  res.send("All users deleted!");
});

router.get("/users", async (req, res) => {
  const users = await User.find().select("+password");

  console.log("USERS");
  res.status(200).json({ users });
});

// Register Locally
router.post("/sign-up", register, checkIsVerified);

//Login Locally
router.post("/sign-in", login, checkIsVerified);

//Logout
router.get("/logout", protect, logout);

//Email verificaton route!
router.post("/verify/:verificationToken", verifyUser);

router.use(protect);

router.get("/me", getMe);
router.patch("/update-me", uploadUserImage, resizeUserImage, updateMe);
router.delete("/delete-me", deleteMe);

// Getting image from server
router.get("/image/:imageName", getUserImage);

//ADMIN ROUTES
router.use(restrictTo("admin"));
router.get("/all-users", getAllUsers);
router.route("/:userId").get(getUser).delete(deleteUserById);
//  ^ checked routes ^

export default router;
