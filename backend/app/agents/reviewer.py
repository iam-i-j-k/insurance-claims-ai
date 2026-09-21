from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.review import ReviewAssessment
import json

def reviewer_agent(state: ClaimState) -> ClaimState:
    print("--- REVIEWER AGENT ---")
    state["current_agent"] = "reviewer_agent"
    
    # We only reprocess a limited number of times to avoid infinite loops
    retry_count = state.get("retry_count", 0)
    if retry_count >= 2:
        state["reviewer_feedback"] = ReviewAssessment(
            review_status="PASS",
            issues=["Max retries reached. Forcing PASS to prevent infinite loop."],
            affected_agents=[],
            reason="Max retries reached."
        )
        return state
        
    extracted_data = state.get("extracted_data")
    coverage = state.get("coverage_assessment")
    fraud = state.get("fraud_assessment")
    settlement = state.get("settlement")
    
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert Reviewer Agent in an insurance triage pipeline.
Your job is to reflect on the outputs of the previous agents and catch errors, hallucinations, or contradictions.

Workflow State:
Extraction: {extracted_data}
Coverage: {coverage}
Fraud/Risk: {fraud}
Settlement: {settlement}

Checks:
1. Did the coverage agent state INFORMATION_REQUIRED while the extraction agent missed obvious data?
2. Are the settlement numbers contradicting the extracted claim amount?
3. Did the fraud agent miss obvious rules from the extraction data?

If you find significant issues that can be fixed by the agents re-running, output status "REPROCESS" and list the affected_agents (e.g., ["coverage_agent", "intake_agent"]).
If everything looks consistent and supported, output "PASS".

Respond strictly with a JSON matching the requested structure.
""",
        input_variables=["extracted_data", "coverage", "fraud", "settlement"]
    )
    
    chain = prompt | llm.with_structured_output(ReviewAssessment)
    
    try:
        review_result = chain.invoke({
            "extracted_data": extracted_data.model_dump_json() if extracted_data else "None",
            "coverage": coverage.model_dump_json() if coverage else "None",
            "fraud": fraud.model_dump_json() if fraud else "None",
            "settlement": settlement.model_dump_json() if settlement else "None",
        })
        
        state["reviewer_feedback"] = review_result
        if review_result.review_status == "REPROCESS":
            state["retry_count"] = retry_count + 1
            
    except Exception as e:
        print(f"Reviewer error: {e}")
        state["errors"].append({"agent": "reviewer_agent", "error": str(e)})
        # Default to PASS on error to avoid infinite loop of failing reviews
        state["reviewer_feedback"] = ReviewAssessment(
            review_status="PASS",
            issues=[],
            affected_agents=[],
            reason=f"Error in review: {e}"
        )
        
    return state
