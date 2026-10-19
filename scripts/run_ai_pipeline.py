#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Runner for Kokoro TTS Server + Cloudflare Tunnel.
Launches both services and displays the live tunnel link.
"""

import os
import re
import sys
import time
import subprocess
import threading
from pathlib import Path

# Ensure UTF-8 output on Windows
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT_DIR = Path(__file__).resolve().parent.parent
PYTHON_EXE = r"C:\zooreup\Zoo Reup Studio\data\runtime\python-embed\install\python.exe"
KOKORO_SERVER_SCRIPT = ROOT_DIR / "scripts" / "local_kokoro_server.py"
CLOUDFLARED_EXE = ROOT_DIR / "scripts" / "cloudflared.exe"

def main():
    print("=" * 72)
    print("  [*] DANG KHOI DONG HE THONG MAY CHU GIONG DOC AI KOKORO")
    print("=" * 72)

    # 1. Start Kokoro HTTP server
    print("[1/2] Dang tai mo hinh Kokoro ONNX va khoi dong server HTTP (cong 8008)...", flush=True)
    server_env = os.environ.copy()
    server_env["PYTHONUNBUFFERED"] = "1"
    server_proc = subprocess.Popen(
        [PYTHON_EXE, "-u", str(KOKORO_SERVER_SCRIPT), "8008"],
        cwd=str(ROOT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="ignore",
        env=server_env,
        bufsize=1,
    )

    # Wait for server ready signal
    server_ready = False
    for line in iter(server_proc.stdout.readline, ""):
        line_s = line.strip()
        if "Server listening on" in line_s:
            server_ready = True
            break
        elif "Error" in line_s or "Exception" in line_s:
            print(f"[Kokoro Server Log] {line_s}", flush=True)

    if not server_ready:
        print("[!] Loi: Khong the khoi dong may chu Kokoro.", flush=True)
        server_proc.terminate()
        return 1

    print("[+] May chu Kokoro da san sang tren http://127.0.0.1:8008", flush=True)

    # 2. Start Cloudflare Tunnel
    print("[2/2] Đang thiết lập đường truyền Cloudflare Tunnel bảo mật...")
    tunnel_proc = subprocess.Popen(
        [str(CLOUDFLARED_EXE), "tunnel", "--url", "http://127.0.0.1:8008"],
        cwd=str(ROOT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )

    tunnel_url = ""
    # Capture trycloudflare URL
    for line in iter(tunnel_proc.stdout.readline, ""):
        m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if m:
            tunnel_url = m.group(0)
            break

    # Save to file
    if tunnel_url:
        try:
            url_file = ROOT_DIR / "scripts" / "current_tunnel_url.txt"
            url_file.write_text(tunnel_url, encoding="utf-8")
        except Exception:
            pass

    print()
    print("=" * 74)
    print("  [OK] MAY CHU GIONG DOC AI KOKORO (ZOO REUP STUDIO) DA HOAT DONG!")
    print("=" * 74)
    print(f"  * Trang thai:      SAN SANG (14 giong doc AI Studio cao cap)")
    print(f"  * Link noi bo:     http://localhost:8008")
    if tunnel_url:
        print(f"  * Link Internet:   {tunnel_url}")
    else:
        print(f"  * Link Internet:   (Dang tao duong truyen...)")
    print("-" * 74)
    print("  HUONG DAN SU DUNG TREN SITE (doctruyen.vip):")
    print("  1. Mo bat ky chuong truyen nao tren doctruyen.vip.")
    print("  2. Bam nut Nghe Audio (bieu tuong loa) -> Bam 'Cai dat' (Settings).")
    if tunnel_url:
        print(f"  3. Bam 'Cau hinh Server' va dan link nay:")
        print(f"     >> {tunnel_url}")
        print("     Roi bam nut 'Test' de kiem tra ket noi.")
    print("  4. Chon bat ky giong nao trong 14 giong Studio AI (Diem Trinh,")
    print("     Hung Thinh, My Yen, Tuan Ngoc...) de nghe truyen!")
    print()
    print("  Luu y: Khi ban tat cua so nay hoac tat may tinh, he thong tren site")
    print("  se tu dong chuyen sang giong Microsoft Edge du phong ma khong bi loi.")
    print("=" * 74)
    print("  (Nhan Ctrl + C de dung may chu)")
    print()

    # Stream logs in background
    def forward_logs(proc, prefix):
        for line in iter(proc.stdout.readline, ""):
            line_s = line.strip()
            if line_s and not any(skip in line_s for skip in ["metrics server", "CurveID", "precheck", "Connector ID"]):
                # Show synthesis logs
                if "[Kokoro TTS" in line_s:
                    print(f"  🔊 {line_s}", flush=True)

    t1 = threading.Thread(target=forward_logs, args=(server_proc, "SERVER"), daemon=True)
    t1.start()

    try:
        while True:
            time.sleep(1)
            if server_proc.poll() is not None or tunnel_proc.poll() is not None:
                break
    except KeyboardInterrupt:
        print("\nĐang tắt máy chủ...")
    finally:
        try:
            server_proc.terminate()
            tunnel_proc.terminate()
        except Exception:
            pass

    return 0

if __name__ == "__main__":
    sys.exit(main())
