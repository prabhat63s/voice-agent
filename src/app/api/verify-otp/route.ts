import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, otp, password } = await req.json();

        if (!email || !otp || !password) {
            return NextResponse.json({ error: "Email, OTP and password are required" }, { status: 400 });
        }

        const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

        if (!otpRecord) return NextResponse.json({ error: "OTP not found" }, { status: 400 });

        // Expiration check
        const expiresAt = new Date(otpRecord.expiresAt);
        if (expiresAt.getTime() < new Date().getTime()) {
            return NextResponse.json({ error: "OTP expired" }, { status: 400 });
        }

        if (otpRecord.code.trim() !== otp.trim()) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        // Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashedPassword });

        // Delete OTP after success
        await Otp.deleteMany({ email });

        return NextResponse.json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Verify OTP error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
