from typing import TypedDict, List, Dict, Any, Optional
from app.models.document import DocumentInfo, DocumentSource
from app.models.claim import ClaimExtraction, ClaimClassification, ClarificationRequest, TriageReport
from app.models.coverage import CoverageAssessment
from app.models.fraud import FraudAssessment
from app.models.settlement import Settlement
from app.models.review import ReviewAssessment

class ClaimState(TypedDict):
    claim_id: str
    user_id: str
    created_at: str
    updated_at: str
    documents: List[DocumentInfo]
    extracted_data: Optional[ClaimExtraction]
    extraction_sources: List[DocumentSource]
    classification: Optional[ClaimClassification]
    checklist: List[Dict[str, Any]]
    retrieved_policy_evidence: List[Dict[str, Any]]
    coverage_assessment: Optional[CoverageAssessment]
    fraud_assessment: Optional[FraudAssessment]
    settlement: Optional[Settlement]
    clarifications: List[ClarificationRequest]
    reviewer_feedback: Optional[ReviewAssessment]
    triage_report: Optional[TriageReport]
    customer_communication: Optional[str]
    
    workflow_status: str
    current_agent: str
    errors: List[Dict[str, Any]]
    retry_count: int
    audit_log: List[Dict[str, Any]]
