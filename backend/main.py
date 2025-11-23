"""
RollScape Backend - AI-Native D&D Virtual Tabletop

Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from config import settings

# Import routers
from api import users, campaigns, characters, dice, dm, player_agent, game_session, status, friends, messaging, ai_images, pdf_import, combat, inventory

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

# Custom exception handler for validation errors (including invalid UUIDs)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper 422 responses"""
    # Clean up errors to ensure JSON serializable
    errors = []
    for error in exc.errors():
        error_dict = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": str(error.get("input", ""))[:200]  # Truncate long inputs
        }
        # Convert ctx error objects to strings
        if "ctx" in error and "error" in error["ctx"]:
            error_dict["ctx"] = {"error": str(error["ctx"]["error"])}
        errors.append(error_dict)
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )

# Register API routers
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(characters.router)
app.include_router(dice.router)
app.include_router(dm.router)
app.include_router(player_agent.router)
app.include_router(game_session.router)
app.include_router(status.router)
app.include_router(friends.router)
app.include_router(messaging.router)
app.include_router(ai_images.router)
app.include_router(pdf_import.router)
app.include_router(combat.router)
app.include_router(inventory.router)

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
            "player-agent": "/api/player-agent",
            "game-session": "/api/session",
            "status": "/api/status",
            "friends": "/api/friends",
            "messages": "/api/messages"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }
