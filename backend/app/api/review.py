from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.database import load_claim, save_claim

router = APIRouter()

class ReviewDecision(BaseModel):
    action: str
    comment: str

@router.post("/claims/{claim_id}/review")
def review_claim(claim_id: str, decision: ReviewDecision):
    state = load_claim(claim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Store human decision
    state["audit_log"].append({
        "agent": "HUMAN_ADJUSTER",
        "action": decision.action,
        "comment": decision.comment
    })
    
    # Update status based on decision
    if decision.action == "APPROVE":
        state["workflow_status"] = "APPROVED"
    elif decision.action == "REJECT":
        state["workflow_status"] = "REJECTED"
    elif decision.action == "REQUEST_DOCUMENTS":
        state["workflow_status"] = "PENDING_DOCUMENTS"
    elif decision.action == "ESCALATE":
        state["workflow_status"] = "ESCALATED"
        
    save_claim(claim_id, state)
        
    return {"status": "success", "new_status": state["workflow_status"]}
