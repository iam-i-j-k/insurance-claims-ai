from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
from .document import ExtractedField

class ClaimExtraction(BaseModel):
    policyholder_name: Optional[ExtractedField] = None
    policy_number: Optional[ExtractedField] = None
    claim_number: Optional[ExtractedField] = None
    claim_type: Optional[ExtractedField] = None
    incident_date: Optional[ExtractedField] = None
    filing_date: Optional[ExtractedField] = None
    incident_location: Optional[ExtractedField] = None
    incident_description: Optional[ExtractedField] = None
    reported_cause: Optional[ExtractedField] = None
    claimed_amount: Optional[ExtractedField] = None
    itemized_costs: Optional[ExtractedField] = None
    supporting_documents: Optional[ExtractedField] = None
    prior_claim_references: Optional[ExtractedField] = None
    submission_channel: Optional[ExtractedField] = None
    
    status: str = Field(default="PENDING", description="Status of extraction: PENDING, COMPLETED, or INFORMATION_REQUIRED")
    missing_information: List[str] = Field(default_factory=list)

class ChecklistItem(BaseModel):
    document: str
    is_present: bool
    is_mandatory: bool
    evidence_source: Optional[str] = None

class ClaimClassification(BaseModel):
    claim_type: str = Field(description="Motor, Health, Property, Travel, Liability")
    severity: str = Field(description="Minor, Moderate, Major, Catastrophic")
    urgency: str = Field(description="Routine, Expedited, Emergency")
    documentation_status: str = Field(description="Complete, Incomplete")
    claim_history_type: str = Field(description="First-time, Repeat")
    checklist: List[ChecklistItem] = Field(default_factory=list)

class ClarificationRequest(BaseModel):
    reason: str
    required_document: Optional[str] = None
    related_claim_field: Optional[str] = None
    priority: str = Field(description="HIGH | MEDIUM | LOW")
    source_rule: Optional[str] = None

class TriageReport(BaseModel):
    claim_id: str
    recommendation: str = Field(description="REQUEST_DOCUMENTS | MANUAL_REVIEW | SIU_REVIEW | COVERAGE_REVIEW | ESCALATE | PREPARE_FOR_ADJUSTER")
    summary: str
    assumptions: List[str] = Field(default_factory=list)
    unresolved_information: List[str] = Field(default_factory=list)

