import os
import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.rag.vectorstore import VectorStore
from app.documents.processor import DocumentProcessor

def ingest_document(filepath: str, policy_type: str):
    """
    Ingests a document (PDF/DOCX/MD) into the vector store.
    """
    filename = os.path.basename(filepath)
    doc_type = filepath.split('.')[-1].lower()
    
    # Text extraction
    if doc_type in ['pdf', 'docx', 'doc']:
        processor = DocumentProcessor()
        doc_info = processor.process_file(filepath, doc_type, filename)
        text = doc_info.text
    elif doc_type in ['txt', 'md']:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        raise ValueError(f"Unsupported file type for ingestion: {doc_type}")
        
    # Chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)
    
    # Prepare metadata and IDs
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        # Note: robust page extraction from chunk logic is omitted for simplicity in MVP,
        # but normally we'd keep track of page numbers during chunking.
        metadatas.append({
            "document": filename,
            "policy_type": policy_type,
            "chunk_index": i
        })
        ids.append(f"{filename}_{i}_{uuid.uuid4().hex[:8]}")
        
    vs = VectorStore.get_instance()
    vs.add_documents(documents=documents, metadatas=metadatas, ids=ids)
    return len(chunks)
