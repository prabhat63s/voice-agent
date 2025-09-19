"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const { status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/chat");
        }
    }, [status, router]);

    if (status === "loading" || status === "authenticated") {
        return null;
    }

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordRegex.test(password)) {
            toast.error(
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            );
            return;
        }

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (!res?.error) {
            toast.success("Login successful!");
            router.push("/chat");
        } else {
            toast.error("Invalid credentials");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-md text-black">
                <h1 className="text-2xl font-semibold text-center mb-8">Welcome Back</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="email" className="mb-1 font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-neutral-800 transition"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="mb-1 font-medium">
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
                    </div>

                    <button
                        type="submit"
                        className="bg-black text-white font-medium p-2 rounded-lg hover:bg-neutral-800 transition"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center mt-6 text-neutral-700">
                    Don’t have an account?{" "}
                    <button
                        onClick={() => router.push("/register")}
                        className="font-medium hover:underline"
                    >
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
}
