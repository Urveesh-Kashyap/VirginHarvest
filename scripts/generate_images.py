import asyncio
import os
import base64
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUT = Path("/app/frontend/public/brand")
OUT.mkdir(parents=True, exist_ok=True)

api_key = os.getenv("EMERGENT_LLM_KEY")

PROMPTS = {
    "hero-bottle": "Ultra premium cinematic product photograph of a single elegant glass bottle of golden cold-pressed mustard oil, centered, floating against a deep matte black background, dramatic warm gold rim lighting, soft reflections, subtle film grain, luxury advertising photography, the oil glows amber-gold, minimalistic, high detail, 4k, photorealistic",
    "mustard-field": "Cinematic moody photograph of a vast Rajasthan yellow mustard flower field at golden hour, soft dramatic light, shallow depth of field, dark atmospheric sky, premium organic brand aesthetic, warm tones, photorealistic, fine art photography",
    "seeds-macro": "Extreme close-up macro photograph of golden yellow mustard seeds piled together, dramatic side lighting on deep black background, glistening texture, luxury organic product photography, warm gold tones, photorealistic, high detail",
    "cold-press": "Cinematic photograph of a traditional wooden cold-press oil extraction (kohlu/ghani) with golden mustard oil flowing, warm amber lighting against a dark moody background, artisanal craftsmanship, premium brand storytelling, photorealistic, fine detail",
    "oil-pour": "Luxury cinematic photograph of golden mustard oil being poured in a thin elegant stream, deep black background, dramatic gold lighting, glossy reflections, splash frozen in motion, premium food photography, photorealistic, 4k",
    "product-pack": "Premium product photograph of a sleek dark glass mustard oil bottle with minimal gold label, standing on a dark stone surface with mustard flowers softly blurred behind, forest green and gold tones, luxury D2C brand packaging, soft studio light, photorealistic",
    "lifestyle-kitchen": "Cinematic warm photograph of golden mustard oil drizzled over fresh Indian cuisine on a dark elegant table setting, moody luxury restaurant lighting, gold and forest green accents, premium food styling, photorealistic, shallow depth of field",
    "founder-story": "Atmospheric cinematic photograph of hands holding golden mustard seeds over a rustic dark wooden table, warm directional light, mustard flowers in soft background, heritage and tradition storytelling, premium organic brand, photorealistic",
}


async def gen(name, prompt):
    try:
        chat = LlmChat(api_key=api_key, session_id=f"vh-{name}", system_message="You are a premium product photographer.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        msg = UserMessage(text=prompt)
        _text, images = await chat.send_message_multimodal_response(msg)
        if images:
            image_bytes = base64.b64decode(images[0]["data"])
            (OUT / f"{name}.png").write_bytes(image_bytes)
            print(f"OK {name} ({len(image_bytes)} bytes)")
        else:
            print(f"NO IMAGE {name}")
    except Exception as e:
        print(f"ERROR {name}: {e}")


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())
