"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiUser, FiMessageCircle, FiGlobe, FiCpu, FiFileText, FiTerminal, FiZap } from "react-icons/fi";
import Header from "@/components/Header";

export default function HomePage() {
  const { data: session } = useSession();

  const tools = [
    {
      name: "Function Calling",
      desc: "Interact with your custom code and execute functions programmatically.",
      icon: <FiZap className="text-3xl text-indigo-600" />,
    },
    {
      name: "Web Search",
      desc: "Fetch up-to-date information from the web to get instant answers.",
      icon: <FiGlobe className="text-3xl text-green-600" />,
    },
    {
      name: "File Search",
      desc: "Perform semantic search across your documents for quick insights.",
      icon: <FiFileText className="text-3xl text-orange-600" />,
    },
    {
      name: "Computer Use",
      desc: "Understand and control your computer or browser with AI commands.",
      icon: <FiCpu className="text-3xl text-purple-600" />,
    },
    {
      name: "Local Shell",
      desc: "Execute safe commands on your local machine directly from AI.",
      icon: <FiTerminal className="text-3xl text-red-600" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <section className="flex flex-col items-center justify-center p-4 py-20 text-center bg-gradient-to-b from-white to-gray-50">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 mt-10">
          Your AI-Powered Realtime Agent
        </h2>
        <p className="text-gray-600 max-w-2xl mb-12 text-lg">
          Automate tasks, get instant answers, and interact with AI using just your fingertips.
          All tools integrated for seamless productivity.
        </p>

        <div className="flex items-center gap-4">
          {session ? (
            <Link href="/chat">
              <button className="px-6 py-3 bg-gradient-to-b from-neutral-900 to-neutral-800 text-white rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2">
                <FiMessageCircle className="text-lg" /> Start Chatting
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="px-4 py-3 bg-gradient-to-b from-neutral-900 to-neutral-800 text-white rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2">
                <FiUser className="text-lg" /> Get Started
              </button>
            </Link>
          )}
          <Link href="https://platform.openai.com/docs/guides/agents#tools" target="_blank" rel="noopener noreferrer">
            <button className="px-4 py-3 bg-gradient-to-b from-neutral-900 to-neutral-800 text-white rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2">
              <FiGlobe className="text-lg" /> OpenAI
            </button>
          </Link>
        </div>
      </section>

      {/* Tools Section */}
      <section className="px-4 w-full bg-gray-50 flex flex-col text-center justify-center">
        <h3 className="text-2xl md:text-4xl font-bold text-center text-gray-900 mb-6">
          Tools
        </h3>
        <p className="text-gray-600 max-w-4xl m-auto mb-12">
          Tools enable agents to interact with the world. OpenAI supports function calling to connect with your code, and built-in tools for common tasks like web searches and data retrieval.
        </p>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition hover:-translate-y-1 hover:scale-[1.02] group"
            >
              <div className="mb-3 group-hover:scale-110 transition transform">{tool.icon}</div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">{tool.name}</h4>
              <p className="text-gray-600">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>


      <footer className="w-full p-6 text-center m-auto mt-10">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Realtime Agent. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
