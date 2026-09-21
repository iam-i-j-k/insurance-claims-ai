from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.claim import TriageReport

def report_agent(state: ClaimState) -> ClaimState:
    print("--- REPORT AGENT ---")
    state["current_agent"] = "report_agent"
    
    extracted = state.get("extracted_data")
    coverage = state.get("coverage_assessment")
    fraud = state.get("fraud_assessment")
    settlement = state.get("settlement")
    checklist = state.get("checklist", [])
    
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert Triage Report generation agent.
Generate a final triage report based on the workflow state.

State:
Extraction: {extracted}
Coverage: {coverage}
Fraud: {fraud}
Settlement: {settlement}
Checklist: {checklist}

Rules:
1. Provide a concise summary of the claim and findings.
2. Provide a recommendation (REQUEST_DOCUMENTS, MANUAL_REVIEW, SIU_REVIEW, COVERAGE_REVIEW, ESCALATE, PREPARE_FOR_ADJUSTER).
3. Do NOT automatically approve or reject the claim.
4. List any assumptions made during processing.
5. List unresolved information.

Respond strictly with a JSON matching the requested structure.
""",
        input_variables=["extracted", "coverage", "fraud", "settlement", "checklist"]
    )
    
    chain = prompt | llm.with_structured_output(TriageReport)
    
    try:
        report_result = chain.invoke({
            "extracted": extracted.model_dump_json() if extracted else "None",
            "coverage": coverage.model_dump_json() if coverage else "None",
            "fraud": fraud.model_dump_json() if fraud else "None",
            "settlement": settlement.model_dump_json() if settlement else "None",
            "checklist": checklist
        })
        
        report_result.claim_id = state.get("claim_id", "Unknown")
        state["triage_report"] = report_result
        state["workflow_status"] = "COMPLETED"
        
    except Exception as e:
        print(f"Report error: {e}")
        state["errors"].append({"agent": "report_agent", "error": str(e)})
        state["workflow_status"] = "FAILED"
        
    return state
