"""
Configuration settings for RollScape backend.
Loads environment variables and provides type-safe config.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    environment: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    
    # Mock Mode - Set to True for free development without API costs
    mock_mode: bool = True
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/rollscape"
    redis_url: str = "redis://localhost:6379/0"
    
    # OpenAI (optional for now)
    openai_api_key: str | None = None
    openai_enabled: bool = True
    
    # Supabase (optional for now)
    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_enabled: bool = True
    
    # Stripe Payment (optional for now)
    stripe_api_key: str | None = None
    stripe_publishable_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_basic_monthly: str | None = None
    stripe_price_basic_yearly: str | None = None
    stripe_price_premium_monthly: str | None = None
    stripe_price_premium_yearly: str | None = None
    stripe_price_ultimate_monthly: str | None = None
    stripe_price_ultimate_yearly: str | None = None
    
    # Service Toggles
    redis_enabled: bool = True
    websocket_enabled: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env file
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
