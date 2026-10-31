#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Production Kokoro Vietnamese TTS Server for Google Cloud Run.
Loads kokoro_vi.onnx and 14 voicepacks from ./model directory.
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
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import zipfile

import numpy as np
import onnxruntime as ort
from vig2p import phonemize_text

SAMPLE_RATE = 24000
CROSSFADE_MS = 50
MAX_PHONEMES = 500
PEAK_LIMIT = 0.95

MODEL_DIR = Path(__file__).resolve().parent / "model"
ONNX_PATH = MODEL_DIR / "kokoro_vi.onnx"
CONFIG_PATH = MODEL_DIR / "config.json"
VOICEPACKS_DIR = MODEL_DIR / "voicepacks"

VOICES_INFO = [
    {"id": "diem_trinh", "name": "Diễm Trinh", "gender": "female", "desc": "Giọng Nữ truyền cảm, ngọt ngào (Studio AI)", "tag": "Khuyên dùng"},
    {"id": "hung_thinh", "name": "Hưng Thịnh", "gender": "male", "desc": "Giọng Nam trầm ấm, hào sảng (Studio AI)", "tag": "Phổ biến"},
    {"id": "my_yen", "name": "Mỹ Yến", "gender": "female", "desc": "Giọng Nữ dịu dàng, ngôn tình (Studio AI)", "tag": "Ngôn tình"},
    {"id": "tuan_ngoc", "name": "Tuấn Ngọc", "gender": "male", "desc": "Giọng Nam rõ ràng, đĩnh đạc (Studio AI)", "tag": "Kiếm hiệp"},
    {"id": "thuc_trinh", "name": "Thục Trinh", "gender": "female", "desc": "Giọng Nữ sâu lắng, êm dịu (Studio AI)", "tag": "Tự nhiên"},
    {"id": "mai_linh", "name": "Mai Linh", "gender": "female", "desc": "Giọng Nữ trẻ trung, trong trẻo (Studio AI)", "tag": "Trẻ trung"},
    {"id": "mai_loan", "name": "Mai Loan", "gender": "female", "desc": "Giọng Nữ chuẩn đài, thanh lịch (Studio AI)", "tag": "Thanh lịch"},
    {"id": "manh_dung", "name": "Mạnh Dũng", "gender": "male", "desc": "Giọng Nam trầm hùng, mạnh mẽ (Studio AI)", "tag": "Hùng tráng"},
    {"id": "ngoc_huyen", "name": "Ngọc Huyền", "gender": "female", "desc": "Giọng Nữ ấm áp, tự nhiên (Studio AI)", "tag": "Tự nhiên"},
    {"id": "phat_tai", "name": "Phát Tài", "gender": "male", "desc": "Giọng Nam sôi nổi, vui vẻ (Studio AI)", "tag": "Sôi nổi"},
    {"id": "thanh_dat", "name": "Thành Đạt", "gender": "male", "desc": "Giọng Nam thời sự, dứt khoát (Studio AI)", "tag": "Hiện đại"},
    {"id": "duc_an", "name": "Đức An", "gender": "male", "desc": "Giọng Nam điềm đạm, triết lý (Studio AI)", "tag": "Điềm đạm"},
    {"id": "duc_duy", "name": "Đức Duy", "gender": "male", "desc": "Giọng Nam thanh niên hoạt bát (Studio AI)", "tag": "Năng động"},
    {"id": "storyvert", "name": "Truyện Audio", "gender": "female", "desc": "Giọng đọc chuyên biệt cho tiểu thuyết dài kỳ (Studio AI)", "tag": "Kể chuyện"},
]

# Global Runtime State
RUNTIME: dict = {}
AUDIO_CACHE: dict[str, bytes] = {}
CACHE_MAX_SIZE = 300

def get_cache_key(voice: str, speed: float, text: str) -> str:
    return hashlib.md5(f"{voice}:{speed:.2f}:{text}".encode("utf-8")).hexdigest()

def init_runtime():
    global RUNTIME
    if RUNTIME:
        return RUNTIME

    print(f"[*] Loading model from {ONNX_PATH}...")
    t0 = time.time()
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    # Session options for Cloud Run CPU
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = int(os.environ.get("ORT_THREADS", 2))
    opts.inter_op_num_threads = 1
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    session = ort.InferenceSession(str(ONNX_PATH), sess_options=opts, providers=["CPUExecutionProvider"])

    RUNTIME = {
        "session": session,
        "vocab": config["vocab"],
        "context_length": int(config["plbert"]["max_position_embeddings"]),
        "voicepacks": {},
    }
    print(f"[+] Model loaded in {(time.time() - t0)*1000:.1f}ms")
    return RUNTIME

def load_voicepack(voice: str):
    rt = init_runtime()
    if voice in rt["voicepacks"]:
        return rt["voicepacks"][voice]

    pt_path = VOICEPACKS_DIR / f"{voice}.pt"
    if not pt_path.is_file():
        pt_path = VOICEPACKS_DIR / "diem_trinh.pt"

    with zipfile.ZipFile(pt_path) as archive:
        entries = [n for n in archive.namelist() if re.search(r"/data/\d+$", n)]
        raw = archive.read(sorted(entries)[0])

    pack = np.frombuffer(raw, dtype="<f4").reshape(-1, 1, 256)
    rt["voicepacks"][voice] = pack
    return pack

def split_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text.strip())
    if not normalized:
        return []
    chunks: list[str] = []
    start = 0
    for match in re.finditer(r"[.!?…]+(?:[\"”’)]*)", normalized):
        end = match.end()
        if end < len(normalized) and not normalized[end].isspace():
            continue
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
    remainder = normalized[start:].strip()
    if remainder:
        chunks.append(remainder)
    return chunks

def phoneme_chunks(text: str) -> list[str]:
    out: list[str] = []
    def emit(part: str) -> None:
        part = part.strip()
        if not part:
            return
        phonemes = phonemize_text(part)
        if not phonemes:
            return
        if len(phonemes) <= MAX_PHONEMES:
            out.append(phonemes)
            return
        words = part.split(" ")
        if len(words) < 2:
            out.append(phonemes[:MAX_PHONEMES])
            return
        mid = len(words) // 2
        emit(" ".join(words[:mid]))
        emit(" ".join(words[mid:]))

    for sentence in split_sentences(text):
        emit(sentence)
    return out

def merge_audio(chunks: list, crossfade_samples: int):
    valid = [np.asarray(c, dtype=np.float32).reshape(-1) for c in chunks if len(c) > 0]
    if not valid:
        return np.array([], dtype=np.float32)
    merged = valid[0]
    for chunk in valid[1:]:
        overlap = min(int(crossfade_samples), len(merged), len(chunk))
        if overlap <= 0:
            merged = np.concatenate([merged, chunk])
            continue
        fade_out = np.linspace(1.0, 0.0, overlap + 2, dtype=np.float32)[1:-1]
        fade_in = 1.0 - fade_out
        blended = (merged[-overlap:] * fade_out) + (chunk[:overlap] * fade_in)
        merged = np.concatenate([merged[:-overlap], blended, chunk[overlap:]])
    return merged.astype(np.float32, copy=False)

def synthesize_to_wav(voice: str, text: str, speed: float = 1.0) -> bytes:
    cache_key = get_cache_key(voice, speed, text)
    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]

    rt = init_runtime()
    vocab = rt["vocab"]
    pack = load_voicepack(voice)
    speed_input = np.asarray(float(speed if speed > 0 else 1.0), dtype=np.float32)

    audio_chunks = []
    for phonemes in phoneme_chunks(text):
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

    audio = merge_audio(audio_chunks, round(SAMPLE_RATE * CROSSFADE_MS / 1000))
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

    if len(AUDIO_CACHE) >= CACHE_MAX_SIZE:
        oldest_key = next(iter(AUDIO_CACHE))
        del AUDIO_CACHE[oldest_key]
    AUDIO_CACHE[cache_key] = wav_bytes

    return wav_bytes


class CloudRunHandler(BaseHTTPRequestHandler):
    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/health"):
            data = json.dumps({"status": "ok", "service": "Kokoro Vietnamese Cloud Run TTS", "voices_count": len(VOICES_INFO)}).encode("utf-8")
            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/voices":
            data = json.dumps({"voices": VOICES_INFO}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/tts":
            text = query.get("text", [""])[0].strip()
            voice = query.get("voice", ["diem_trinh"])[0].strip()
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
                self.send_cors()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            t0 = time.time()
            try:
                wav_bytes = synthesize_to_wav(voice, text, speed)
                took_ms = int((time.time() - t0) * 1000)

                self.send_response(200)
                self.send_cors()
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav_bytes)))
                self.send_header("X-Synthesis-Time-Ms", str(took_ms))
                self.send_header("X-Voice", voice)
                self.send_header("Cache-Control", "public, max-age=86400, immutable")
                self.end_headers()
                self.wfile.write(wav_bytes)
                print(f"[CloudRun TTS] '{voice}' | len={len(text)} | {took_ms}ms | {len(wav_bytes)} bytes", flush=True)
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_cors()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
            return

        self.send_response(404)
        self.send_cors()
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
                self.send_cors()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            t0 = time.time()
            try:
                wav_bytes = synthesize_to_wav(voice, text, speed)
                took_ms = int((time.time() - t0) * 1000)

                self.send_response(200)
                self.send_cors()
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav_bytes)))
                self.send_header("X-Synthesis-Time-Ms", str(took_ms))
                self.send_header("X-Voice", voice)
                self.send_header("Cache-Control", "public, max-age=86400, immutable")
                self.end_headers()
                self.wfile.write(wav_bytes)
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_cors()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
            return

        self.send_response(404)
        self.send_cors()
        self.end_headers()

    def log_message(self, format, *args):
        pass

def main():
    port = int(os.environ.get("PORT", 8080))
    print(f"[*] Starting Cloud Run Kokoro TTS Server on port {port}...", flush=True)
    init_runtime()
    load_voicepack("diem_trinh")
    server = ThreadingHTTPServer(("0.0.0.0", port), CloudRunHandler)
    print(f"[+] Kokoro Cloud Run Server ready on http://0.0.0.0:{port}", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
