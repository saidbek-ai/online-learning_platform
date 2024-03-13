import { Schema, model } from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import validator from "validator";
import AppError from "../utils/appError.js";
import isEmail from "validator/lib/isEmail.js";

const userSchema = new Schema(
  {
    fName: {
      type: String,
      required: [true, "A user must have fist name!"],
      maxLength: 24,
      trim: true,
    },
    lName: {
      type: String,
      required: [true, "A user must have last name!"],
      maxLength: 32,
      trim: true,
    },
    image: String,
    bio: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "A user must have email!"],
      trim: true,
      validate: {
        validator: function (email) {
          return isEmail(email);
        },
        message: "Email is not valid!",
      },
    },
    password: { type: String, select: false },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (cPass) {
          return cPass === this.password;
        },
        message: "Password confirmation doesn't match!",
      },
    },
    googleAuthId: {
      type: String,
    },
    facebookAuthId: {
      type: String,
    },
    githubAuthId: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "course-instructor", "owner"],
      default: "user",
      required: [true, "A user must have role!"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountDeactivatedDate: Date,
    verificationToken: String,
    verificationTokenExpDate: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Validation logic for requiring password when using only email!
    const oauthplatforms =
      !this.googleAuthId || !this.facebookAuthId || !this.githubAuthId;

    if (oauthplatforms && !this.password) {
      return new AppError("Please enter a password!");
    }

    if (oauthplatforms && !this.confirmPassword) {
      return new AppError("Please confirm your password!");
    }

    // Hashing password if it exists!
    if (this.password) {
      if (!this.isModified("password")) return next();

      this.password = await bcrypt.hash(this.password, 12);

      this.confirmPassword = undefined;
    }
  }
  next(); // Continue with the save operation
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createVerificationToken = function () {
  // generating random token
  const verToken = crypto.randomBytes(32).toString("hex");

  //hashing random token
  this.verificationToken = crypto
    .createHash("sha256")
    .update(verToken)
    .digest("hex");

  // setting 10 min expiration date for token
  this.verificationTokenExpDate = Date.now() + 60000 * 10;

  return this.verificationToken;
};

const User = model("User", userSchema);

export default User;
