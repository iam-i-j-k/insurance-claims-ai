from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.fraud import FraudAssessment
import json

def fraud_agent(state: ClaimState) -> ClaimState:
    print("--- FRAUD & ANOMALY AGENT ---")
    state["current_agent"] = "fraud_agent"
    
    extracted_data = state.get("extracted_data")
    if not extracted_data:
        state["errors"].append({"agent": "fraud_agent", "error": "No extracted data available"})
        return state
        
    risk_indicators = []
    rationale = []
    
    # 1. Deterministic Rule Engine
    try:
        # Example Rule: High Claim Frequency
        prior_claims = 0
        if extracted_data.prior_claim_references and extracted_data.prior_claim_references.value:
            # Simple heuristic for MVP. A real system would query a database.
            val = str(extracted_data.prior_claim_references.value).lower()
            if "3" in val or "three" in val:
                prior_claims = 3
            elif "2" in val or "two" in val:
                prior_claims = 2
                
        if prior_claims > 2:
            risk_indicators.append("[RULE] High claim frequency")
            rationale.append(f"Detected {prior_claims} prior claims in recent history, which exceeds the threshold of 2.")
            
        # Example Rule: High Value Claim
        claimed_amount = 0
        if extracted_data.claimed_amount and extracted_data.claimed_amount.value:
            try:
                # Naive parse for MVP
                claimed_amount = float(str(extracted_data.claimed_amount.value).replace(',', '').replace('₹', '').replace('$', '').strip())
            except:
                pass
                
        if claimed_amount > 100000:
            risk_indicators.append("[RULE] High-value claim")
            rationale.append(f"Claimed amount {claimed_amount} exceeds high-value threshold.")
            
            # Check for FIR if motor and high value
            checklist = state.get("checklist", [])
            fir_present = any(item.get("document", "").lower() in ["fir", "police report"] and item.get("is_present") for item in checklist)
            if not fir_present:
                risk_indicators.append("[RULE] Mandatory FIR missing for high-value claim")
                rationale.append("FIR is missing but required for claims over threshold.")
                
    except Exception as e:
        print(f"Deterministic rule evaluation error: {e}")
        
    # 2. LLM Anomaly Detection
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert insurance fraud and anomaly detection agent.
Review the claim data for inconsistencies, contradictory dates/descriptions, or suspicious patterns.

Extracted Data:
{extracted_data}

Rules:
1. Do NOT state "This claim is fraudulent." Use terms like "risk indicator detected".
2. Incorporate these already identified deterministic rules: {deterministic_rules}
3. Assess a risk_score from 0-100 and a risk_level (LOW, MEDIUM, HIGH, CRITICAL).
4. Provide a recommended_action (e.g., "Proceed", "Manual investigation recommended", "SIU review").

Respond strictly with a JSON matching the requested structure.
""",
        input_variables=["extracted_data", "deterministic_rules"]
    )
    
    chain = prompt | llm.with_structured_output(FraudAssessment)
    
    try:
        fraud_result = chain.invoke({
            "extracted_data": extracted_data.model_dump_json(),
            "deterministic_rules": json.dumps({"indicators": risk_indicators, "rationale": rationale})
        })
        
        # Merge deterministic rules with LLM findings if LLM dropped them
        for ind in risk_indicators:
            if ind not in fraud_result.indicators:
                fraud_result.indicators.append(ind)
        for rat in rationale:
            if rat not in fraud_result.rationale:
                fraud_result.rationale.append(rat)
                
        state["fraud_assessment"] = fraud_result
        
    except Exception as e:
        print(f"Fraud LLM error: {e}")
        state["errors"].append({"agent": "fraud_agent", "error": str(e)})
        
    return state
