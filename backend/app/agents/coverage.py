from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.coverage import CoverageAssessment
from app.rag.retriever import PolicyRetriever
import json

def coverage_agent(state: ClaimState) -> ClaimState:
    print("--- COVERAGE AGENT ---")
    state["current_agent"] = "coverage_agent"
    
    extracted_data = state.get("extracted_data")
    classification = state.get("classification")
    
    if not extracted_data or not classification:
        state["errors"].append({"agent": "coverage_agent", "error": "Missing extraction or classification data"})
        return state
        
    policy_type = classification.claim_type.lower()
    
    # 1. RAG Retrieval
    retriever = PolicyRetriever()
    # Construct a search query based on claim details
    query = f"Coverage rules, limits, exclusions, deductibles, and required documents for {policy_type} insurance claim."
    if extracted_data.reported_cause and extracted_data.reported_cause.value:
        query += f" Incident cause: {extracted_data.reported_cause.value}."
        
    retrieved_evidence = retriever.retrieve(query=query, policy_type=policy_type, n_results=5)
    state["retrieved_policy_evidence"] = retrieved_evidence
    
    evidence_text = ""
    for idx, ev in enumerate(retrieved_evidence):
        evidence_text += f"\n--- Evidence {idx + 1} from {ev['document']} ---\n{ev['text']}\n"
        
    # 2. LLM Evaluation
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert insurance coverage assessment agent.
Evaluate the claim based ONLY on the retrieved policy evidence. DO NOT invent or assume policy terms, limits, or deductibles.

Extracted Claim Data:
{extracted_data}

Retrieved Policy Evidence:
{evidence_text}

Rules:
1. For each condition found in the evidence (e.g., Filing deadline, Mandatory documents like FIR, Deductibles, Limits), evaluate if the claim complies.
2. Status must be one of: COMPLIANT, NON_COMPLIANT, PARTIALLY_COVERED, INFORMATION_REQUIRED.
3. If evidence is missing for a key assessment, state INFORMATION_REQUIRED.
4. Set the overall_status appropriately based on individual conditions.
5. Provide reasoning and cite the source document.

Respond strictly with a JSON matching the requested structure.
""",
        input_variables=["extracted_data", "evidence_text"]
    )
    
    chain = prompt | llm.with_structured_output(CoverageAssessment)
    
    try:
        coverage_result = chain.invoke({
            "extracted_data": extracted_data.model_dump_json(),
            "evidence_text": evidence_text if evidence_text else "No specific policy evidence found."
        })
        state["coverage_assessment"] = coverage_result
        
    except Exception as e:
        print(f"Coverage error: {e}")
        state["errors"].append({"agent": "coverage_agent", "error": str(e)})
        
    return state
