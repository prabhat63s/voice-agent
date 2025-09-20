/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mapping for Windows special URIs/apps
const WINDOWS_APP_MAP: Record<string, string> = {
    settings: "ms-settings:",
    camera: "ms-camera:",
    "control panel": "control",
    calculator: "calc",
    display: "ms-settings:display",
    bluetooth: "ms-settings:bluetooth",
    network: "ms-settings:network",
};

async function getWeather(city: string) {
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    if (!WEATHER_API_KEY) throw new Error("WEATHER_API_KEY is not set");

    const WEATHER_API_URL = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        city
    )}&aqi=yes`;
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok)
        throw new Error(`Weather API error for city ${city}: ${res.statusText}`);

    const data = await res.json();
    const current = data.current;

    const weatherDetails = `
Weather in ${data.location.name}, ${data.location.region}, ${data.location.country}:
- Temperature: ${current.temp_c}°C / ${current.temp_f}°F
- Condition: ${current.condition.text}
- Feels Like: ${current.feelslike_c}°C / ${current.feelslike_f}°F
- Humidity: ${current.humidity}%
- Wind: ${current.wind_kph} kph (${current.wind_mph} mph), direction ${current.wind_dir}
- Precipitation: ${current.precip_mm} mm / ${current.precip_in} in
- UV Index: ${current.uv}
- Cloud Cover: ${current.cloud}%
- Visibility: ${current.vis_km} km / ${current.vis_miles} miles
- Air Quality Index (if available): ${current.air_quality ? JSON.stringify(current.air_quality, null, 2) : "N/A"
        }
    `.trim();

    return weatherDetails;
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
                    input: [
                        { role: "user", content: [{ type: "input_text", text: prompt }] },
                    ],
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
                const docsDir = path.join(process.cwd(), "documents");

                if (!fs.existsSync(docsDir)) {
                    output = "Documents folder does not exist.";
                    break;
                }

                const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".txt"));

                if (files.length === 0) {
                    output = "No documents found in the folder.";
                    break;
                }

                const results = files
                    .map((file) => {
                        const filePath = path.join(docsDir, file);
                        const content = fs.readFileSync(filePath, "utf-8");
                        if (content.toLowerCase().includes(prompt.toLowerCase())) {
                            const index = content
                                .toLowerCase()
                                .indexOf(prompt.toLowerCase());
                            const snippet = content.slice(
                                Math.max(0, index - 30),
                                index + prompt.length + 30
                            );
                            return `- ${file}: "...${snippet.trim()}..."`;
                        }
                        return null;
                    })
                    .filter(Boolean);

                output = results.length
                    ? `Found ${results.length} result(s) for "${prompt}":\n${results.join(
                        "\n"
                    )}`
                    : `No results found for "${prompt}".`;

                break;
            }

            case "computer_use": {
                try {
                    const platform = process.platform;
                    const isLocal =
                        platform === "win32" || platform === "darwin" || platform === "linux";

                    if (!isLocal) {
                        output = "Computer actions can only be executed on your local machine.";
                        break;
                    }

                    const parts = prompt.trim().split(" ");
                    const action = parts[0].toLowerCase();
                    const args = parts.slice(1).join(" ");

                    let result = "";

                    switch (action) {
                        case "open": {
                            if (!args) {
                                result = "Please specify what to open.";
                                break;
                            }

                            if (platform === "win32") {
                                const mapped = WINDOWS_APP_MAP[args.toLowerCase()];
                                if (mapped) {
                                    execSync(`start "" "${mapped}"`);
                                } else if (args.startsWith("http")) {
                                    execSync(`start "" "${args}"`);
                                } else {
                                    try {
                                        execSync(`start "" "${args}"`);
                                    } catch {
                                        result = `Unable to open "${args}".`;
                                        break;
                                    }
                                }
                            } else if (platform === "darwin") {
                                execSync(`open "${args}"`);
                            } else if (platform === "linux") {
                                execSync(`xdg-open "${args}"`);
                            }

                            result = `Opened "${args}" successfully.`;
                            break;
                        }

                        case "close": {
                            if (!args) {
                                result = "Please specify what to close.";
                                break;
                            }

                            if (platform === "win32") {
                                try {
                                    execSync(`taskkill /IM "${args}.exe" /F`);
                                    result = `Closed "${args}" successfully.`;
                                } catch {
                                    result = `Unable to close "${args}". Make sure the app name is correct.`;
                                }
                            } else if (platform === "darwin") {
                                try {
                                    execSync(`osascript -e 'quit app "${args}"'`);
                                    result = `Closed "${args}" successfully.`;
                                } catch {
                                    result = `Unable to close "${args}" on macOS.`;
                                }
                            } else if (platform === "linux") {
                                try {
                                    execSync(`pkill -f "${args}"`);
                                    result = `Closed "${args}" successfully.`;
                                } catch {
                                    result = `Unable to close "${args}" on Linux.`;
                                }
                            } else {
                                result = "Close command not supported on this OS.";
                            }
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
                    const platform = process.platform;
                    const isLocal = platform === "win32" || platform === "darwin" || platform === "linux";

                    if (!isLocal) {
                        output = "Local shell commands can only run on your local machine.";
                        break;
                    }

                    const parts = prompt.trim().split(" ");
                    const cmd = parts[0].toLowerCase();
                    const args = parts.slice(1);

                    // Cross-platform allowlist
                    const allowedCommands: Record<string, string[]> = {
                        echo: [],
                        cd: [],
                        pwd: [],
                        ls: [],
                        dir: [],
                        notepad: ["win32"],
                        calc: ["win32"],
                        TextEdit: ["darwin"],
                        Calculator: ["darwin"],
                        gedit: ["linux"],
                        xcalc: ["linux"],
                    };

                    if (!allowedCommands[cmd] || (allowedCommands[cmd].length && !allowedCommands[cmd].includes(platform))) {
                        output = `Command "${cmd}" not allowed on this platform for security reasons.`;
                        break;
                    }

                    // Handle special commands
                    switch (cmd) {
                        case "cd": {
                            try {
                                const dir = args[0] || process.env.HOME || process.cwd();
                                process.chdir(dir);
                                output = `Changed directory to ${process.cwd()}`;
                            } catch (err: any) {
                                output = `Error changing directory: ${err.message}`;
                            }
                            break;
                        }

                        case "pwd": {
                            output = `Current directory: ${process.cwd()}`;
                            break;
                        }

                        case "ls":
                        case "dir": {
                            try {
                                let listCmd: "dir" | "ls";
                                let listArgs = args.join(" ");

                                if (platform === "win32") {
                                    listCmd = "dir";
                                } else {
                                    listCmd = "ls";
                                    listArgs = "-la " + listArgs;
                                }

                                const result = execSync(`${listCmd} ${listArgs}`, { encoding: "utf-8" });
                                output = result;

                            } catch (err: any) {
                                output = `Error listing files: ${err.message}`;
                            }
                            break;
                        }

                        case "echo": {
                            output = args.join(" ");
                            break;
                        }

                        default: {
                            // GUI apps launch
                            try {
                                const appCmd = cmd;
                                if (platform === "win32") {
                                    execSync(`start "" "${appCmd}"`);
                                } else if (platform === "darwin") {
                                    execSync(`open -a "${appCmd}"`);
                                } else if (platform === "linux") {
                                    execSync(`${appCmd} ${args.join(" ")}`);
                                }
                                output = `Launched ${cmd} successfully.`;
                            } catch (err: any) {
                                output = `Error launching "${cmd}": ${err.message}`;
                            }
                        }
                    }

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
