/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Header from "@/components/Header";
import { useState, useRef, useEffect } from "react";
import { FaArrowUp, FaRegClipboard, FaCheck } from "react-icons/fa";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import LoaderDots from "@/components/LoaderDots";
import { HiMiniMicrophone, HiOutlineMicrophone } from "react-icons/hi2";

interface Message {
    user?: string;
    bot?: string;
}

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const rtcAgentRef = useRef<RealtimeAgent | null>(null);
    const sessionRef = useRef<RealtimeSession | null>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send text message
    const sendMessage = async () => {
        if (!input.trim()) return;
        const userInput = input;
        setInput("");
        setMessages(prev => [...prev, { user: userInput }]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setLoading(true);

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userInput }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unknown error");
            setMessages(prev => [...prev, { bot: data.output }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { bot: `**Error:** ${err.message || err}` }]);
        } finally {
            setLoading(false);
        }
    };

    // Start voice session
    const startVoiceSession = async () => {
        try {
            // 1️⃣ Close existing session if any
            if (sessionRef.current) {
                await sessionRef.current.close(); // properly close old session
                sessionRef.current = null;
                rtcAgentRef.current = null;
                setVoiceActive(false);
            }

            // 2️⃣ Request ephemeral key from your API
            const res = await fetch("/api/realtime-session", { method: "POST" });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Failed to fetch ephemeral key: ${JSON.stringify(errData)}`);
            }

            const data = await res.json();
            const ephemeralKey = data.client_secret?.value;
            if (!ephemeralKey) throw new Error("No ephemeral key received");

            // 3️⃣ Create a RealtimeAgent
            const agent = new RealtimeAgent({
                name: "Voice Assistant",
                instructions: "You are a helpful, friendly voice assistant.",
            });
            rtcAgentRef.current = agent;

            // 4️⃣ Create a RealtimeSession
            const session = new RealtimeSession(agent);
            sessionRef.current = session;

            // 5️⃣ Connect session using SDK (DO NOT call /v1/realtime/calls manually)
            await session.connect({
                apiKey: ephemeralKey,
                model: "gpt-4o-realtime-preview", // REQUIRED
            });

            setVoiceActive(true);

            // 6️⃣ Stream bot text responses into chat
            let currentBotIndex: number | null = null;
            (session as any).on("response.delta", (evt: any) => {
                if (!evt?.delta?.content) return;
                setMessages(prev => {
                    if (currentBotIndex !== null && prev[currentBotIndex]?.bot) {
                        const updated = [...prev];
                        updated[currentBotIndex].bot += evt.delta.content;
                        return updated;
                    } else {
                        const updated = [...prev, { bot: evt.delta.content }];
                        currentBotIndex = updated.length - 1;
                        return updated;
                    }
                });
            });

            (session as any).on("response.completed", () => {
                currentBotIndex = null;
            });

            // 7️⃣ Optional error handling
            session.on("error", (err: any) => console.error("Realtime session error:", err));

        } catch (err) {
            console.error("startVoiceSession error:", err);
            setMessages(prev => [...prev, { bot: `**Error:** ${String(err)}` }]);
        }
    };

    // Stop voice session
    const stopVoiceSession = async () => {
        try {
            const session = sessionRef.current as any;
            if (session) await session.close(); // ensures proper cleanup
            sessionRef.current = null;
            rtcAgentRef.current = null;
            setVoiceActive(false);
        } catch (err) {
            console.warn("stopVoiceSession cleanup error:", err);
        }
    };


    // Render Markdown
    const renderMarkdown = (text: string, idx: number) => (
        <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            components={{
                code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match) {
                        return (
                            <div className="relative group">
                                <SyntaxHighlighter
                                    style={oneDark as any}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                                <CopyButton text={String(children)} />
                            </div>
                        );
                    }
                    return (
                        <code className="bg-white text-neutral-800 px-1.5 mt-2 py-1 rounded" {...props}>
                            {children}
                        </code>
                    );
                },
                p: ({ children }) => <p className="mb-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                a: ({ href, children }) => (
                    <a href={href || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {children}
                    </a>
                ),
            }}
        >
            {text}
        </ReactMarkdown>
    );

    return (
        <div className="flex flex-col h-screen bg-white">
            <Header />
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-7xl mx-auto flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            {msg.user && (
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] bg-neutral-200 text-black py-2 px-4 rounded-2xl">
                                        {msg.user}
                                    </div>
                                </div>
                            )}
                            {msg.bot && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] bg-gray-100 text-black p-4 flex flex-col gap-2 rounded-2xl">
                                        {renderMarkdown(msg.bot, idx)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start mt-4">
                            <LoaderDots />
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Box */}
            <div className="mt-4 mb-6 px-4">
                <div className="relative max-w-7xl border border-gray-300 rounded-2xl p-4 mx-auto flex items-center gap-2 bg-white">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            const ta = textareaRef.current;
                            if (ta) {
                                ta.style.height = "auto";
                                ta.style.height = ta.scrollHeight + "px";
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Message realtime agent"
                        rows={1}
                        className="flex-1 resize-none focus:outline-none bg-transparent overflow-hidden max-h-48"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {!voiceActive ? (
                            <button
                                onClick={startVoiceSession}
                                className="p-1.5 rounded-full bg-neutral-800/50 hover:bg-neutral-700 text-white"
                                title="Start Voice Session"
                            >
                                <HiMiniMicrophone />
                            </button>
                        ) : (
                            <button
                                onClick={stopVoiceSession}
                                className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white"
                                title="Stop Voice Session"
                            >
                                <HiOutlineMicrophone />
                            </button>
                        )}
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-neutral-800 text-white p-1.5 rounded-full hover:bg-neutral-700 transition disabled:opacity-50"
                            title="Send Message"
                        >
                            <FaArrowUp />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Copy Button Component
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-neutral-800 text-white opacity-0 group-hover:opacity-100 transition"
        >
            {copied ? (
                <span className="flex items-center">
                    <FaCheck /> Copied
                </span>
            ) : (
                <span className="flex items-center">
                    <FaRegClipboard /> Copy
                </span>
            )}
        </button>
    );
}