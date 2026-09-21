from app.rag.vectorstore import VectorStore
from typing import List, Dict, Any

class PolicyRetriever:
    def __init__(self):
        self.vs = VectorStore.get_instance()
        
    def retrieve(self, query: str, policy_type: str = None, n_results: int = 5) -> List[Dict[str, Any]]:
        where_clause = {}
        if policy_type:
            where_clause = {"policy_type": policy_type}
            
        # Chroma query
        results = self.vs.query(
            query_texts=[query],
            n_results=n_results,
            where=where_clause if where_clause else None
        )
        
        retrieved_evidence = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else []
            
            for i, doc_text in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                retrieved_evidence.append({
                    "text": doc_text,
                    "document": meta.get("document", "Unknown"),
                    "policy_type": meta.get("policy_type", "Unknown")
                })
                
        return retrieved_evidence
