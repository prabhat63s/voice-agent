import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_KEY) {
        return NextResponse.json(
            { error: "Missing OPENAI_API_KEY" },
            { status: 500 }
        );
    }

    try {
        // Create a Realtime session with OpenAI
        const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENAI_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview",
                voice: "verse", // voice for TTS
                instructions: "You are a helpful voice assistant.", // GPT instructions
                output_audio_format: "pcm16", // audio output format for TTS
                max_response_output_tokens: 1000,
                temperature: 0.8,
                speed: 1,

                // Turn detection settings for live conversation
                turn_detection: {
                    type: "server_vad", // voice activity detection
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 200,
                    create_response: true,
                    interrupt_response: true,
                },

                // Enable STT + TTS
                enable_streaming: true, // allows streaming partial responses
            }),
        });

        const data = await resp.json();

        if (!resp.ok || !data.client_secret?.value) {
            return NextResponse.json(
                { error: "Failed to create Realtime session", details: data },
                { status: resp.status }
            );
        }

        return NextResponse.json({ client_secret: data.client_secret });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
