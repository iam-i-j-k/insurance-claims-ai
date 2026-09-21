from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.db.database import load_claim, save_claim
from app.graph.workflow import create_workflow
from app.api.auth import get_current_user

router = APIRouter()

def run_workflow(claim_id: str):
    state = load_claim(claim_id)
    if not state:
        return
        
    state["workflow_status"] = "RUNNING"
    state["errors"] = []
    save_claim(claim_id, state)
    
    workflow = create_workflow()
    
    # Run the graph
    try:
        final_state = workflow.invoke(state)
        save_claim(claim_id, final_state)
    except Exception as e:
        state = load_claim(claim_id)
        state["workflow_status"] = "FAILED"
        state["errors"].append({"agent": "orchestrator", "error": str(e)})
        save_claim(claim_id, state)

@router.post("/claims/{claim_id}/process")
def process_claim(claim_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    state = load_claim(claim_id)
    if not state or state.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    if state.get("workflow_status") == "RUNNING":
        raise HTTPException(status_code=400, detail="Workflow already running")
        
    background_tasks.add_task(run_workflow, claim_id)
    return {"status": "started"}

@router.get("/claims/{claim_id}/coverage")
def get_coverage(claim_id: str, current_user: dict = Depends(get_current_user)):
    state = load_claim(claim_id)
    if not state or state.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Claim not found")
    return state.get("coverage_assessment")

@router.get("/claims/{claim_id}/risks")
def get_risks(claim_id: str, current_user: dict = Depends(get_current_user)):
    state = load_claim(claim_id)
    if not state or state.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Claim not found")
    return state.get("fraud_assessment")

@router.get("/claims/{claim_id}/report")
def get_report(claim_id: str, current_user: dict = Depends(get_current_user)):
    state = load_claim(claim_id)
    if not state or state.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Claim not found")
    return state.get("triage_report")
