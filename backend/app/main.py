import os
from dotenv import load_dotenv
load_dotenv()

from langchain_core.globals import set_llm_cache
from langchain_community.cache import SQLiteCache

set_llm_cache(SQLiteCache(database_path="llm_cache.db"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import claims, documents, workflow, review, auth
from app.db.database import init_db

app = FastAPI(title="Agentic AI Insurance Claims Triage System API")

@app.on_event("startup")
def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(claims.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(workflow.router, prefix="/api")
app.include_router(review.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
