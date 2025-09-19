/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
    try {
        const { prompt, toolType } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        // Set a default toolType if not provided
        const selectedToolType = toolType || "web_search";

        let response;
        let output;

        switch (selectedToolType) {
            case "web_search":
                response = await client.responses.create({
                    model: "gpt-4o-mini",
                    tools: [{ type: "web_search" }],
                    input: prompt,
                });
                output = response.output_text || "No response generated";
                break;

            default:
                return NextResponse.json({ error: "Invalid tool type" }, { status: 400 });
        }

        return NextResponse.json({ output, toolType: selectedToolType });

    } catch (err: any) {
        console.error("OpenAI API error:", err);
        return NextResponse.json(
            { error: err?.message ?? "unknown error" },
            { status: 500 }
        );
    }
}