"""
Service Factory - Returns mock or real services based on configuration.

This allows seamless switching between development (free) and production (paid) modes.
"""

import os
from typing import Optional
from config import settings


class ServiceFactory:
    """Factory for creating service instances based on configuration"""
    
    @staticmethod
    def get_openai_service():
        """
        Get OpenAI service (mock or real based on MOCK_MODE).
        
        Returns:
            MockOpenAIService if MOCK_MODE=true, otherwise real OpenAI service
        """
        mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        
        if mock_mode:
            from services.mock_openai_service import get_mock_openai_service
            return get_mock_openai_service()
        else:
            # Import real service only when needed
            try:
                from services.openai_service import get_openai_service
                return get_openai_service()
            except ImportError:
                print("⚠️  Real OpenAI service not implemented yet. Using mock.")
                from services.mock_openai_service import get_mock_openai_service
                return get_mock_openai_service()
    
    @staticmethod
    def get_dalle_service():
        """
        Get DALL-E service (mock or real based on MOCK_MODE).
        
        Returns:
            MockDALLEService if MOCK_MODE=true, otherwise real DALL-E service
        """
        mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        
        if mock_mode:
            from services.mock_dalle_service import get_mock_dalle_service
            return get_mock_dalle_service()
        else:
            # Import real service only when needed
            try:
                from services.dalle_service import get_dalle_service
                return get_dalle_service()
            except ImportError:
                print("⚠️  Real DALL-E service not implemented yet. Using mock.")
                from services.mock_dalle_service import get_mock_dalle_service
                return get_mock_dalle_service()
    
    @staticmethod
    def get_redis_service():
        """
        Get Redis service (mock or real based on configuration).
        
        Returns:
            Mock in-memory service or real Redis connection
        """
        mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        redis_enabled = os.getenv("REDIS_ENABLED", "true").lower() == "true"
        
        if mock_mode or not redis_enabled:
            from services.mock_redis_service import get_mock_redis_service
            return get_mock_redis_service()
        else:
            try:
                from services.redis_service import get_redis_service
                return get_redis_service()
            except ImportError:
                print("⚠️  Real Redis service not available. Using mock.")
                from services.mock_redis_service import get_mock_redis_service
                return get_mock_redis_service()
    
    @staticmethod
    def is_mock_mode() -> bool:
        """Check if running in mock mode"""
        return os.getenv("MOCK_MODE", "true").lower() == "true"
    
    @staticmethod
    def get_mode_info() -> dict:
        """Get information about current service mode"""
        mock_mode = ServiceFactory.is_mock_mode()
        
        return {
            "mock_mode": mock_mode,
            "mode_name": "Development (Free)" if mock_mode else "Production (Paid)",
            "openai_enabled": not mock_mode and os.getenv("OPENAI_ENABLED", "true").lower() == "true",
            "dalle_enabled": not mock_mode and os.getenv("OPENAI_ENABLED", "true").lower() == "true",
            "redis_enabled": not mock_mode and os.getenv("REDIS_ENABLED", "true").lower() == "true",
            "supabase_enabled": not mock_mode and os.getenv("SUPABASE_ENABLED", "true").lower() == "true",
            "cost_warning": "No costs - using mock services" if mock_mode else "⚠️  Using paid services - costs apply!"
        }


# Convenience functions
def get_ai_service():
    """Convenience function to get AI service"""
    return ServiceFactory.get_openai_service()


def get_image_service():
    """Convenience function to get image generation service"""
    return ServiceFactory.get_dalle_service()


def get_cache_service():
    """Convenience function to get cache service"""
    return ServiceFactory.get_redis_service()
