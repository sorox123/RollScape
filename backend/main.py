"""
RollScape Backend - AI-Native D&D Virtual Tabletop

Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RollScape API",
    description="AI-Native D&D Virtual Tabletop Backend",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend dev server
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
        "status": "operational"
    }

@app.get("/health")
async def health():
    """Health check for monitoring"""
    return {"status": "healthy"}
