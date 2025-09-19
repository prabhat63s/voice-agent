"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Header() {
    const router = useRouter();
    const { data: session } = useSession();

    const handleLogout = async () => {
        try {
            localStorage.removeItem("sessionEvent");
            await signOut({ redirect: false });
            toast.success("Logged out successfully!");
            router.push("/");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Failed to logout. Try again!");
        }
    };

    return (
        <header className="w-full bg-transparent px-4 py-3 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm">
            <Link href="/" className="text-xl font-bold text-black flex items-center gap-2">
                Realtime Agent
            </Link>

            <div>
                {session ? (
                    <button
                        onClick={handleLogout}
                        className="px-2 py-1.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition flex items-center gap-1"
                    >
                        <FiLogOut /> Logout
                    </button>
                ) : (
                    <Link href="/login">
                        <button className="px-2 py-1.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition flex items-center gap-1">
                            <FiUser /> Login
                        </button>
                    </Link>
                )}
            </div>
        </header>
    );
}
