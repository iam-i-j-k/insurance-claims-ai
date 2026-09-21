import psycopg2
import json
import os
from app.graph.state import ClaimState

DB_URL = os.getenv("DATABASE_URL")

import time

def get_connection():
    if not DB_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
        
    for attempt in range(5):
        try:
            return psycopg2.connect(DB_URL)
        except psycopg2.OperationalError as e:
            if attempt < 4:
                time.sleep(2)
                continue
            raise e

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            name TEXT NOT NULL
        )
    ''')
    
    # Create Claims table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            claim_id TEXT PRIMARY KEY,
            user_id TEXT,
            state JSONB
        )
    ''')
    
    # Add user_id column if it doesn't exist (for existing DBs)
    try:
        cursor.execute('ALTER TABLE claims ADD COLUMN user_id TEXT')
    except psycopg2.errors.DuplicateColumn:
        conn.rollback() # column already exists
    else:
        conn.commit()
    
    # Seed default user
    cursor.execute("SELECT id FROM users WHERE email = %s", ("admin@claimguard.com",))
    if not cursor.fetchone():
        try:
            import bcrypt
            hashed = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute(
                "INSERT INTO users (id, email, hashed_password, name) VALUES (%s, %s, %s, %s)", 
                ("usr_1", "admin@claimguard.com", hashed, "David Vance")
            )
        except ImportError:
            pass # ignore if bcrypt not ready during first boot
            
    conn.commit()
    conn.close()

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, hashed_password, name FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "email": row[1], "hashed_password": row[2], "name": row[3]}
    return None

def create_user(user_id: str, email: str, hashed_password: str, name: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (id, email, hashed_password, name) VALUES (%s, %s, %s, %s)",
        (user_id, email, hashed_password, name)
    )
    conn.commit()
    conn.close()

def save_claim(claim_id: str, state: ClaimState):
    conn = get_connection()
    cursor = conn.cursor()
    from datetime import datetime
    
    # Inject updated_at timestamp
    state["updated_at"] = datetime.utcnow().isoformat()
    user_id = state.get("user_id")
    
    # Serialize state to JSON
    # Need to handle objects, since state can contain Pydantic models.
    # In practice we dump the dict.
    state_dict = {}
    for k, v in state.items():
        if hasattr(v, "model_dump"):
            state_dict[k] = v.model_dump()
        elif isinstance(v, list):
            state_dict[k] = [item.model_dump() if hasattr(item, "model_dump") else item for item in v]
        else:
            state_dict[k] = v
            
    cursor.execute('''
        INSERT INTO claims (claim_id, user_id, state)
        VALUES (%s, %s, %s)
        ON CONFLICT(claim_id) DO UPDATE SET state = EXCLUDED.state, user_id = EXCLUDED.user_id
    ''', (claim_id, user_id, json.dumps(state_dict, default=str)))
    conn.commit()
    conn.close()

def load_claim(claim_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT state FROM claims WHERE claim_id = %s', (claim_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0] if isinstance(row[0], dict) else json.loads(row[0])
    return None

def get_all_claims(user_id: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute('SELECT claim_id, state FROM claims WHERE user_id = %s', (user_id,))
    else:
        cursor.execute('SELECT claim_id, state FROM claims')
    rows = cursor.fetchall()
    conn.close()
    return [{"claim_id": row[0], "state": row[1] if isinstance(row[1], dict) else json.loads(row[1])} for row in rows]
