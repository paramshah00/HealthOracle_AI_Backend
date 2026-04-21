import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from backend.database import engine, Base
from backend import models  # Import models so all tables are registered with Base
from backend.routes import auth
from backend.routes import predictions
from backend.routes import analytics
from backend.routes import assistant


# To run the server of backend use this command (from the project root directory):
#           uvicorn backend.main:app --reload
# python -m uvicorn backend.main:app --reload


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Health Risk Prediction API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix="/api/predict", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["AI Assistant"])

# ─── Serve Frontend (pre-built dist) ───
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="static-assets")

# Catch-all: serve index.html for SPA client-side routing
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return {"message": "Welcome to AI Health Risk Prediction API"}
