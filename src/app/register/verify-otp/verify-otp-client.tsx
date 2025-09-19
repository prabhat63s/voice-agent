
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

export default function VerifyOtpPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email")!;
    const password = searchParams.get("password")!;
    const [otp, setOtp] = useState("");
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

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/verify-otp", {
                method: "POST",
                body: JSON.stringify({ email, password, otp }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("OTP verified successfully!");

                const loginRes = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                });

                if (!loginRes?.error) {
                    router.push("/");
                } else {
                    toast.error("OTP verified but login failed, please login manually");
                    router.push("/login");
                }
            } else {
                toast.error(data.error || "OTP verification failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error, please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="md:bg-white rounded-2xl md:shadow-2xl p-5 md:p-10 w-full max-w-md">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8">
                    Verify OTP
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Enter the 6-digit OTP sent to <span className="text-black">{email}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-neutral-800 transition"
                        maxLength={6}
                        required
                    />

                    <button
                        type="submit"
                        className="bg-black text-white font-medium p-2 rounded-lg hover:bg-neutral-800 transition"
                        disabled={loading}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}
