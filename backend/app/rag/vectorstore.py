import os
from pinecone import Pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class VectorStore:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def __init__(self):
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if not pinecone_api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set")
            
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "policy-knowledge-base")
        self.index = self.pc.Index(self.index_name)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            output_dimensionality=768
        )
        
    def add_documents(self, documents: list[str], metadatas: list[dict], ids: list[str]):
        # Embed the documents
        vectors = self.embeddings.embed_documents(documents)
        
        # Prepare data for pinecone
        records = []
        for i in range(len(documents)):
            # Inject text into metadata so we can retrieve it
            meta = metadatas[i].copy()
            meta["text"] = documents[i]
            
            records.append((
                ids[i],
                vectors[i],
                meta
            ))
            
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(records), batch_size):
            self.index.upsert(vectors=records[i:i + batch_size])
        
    def query(self, query_texts: list[str], n_results: int = 5, where: dict = None):
        # We assume one query text for simplicity based on original chromadb usage
        query_text = query_texts[0]
        query_vector = self.embeddings.embed_query(query_text)
        
        results = self.index.query(
            vector=query_vector,
            top_k=n_results,
            filter=where,
            include_metadata=True
        )
        
        # Reconstruct into a format similar to ChromaDB's output for minimal disruption
        retrieved_docs = []
        retrieved_metas = []
        
        for match in results.get("matches", []):
            meta = match.get("metadata", {})
            retrieved_docs.append(meta.pop("text", ""))
            retrieved_metas.append(meta)
            
        return {
            "documents": [retrieved_docs],
            "metadatas": [retrieved_metas]
        }
