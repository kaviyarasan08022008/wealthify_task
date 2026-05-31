from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from app.routes.api import router as api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Mutual Fund Transaction Dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Serve frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

@app.get("/", include_in_schema=False)
def read_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/app.js", include_in_schema=False)
def read_js():
    return FileResponse(os.path.join(frontend_dir, "app.js"))

@app.get("/style.css", include_in_schema=False)
def read_css():
    return FileResponse(os.path.join(frontend_dir, "style.css"))


# ── Direct Transaction API Endpoints ──
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.data_service import data_service
from typing import Optional

@app.get("/itransactions")
def get_itransactions(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Direct endpoint to fetch all transactions."""
    try:
        return data_service.list_transactions(db, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
def get_transactions(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Direct endpoint to fetch all transactions (alias)."""
    try:
        return data_service.list_transactions(db, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

