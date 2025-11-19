"""
RollScape Backend - AI-Native D&D Virtual Tabletop

Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# Import routers
from api import users, campaigns, characters, dice, dm, player_agent

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

# Register API routers
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(characters.router)
app.include_router(dice.router)
app.include_router(dm.router)
app.include_router(player_agent.router)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Welcome to RollScape API",
        "version": "0.1.0",
        "status": "operational",
        "environment": settings.environment,
        "docs": "/docs"
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
        "available_endpoints": {
            "users": "/api/users",
            "campaigns": "/api/campaigns",
            "characters": "/api/characters",
            "dice": "/api/dice",
            "dm": "/api/dm",
            "player-agent": "/api/player-agent"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }
