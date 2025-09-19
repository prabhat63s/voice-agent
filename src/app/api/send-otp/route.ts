import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import User from "@/models/User"; // import User model to check existing accounts
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Save OTP
        await Otp.create({ email, code: otpCode, expiresAt });

        // Send OTP via email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otpCode}. It expires in 10 minutes.`,
        });

        return NextResponse.json({ message: "OTP sent" });
    } catch (err) {
        console.error("Send OTP error:", err);
        return NextResponse.json(
            { error: "Failed to send OTP" },
            { status: 500 }
        );
    }
}
