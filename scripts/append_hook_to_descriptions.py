import sys
import json
import urllib.request
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def load_env(filepath=r"F:\Antigravity\truyenhub\.env.local"):
    env = {}
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip("\"'")
    return env

env = load_env()
url = env.get("NEXT_PUBLIC_SUPABASE_URL")
key = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def update_single_story(story):
    desc = story.get("description") or ""
    if "DocTruyen.VIP" in desc:
        return "skipped"

    hook = "\n\n👉 Hãy cùng đọc truyện này với DocTruyen.VIP nhé! Chúc bạn có những phút giây đọc truyện thật thư giãn và vui vẻ."
    new_desc = desc.rstrip() + hook

    patch_data = json.dumps({"description": new_desc}).encode("utf-8")
    patch_req = urllib.request.Request(
        f"{url}/rest/v1/stories?id=eq.{story['id']}",
        data=patch_data,
        headers=headers,
        method="PATCH"
    )
    for _ in range(3):
        try:
            with urllib.request.urlopen(patch_req, timeout=10) as resp:
                return "updated"
        except Exception:
            time.sleep(0.5)
    return "failed"

def main():
    print("Fetching stories...", flush=True)
    req = urllib.request.Request(f"{url}/rest/v1/stories?select=id,slug,title,type,description", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req) as resp:
        stories = json.loads(resp.read().decode("utf-8"))

    print(f"Total stories fetched: {len(stories)}. Starting multi-threaded updates...", flush=True)
    updated = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(update_single_story, s): s for s in stories}
        done_count = 0
        for future in as_completed(futures):
            res = future.result()
            if res == "updated":
                updated += 1
            elif res == "skipped":
                skipped += 1
            else:
                failed += 1

            done_count += 1
            if done_count % 100 == 0 or done_count == len(stories):
                print(f"Processed: {done_count}/{len(stories)} - Updated: {updated}, Skipped: {skipped}, Failed: {failed}", flush=True)

    print(f"Done! Updated: {updated}, Skipped: {skipped}, Failed: {failed}", flush=True)

if __name__ == "__main__":
    main()
