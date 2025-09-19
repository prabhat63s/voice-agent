/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Dynamic function example
async function getWeather(city: string) {
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    const WEATHER_API_URL = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}`;
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok) throw new Error(`Weather API error for city ${city}`);
    const data = await res.json();
    return `Weather in ${city}:\n- Temperature: ${data.current.temp_c}°C\n- Condition: ${data.current.condition.text}`;
}

export async function POST(req: Request) {
    try {
        const { prompt, toolType } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        let output = "";

        switch (toolType) {
            case "web_search": {
                const webRes = await client.responses.create({
                    model: "gpt-4o-mini",
                    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
                });
                output = webRes.output_text || "No response generated";
                break;
            }

            case "function_calling": {
                const funcRes = await client.responses.create({
                    model: "gpt-4o-mini",
                    input: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "input_text",
                                    text: `Extract the city from this input and return only the city name:\n"${prompt}"`,
                                },
                            ],
                        },
                    ],
                });

                const city = funcRes.output_text?.trim();
                if (!city) {
                    output = "Could not determine city from input.";
                } else {
                    output = await getWeather(city);
                }
                break;
            }

            case "file_search": {
                const docsDir = path.join(process.cwd(), "documents"); // adjust if needed

                console.log("Looking for documents in:", docsDir);

                if (!fs.existsSync(docsDir)) {
                    output = "Documents folder does not exist.";
                    break;
                }

                const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".txt"));
                console.log("Files found:", files);

                if (files.length === 0) {
                    output = "No documents found in the folder.";
                    break;
                }

                const results = files
                    .map(file => {
                        const filePath = path.join(docsDir, file);
                        const content = fs.readFileSync(filePath, "utf-8");
                        if (content.toLowerCase().includes(prompt.toLowerCase())) {
                            const index = content.toLowerCase().indexOf(prompt.toLowerCase());
                            const snippet = content.slice(Math.max(0, index - 30), index + prompt.length + 30);
                            return `- ${file}: "...${snippet.trim()}..."`;
                        }
                        return null;
                    })
                    .filter(Boolean);

                output = results.length
                    ? `Found ${results.length} result(s) for "${prompt}":\n${results.join("\n")}`
                    : `No results found for "${prompt}".`;

                break;
            }


            case "computer_use": {
                try {
                    const platform = process.platform;
                    const parts = prompt.trim().split(" ");
                    const action = parts[0].toLowerCase();
                    const args = parts.slice(1).join(" ");

                    let result = "";

                    switch (action) {
                        case "open": {
                            if (!args) {
                                result = "Please specify a file or folder to open.";
                                break;
                            }
                            if (platform === "win32") {
                                execSync(`start "" "${args}"`);
                            } else {
                                execSync(`open "${args}"`);
                            }
                            result = `Opened "${args}" successfully.`;
                            break;
                        }

                        case "list_apps": {
                            if (platform === "win32") {
                                try {
                                    result = execSync(
                                        `powershell -Command "Get-StartApps | Select-Object -ExpandProperty Name"`,
                                        { encoding: "utf-8" }
                                    );
                                } catch {
                                    result = "Unable to list apps on this system.";
                                }
                            } else {
                                result = "Listing apps is only supported on Windows.";
                            }
                            break;
                        }

                        default: {
                            const allowedCommands = ["echo", "dir", "cd", "ls", "pwd"];
                            if (!allowedCommands.includes(action)) {
                                result = `Action/command "${action}" not recognized or not allowed.`;
                                break;
                            }
                            try {
                                const cmd = args ? `${action} ${args}` : action;
                                result = execSync(cmd, { encoding: "utf-8" });
                            } catch (err: any) {
                                result = `Error executing command "${action}": ${err.message}`;
                            }
                        }
                    }

                    output = result;
                } catch (err: any) {
                    output = `Error executing computer action: ${err.message}`;
                }
                break;
            }

            case "local_shell": {
                try {
                    const parts = prompt.trim().split(" ");
                    const cmd = parts[0].toLowerCase();
                    const args = parts.slice(1).join(" ");
                    const allowedCommands = ["echo", "dir", "cd", "ls", "pwd"];
                    if (!allowedCommands.includes(cmd)) {
                        output = `Command "${cmd}" not allowed for security reasons.`;
                        break;
                    }
                    const fullCmd = args ? `${cmd} ${args}` : cmd;
                    const result = execSync(fullCmd, { encoding: "utf-8" });
                    output = `Shell command output:\n${result}`;
                } catch (err: any) {
                    output = `Error executing shell command: ${err.message}`;
                }
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid tool type" }, { status: 400 });
        }

        return NextResponse.json({ output, toolType });
    } catch (err: any) {
        console.error("OpenAI API error:", err);
        return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
    }
}
