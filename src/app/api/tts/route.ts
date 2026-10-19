import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

/**
 * Synthesize speech using Microsoft Edge Neural TTS via Python helper
 */
async function generateEdgeTts(text: string, voice: string, rate: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Resolve python path (.venv on Windows or fallback)
    const pythonExe = path.resolve(process.cwd(), ".venv/Scripts/python.exe");
    const scriptPath = path.resolve(process.cwd(), "scripts/tts_stream.py");

    if (!fs.existsSync(pythonExe) || !fs.existsSync(scriptPath)) {
      return reject(new Error("Python venv or tts_stream.py not found"));
    }

    const proc = spawn(pythonExe, [scriptPath, voice, rate]);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    proc.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });

    proc.stderr.on("data", (chunk) => {
      errChunks.push(chunk);
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        const errMsg = Buffer.concat(errChunks).toString("utf-8");
        reject(new Error(`Edge TTS process exited with code ${code}: ${errMsg}`));
      }
    });

    try {
      proc.stdin.write(text, "utf-8");
      proc.stdin.end();
    } catch (e) {
      reject(e);
    }

    // Safety timeout: 7 seconds
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch (_) {}
      reject(new Error("Edge TTS timed out after 7s"));
    }, 7000);

    proc.on("close", () => clearTimeout(timer));
  });
}

/**
 * Fallback to Google Translate TTS
 */
async function generateGoogleTts(text: string, lang: string): Promise<Buffer> {
  const cleanText = text.slice(0, 200);
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
    lang
  )}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

  const response = await fetch(googleTtsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Google TTS responded with ${response.status}`);
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}

const KOKORO_VOICE_IDS = new Set([
  "diem_trinh",
  "hung_thinh",
  "my_yen",
  "tuan_ngoc",
  "thuc_trinh",
  "mai_linh",
  "mai_loan",
  "manh_dung",
  "ngoc_huyen",
  "phat_tai",
  "thanh_dat",
  "duc_an",
  "duc_duy",
  "storyvert",
]);

const MALE_KOKORO_VOICES = new Set([
  "hung_thinh",
  "tuan_ngoc",
  "manh_dung",
  "phat_tai",
  "thanh_dat",
  "duc_an",
  "duc_duy",
]);

/**
 * Synthesize speech using local/tunneled Kokoro-82M ONNX server
 */
async function generateKokoroTts(
  endpoint: string,
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer> {
  const cleanEndpoint = endpoint.replace(/\/+$/, "");
  const rawVoice = voice.replace(/^kokoro-/, "");
  const url = `${cleanEndpoint}/tts?voice=${encodeURIComponent(rawVoice)}&speed=${speed}&text=${encodeURIComponent(text)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "audio/wav, audio/*",
        "User-Agent": "DocTruyen-TTS-Gateway/1.0",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Kokoro server error (${res.status}): ${errText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Health check endpoint for UI testing
  if (searchParams.get("check") === "health") {
    const customEndpoint = searchParams.get("endpoint") || process.env.KOKORO_TTS_URL || "http://127.0.0.1:8008";
    try {
      const cleanEndpoint = customEndpoint.replace(/\/+$/, "");
      const res = await fetch(`${cleanEndpoint}/health`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ok: true, endpoint: cleanEndpoint, data });
      }
      return NextResponse.json({ ok: false, error: `Status ${res.status}` }, { status: 502 });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
  }

  const text = (searchParams.get("text") || "").trim();
  const lang = searchParams.get("lang") || "vi";
  let voice = searchParams.get("voice") || "";
  const rate = searchParams.get("rate") || "+0%";
  const customEndpoint = searchParams.get("endpoint") || "";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // Parse speed factor from rate string (e.g. "+20%" -> 1.2, "-10%" -> 0.9)
  let speed = 1.0;
  if (rate) {
    const match = rate.match(/([+-]?\d+)%/);
    if (match) {
      const percent = parseInt(match[1], 10);
      speed = Math.max(0.5, Math.min(2.0, 1.0 + percent / 100));
    }
  }

  // Check if requested voice is a Kokoro voice
  const rawVoiceId = voice.replace(/^kokoro-/, "");
  const isKokoro = voice.startsWith("kokoro-") || KOKORO_VOICE_IDS.has(rawVoiceId);

  if (isKokoro) {
    // Determine candidate endpoints to try
    const endpointsToTry: string[] = [];
    if (customEndpoint) endpointsToTry.push(customEndpoint);
    if (process.env.KOKORO_TTS_URL) endpointsToTry.push(process.env.KOKORO_TTS_URL);
    // In local dev, try localhost:8008
    if (process.env.NODE_ENV !== "production") {
      endpointsToTry.push("http://127.0.0.1:8008");
    }
    // Also include default fallback tunnel or domain
    endpointsToTry.push("https://tts.doctruyen.vip");

    let lastKokoroErr = "";
    for (const ep of endpointsToTry) {
      try {
        const audioBuffer = await generateKokoroTts(ep, text, rawVoiceId, speed);
        return new NextResponse(new Uint8Array(audioBuffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.byteLength.toString(),
            "Cache-Control": "public, max-age=86400, immutable",
            "X-TTS-Engine": "kokoro-ai-studio",
            "X-TTS-Voice": rawVoiceId,
          },
        });
      } catch (err: any) {
        lastKokoroErr = err.message;
      }
    }

    console.warn(`[TTS] Kokoro server unavailable (${lastKokoroErr}), falling back to Edge TTS.`);
    // Fall back to suitable Edge TTS voice based on gender
    const isMale = MALE_KOKORO_VOICES.has(rawVoiceId);
    voice = isMale ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
  }

  // Default natural voices if not specified
  if (!voice) {
    if (lang === "vi") voice = "vi-VN-HoaiMyNeural";
    else if (lang === "en") voice = "en-US-JennyNeural";
    else if (lang === "zh") voice = "zh-CN-XiaoxiaoNeural";
    else if (lang === "ja") voice = "ja-JP-NanamiNeural";
    else voice = "vi-VN-HoaiMyNeural";
  }

  // If explicit google requested
  if (voice === "google") {
    try {
      const audioBuffer = await generateGoogleTts(text, lang);
      return new NextResponse(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Attempt Neural Edge TTS
  try {
    const audioBuffer = await generateEdgeTts(text, voice, rate);
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
        "X-TTS-Engine": "edge-neural",
        "X-TTS-Voice": voice,
      },
    });
  } catch (edgeErr: any) {
    // Graceful fallback to Google TTS
    try {
      const fallbackBuffer = await generateGoogleTts(text, lang);
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": fallbackBuffer.byteLength.toString(),
          "Cache-Control": "public, max-age=86400, immutable",
          "X-TTS-Engine": "google-fallback",
        },
      });
    } catch (googleErr: any) {
      return NextResponse.json(
        { error: `TTS failed: ${edgeErr.message} | ${googleErr.message}` },
        { status: 500 }
      );
    }
  }
}

