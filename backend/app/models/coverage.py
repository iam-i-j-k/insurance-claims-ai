from pydantic import BaseModel, Field
from typing import List, Optional
from .document import DocumentSource

class CoverageCondition(BaseModel):
    condition: str = Field(description="The policy condition or clause")
    claim_detail: str = Field(description="The relevant detail from the claim")
    status: str = Field(description="COMPLIANT | NON_COMPLIANT | PARTIALLY_COVERED | INFORMATION_REQUIRED")
    reason: str = Field(description="Reasoning for the status")
    source: Optional[DocumentSource] = None

class CoverageAssessment(BaseModel):
    conditions: List[CoverageCondition] = Field(default_factory=list)
    overall_status: str = Field(description="COVERED | PARTIALLY COVERED | NOT COVERED | INFORMATION REQUIRED")
    notes: Optional[str] = None
