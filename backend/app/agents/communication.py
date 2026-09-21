from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState

def communication_agent(state: ClaimState) -> ClaimState:
    print("--- COMMUNICATION AGENT ---")
    state["current_agent"] = "communication_agent"
    
    triage = state.get("triage_report")
    if not triage:
        state["customer_communication"] = "Internal Error: Triage report not found."
        return state
        
    extracted = state.get("extracted_data")
    policyholder_name = "Valued Customer"
    if extracted:
        if isinstance(extracted, dict):
            if "policyholder_name" in extracted and isinstance(extracted["policyholder_name"], dict):
                policyholder_name = extracted["policyholder_name"].get("value", "Valued Customer")
        else:
            if hasattr(extracted, "policyholder_name") and extracted.policyholder_name:
                policyholder_name = extracted.policyholder_name.value
    claim_id = state.get("claim_id", "N/A")
    
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.2)
    
    prompt = PromptTemplate(
        template="""You are an automated customer communication assistant for ClaimGuard Insurance.
Write a professional, empathetic, and clear email to the policyholder explaining the AI triage decision.

Policyholder Name: {policyholder}
Claim ID: {claim_id}

AI Triage Report:
Decision: {decision}
Confidence: {confidence}
Summary: {summary}
Recommended Action: {action}

Checklist/Missing Documents:
{missing_docs}

Guidelines:
- If the claim is APPROVED or FAST_TRACK, write a congratulatory email explaining the next steps for payout.
- If the claim is PENDING_DOCUMENTS, clearly explain what is missing and ask them to upload it.
- If the claim is REJECTED or FLAGGED_FOR_FRAUD, write a professional email explaining that the claim requires further manual review by an adjuster, and they will be contacted shortly. DO NOT explicitly accuse them of fraud.
- Sign off as "The ClaimGuard AI Team".

Write ONLY the email content, no pleasantries or meta-text.
""",
        input_variables=["policyholder", "claim_id", "decision", "confidence", "summary", "action", "missing_docs"]
    )
    
    missing_docs = "\n".join([f"- {item.get('document')} (Mandatory: {item.get('is_mandatory')})" 
                            for item in state.get("checklist", []) if not item.get("is_present")])
    if not missing_docs:
        missing_docs = "None"
        
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "policyholder": policyholder_name,
            "claim_id": claim_id,
            "decision": triage.get("final_decision") if isinstance(triage, dict) else getattr(triage, "final_decision", ""),
            "confidence": triage.get("confidence_score") if isinstance(triage, dict) else getattr(triage, "confidence_score", ""),
            "summary": triage.get("summary") if isinstance(triage, dict) else getattr(triage, "summary", ""),
            "action": triage.get("recommended_action") if isinstance(triage, dict) else getattr(triage, "recommended_action", ""),
            "missing_docs": missing_docs
        })
        state["customer_communication"] = response.content
    except Exception as e:
        print(f"Communication error: {e}")
        state["errors"].append({"agent": "communication_agent", "error": str(e)})
        
    return state
