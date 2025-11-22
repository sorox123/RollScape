"""
Database-agnostic type definitions for cross-compatibility.
Supports both SQLite (development) and PostgreSQL (production).
"""

from sqlalchemy import types, String, JSON
from sqlalchemy.dialects.postgresql import JSONB
import uuid


class GUID(types.TypeDecorator):
    """
    Cross-platform UUID type.
    
    Stores UUIDs as strings in SQLite, native UUID in PostgreSQL.
    Returns Python uuid.UUID objects in both cases.
    
    Usage:
        id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    """
    impl = String(36)
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))
    
    def process_bind_param(self, value, dialect):
        """Convert UUID to appropriate format for storage"""
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            if dialect.name == 'postgresql':
                return value  # PostgreSQL handles UUID objects
            return str(value)  # SQLite needs string
        # If it's already a string, ensure it's valid
        try:
            uuid.UUID(value)
            return value
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid UUID: {value}")
    
    def process_result_value(self, value, dialect):
        """Convert stored value back to Python UUID"""
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(value)
        except (ValueError, AttributeError):
            return None


class FlexJSON(types.TypeDecorator):
    """
    Cross-platform JSON type.
    
    Uses JSONB in PostgreSQL (better performance, indexing)
    Uses JSON in SQLite (native since 3.38+)
    
    Usage:
        resources = Column(FlexJSON, default=dict)
        inventory = Column(FlexJSON, default=list)
    """
    impl = JSON
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(JSON())
    
    def process_bind_param(self, value, dialect):
        """Ensure value is JSON-serializable"""
        if value is None:
            return None
        return value
    
    def process_result_value(self, value, dialect):
        """Return parsed JSON"""
        if value is None:
            return None
        return value


# Convenience type aliases
UUID_TYPE = GUID
JSON_TYPE = FlexJSON


# Example usage in models:
"""
from backend.db_types import GUID, FlexJSON
import uuid

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"))
    
    # Flexible data
    resources = Column(FlexJSON, default=dict)
    inventory = Column(FlexJSON, default=list)
    
    # Will work in both SQLite and PostgreSQL!
"""
