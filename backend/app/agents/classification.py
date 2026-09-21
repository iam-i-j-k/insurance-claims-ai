from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.claim import ClaimClassification

def classification_agent(state: ClaimState) -> ClaimState:
    print("--- CLASSIFICATION AGENT ---")
    state["current_agent"] = "classification_agent"
    
    extracted_data = state.get("extracted_data")
    if not extracted_data:
        state["errors"].append({"agent": "classification_agent", "error": "No extracted data available"})
        return state
        
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert insurance claim classification agent.
Based on the following extracted claim data, classify the claim according to the required schema.

Extracted Data:
{extracted_data}

Rules:
1. Determine Severity (Minor, Moderate, Major, Catastrophic) based on claimed amount and description.
2. Determine Urgency (Routine, Expedited, Emergency).
3. Evaluate Documentation status.
4. Generate a checklist of mandatory and optional documents expected for this type of claim.
   For example, Motor claims over a threshold might require an FIR (First Information Report) or Police Report.

Respond strictly with a JSON matching the requested structure.
""",
        input_variables=["extracted_data"]
    )
    
    chain = prompt | llm.with_structured_output(ClaimClassification)
    
    try:
        classification_result = chain.invoke({"extracted_data": extracted_data.model_dump_json()})
        state["classification"] = classification_result
        state["checklist"] = [item.dict() for item in classification_result.checklist]
        
    except Exception as e:
        print(f"Classification error: {e}")
        state["errors"].append({"agent": "classification_agent", "error": str(e)})
        
    return state
