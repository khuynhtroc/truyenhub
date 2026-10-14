import sys
import asyncio
import edge_tts

async def synthesize():
    voice = sys.argv[1] if len(sys.argv) > 1 else 'vi-VN-HoaiMyNeural'
    rate_str = sys.argv[2] if len(sys.argv) > 2 else '+0%'
    
    # Read text from stdin in UTF-8
    text = sys.stdin.buffer.read().decode('utf-8', errors='ignore').strip()
    if not text:
        return

    communicate = edge_tts.Communicate(text, voice, rate=rate_str)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])
    sys.stdout.buffer.flush()

if __name__ == '__main__':
    asyncio.run(synthesize())
