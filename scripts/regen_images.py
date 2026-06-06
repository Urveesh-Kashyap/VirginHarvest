import asyncio, os, base64
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")
OUT = Path("/app/frontend/public/brand")
api_key = os.getenv("EMERGENT_LLM_KEY")

PROMPTS = {
    "hero-bottle": "Ultra premium cinematic product photograph of a single elegant tall glass bottle filled with glowing golden cold-pressed mustard oil, standing upright centered on a pure solid black background, dramatic warm gold rim lighting from behind, soft glossy reflections, the bottle has a plain blank unlabeled minimal design with NO text and NO writing, luxury advertising photography, photorealistic, 4k, isolated on black",
    "product-pack": "Premium cinematic product photograph of a sleek dark amber glass mustard oil bottle with a plain minimal blank label containing NO text and NO letters, standing on a dark stone surface, pure black background, warm gold rim light, forest green tones, luxury D2C packaging, photorealistic, isolated",
    "oil-pour": "Luxury cinematic photograph of glowing golden mustard oil being poured in a thin elegant stream into a glass, pure solid black background, dramatic warm gold lighting, glossy reflections, premium food photography, photorealistic, no text",
}

async def gen(name, prompt):
    try:
        chat = LlmChat(api_key=api_key, session_id=f"vh2-{name}", system_message="You are a premium product photographer.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _t, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        if images:
            (OUT / f"{name}.png").write_bytes(base64.b64decode(images[0]["data"]))
            print(f"OK {name}")
        else:
            print(f"NO IMAGE {name}")
    except Exception as e:
        print(f"ERR {name}: {e}")

async def main():
    for n, p in PROMPTS.items():
        await gen(n, p)

asyncio.run(main())
