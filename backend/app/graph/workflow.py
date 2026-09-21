import time
from langgraph.graph import StateGraph, END
from app.graph.state import ClaimState
from app.agents.intake import intake_agent
from app.agents.classification import classification_agent
from app.agents.coverage import coverage_agent
from app.agents.fraud import fraud_agent
from app.agents.settlement import settlement_agent
from app.agents.reviewer import reviewer_agent
from app.agents.report import report_agent
from app.agents.communication import communication_agent
from app.models.review import ReviewAssessment
from datetime import datetime

def route_after_review(state: ClaimState):
    feedback = state.get("reviewer_feedback")
    if feedback and feedback.review_status == "REPROCESS":
        # Check affected agents. For simplicity in MVP, if there is a reprocessing request,
        # we route back to intake or coverage depending on what was affected, or just restart at intake.
        # Here we just restart at classification if we need to reprocess, or a specific agent if listed.
        agents = feedback.affected_agents
        if "intake_agent" in agents:
            return "intake_agent"
        if "coverage_agent" in agents:
            return "coverage_agent"
        return "classification_agent"
    return "report_agent"

def log_audit(state: ClaimState):
    # This is a passive node or function that could be called after each agent, 
    # but for simplicity we let agents update state or we can add it as a wrapper.
    # In this implementation, we will append to audit log dynamically.
    pass

def rate_limit_wrapper(agent_func):
    def wrapper(state: ClaimState):
        from app.db.database import save_claim
        import time
        import re
        import math
        
        state["current_agent"] = agent_func.__name__
        if "audit_log" not in state:
            state["audit_log"] = []
        state["audit_log"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] Started {agent_func.__name__}...")
        
        if state.get("claim_id"):
            save_claim(state["claim_id"], state)
            
        time.sleep(6)  # Increased baseline delay to 6s
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                new_state = agent_func(state)
                
                # Intercept internally swallowed exceptions from agents
                if new_state.get("workflow_status") == "FAILED" and len(new_state.get("errors", [])) > 0:
                    last_error = new_state["errors"][-1]
                    error_msg = str(last_error.get("error", ""))
                    
                    if "429" in error_msg or "ResourceExhausted" in error_msg:
                        if attempt < max_retries - 1:
                            delay = 60
                            # Dynamically extract wait time from Gemini error string
                            match = re.search(r'Please retry in ([0-9\.]+)s', error_msg)
                            if match:
                                delay = int(float(match.group(1))) + 1
                            else:
                                match2 = re.search(r'retryDelay[^0-9]+([0-9\.]+)s', error_msg)
                                if match2:
                                    delay = int(float(match2.group(1))) + 1
                                    
                            print(f"Rate limit hit in {agent_func.__name__}. Sleeping for {delay}s (Attempt {attempt+1}/{max_retries})...")
                            state["audit_log"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] Rate limit hit in {agent_func.__name__}. Retrying in {delay}s...")
                            time.sleep(delay)
                            
                            # Clean up the swallowed error from state before retrying
                            new_state["errors"].pop()
                            new_state["workflow_status"] = "RUNNING"
                            continue # Try agent again
                break
                
            except Exception as e:
                if "429" in str(e) or "ResourceExhausted" in type(e).__name__:
                    if attempt < max_retries - 1:
                        print(f"Rate limit hit in {agent_func.__name__}. Sleeping for 60s (Attempt {attempt+1}/{max_retries})...")
                        time.sleep(60)
                    else:
                        raise e
                else:
                    raise e
        
        state["audit_log"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] Completed {agent_func.__name__} successfully.")
        if new_state.get("claim_id"):
            save_claim(new_state["claim_id"], new_state)
            
        return new_state
    return wrapper

def create_workflow():
    workflow = StateGraph(ClaimState)
    
    # Add Nodes with rate limit wrappers
    workflow.add_node("intake_agent", rate_limit_wrapper(intake_agent))
    workflow.add_node("classification_agent", rate_limit_wrapper(classification_agent))
    workflow.add_node("coverage_agent", rate_limit_wrapper(coverage_agent))
    workflow.add_node("fraud_agent", rate_limit_wrapper(fraud_agent))
    workflow.add_node("settlement_agent", rate_limit_wrapper(settlement_agent))
    workflow.add_node("reviewer_agent", rate_limit_wrapper(reviewer_agent))
    workflow.add_node("report_agent", rate_limit_wrapper(report_agent))
    workflow.add_node("communication_agent", rate_limit_wrapper(communication_agent))
    
    # Add Edges
    workflow.set_entry_point("intake_agent")
    workflow.add_edge("intake_agent", "classification_agent")
    workflow.add_edge("classification_agent", "coverage_agent")
    workflow.add_edge("coverage_agent", "fraud_agent")
    workflow.add_edge("fraud_agent", "settlement_agent")
    workflow.add_edge("settlement_agent", "reviewer_agent")
    
    # Conditional Routing
    workflow.add_conditional_edges(
        "reviewer_agent",
        route_after_review,
        {
            "intake_agent": "intake_agent",
            "coverage_agent": "coverage_agent",
            "classification_agent": "classification_agent",
            "report_agent": "report_agent"
        }
    )
    
    workflow.add_edge("report_agent", "communication_agent")
    workflow.add_edge("communication_agent", END)
    
    return workflow.compile()

