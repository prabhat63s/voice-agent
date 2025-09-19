"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiUser, FiMessageCircle, FiGlobe } from "react-icons/fi";
import Header from "@/components/Header";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header />

      <section className="flex flex-col items-center justify-center p-8 py-20 text-center bg-gradient-to-b from-neutral-50 to-white">
        <h2 className="text-3xl md:text-6xl font-bold text-black mb-6">
          Your AI-Powered Realtime Agent
        </h2>
        <p className="text-gray-700 max-w-xl mb-10 text-lg">
          Automate tasks, get instant answers, and interact with AI using just your fingertips.
        </p>

        {/* Web Search Highlight */}
        <div className="flex flex-col items-center bg-neutral-100 p-4 rounded-xl mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FiGlobe className="text-3xl text-black" />
            <h4 className="text-xl font-semibold text-black">Web Search</h4>
          </div>
          <p className="text-gray-700">
            Fetch up-to-date information from the web to get instant answers.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {session ? (
            <Link href="/chat">
              <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition shadow-md hover:shadow-lg flex items-center gap-2">
                <FiMessageCircle className="text-lg" /> Start Chatting
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition shadow-md hover:shadow-lg flex items-center gap-2">
                <FiUser className="text-lg" /> Get Started
              </button>
            </Link>
          )}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0  w-full bg-neutral-100 p-6 text-center border-t">
        <p className="text-black text-sm">
          &copy; {new Date().getFullYear()} Realtime Agent. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
