#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Local Kokoro Vietnamese TTS HTTP Server
Powered by Kokoro-82M ONNX + Zoo Reup Studio voicepacks.
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import time
import urllib.parse
import wave
import hashlib
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Paths
KOKORO_INSTALL = Path(r"C:\zooreup\Zoo Reup Studio\data\runtime\kokoro-vi\install")
KOKORO_WORKER_DIR = Path(r"C:\zooreup\Zoo Reup Studio\resources\tts")

# Environment setup
os.environ["KOKORO_DIR"] = str(KOKORO_INSTALL)
if str(KOKORO_WORKER_DIR) not in sys.path:
    sys.path.insert(0, str(KOKORO_WORKER_DIR))

site_packages = KOKORO_INSTALL / "site-packages"
if site_packages.is_dir() and str(site_packages) not in sys.path:
    sys.path.insert(0, str(site_packages))

# Import kokoro_worker helpers
import kokoro_worker

SAMPLE_RATE = kokoro_worker.SAMPLE_RATE
CROSSFADE_MS = kokoro_worker.CROSSFADE_MS
PEAK_LIMIT = kokoro_worker.PEAK_LIMIT

VOICES_INFO = [
    {"id": "diem_trinh", "name": "Diễm Trinh", "gender": "female", "desc": "Giọng Nữ truyền cảm, ngọt ngào (AI Studio)", "tag": "Khuyên dùng"},
    {"id": "hung_thinh", "name": "Hưng Thịnh", "gender": "male", "desc": "Giọng Nam trầm ấm, hào sảng (AI Studio)", "tag": "Phổ biến"},
    {"id": "my_yen", "name": "Mỹ Yến", "gender": "female", "desc": "Giọng Nữ dịu dàng, ngôn tình (AI Studio)", "tag": "Ngôn tình"},
    {"id": "tuan_ngoc", "name": "Tuấn Ngọc", "gender": "male", "desc": "Giọng Nam rõ ràng, đĩnh đạc (AI Studio)", "tag": "Kiếm hiệp"},
    {"id": "thuc_trinh", "name": "Thục Trinh", "gender": "female", "desc": "Giọng Nữ sâu lắng, êm dịu (AI Studio)", "tag": "Tự nhiên"},
    {"id": "mai_linh", "name": "Mai Linh", "gender": "female", "desc": "Giọng Nữ trẻ trung, trong trẻo (AI Studio)", "tag": "Trẻ trung"},
    {"id": "mai_loan", "name": "Mai Loan", "gender": "female", "desc": "Giọng Nữ chuẩn đài, thanh lịch (AI Studio)", "tag": "Thanh lịch"},
    {"id": "manh_dung", "name": "Mạnh Dũng", "gender": "male", "desc": "Giọng Nam trầm hùng, mạnh mẽ (AI Studio)", "tag": "Hùng tráng"},
    {"id": "ngoc_huyen", "name": "Ngọc Huyền", "gender": "female", "desc": "Giọng Nữ ấm áp, tự nhiên (AI Studio)", "tag": "Tự nhiên"},
    {"id": "phat_tai", "name": "Phát Tài", "gender": "male", "desc": "Giọng Nam sôi nổi, vui vẻ (AI Studio)", "tag": "Sôi nổi"},
    {"id": "thanh_dat", "name": "Thành Đạt", "gender": "male", "desc": "Giọng Nam thời sự, dứt khoát (AI Studio)", "tag": "Hiện đại"},
    {"id": "duc_an", "name": "Đức An", "gender": "male", "desc": "Giọng Nam điềm đạm, triết lý (AI Studio)", "tag": "Điềm đạm"},
    {"id": "duc_duy", "name": "Đức Duy", "gender": "male", "desc": "Giọng Nam thanh niên hoạt bát (AI Studio)", "tag": "Năng động"},
    {"id": "storyvert", "name": "Truyện Audio", "gender": "female", "desc": "Giọng đọc chuyên biệt cho truyện dài kỳ (AI Studio)", "tag": "Kể chuyện"},
]

# Audio in-memory cache (max 200 recent chunks)
AUDIO_CACHE: dict[str, bytes] = {}
CACHE_MAX_SIZE = 200

def get_cache_key(voice: str, speed: float, text: str) -> str:
    h = hashlib.md5(f"{voice}:{speed:.2f}:{text}".encode("utf-8")).hexdigest()
    return h

def synthesize_to_wav_bytes(voice: str, text: str, speed: float = 1.0) -> bytes:
    cache_key = get_cache_key(voice, speed, text)
    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]

    rt = kokoro_worker._runtime()
    np = rt["np"]
    vocab = rt["vocab"]
    pack = kokoro_worker._voicepack(voice)

    speed_input = np.asarray(float(speed if speed > 0 else 1.0), dtype=np.float32)
    audio_chunks = []

    for phonemes in kokoro_worker._phoneme_chunks(text):
        ids = [vocab[p] for p in phonemes if p in vocab]
        if not ids:
            continue
        if len(ids) + 2 > rt["context_length"]:
            ids = ids[: rt["context_length"] - 2]
        input_ids = np.asarray([[0, *ids, 0]], dtype=np.int64)
        style = np.asarray(pack[min(len(phonemes), pack.shape[0]) - 1], dtype=np.float32)
        waveform, _ = rt["session"].run(
            None,
            {"input_ids": input_ids, "ref_s": style, "speed": speed_input},
        )
        audio_chunks.append(np.asarray(waveform, dtype=np.float32).reshape(-1))

    audio = kokoro_worker._merge_audio(audio_chunks, round(SAMPLE_RATE * CROSSFADE_MS / 1000))
    if len(audio) == 0:
        raise RuntimeError("Không tạo được âm thanh từ nội dung này.")

    peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
    if peak > PEAK_LIMIT:
        audio = audio * (PEAK_LIMIT / peak)
    pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype("<i2")

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())

    wav_bytes = buf.getvalue()

    # Evict if cache exceeds max size
    if len(AUDIO_CACHE) >= CACHE_MAX_SIZE:
        oldest_key = next(iter(AUDIO_CACHE))
        del AUDIO_CACHE[oldest_key]
    AUDIO_CACHE[cache_key] = wav_bytes

    return wav_bytes


class KokoroHTTPHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/health"):
            data = json.dumps({"status": "ok", "service": "Kokoro Vietnamese TTS Server", "voices_count": len(VOICES_INFO)}).encode("utf-8")
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/voices":
            data = json.dumps({"voices": VOICES_INFO}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/tts":
            text = query.get("text", [""])[0].strip()
            voice = query.get("voice", ["diem_trinh"])[0].strip()
            # Strip kokoro- prefix if present
            if voice.startswith("kokoro-"):
                voice = voice[7:]
            if not voice:
                voice = "diem_trinh"

            try:
                speed = float(query.get("speed", ["1.0"])[0])
            except ValueError:
                speed = 1.0

            if not text:
                err = json.dumps({"error": "Missing 'text' parameter"}).encode("utf-8")
                self.send_response(400)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            t0 = time.time()
            try:
                wav_bytes = synthesize_to_wav_bytes(voice, text, speed)
                took_ms = int((time.time() - t0) * 1000)

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav_bytes)))
                self.send_header("X-Synthesis-Time-Ms", str(took_ms))
                self.send_header("X-Voice", voice)
                self.send_header("Cache-Control", "public, max-age=86400, immutable")
                self.end_headers()
                self.wfile.write(wav_bytes)
                print(f"[Kokoro TTS] '{voice}' | len={len(text)} | {took_ms}ms | {len(wav_bytes)} bytes", flush=True)
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
                print(f"[Kokoro TTS Error] {e}", flush=True)
            return

        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == "/tts":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len).decode("utf-8", errors="ignore")
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            text = str(data.get("text", "")).strip()
            voice = str(data.get("voice", "diem_trinh")).strip()
            if voice.startswith("kokoro-"):
                voice = voice[7:]
            if not voice:
                voice = "diem_trinh"

            try:
                speed = float(data.get("speed", 1.0))
            except ValueError:
                speed = 1.0

            if not text:
                err = json.dumps({"error": "Missing 'text' field"}).encode("utf-8")
                self.send_response(400)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            t0 = time.time()
            try:
                wav_bytes = synthesize_to_wav_bytes(voice, text, speed)
                took_ms = int((time.time() - t0) * 1000)

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav_bytes)))
                self.send_header("X-Synthesis-Time-Ms", str(took_ms))
                self.send_header("X-Voice", voice)
                self.send_header("Cache-Control", "public, max-age=86400, immutable")
                self.end_headers()
                self.wfile.write(wav_bytes)
                print(f"[Kokoro TTS POST] '{voice}' | len={len(text)} | {took_ms}ms | {len(wav_bytes)} bytes", flush=True)
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
            return

        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()

    def log_message(self, format, *args):
        # Silence standard HTTP access log spam
        pass


def run_server(port: int = 8008, host: str = "0.0.0.0"):
    print("=" * 60)
    print("  KOKORO VIETNAMESE TTS LOCAL SERVER")
    print("  Loading ONNX model & warming up...")
    print("=" * 60)

    # Pre-warm runtime and default voice
    t0 = time.time()
    rt = kokoro_worker._runtime()
    kokoro_worker._voicepack("diem_trinh")
    print(f"-> Model & voicepack loaded in {(time.time() - t0)*1000:.1f}ms")
    print(f"-> Available voices ({len(VOICES_INFO)}): {', '.join([v['id'] for v in VOICES_INFO])}")
    print(f"-> Server listening on http://{host}:{port}")
    print("   Endpoints:")
    print(f"     GET  http://localhost:{port}/health")
    print(f"     GET  http://localhost:{port}/voices")
    print(f"     GET  http://localhost:{port}/tts?voice=diem_trinh&text=...")
    print("=" * 60, flush=True)

    server = ThreadingHTTPServer((host, port), KokoroHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Kokoro Server...")
        server.server_close()


if __name__ == "__main__":
    port = 8008
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port=port)
