"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        // If the user is already logged in, redirect them to chat page
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading" || status === "authenticated") {
        // Show nothing or a loader while checking session
        return null;
    }

    // Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password before sending OTP
        if (!passwordRegex.test(password)) {
            toast.error(
                "Password must be at least 8 characters long, with uppercase, lowercase, number, and special character."
            );
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/send-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("OTP sent successfully!");
                router.push(
                    `/register/verify-otp?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
                );
            } else {
                toast.error(data.error || "Failed to send OTP");
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error, please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-100">
            <div className="md:bg-white rounded-2xl md:shadow-2xl p-5 md:p-10 w-full max-w-md">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8">
                    Create Account
                </h1>

                <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="email" className="mb-1 text-gray-700 font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-neutral-800 transition"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="mb-1 text-gray-700 font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-neutral-800 transition"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Minimum 8 chars, uppercase, lowercase, number & special char
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="bg-black text-white font-medium p-2 rounded-lg hover:bg-neutral-800 transition"
                        disabled={loading}
                    >
                        {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                </form>

                <p className="text-center mt-6 text-neutral-700">
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/login")}
                        className="font-medium hover:underline"
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
}
