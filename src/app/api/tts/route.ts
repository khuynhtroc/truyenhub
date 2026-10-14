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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") || "").trim();
  const lang = searchParams.get("lang") || "vi";
  let voice = searchParams.get("voice") || "";
  const rate = searchParams.get("rate") || "+0%";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
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

  // Attempt Neural Edge TTS first
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
    console.warn("Edge TTS fallback to Google TTS:", edgeErr.message);
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
