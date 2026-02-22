# UniVital — A Healthcare Financial Risk Engine for Students

## Inspiration

As students in Georgia, we’ve seen firsthand how confusing and financially dangerous health insurance can be. Most students are one unexpected ER visit away from serious financial strain. Two plans may look similar on monthly premium, yet one may expose you to dramatically higher tail risk.

We wanted to build something that quantifies this financial fragility as opposed to simply listing some plans. UniVital brings quantitative risk modeling (similar to portfolio risk analytics in finance) into the student health insurance world.

---

## What It Does

UniVital is a Healthcare Financial Risk Engine that models how financially fragile a student is across multiple insurance plans under income volatility and medical uncertainty.

For each county and student profile (income + medical usage metrics), we dynamically present **4–6 relevant health insurance plans** and help students compare them on risk — not just price.

Instead of only showing:

> Plan A – 45/month  
> Plan B – 62/month  

We show:

- Premium Fragility
- Distance to Subsidy Cliff
- Deductible Breach Probability
- 90th Percentile Exposure
- Expected Annual Total Cost
- Shock Sensitivity

Students choose based on risk tolerance, not just lowest premium.

---

# System Architecture

UniVital follows a two-tier architecture:

Student → FastAPI Backend → Cached Gold JSON

↑

Databricks Lakehouse

Bronze → Silver → Gold


**Important Design Decision:**  
For demo reliability, Gold outputs are precomputed in Databricks and cached in the backend.  
In production, the API would query Databricks Gold tables directly.

---

# Databricks Lakehouse Architecture

## 🥉 Bronze Layer — Raw Ingestion

Stores:

- Plan catalog (premiums, deductibles, OOP max, copays)
- Subsidy parameters
- Utilization priors
- Cost distributions
- ER visit priors
- User profiles

Bronze is immutable ingestion + normalization.

---

## 🥈 Silver Layer — Policy Math Surfaces

### Feature 1: Premium Fragility Curve

We compute net premium as:

5111
\text{NetPremium}(I) = \text{BasePremium} - \text{Subsidy}(I)
5111

To measure sensitivity:

5111
\text{FragilitySlope}(I) \approx 
\frac{\text{NetPremium}(I+\Delta) - \text{NetPremium}(I-\Delta)}{2\Delta}
5111

A spike in slope indicates a subsidy discontinuity (“cliff”).

Silver outputs:
- Subsidy-adjusted premium grid
- Finite-difference slope
- Discontinuity flags

---

## 🥇 Gold Layer — Risk Metrics & Simulation

Gold produces user-specific risk metrics.

---

# Core Features

---

## 🔵 Feature 1 — Premium Fragility Curve

### Why It Matters

Students often have fluctuating income. A small increase in income can trigger a large premium jump.

### Computation

5111
\text{NetPremium}(I) = \text{BaseCost} - \text{Subsidy}(I)
5111

5111
\text{FragilitySlope} = \frac{d(\text{Premium})}{dI}
5111

Higher slope = more fragile premium.

### Visualization

- Overlay of 4–6 relevant plans
- Income on X-axis
- Net premium on Y-axis
- Vertical line marking user income
- Cliff regions highlighted

---

## 🟠 Feature 2 — Cliff Proximity Indicator

### Why It Matters

Subsidy cliffs can create sudden financial shock.

### Computation

Distance to cliff:

5111
\text{CliffDistance} = I_{\text{threshold}} - I_{\text{current}}
5111

Elasticity ratio:

5111
\text{ElasticityRatio} =
\frac{\% \text{Premium Change}}{\% \text{Income Change}}
5111

Classification:
- Stable
- Moderately Sensitive
- Cliff-Prone

### Visualization

- Horizontal risk bars
- Cliff-prone badge if within high-risk threshold
- Elasticity displayed numerically

---

## 🟣 Feature 3 — Deductible Breach Probability (Monte Carlo)

### Why It Matters

Premium does not equal protection. Deductibles determine exposure risk.

### Monte Carlo Simulation (10,000 paths)

Inputs:

- Medication count  
- ER visit probability  
- Therapy frequency  
- Plan deductible & copay  
- Cost distributions  

We simulate annual out-of-pocket:

5111
\text{AnnualOOP}_k = \sum_i \text{MedicalEventCost}_{k,i}
5111

Then compute:

Breach probability:

5111
\text{BreachProbability} = P(\text{AnnualOOP} > \text{Deductible})
5111

Expected out-of-pocket:

5111
\text{MeanOOP} = \mathbb{E}[\text{AnnualOOP}]
5111

Tail exposure:

5111
\text{P90Exposure} =
\text{Quantile}_{0.9}(\text{AnnualOOP})
5111

Total expected cost:

5111
\text{ExpectedAnnualTotalCost} =
12 \times \text{NetPremium} + \text{MeanOOP}
5111

### Visualization

Instead of histograms, we overlay CDF curves:

5111
F(x) = P(\text{AnnualOOP} \le x)
5111

Overlaying plans shows:

- Which plan dominates risk
- Which has thinner tail
- Where curves cross

This mirrors portfolio risk comparison logic used in quantitative finance.

---

## 🔴 Feature 4 — Shock Test Engine

### Why It Matters

Insurance should be stress-tested like a financial instrument.

Precomputed scenarios:

- +10% income  
- Add chronic medication  
- Two ER visits  
- Subsidy expiration  

Delta calculation:

5111
\Delta \text{Metric} =
\text{Shocked} - \text{Baseline}
5111

Metrics include:

- Expected Annual Cost  
- Breach Probability  
- Monthly Premium  
- P90 Exposure  

Visualization:

- Grouped bar charts  
- Green = improvement  
- Red = worsening  

---

# 🤖 Vital AI — Plan Intelligence Assistant

We built a Retrieval-Augmented Generation (RAG) assistant for plan-specific questions.

## Step 1 — Vectorization (Gemini Embeddings)

We use Gemini’s .

Each plan → 3072-dimensional vector.

Higher dimensionality provides stronger semantic resolution to distinguish similar premiums with different metal tiers or copay structures.

---

## Step 2 — High-Performance Storage (Actian VectorAI)

Vectors are stored in Actian VectorAI.

Why Actian?

- gRPC-based architecture (low latency)
- Built-in Hybrid Search

Hybrid search combines:

5111
\text{SimilarityScore}(\vec{q}, \vec{v})
5111

with metadata filtering (e.g., Metal Tier constraints).

---

## Step 3 — Contextual Reasoning

1. Actian retrieves top 10 relevant plans
2. Inject into Gemini 2.5 Flash
3. Gemini analyzes side-by-side

We chose Gemini 2.5 Flash for:

- Large context window
- Fast inference
- Ability to compare multiple plans simultaneously

---

# Technical Stack

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- Framer Motion

**Backend**
- FastAPI
- SQLite
- Deterministic profile bucketing
- Cached Gold JSON

**Data Layer**
- Databricks Lakehouse (Bronze/Silver/Gold)
- Monte Carlo simulation in Gold
- Exported JSON for demo

**AI Stack**
- Gemini embeddings (3072-d vectors)
- Actian VectorAI
- Gemini 2.5 Flash
