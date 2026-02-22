import type { RiskResponse, ShockResponse, ChatResponse } from "../types/risk";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  async registerUser(userData: {
    name: string;
    email: string;
    income: string;
    county: string;
    medicationCount: string;
    expectedErVisits: string;
    therapyFrequency: string;
  }) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: userData.name,
        email: userData.email,
        income_profile: parseFloat(userData.income) || 0,
        coverage: "uninsured",
        county: userData.county || "Fulton",
        medication_count: parseInt(userData.medicationCount) || 0,
        expected_er_visits: parseFloat(userData.expectedErVisits) || 0,
        therapy_frequency: parseFloat(userData.therapyFrequency) || 0,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async updateUser(
    email: string,
    userData: {
      name: string;
      income: string;
      county: string;
      medicationCount: string;
      expectedErVisits: string;
      therapyFrequency: string;
    },
  ) {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: userData.name,
        income_profile: parseFloat(userData.income) || 0,
        coverage: "uninsured",
        county: userData.county || "Fulton",
        medication_count: parseInt(userData.medicationCount) || 0,
        expected_er_visits: parseFloat(userData.expectedErVisits) || 0,
        therapy_frequency: parseFloat(userData.therapyFrequency) || 0,
      }),
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  },

  async getRisk(email: string): Promise<RiskResponse> {
    const res = await fetch(`${API_BASE}/risk/${encodeURIComponent(email)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Risk data unavailable");
    }
    return res.json();
  },

  async runShock(email: string, scenarioType: string): Promise<ShockResponse> {
    const res = await fetch(`${API_BASE}/shock/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_type: scenarioType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Shock scenario unavailable");
    }
    return res.json();
  },

  async chat(message: string, tierFilter?: string[]): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tier_filter: tierFilter || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Chat unavailable");
    }
    return res.json();
  },
};
