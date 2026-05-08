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
from backend.routes import doctors
from backend.routes import appointments
from backend import admin_auth
from backend import doctor_auth


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
app.include_router(admin_auth.router, prefix="/api/admin", tags=["Admin"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(doctor_auth.router, prefix="/api/doctor-auth", tags=["Doctor Auth"])

# ─── Serve Frontend (pre-built dist) ───
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="static-assets")

@app.get("/")
async def root():
    """Root endpoint — returns API info or serves SPA if dist exists."""
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return {"message": "Welcome to AI Health Risk Prediction API"}
