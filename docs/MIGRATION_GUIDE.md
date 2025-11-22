# SQLite → PostgreSQL Migration Guide

## Quick Switch Guide

### Option 1: Start Fresh with SQLite (Recommended for Now)

```powershell
# 1. Update .env
DATABASE_URL=sqlite:///./rollscape.db

# 2. Run migrations
cd backend
alembic upgrade head

# 3. Start developing!
uvicorn main:app --reload
```

**Benefits:** 
- ✅ Zero setup
- ✅ Fast tests  
- ✅ Easy reset (`Remove-Item rollscape.db`)
- ✅ Perfect for rapid prototyping

---

### Option 2: Use PostgreSQL from Start

```powershell
# 1. Start PostgreSQL with Docker
docker run -d `
  --name rollscape-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=rollscape `
  -p 5432:5432 `
  postgres:15-alpine

# 2. Your .env already has the right URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rollscape

# 3. Run migrations
cd backend
alembic upgrade head

# 4. Start developing
uvicorn main:app --reload
```

**Benefits:**
- ✅ Production-identical behavior
- ✅ Test JSONB features
- ✅ Practice PostgreSQL

---

## When to Switch: SQLite → PostgreSQL

### Timeline Recommendation

**Months 1-2: SQLite**
- Focus: Build features fast
- Database: `sqlite:///./rollscape.db`
- Cost: $0

**Months 3-4: Docker PostgreSQL**  
- Focus: Test production behavior
- Database: `postgresql://localhost:5432/rollscape`
- Cost: $0

**Launch: Managed PostgreSQL**
- Focus: Scale and monitor
- Database: Supabase/Railway/Neon
- Cost: $0-25/mo

---

## Migration Process

### Step 1: Export Data (if you have data to keep)

```powershell
# Export to JSON
python scripts/export_sqlite_data.py
```

**scripts/export_sqlite_data.py:**
```python
import json
from backend.database import SessionLocal
from backend.models import User, Campaign, Character

db = SessionLocal()

data = {
    'users': [
        {
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            # ... other fields
        }
        for u in db.query(User).all()
    ],
    'campaigns': [
        {
            'id': str(c.id),
            'name': c.name,
            'dm_user_id': str(c.dm_user_id),
            # ... other fields
        }
        for c in db.query(Campaign).all()
    ],
    'characters': [
        {
            'id': str(ch.id),
            'name': ch.name,
            'campaign_id': str(ch.campaign_id),
            'inventory': ch.inventory,  # JSONB data
            # ... other fields
        }
        for ch in db.query(Character).all()
    ],
}

with open('data_backup.json', 'w') as f:
    json.dump(data, f, indent=2, default=str)

print(f"✅ Exported {len(data['users'])} users, {len(data['campaigns'])} campaigns, {len(data['characters'])} characters")
```

### Step 2: Switch Database

```powershell
# 1. Stop backend
# Ctrl+C

# 2. Start PostgreSQL
docker run -d `
  --name rollscape-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=rollscape `
  -p 5432:5432 `
  postgres:15-alpine

# 3. Update .env
# Change: DATABASE_URL=sqlite:///./rollscape.db
# To:     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rollscape

# 4. Run migrations
alembic upgrade head
```

### Step 3: Import Data

```powershell
python scripts/import_to_postgres.py
```

**scripts/import_to_postgres.py:**
```python
import json
from backend.database import SessionLocal, engine
from backend.models import Base, User, Campaign, Character
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

# Load backup
with open('data_backup.json', 'r') as f:
    data = json.load(f)

db = SessionLocal()

try:
    # Import users
    for user_data in data['users']:
        user = User(
            id=uuid.UUID(user_data['id']),
            username=user_data['username'],
            email=user_data['email'],
            # ... other fields
        )
        db.add(user)
    
    # Import campaigns
    for campaign_data in data['campaigns']:
        campaign = Campaign(
            id=uuid.UUID(campaign_data['id']),
            name=campaign_data['name'],
            dm_user_id=uuid.UUID(campaign_data['dm_user_id']),
            # ... other fields
        )
        db.add(campaign)
    
    # Import characters
    for character_data in data['characters']:
        character = Character(
            id=uuid.UUID(character_data['id']),
            name=character_data['name'],
            campaign_id=uuid.UUID(character_data['campaign_id']),
            inventory=character_data['inventory'],  # JSONB!
            # ... other fields
        )
        db.add(character)
    
    db.commit()
    print(f"✅ Imported {len(data['users'])} users, {len(data['campaigns'])} campaigns, {len(data['characters'])} characters")

except Exception as e:
    db.rollback()
    print(f"❌ Import failed: {e}")
    raise

finally:
    db.close()
```

### Step 4: Verify

```powershell
# Start backend
uvicorn main:app --reload

# Test endpoints
curl http://localhost:8000/api/campaigns
curl http://localhost:8000/api/characters/campaign/{campaign_id}

# Check data
python scripts/verify_migration.py
```

**scripts/verify_migration.py:**
```python
from backend.database import SessionLocal
from backend.models import User, Campaign, Character

db = SessionLocal()

users = db.query(User).count()
campaigns = db.query(Campaign).count()
characters = db.query(Character).count()

print(f"📊 Database Statistics:")
print(f"  Users: {users}")
print(f"  Campaigns: {campaigns}")
print(f"  Characters: {characters}")

# Test JSONB
sample_char = db.query(Character).first()
if sample_char:
    print(f"\n🎭 Sample Character:")
    print(f"  Name: {sample_char.name}")
    print(f"  Inventory: {sample_char.inventory}")
    print(f"  Resources: {sample_char.resources}")
```

---

## Troubleshooting

### "No module named 'psycopg2'"

```powershell
pip install psycopg2-binary
```

### "Connection refused" (PostgreSQL)

```powershell
# Check if PostgreSQL is running
docker ps | Select-String rollscape-postgres

# Start if stopped
docker start rollscape-postgres

# Or create new container
docker run -d --name rollscape-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rollscape -p 5432:5432 postgres:15-alpine
```

### "Table already exists"

```powershell
# Drop all tables and recreate
alembic downgrade base
alembic upgrade head
```

### UUIDs not working

Make sure you're using the new `GUID` type:
```python
from backend.db_types import GUID
import uuid

id = Column(GUID(), primary_key=True, default=uuid.uuid4)
```

---

## Database Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Setup Time | 0 seconds | 2 minutes |
| Cost | Free | Free (Docker) |
| Performance (dev) | Fast | Fast |
| Concurrent Writes | Limited | Excellent |
| JSONB Operators | ❌ | ✅ |
| Production Ready | ❌ | ✅ |
| Easy Reset | ✅ | ⚠️ |
| Offline Work | ✅ | ❌ |
| Migration Path | Easy | N/A |

---

## Recommendation

```
┌──────────────────────────────────────────┐
│  Start with SQLite, switch later        │
│                                          │
│  ✅ Fast to start                        │
│  ✅ Easy to reset                        │
│  ✅ No Docker needed                     │
│  ✅ Works offline                        │
│  ✅ Migration is straightforward         │
│                                          │
│  Switch to PostgreSQL when:             │
│  • You have stable schema               │
│  • You need JSONB queries               │
│  • You're 1-2 months from launch        │
└──────────────────────────────────────────┘
```

**For RollScape right now:** Use SQLite. You're in Month 1, focus on features, not database perfection.
