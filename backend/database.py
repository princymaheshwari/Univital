import sqlite3
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "health_insurance.db")

RISK_COLUMNS = [
    ("medication_count", "INTEGER DEFAULT 0"),
    ("expected_er_visits", "REAL DEFAULT 0.0"),
    ("therapy_frequency", "REAL DEFAULT 0.0"),
    ("income_volatility", "TEXT"),
]


def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn


def _migrate_users_table(conn):
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    existing = {row["name"] for row in cursor.fetchall()}
    for col_name, col_def in RISK_COLUMNS:
        if col_name not in existing:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
    conn.commit()


def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        income_profile REAL NOT NULL,
        coverage TEXT NOT NULL,
        county TEXT NOT NULL,
        medication_count INTEGER DEFAULT 0,
        expected_er_visits REAL DEFAULT 0.0,
        therapy_frequency REAL DEFAULT 0.0,
        income_volatility TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    _migrate_users_table(conn)
    conn.close()


class User:
    def __init__(self, row: sqlite3.Row):
        self.id = row["id"]
        self.full_name = row["full_name"]
        self.email = row["email"]
        self.income_profile = row["income_profile"]
        self.coverage = row["coverage"]
        self.county = row["county"]
        self.medication_count = row["medication_count"] or 0
        self.expected_er_visits = row["expected_er_visits"] or 0.0
        self.therapy_frequency = row["therapy_frequency"] or 0.0
        self.income_volatility = row["income_volatility"]
        self.created_at = row["created_at"]
        self.updated_at = row["updated_at"]


def get_user_by_email(email: str) -> Optional[User]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return User(row)
    return None


def create_user(
    full_name: str,
    email: str,
    income_profile: float,
    coverage: str,
    county: str,
    medication_count: int = 0,
    expected_er_visits: float = 0.0,
    therapy_frequency: float = 0.0,
    income_volatility: str | None = None,
) -> User:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO users (full_name, email, income_profile, coverage, county,
                           medication_count, expected_er_visits, therapy_frequency, income_volatility)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (full_name, email, income_profile, coverage, county,
         medication_count, expected_er_visits, therapy_frequency, income_volatility),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return User(row)


def get_all_users() -> List[User]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [User(row) for row in rows]


def update_user(
    user_id: int,
    full_name: str = None,
    income_profile: float = None,
    coverage: str = None,
    county: str = None,
    medication_count: int = None,
    expected_er_visits: float = None,
    therapy_frequency: float = None,
    income_volatility: str = None,
) -> Optional[User]:
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = []
    params = []
    field_map = {
        "full_name": full_name,
        "income_profile": income_profile,
        "coverage": coverage,
        "county": county,
        "medication_count": medication_count,
        "expected_er_visits": expected_er_visits,
        "therapy_frequency": therapy_frequency,
        "income_volatility": income_volatility,
    }

    for col, val in field_map.items():
        if val is not None:
            updates.append(f"{col} = ?")
            params.append(val)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return User(row)
    return None


class Plan:
    def __init__(self, row: sqlite3.Row):
        self.Health_Insurance_Provider = row["Health_Insurance_Provider"]
        self.Health_Insurance_Plan = row["Health_Insurance_Plan"]
        self.Plan_Marketing_Name = row["Plan_Marketing_Name"]
        self.County = row["County"]
        self.Metal = row["Metal"]
        self.Premium_21_Year_Old = row["Premium_21_Year_Old"]
        self.Deductible_21_Year_Old = row["Deductible_21_Year_Old"]
        self.Copay_Primary_Care = row["Copay_Primary_Care"]
        self.Copay_Specialist = row["Copay_Specialist"]
        self.Copay_Emergency_Room = row["Copay_Emergency_Room"]
        self.Subsidy_Details = row["Subsidy_Details"]


def get_plans_by_county(county: str) -> List[Plan]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM health_insurance_plans WHERE County = ?", (county,))
    rows = cursor.fetchall()
    conn.close()
    return [Plan(row) for row in rows]
