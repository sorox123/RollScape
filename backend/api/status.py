"""
Service status and configuration endpoints.
"""

from fastapi import APIRouter
from services import get_service_status, is_mock_mode
from services.openai_service import openai_service

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("/services", response_model=dict)
async def get_services_status():
    """
    Get status of all external services.
    
    Shows which services are in mock mode vs production,
    and whether they're properly configured.
    """
    status = get_service_status()
    
    # Add usage stats for OpenAI
    if not openai_service.is_mock:
        status["openai_usage"] = openai_service.get_usage_stats()
    
    return status


@router.get("/health", response_model=dict)
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "mock_mode": is_mock_mode(),
        "message": "All systems operational"
    }


@router.get("/mode", response_model=dict)
async def get_operation_mode():
    """
    Get current operation mode.
    """
    mock = is_mock_mode()
    
    return {
        "mode": "development" if mock else "production",
        "mock_mode": mock,
        "description": (
            "Running in development mode with mock services (free)" if mock
            else "Running in production mode with real services"
        ),
        "message": (
            "Set MOCK_MODE=false in .env to enable production services" if mock
            else "Using production services"
        )
    }
