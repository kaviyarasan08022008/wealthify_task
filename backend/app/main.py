import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes.api import router as api_router

# Initialize the FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Mutual Fund Transaction Dashboard",
    version="1.0.0"
)

# Enable Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Core API Routes
app.include_router(api_router)

# Resolve Frontend Directory Path
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

# Mount Frontend Assets Dynamically
app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")

if os.path.exists(os.path.join(frontend_dir, "screenshots")):
    app.mount("/screenshots", StaticFiles(directory=os.path.join(frontend_dir, "screenshots")), name="screenshots")

# ── Dynamic Frontend Page Router ──

@app.get("/pages/{page_name}.html", include_in_schema=False)
def read_page(page_name: str):
    """Dynamic route to serve subpages from the pages folder."""
    path = os.path.join(frontend_dir, "pages", f"{page_name}.html")
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Page not found")

@app.get("/", include_in_schema=False)
def read_index():
    """Serve the central dashboard overview page."""
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/style.css", include_in_schema=False)
def read_css():
    """Redirect style.css requests to the primary main.css file."""
    return FileResponse(os.path.join(frontend_dir, "css", "main.css"))