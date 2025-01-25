import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.config";
import { resend } from "../config/resend.config";

async function sendVerificationEmail(email: string) {
  const VERIFICATION_TOKEN = jwt.sign({ email }, JWT_SECRET, {expiresIn: "10m"});
  const FRONTEND_URL = process.env.NODE_ENV == "development" && process.env.CLIENT_URL;
  const VERIFY_EMAIL_URL = `${FRONTEND_URL}/verify-email?token=${VERIFICATION_TOKEN}`;
  try {
    await resend.emails.send({
      from: process.env.EMAIL as string,
      to: [email],
      subject: "Verify your email of Pencil",
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
                <p style="color: #555; font-size: 16px;">
                    Thank you for signing up for the Pencil! To complete your registration, please verify your email by clicking the button below:
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${VERIFY_EMAIL_URL}" 
                        style="background-color: #007BFF; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #555; font-size: 14px;">
                    This link is only valid for 10 minutes. If you did not request this, please ignore this email.
                </p>
                <p style="color: #555; font-size: 14px;">
                    If the button above does not work, copy and paste this link into your browser:
                    <a href="${VERIFY_EMAIL_URL}" style="color: #007BFF; word-break: break-word;">${VERIFY_EMAIL_URL}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Automation Tool | All rights reserved © 2025
                </p>
            </div>
        `,
    });
    return { status: true, message: "Verification email sent successfully." };
  } catch (error) {
    throw new Error("Failed to send email.");
  }
}

export { sendVerificationEmail };
