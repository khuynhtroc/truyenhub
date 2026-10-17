import sys
import json
import urllib.request
import re
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

HOOK_PATTERN = re.compile(r'(\n\s*)?(👉\s*)?Hãy cùng đọc.*?DocTruyen\.VIP.*$', re.IGNORECASE | re.DOTALL)

def clean_story(story):
    desc = story.get("description") or ""
    if not HOOK_PATTERN.search(desc):
        return "skipped"

    cleaned_desc = HOOK_PATTERN.sub("", desc).rstrip()

    patch_data = json.dumps({"description": cleaned_desc}).encode("utf-8")
    patch_req = urllib.request.Request(
        f"{url}/rest/v1/stories?id=eq.{story['id']}",
        data=patch_data,
        headers=headers,
        method="PATCH"
    )
    for _ in range(3):
        try:
            with urllib.request.urlopen(patch_req, timeout=10):
                return "updated"
        except Exception:
            pass
    return "failed"

def main():
    print("Fetching stories...", flush=True)
    req = urllib.request.Request(f"{url}/rest/v1/stories?select=id,slug,title,description", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req) as resp:
        stories = json.loads(resp.read().decode("utf-8"))

    print(f"Total stories fetched: {len(stories)}. Stripping redundant hook from raw description...", flush=True)
    updated = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = {executor.submit(clean_story, s): s for s in stories}
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
                print(f"Processed: {done_count}/{len(stories)} - Cleaned: {updated}, Skipped: {skipped}, Failed: {failed}", flush=True)

    print(f"Done! Cleaned: {updated}, Skipped: {skipped}, Failed: {failed}", flush=True)

if __name__ == "__main__":
    main()
