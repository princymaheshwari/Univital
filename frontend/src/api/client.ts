const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  async registerUser(userData: {
    name: string;
    email: string;
    income: string;
    hasIns: boolean | null;
    county: string;
  }) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: userData.name,
        email: userData.email,
        income_profile: parseFloat(userData.income) || 0,
        coverage: userData.hasIns ? "insured" : "uninsured",
        county: userData.county || "Fulton",
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async getUser(email: string) {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("User not found");
    return res.json();
  },

  async updateUser(
    email: string,
    userData: {
      name: string;
      income: string;
      hasIns: boolean | null;
      county: string;
    },
  ) {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: userData.name,
        income_profile: parseFloat(userData.income) || 0,
        coverage: userData.hasIns ? "insured" : "uninsured",
        county: userData.county || "Fulton",
      }),
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  },

  async getPlansByCounty(county: string) {
    const res = await fetch(`${API_BASE}/plans/${encodeURIComponent(county)}`);
    if (!res.ok) throw new Error("Could not fetch plans");
    return res.json();
  },
};
