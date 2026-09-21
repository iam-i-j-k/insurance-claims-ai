from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import os
from app.db.database import load_claim, save_claim
from app.documents.processor import DocumentProcessor

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/claims/{claim_id}/documents")
async def upload_document(claim_id: str, file: UploadFile = File(...)):
    state = load_claim(claim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    processor = DocumentProcessor()
    doc_type = file.filename.split('.')[-1]
    doc_info = processor.process_file(filepath, doc_type, file.filename)
    
    # Store just dict
    state["documents"].append(doc_info.__dict__)
    save_claim(claim_id, state)
    
    return {"status": "success", "document_id": doc_info.document_id}
