"""
RollScape Backend - AI-Native D&D Virtual Tabletop

Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(
    title="RollScape API",
    description="AI-Native D&D Virtual Tabletop Backend",
    version="0.1.0",
    debug=settings.debug
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Welcome to RollScape API",
        "version": "0.1.0",
        "status": "operational",
        "environment": settings.environment
    }

@app.get("/health")
async def health():
    """Health check for monitoring"""
    return {"status": "healthy"}

@app.get("/api/test")
async def test():
    """Test endpoint to verify API is working"""
    return {
        "message": "API is working!",
        "endpoints": [
            "/",
            "/health",
            "/api/test",
            "/docs",
            "/redoc"
        ]
    }
