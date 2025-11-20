"""
Base service configuration for all external services.
Supports mock mode for free development.
"""

import os
from typing import Optional
from pydantic import BaseModel
from enum import Enum


class ServiceMode(str, Enum):
    """Service operation mode"""
    MOCK = "mock"
    PRODUCTION = "production"


class ServiceConfig(BaseModel):
    """Base configuration for services"""
    mode: ServiceMode = ServiceMode.MOCK
    enabled: bool = True
    
    @classmethod
    def from_env(cls, service_name: str):
        """Create config from environment variables"""
        mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        enabled = os.getenv(f"{service_name.upper()}_ENABLED", "true").lower() == "true"
        
        return cls(
            mode=ServiceMode.MOCK if mock_mode else ServiceMode.PRODUCTION,
            enabled=enabled
        )


class OpenAIConfig(ServiceConfig):
    """OpenAI service configuration"""
    api_key: Optional[str] = None
    model: str = "gpt-4-turbo-preview"
    max_tokens: int = 2000
    temperature: float = 0.8
    rate_limit_rpm: int = 60  # Requests per minute
    cost_limit_daily: float = 10.0  # Max $10 per day
    
    @classmethod
    def from_env(cls):
        base = super().from_env("openai")
        return cls(
            mode=base.mode,
            enabled=base.enabled,
            api_key=os.getenv("OPENAI_API_KEY"),
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "2000")),
            temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.8")),
            rate_limit_rpm=int(os.getenv("OPENAI_RATE_LIMIT_RPM", "60")),
            cost_limit_daily=float(os.getenv("OPENAI_COST_LIMIT_DAILY", "10.0"))
        )


class SupabaseConfig(ServiceConfig):
    """Supabase service configuration"""
    url: Optional[str] = None
    key: Optional[str] = None
    jwt_secret: Optional[str] = None
    
    @classmethod
    def from_env(cls):
        base = super().from_env("supabase")
        return cls(
            mode=base.mode,
            enabled=base.enabled,
            url=os.getenv("SUPABASE_URL"),
            key=os.getenv("SUPABASE_KEY"),
            jwt_secret=os.getenv("SUPABASE_JWT_SECRET")
        )


class RedisConfig(ServiceConfig):
    """Redis service configuration"""
    url: Optional[str] = None
    max_connections: int = 10
    ttl_default: int = 3600  # 1 hour default TTL
    
    @classmethod
    def from_env(cls):
        base = super().from_env("redis")
        return cls(
            mode=base.mode,
            enabled=base.enabled,
            url=os.getenv("REDIS_URL"),
            max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "10")),
            ttl_default=int(os.getenv("REDIS_TTL_DEFAULT", "3600"))
        )


class WebSocketConfig(ServiceConfig):
    """WebSocket service configuration"""
    enabled: bool = True
    cors_origins: list = ["http://localhost:3000"]
    
    @classmethod
    def from_env(cls):
        base = super().from_env("websocket")
        cors = os.getenv("CORS_ORIGINS", "http://localhost:3000")
        
        return cls(
            mode=base.mode,
            enabled=base.enabled,
            cors_origins=cors.split(",")
        )


# Global service configs
openai_config = OpenAIConfig.from_env()
supabase_config = SupabaseConfig.from_env()
redis_config = RedisConfig.from_env()
websocket_config = WebSocketConfig.from_env()


def is_mock_mode() -> bool:
    """Check if running in mock mode"""
    return os.getenv("MOCK_MODE", "true").lower() == "true"


def get_service_status() -> dict:
    """Get status of all services"""
    return {
        "mock_mode": is_mock_mode(),
        "services": {
            "openai": {
                "mode": openai_config.mode,
                "enabled": openai_config.enabled,
                "configured": openai_config.api_key is not None
            },
            "supabase": {
                "mode": supabase_config.mode,
                "enabled": supabase_config.enabled,
                "configured": supabase_config.url is not None
            },
            "redis": {
                "mode": redis_config.mode,
                "enabled": redis_config.enabled,
                "configured": redis_config.url is not None
            },
            "websocket": {
                "mode": websocket_config.mode,
                "enabled": websocket_config.enabled
            }
        }
    }
