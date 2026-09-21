from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.graph.state import ClaimState
from app.models.claim import ClaimExtraction
import json

def intake_agent(state: ClaimState) -> ClaimState:
    print("--- INTAKE AGENT ---")
    state["current_agent"] = "intake_agent"
    
    docs = state.get("documents", [])
    if not docs:
        state["errors"].append({"agent": "intake_agent", "error": "No documents provided"})
        state["workflow_status"] = "FAILED"
        return state
        
    # Combine document texts for MVP context (in real scenario, process separately or intelligently chunk)
    context = ""
    for doc in docs:
        context += f"\n\n--- Document: {doc['filename']} ---\n{doc['text']}"
        
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0) # using groq as default
    
    prompt = PromptTemplate(
        template="""You are an expert insurance claim intake agent.
Extract the following information from the provided claim documents.
For each field, if the information is not explicitly present, set its value to null.
Do NOT hallucinate or guess any values.

Documents:
{context}

Respond strictly with a JSON matching the requested structure. Ensure the 'source' field correctly references the document name.
""",
        input_variables=["context"]
    )
    
    chain = prompt | llm.with_structured_output(ClaimExtraction)
    
    try:
        extraction_result = chain.invoke({"context": context})
        state["extracted_data"] = extraction_result
        
        # Populate extraction sources for traceability
        sources = []
        for field_name, field_data in extraction_result.dict().items():
            if isinstance(field_data, dict) and field_data.get("source"):
                sources.append(field_data["source"])
                
        state["extraction_sources"] = sources
        
    except Exception as e:
        print(f"Extraction error: {e}")
        state["errors"].append({"agent": "intake_agent", "error": str(e)})
        
    return state
