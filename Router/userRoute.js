import { Router } from "express";
import User from "../Models/User.js";
import { checkpassword } from "../Service/auth.js";
import { requireAuth } from "../Middleware/auth.js";
import PendingUser from "../Models/PendingUser.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv"
import { hashPassword, isStrongPassword } from "../Service/Password.js";
dotenv.config();
const BASE_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT}`;

const router = Router();

function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
}

//create transpoter using nodemailer:-
const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
        }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profileImageURL = user.profileImageURL?.startsWith("http")
      ? user.profileImageURL
      : `${process.env.BACKEND_URL || BASE_URL}${user.profileImageURL || ""}`;

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profileImageURL,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch user", error: err.message });
  }
});

router.post("/signup", async (req, res) => {
        const { firstname, lastname, email, password } = req.body;
        try {
                const existUser = await User.findOne({ email })
                if (existUser) return res.status(400).json({ message: "User already exists" })
                //check password is strong or not:-
                if (!isStrongPassword(password)) {
                        return res.status(400).json({
                                success: false,
                                message: "Password must be at least 6 characters long and include uppercase, lowercase, digit, and special character (!@#$%^&*)."
                        })
                }
                //hash password:-
                const HashedPassword = await hashPassword(password)
                //generate OTP:-
                const otp = generateOTP();
                const otpExpiry = Date.now() + 5 * 60 * 1000;

                //store pending user:-

                await PendingUser.create({
                        firstname,
                        lastname,
                        email,
                        password:HashedPassword,
                        otp,
                        otpExpiry
                })

                //send OTP mail:-
                await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: "TreeStack OTP verification",
                        text: `Hi ${firstname}, your OTP is ${otp}. It valid for 5 minutes.`
                });

                res.json({ success: true, message: "OTP sent to email" });
        } catch (err) {
                 console.error("❌ Signup error:", err);  
                res.status(500).json({ message: "Signup failed", error: err.message });
        }
        //     await User.create({
        //         firstname,
        //         lastname,
        //         email,
        //         password
        //     });
        //     res.status(200).json({message:"signup succesfully done..."});
});

router.post("/verify-otp", async (req, res) => {
        const { email, otp } = req.body;

        try {
                const pending = await PendingUser.findOne({ email, otp });
                if (!pending) return res.status(400).json({ message: "No signup request found" });
                if (Date.now() > pending.otpExpiry) {
                        await pending.deleteOne({ email });
                        return res.status(400).json({ message: "OTP expired, please signup again" });
                }
                //otp validation:-
                await User.create({
                        firstname: pending.firstname,
                        lastname: pending.lastname,
                        email: pending.email,
                        password: pending.password
                });

                //remove pending user entry:-
                await PendingUser.deleteOne({ email });
                res.json({ success: true, message: "Signup verified successfully" });
        } catch (err) {
                res.status(500).json({ message: "OTP verification failed", error: err.message });
        }
});

router.post("/signin", async (req, res) => {
        const { email, password } = req.body;
        try {
                const token = await checkpassword(email, password);
                return res.cookie("token", token).json({ success: true, message: "You are loggedin" })
        } catch (error) {
                res.status(401).json({ success: false, message: `Signin failed: ${error.message}` });
        }
});
router.get("/logout", (req, res) => {
        res.clearCookie("token");
        res.json({ success: true, message: "you have been logged out" });
});

export default router;