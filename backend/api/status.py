"""
Service status and configuration endpoints.

Shows current mode (mock vs production) and service availability.
"""

from fastapi import APIRouter
from services.service_factory import ServiceFactory, get_ai_service, get_image_service, get_cache_service
from config import settings

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("/", response_model=dict)
async def get_status():
    """
    Get comprehensive system status.
    
    Shows:
    - Current mode (mock vs production)
    - Service availability
    - Usage statistics
    - Cost information
    """
    mode_info = ServiceFactory.get_mode_info()
    
    # Get service instances
    ai_service = get_ai_service()
    image_service = get_image_service()
    cache_service = get_cache_service()
    
    # Get usage stats
    ai_stats = ai_service.get_stats()
    image_stats = image_service.get_stats()
    
    return {
        "status": "operational",
        "mode": mode_info,
        "services": {
            "ai": {
                "available": True,
                "stats": ai_stats
            },
            "images": {
                "available": True,
                "stats": image_stats
            },
            "cache": {
                "available": True,
                "type": "mock" if settings.mock_mode else "redis"
            }
        },
        "environment": settings.environment,
        "debug": settings.debug
    }


@router.get("/health", response_model=dict)
async def health_check():
    """
    Simple health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "mock_mode": settings.mock_mode,
        "mode_name": "Development (Free)" if settings.mock_mode else "Production (Paid)",
        "timestamp": "2025-11-21"
    }


@router.get("/mode", response_model=dict)
async def get_operation_mode():
    """
    Get detailed information about current operation mode.
    """
    mode_info = ServiceFactory.get_mode_info()
    
    return {
        "current_mode": "development" if settings.mock_mode else "production",
        "details": mode_info,
        "recommendations": {
            "development": "Keep MOCK_MODE=true while building features. It's free!",
            "production": "Only enable production mode when ready to launch and pay for APIs.",
            "cost_warning": mode_info["cost_warning"]
        },
        "configuration": {
            "mock_mode": settings.mock_mode,
            "openai_enabled": mode_info["openai_enabled"],
            "supabase_enabled": mode_info["supabase_enabled"],
            "redis_enabled": mode_info["redis_enabled"]
        }
    }


@router.get("/costs", response_model=dict)
async def get_cost_info():
    """
    Get cost information and usage statistics.
    """
    ai_service = get_ai_service()
    image_service = get_image_service()
    
    ai_stats = ai_service.get_stats()
    image_stats = image_service.get_stats()
    
    if settings.mock_mode:
        return {
            "mock_mode": True,
            "total_cost": 0.0,
            "ai_cost": 0.0,
            "image_cost": 0.0,
            "message": "🎉 All services are FREE in mock mode!",
            "usage": {
                "ai_calls": ai_stats.get("total_calls", 0),
                "images_generated": image_stats.get("total_generations", 0)
            }
        }
    else:
        return {
            "mock_mode": False,
            "total_cost": ai_stats.get("total_cost", 0.0) + image_stats.get("total_cost", 0.0),
            "ai_cost": ai_stats.get("total_cost", 0.0),
            "image_cost": image_stats.get("total_cost", 0.0),
            "message": "⚠️ Using paid services - costs apply!",
            "usage": {
                "ai_calls": ai_stats.get("total_calls", 0),
                "ai_tokens": ai_stats.get("tokens_used", 0),
                "images_generated": image_stats.get("total_generations", 0)
            }
        }
