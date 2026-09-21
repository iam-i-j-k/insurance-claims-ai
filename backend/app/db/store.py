from typing import Dict, Any
from app.graph.state import ClaimState

# Simple in-memory store for MVP. Will be replaced by SQLite.
claims_db: Dict[str, ClaimState] = {}
