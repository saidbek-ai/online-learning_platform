import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { sendEmail } from "../utils/mail.js";

const createJWTToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_DATE,
  });

// const verifyJWTToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyJWTToken = async (token) =>
  await jwt.verify(token, process.env.JWT_SECRET);

// send Authorization token
const sendAutToken = (res, user) => {
  const token = createJWTToken(user._id);
  const cookieOption = {
    maxAge: 1000 * 60 * 60 * 24 * parseInt(process.env.JWT_EXP_DATE),
    httpOnly: process.env.NODE_ENV === "production" ? true : false,
  };

  user.password = undefined;

  res.cookie("authToken", token, cookieOption);
  res.status(200).json({ token, user });
};

// local register using email
export const register = catchAsync(async (req, res, next) => {
  const { fName, lName, email, password, confirmPassword } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return next(
      new AppError("User exists with this email. Please sign in!", 403)
    );
  }

  const newUser = await User.create({
    fName,
    lName,
    email,
    password,
    confirmPassword,
  });

  if (!newUser)
    return next(
      new AppError("Something went wrong when sign up! Please try again!", 400)
    );

  req.user = newUser;
  next();
});

// login localy using email and password
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please fill all required fields!"));

  const user = await User.findOne({
    email,
    isActive: true,
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Email or password is incorrect!", 400));
  }

  req.user = user;
  next();
});

//Check user account isVerified and send verify token if it isn't!
export const checkIsVerified = catchAsync(async (req, res, next) => {
  const currentUser = req.user;

  if (!currentUser?.isVerified) {
    const user = await User.findById(currentUser._id);

    // create verificatipon token
    const verificationToken = user.createVerificationToken();

    await user.save();

    console.log(verificationToken);

    const message = `Submit: ${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/verify/${verificationToken}`;

    sendEmail(user.email, "Verify Email!", message);

    return res
      .status(200)
      .json({ status: "success", message: "Please verify your email!" });
  }

  sendAutToken(res, currentUser);
});

export const verifyUser = catchAsync(async (req, res, next) => {
  const verificationToken = req.params.verificationToken;

  const user = await User.findOne({ verificationToken });

  if (!user) {
    return next(new AppError("User is verified!", 200));
  }

  if (Date.now() > user.verifcationTokenExpDate) {
    return next(
      new AppError("Email verification expired! Please try again!", 403)
    );
  }

  user.verificationToken = undefined;
  user.verificationTokenExpDate = undefined;
  user.isVerified = true;

  await user.save();

  sendAutToken(res, user);
});

// Check there is auth token!
export const protect = catchAsync(async (req, res, next) => {
  let token;

  const headers = req.headers;
  const cookies = req.cookies;

  if (headers?.authorization) {
    token = headers.authorization.split(" ")[1];
  } else if (cookies?.authToken) {
    token = cookies?.authToken;
  }

  if (!token) {
    return next(new AppError("You are not signed in!"));
  }

  const { userId } = await verifyJWTToken(token);
  // await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(userId);

  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have permission to get this route!"));
    }

    next();
  };
};

export const logout = catchAsync(async (req, res, next) => {
  const cookies = req.cookies;

  const cookieOption = { maxAge: Date.now() - 1000 };

  if (cookies?.authToken) {
    res.cookie("authToken", "", cookieOption);
  }

  res.status(200).json({ message: "User Logged out!" });
});
