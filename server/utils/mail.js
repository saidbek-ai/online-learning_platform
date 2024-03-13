import nodemailer from "nodemailer";
import catchAsync from "./catchAsync.js";

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
});

export const sendEmail = catchAsync(async (userEmail, subject, textMessage) => {
  const info = await transporter.sendMail({
    from: "Online Learning Platform <saidbek@gmail.com>",
    to: userEmail,
    subject: subject,
    text: textMessage,
  });

  return info;
});
