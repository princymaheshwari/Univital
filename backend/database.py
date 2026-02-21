import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "health_insurance.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

class User:
    def __init__(self, row: sqlite3.Row):
        self.id = row['id']
        self.full_name = row['full_name']
        self.email = row['email']
        self.income_profile = row['income_profile']
        self.coverage = row['coverage']
        self.county = row['county']
        self.created_at = row['created_at']
        self.updated_at = row['updated_at']

def get_user_by_email(email: str) -> Optional[User]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return User(row)
    return None

def create_user(full_name: str, email: str, income_profile: float, coverage: str, county: str) -> User:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO users (full_name, email, income_profile, coverage, county)
    VALUES (?, ?, ?, ?, ?)
    """, (full_name, email, income_profile, coverage, county))
    
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    # Return the created user
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

def update_user(user_id: int, full_name: str = None, income_profile: float = None, coverage: str = None, county: str = None) -> Optional[User]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if full_name is not None:
        updates.append("full_name = ?")
        params.append(full_name)
    if income_profile is not None:
        updates.append("income_profile = ?")
        params.append(income_profile)
    if coverage is not None:
        updates.append("coverage = ?")
        params.append(coverage)
    if county is not None:
        updates.append("county = ?")
        params.append(county)
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
    
    # Return updated user
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return User(row)
    return None

class Plan:
    def __init__(self, row: sqlite3.Row):
        self.Health_Insurance_Provider = row['Health_Insurance_Provider']
        self.Health_Insurance_Plan = row['Health_Insurance_Plan']
        self.Plan_Marketing_Name = row['Plan_Marketing_Name']
        self.County = row['County']
        self.Metal = row['Metal']
        self.Premium_21_Year_Old = row['Premium_21_Year_Old']
        self.Deductible_21_Year_Old = row['Deductible_21_Year_Old']
        self.Copay_Primary_Care = row['Copay_Primary_Care']
        self.Copay_Specialist = row['Copay_Specialist']
        self.Copay_Emergency_Room = row['Copay_Emergency_Room']
        self.Subsidy_Details = row['Subsidy_Details']

def get_plans_by_county(county: str) -> List[Plan]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM health_insurance_plans WHERE County = ?", (county,))
    rows = cursor.fetchall()
    conn.close()
    return [Plan(row) for row in rows]
