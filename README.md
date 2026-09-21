# ClaimGuard AI 🛡️
**Autonomous Insurance Claims Orchestration & Adjudication System**

ClaimGuard AI is a cutting-edge Agentic AI platform built with **LangGraph** and **FastAPI** on the backend, and **React + Vite** on the frontend. It orchestrates a multi-agent workflow to automate the intake, classification, coverage verification, fraud detection, and settlement calculations for insurance claims. 

Designed strictly as a *Human-in-the-Loop* (HITL) decision-support system, it handles the heavy lifting of document analysis and triage, while routing the final AI-generated report and email drafts to a human adjuster for final authorization.

## ✨ Key Features
- **Multi-Agent LangGraph Workflow**: A network of highly specialized AI agents (Intake, Classification, Coverage, Fraud, Settlement, Review/Critique, and Communication) working asynchronously to process claims.
- **Google SSO & JWT Authentication**: Secure, session-based authentication using Google OAuth 2.0, Passlib, and bcrypt password hashing.
- **RAG-Powered Policy Engine**: Integrates **Pinecone** Vector DB and LangChain to semantically match claim conditions against a vast knowledge base of policy documents.
- **Aesthetic Glassmorphic UI**: Built with React, TailwindCSS, and Framer Motion for a premium, minimalistic, and highly responsive user experience. Includes an interactive Agentic Architecture Graph, metric visualizations, and hot toast notifications.
- **Automated Email Drafting**: The Communication Agent automatically drafts highly contextual emails (Approval, Rejection, Request for Information) based on the claim's final adjudicated state.
- **Multi-Modal OCR Intake**: Seamlessly processes `.pdf`, `.docx`, and `.jpg` submissions using PyMuPDF, `python-docx`, and Tesseract OCR.

## 🏗️ Architecture Stack
- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, React Query, Lucide React, Recharts.
- **Backend**: FastAPI, LangGraph, LangChain, SQLite (State Persistence Engine), Pinecone, Passlib/Bcrypt.
- **LLM Engine**: Groq (Llama-3/Mixtral models for hyper-fast, low-latency reasoning).

## ⚙️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
**Environment Variables (`backend/.env`)**:
```env
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=policy-knowledge-base
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=sqlite:///./claims.db
```
Start the local server:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Configuration**:
Ensure you have configured a valid Google Client ID in your `App.tsx` `<GoogleOAuthProvider>`. The application will automatically communicate with the local backend via `api.ts`.

## 🌐 Production Deployment Options
- **Backend (Render)**: Ready for deployment on Render as a Web Service. Set your Start Command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT` and configure your environment variables in the Render Dashboard.
- **Frontend (Vercel)**: Optimized for Vercel deployment. Includes a `vercel.json` for SPA routing rules to prevent 404s on page refreshes. Build command: `npm run build`.

## 🧪 How it Works (The Workflow)
1. **Intake**: An adjuster logs into the portal using Google SSO and uploads a claim document on the "New Claim" page.
2. **Execution**: The LangGraph state machine triggers on the backend. You can trace the live execution via the dashboard's "Live Adjudication Stream".
3. **Multi-Agent Processing**: 
   - *Intake Agent* extracts structured JSON data (policyholder, incident details).
   - *Classification Agent* maps the claim taxonomy.
   - *Coverage Agent* queries Pinecone RAG for policy limits and exclusions.
   - *Fraud Agent* assesses risk scoring based on behavioral anomalies.
   - *Communication Agent* drafts a personalized response.
4. **Human Review**: The Adjuster opens the Claim Detail view, inspects the AI's logic, reviews the drafted email, and clicks "Approve", "Reject", or "Escalate".
