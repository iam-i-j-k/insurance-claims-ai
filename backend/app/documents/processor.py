import os
import uuid
from typing import Dict, Any, List
import pymupdf  # PyMuPDF
from docx import Document
import pytesseract
from PIL import Image
import io

from app.models.document import DocumentInfo

class DocumentProcessor:
    def __init__(self):
        pass
        
    def process_file(self, filepath: str, document_type: str, filename: str) -> DocumentInfo:
        doc_id = str(uuid.uuid4())
        text = ""
        pages = []
        
        if document_type.lower() == "pdf":
            text, pages = self.process_pdf(filepath)
        elif document_type.lower() in ["docx", "doc"]:
            text, pages = self.process_docx(filepath)
        elif document_type.lower() in ["jpg", "jpeg", "png"]:
            text, pages = self.process_image(filepath)
        else:
            raise ValueError(f"Unsupported document type: {document_type}")
            
        return DocumentInfo(
            document_id=doc_id,
            filename=filename,
            document_type=document_type.upper(),
            pages=pages,
            text=text,
            metadata={"filepath": filepath}
        )

    def process_pdf(self, filepath: str):
        text = ""
        pages = []
        try:
            doc = pymupdf.open(filepath)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                
                # If page is essentially empty, try OCR on the image
                if not page_text.strip():
                    pix = page.get_pixmap()
                    img = Image.open(io.BytesIO(pix.tobytes()))
                    page_text = pytesseract.image_to_string(img)
                    
                pages.append(page_text)
                text += f"\n--- Page {page_num + 1} ---\n" + page_text
            doc.close()
        except Exception as e:
            print(f"Error processing PDF {filepath}: {e}")
        return text, pages

    def process_docx(self, filepath: str):
        text = ""
        pages = []
        try:
            doc = Document(filepath)
            for para in doc.paragraphs:
                text += para.text + "\n"
            pages = [text] # docx doesn't have strict pages like PDF in this context
        except Exception as e:
            print(f"Error processing DOCX {filepath}: {e}")
        return text, pages

    def process_image(self, filepath: str):
        text = ""
        pages = []
        try:
            img = Image.open(filepath)
            text = pytesseract.image_to_string(img)
            pages = [text]
        except Exception as e:
            print(f"Error processing Image {filepath}: {e}")
        return text, pages
