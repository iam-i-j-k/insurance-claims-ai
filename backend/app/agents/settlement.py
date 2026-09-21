import re
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from app.graph.state import ClaimState
from app.models.settlement import Settlement, CalculationStep

class PolicyLimitsExtraction(BaseModel):
    coverage_limit: float = Field(description="The maximum coverage limit amount in numeric format. Return 0 if not found.")
    deductible: float = Field(description="The deductible amount in numeric format. Return 0 if not found.")

def settlement_agent(state: ClaimState) -> ClaimState:
    print("--- SETTLEMENT AGENT ---")
    state["current_agent"] = "settlement_agent"
    
    extracted_data = state.get("extracted_data")
    evidence = state.get("retrieved_policy_evidence", [])
    
    if not extracted_data:
        state["errors"].append({"agent": "settlement_agent", "error": "No extracted data available"})
        return state
        
    claimed_amount_str = str(extracted_data.claimed_amount.value) if extracted_data.claimed_amount and extracted_data.claimed_amount.value else "0"
    try:
        claimed_amount = float(re.sub(r'[^\d.]', '', claimed_amount_str))
    except:
        claimed_amount = 0.0

    # Extract limit and deductible from evidence using LLM
    evidence_text = "\n".join([ev["text"] for ev in evidence])
    
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    prompt = PromptTemplate(
        template="""Extract the numeric coverage limit and deductible from the following policy evidence.
If not found, return 0.

Policy Evidence:
{evidence_text}
""",
        input_variables=["evidence_text"]
    )
    
    chain = prompt | llm.with_structured_output(PolicyLimitsExtraction)
    
    coverage_limit = 0.0
    deductible = 0.0
    try:
        if evidence_text.strip():
            limits = chain.invoke({"evidence_text": evidence_text})
            coverage_limit = limits.coverage_limit
            deductible = limits.deductible
    except Exception as e:
        print(f"Error extracting limits: {e}")
        
    # Deterministic Calculation
    steps = []
    
    steps.append(CalculationStep(description="Initial Claimed Amount", amount=claimed_amount))
    
    eligible_amount = claimed_amount
    
    # Apply Limit
    if coverage_limit > 0 and eligible_amount > coverage_limit:
        eligible_amount = coverage_limit
        steps.append(CalculationStep(description="Applied Coverage Limit", amount=- (claimed_amount - coverage_limit), rule_source="Policy Coverage Limit"))
        
    # Apply Deductible
    preliminary_payable = eligible_amount
    if deductible > 0:
        preliminary_payable = max(0.0, eligible_amount - deductible)
        steps.append(CalculationStep(description="Applied Deductible", amount=-deductible, rule_source="Policy Deductible"))
        
    settlement = Settlement(
        claimed_amount=claimed_amount,
        eligible_amount=claimed_amount, # Before limit/deductible
        coverage_limit=coverage_limit,
        deductible=deductible,
        preliminary_payable=preliminary_payable,
        calculation_steps=steps
    )
    
    state["settlement"] = settlement
    return state
