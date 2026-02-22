"""
Chatbot service: Gemini embeddings + Actian VectorAI DB + Gemini 2.5 Flash.

Wraps the Streamlit chatbot logic into a reusable module that FastAPI can call.
"""

import os
import re
import pandas as pd
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

COLLECTION_NAME = "health_plans_v13"
EMBEDDING_MODEL = "models/gemini-embedding-001"
DIMENSION = 3072
CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "finalPlans.csv")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
CORTEX_HOST = os.getenv("VECTORAI_HOST", "localhost")
CORTEX_PORT = os.getenv("VECTORAI_PORT", "50051")
CORTEX_ADDR = f"{CORTEX_HOST}:{CORTEX_PORT}"

_gemini_client = None
_indexed = False


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    return _gemini_client


def _clean_copay(value) -> int:
    if pd.isna(value) or "no charge" in str(value).lower():
        return 0
    numbers = re.findall(r'\d+', str(value))
    return int(numbers[0]) if numbers else 999


def ensure_index() -> int:
    """Index the CSV into VectorAI DB if collection doesn't exist. Returns plan count."""
    global _indexed
    if _indexed:
        return -1

    from cortex import CortexClient, DistanceMetric
    from google.genai import types

    try:
        with CortexClient(CORTEX_ADDR) as client:
            if client.has_collection(COLLECTION_NAME):
                _indexed = True
                return client.count(COLLECTION_NAME)
    except Exception:
        return 0

    if not os.path.exists(CSV_PATH):
        return 0

    df = pd.read_csv(CSV_PATH)
    df["Clean_Copay"] = df["Copay_Primary_Care"].apply(_clean_copay)

    ids, texts, payloads = [], [], []
    for idx, row in df.iterrows():
        search_blob = (
            f"Plan: {row['Plan_Marketing_Name']} | Tier: {row['Metal']} | "
            f"Primary Care Copay: ${row['Clean_Copay']} | "
            f"Premium: ${row['Premium_21_Year_Old']}"
        )
        ids.append(idx)
        texts.append(search_blob)
        payloads.append({
            "text": search_blob,
            "metal": str(row["Metal"]),
            "provider": str(row["Health_Insurance_Provider"]),
        })

    gemini = _get_gemini_client()
    response = gemini.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=DIMENSION,
        ),
    )
    vectors = [e.values for e in response.embeddings]

    with CortexClient(CORTEX_ADDR) as client:
        client.recreate_collection(COLLECTION_NAME, DIMENSION, DistanceMetric.COSINE)
        client.batch_upsert(COLLECTION_NAME, ids, vectors, payloads)

    _indexed = True
    return len(ids)


def query(user_message: str, tier_filter: Optional[list[str]] = None) -> str:
    """Embed user query, search Cortex, generate answer with Gemini."""
    from cortex import CortexClient
    from cortex.filters import Filter, Field
    from google.genai import types

    gemini = _get_gemini_client()

    query_resp = gemini.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=user_message,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=DIMENSION,
        ),
    )
    query_vec = query_resp.embeddings[0].values

    with CortexClient(CORTEX_ADDR) as client:
        if tier_filter:
            f = Filter().must(Field("metal").in_(tier_filter))
            results = client.search_filtered(COLLECTION_NAME, query_vec, f, top_k=10)
        else:
            results = client.search(COLLECTION_NAME, query_vec, top_k=10)

        context_chunks = []
        for r in results:
            payload = getattr(r, "payload", None)
            if payload and "text" in payload:
                context_chunks.append(payload["text"])
            else:
                try:
                    _, fetched = client.get(COLLECTION_NAME, r.id)
                    if fetched and "text" in fetched:
                        context_chunks.append(fetched["text"])
                except Exception:
                    pass

    if not context_chunks:
        return "I couldn't find any plans matching your criteria. Try rephrasing your question."

    context_text = "\n".join(context_chunks)
    prompt = f"""You are UniVital's Health Plan Navigator, an AI assistant that helps students find the best health insurance plans.

Use ONLY the database records below to answer. Do not invent plan details.

Guidelines:
- For students: prioritize low premiums and low primary care copays.
- 'Expanded Bronze' = Bronze-level plans.
- When recommending, always state: plan name, tier, copay, and premium.
- Present comparisons in a clean, readable format.
- Be concise but thorough.

DATABASE RECORDS:
{context_text}

USER QUESTION: {user_message}

RESPONSE:"""

    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text
