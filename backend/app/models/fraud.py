from pydantic import BaseModel, Field
from typing import List, Optional

class FraudAssessment(BaseModel):
    risk_level: str = Field(description="LOW | MEDIUM | HIGH | CRITICAL")
    risk_score: int = Field(ge=0, le=100, description="Risk score from 0 to 100")
    indicators: List[str] = Field(default_factory=list, description="List of identified risk indicators")
    rationale: List[str] = Field(default_factory=list, description="Reasoning behind the risk indicators")
    recommended_action: str = Field(description="e.g., Manual SIU review, Proceed")
