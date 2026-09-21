# ClaimGuard AI: Agentic Insurance Claims Triage System

An advanced Agentic AI decision-support platform designed to automate the triage and preliminary assessment of insurance claims using LangGraph and FastAPI. 

**IMPORTANT**: This system is designed as a *decision-support* tool. It will NEVER automatically approve or reject a claim. It generates a comprehensive triage report and routes the case to a human adjuster for final approval.

## 🚀 Features
- **Multi-Agent Architecture**: Built with LangGraph. Includes Intake, Classification, Coverage, Fraud, Settlement, Reviewer, and Report agents.
- **RAG-Powered Coverage Matrix**: Uses ChromaDB and LangChain to fetch semantic matches from the policy knowledge base.
- **Hybrid AI + Deterministic Rules**: Combines LLM risk assessment with deterministic hardcoded constraints (e.g. math checks, claim history).
- **Self-Correction (Reflection)**: The Reviewer Agent audits intermediate outputs and can trigger a re-processing loop if hallucination or incomplete data is detected.
- **Human-in-the-Loop Workflow**: Live dashboard for adjusters to review the final Triage Report, Risk Panel, Coverage Matrix, and issue the final ruling.
- **Multi-Modal Document Intake**: Processes `.pdf`, `.docx`, and `.jpg` utilizing PyMuPDF, python-docx, and Tesseract OCR.

## 🏗️ Architecture

1. **Frontend**: React, Vite, TailwindCSS, React Query.
2. **Backend**: FastAPI, LangGraph, LangChain, SQLite (MVP Persistence).
3. **LLM**: Google Gemini (Configurable via `GOOGLE_API_KEY`).
4. **Vector Store**: ChromaDB.

## ⚙️ Quick Start Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt

# Set your Google Gemini API Key
export GOOGLE_API_KEY="your-api-key-here"

# Start the FastAPI Server
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Demo Data Generation
If you want to test the workflow with dummy data, we provided a python script to generate a `.docx` policy and a `.docx` claim form.
```bash
cd sample_claims
python generate_demo_data.py
```
This generates `demo_claim_form.docx` in the `sample_claims` directory and `motor_policy.docx` in `knowledge_base/motor`.

## 🧪 How it Works
1. Upload the `demo_claim_form.docx` on the New Claim page.
2. The LangGraph workflow automatically initiates in the background.
3. The UI queries the FastAPI backend to visualize real-time agent progression (Intake -> Classification -> Coverage -> Fraud -> Settlement -> Reviewer -> Report).
4. Review the final AI Triage Report and click "Approve", "Reject", or "Escalate".
