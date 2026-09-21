from pydantic import BaseModel, Field
from typing import List, Optional

class ReviewAssessment(BaseModel):
    review_status: str = Field(description="PASS | REPROCESS")
    issues: List[str] = Field(default_factory=list, description="List of identified issues in the workflow state")
    affected_agents: List[str] = Field(default_factory=list, description="Agents that need to reprocess")
    reason: str = Field(description="Detailed explanation for the review outcome")
