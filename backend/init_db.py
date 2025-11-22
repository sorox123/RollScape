"""
Initialize SQLite database for development.
Creates all tables from models without migrations.
"""

from database import Base, engine
from models import *  # Import all models

def init_db():
    """Create all tables"""
    print("Creating database tables...")
    
    # Drop all tables (for fresh start)
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database initialized successfully!")
    print(f"   Tables created: {len(Base.metadata.tables)}")
    for table_name in Base.metadata.tables.keys():
        print(f"      - {table_name}")

if __name__ == "__main__":
    init_db()
