from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class DocumentSource(BaseModel):
    document: str = Field(description="Name of the source document")
    page: Optional[int] = Field(None, description="Page number where information was found")
    section: Optional[str] = Field(None, description="Section of the document")

class ExtractedField(BaseModel):
    value: Any = Field(description="The extracted value")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score from 0 to 1")
    source: Optional[DocumentSource] = Field(None, description="Source of the extracted value")

class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    document_type: str
    pages: List[str] = []
    text: str = ""
    metadata: Dict[str, Any] = {}
