import streamlit as st
import pandas as pd
import os
import re
import time
from dotenv import load_dotenv
from cortex import CortexClient, DistanceMetric
from cortex.filters import Filter, Field
from google import genai
from google.genai import types

# --- 1. INITIALIZATION & CONFIG ---
load_dotenv()

st.set_page_config(page_title="Health AI Navigator", page_icon="🏥", layout="wide")

# Constants
COLLECTION_NAME = "health_plans_v13"          # bumped version since dimension changed
EMBEDDING_MODEL = "models/gemini-embedding-001"
DIMENSION = 3072                               # gemini-embedding-001 outputs 3072 dims
CSV_PATH = os.getenv("CSV_PATH", "finalPlans.csv")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GEMINI_API_KEY:
    st.error("Missing GOOGLE_API_KEY in .env file")
    st.stop()

# gemini-embedding-001 works on default v1beta — no http_options override needed
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# --- 2. DATA PROCESSING HELPERS ---

def clean_copay(value):
    """Extracts numeric value from strings like '30 Copay after deductible'."""
    if pd.isna(value) or "no charge" in str(value).lower():
        return 0
    numbers = re.findall(r'\d+', str(value))
    return int(numbers[0]) if numbers else 999


@st.cache_data(show_spinner=False)
def index_data_to_cortex(_bust=0):
    """Reads CSV, generates embeddings, and upserts to Actian Cortex."""
    if not os.path.exists(CSV_PATH):
        st.error(f"CSV not found at: {CSV_PATH}\nSet CSV_PATH in your .env file.")
        return 0

    df = pd.read_csv(CSV_PATH)
    df['Clean_Copay'] = df['Copay_Primary_Care'].apply(clean_copay)

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
            "metal": str(row['Metal']),
            "provider": str(row['Health_Insurance_Provider'])
        })

    st.info(f"Generating embeddings for {len(texts)} plans...")
    response = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=DIMENSION
        )
    )
    vectors = [e.values for e in response.embeddings]

    with CortexClient("localhost:50051") as client:
        client.recreate_collection(COLLECTION_NAME, DIMENSION, DistanceMetric.COSINE)
        client.batch_upsert(COLLECTION_NAME, ids, vectors, payloads)

    return len(ids)


# --- 3. AUTO-INDEX ON FIRST LOAD ---

try:
    with CortexClient("localhost:50051") as _client:
        if not _client.has_collection(COLLECTION_NAME):
            with st.spinner("First-time setup: indexing health plans..."):
                index_data_to_cortex(_bust=0)
except Exception:
    pass


# --- 4. SIDEBAR ---

st.title("🏥 Health Plan AI Navigator")
st.caption("Powered by Actian Cortex · gemini-embedding-001 · Gemini 2.5 Flash")

with st.sidebar:
    st.header("⚙️ Admin Panel")
    if st.button("🔄 Rebuild Vector Index"):
        with st.spinner("Re-indexing plans..."):
            count = index_data_to_cortex(_bust=time.time())
            if count:
                st.success(f"✅ Indexed {count} plans!")
            st.rerun()

    st.divider()
    st.header("🔍 Search Filters")
    tier_filter = st.multiselect(
        "Filter by Metal Tier",
        ["Silver", "Gold", "Expanded Bronze"],
        help="Restrict results to selected tiers only."
    )

    st.divider()
    st.header("📊 Database Status")
    try:
        with CortexClient("localhost:50051") as client:
            if client.has_collection(COLLECTION_NAME):
                db_count = client.count(COLLECTION_NAME)
                st.metric("Plans Indexed", db_count)
            else:
                st.warning("No data found. Click 'Rebuild Vector Index'.")
    except Exception as e:
        st.error(f"Cortex not connected: {e}")


# --- 5. CHAT INTERFACE ---

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if user_query := st.chat_input("Ask about plans (e.g., 'Cheapest Silver plan for a student')"):
    st.session_state.messages.append({"role": "user", "content": user_query})
    with st.chat_message("user"):
        st.markdown(user_query)

    with st.chat_message("assistant"):
        with st.spinner("Searching plans..."):
            try:
                # Embed the query
                query_resp = gemini_client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=user_query,
                    config=types.EmbedContentConfig(
                        task_type="RETRIEVAL_QUERY",
                        output_dimensionality=DIMENSION
                    )
                )
                query_vec = query_resp.embeddings[0].values

                # Vector search
                with CortexClient("localhost:50051") as client:
                    if tier_filter:
                        f = Filter().must(Field("metal").in_(tier_filter))
                        results = client.search_filtered(COLLECTION_NAME, query_vec, f, top_k=5)
                    else:
                        results = client.search(COLLECTION_NAME, query_vec, top_k=5)

                    # Extract context — use payload directly, fallback to client.get()
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
                    ans = "I couldn't find any plans matching your criteria. Try adjusting your filters or rephrasing."
                else:
                    context_text = "\n".join(context_chunks)
                    prompt = f"""You are a friendly Health Plan Navigator assistant.
Use ONLY the database records below to answer. Do not invent plan details.

Guidelines:
- For students: prioritize low premiums and low primary care copays.
- 'Expanded Bronze' = Bronze-level plans.
- When recommending, always state: plan name, tier, copay, and premium.
- Present comparisons in a clean, readable format.

DATABASE RECORDS:
{context_text}

USER QUESTION: {user_query}

RESPONSE:"""

                    response = gemini_client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt
                    )
                    ans = response.text

                st.markdown(ans)
                st.session_state.messages.append({"role": "assistant", "content": ans})

            except Exception as e:
                err_msg = f"⚠️ Error: {e}"
                st.error(err_msg)
                st.session_state.messages.append({"role": "assistant", "content": err_msg})