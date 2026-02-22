"""
Run this FIRST to see which embedding models are available on your account.
Usage: python check_models.py
"""
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

print("=== Available Embedding Models ===\n")
for model in client.models.list():
    # Only show embedding-capable models
    supported = getattr(model, "supported_actions", []) or []
    if "embedContent" in supported or "embed" in str(supported).lower():
        print(f"✅ {model.name}")
        print(f"   Actions: {supported}\n")

print("\n=== All Models (for reference) ===\n")
for model in client.models.list():
    print(f"  {model.name}")