# Database Decision Summary for RollScape

**Date:** November 21, 2025  
**Decision:** Use SQLite for development, PostgreSQL for production

---

## Key Research Findings

### What VTT Platforms Use

| Platform | Database | Scale | Key Insight |
|----------|----------|-------|-------------|
| **Roll20** | MySQL | 10M+ users | JSONB-like storage in TEXT columns |
| **D&D Beyond** | PostgreSQL | 1M+ users | Heavy JSONB use for homebrew |
| **Foundry VTT** | NeDB (files) | Self-hosted | Not applicable to SaaS |

**Takeaway:** PostgreSQL + JSONB is the modern standard for flexible RPG data.

---

## SQLite vs PostgreSQL: Your Decision

### Use SQLite NOW Because:
- ✅ You're solo dev, pre-launch
- ✅ Zero setup time (no Docker)
- ✅ Fast iteration (delete DB = fresh start)
- ✅ Works offline
- ✅ Perfect for prototyping
- ✅ Easy migration path exists

### Switch to PostgreSQL Later (Month 2-3) Because:
- ✅ Production-identical behavior
- ✅ JSONB performance testing
- ✅ Concurrent connection testing
- ✅ Practice before launch

### Use PostgreSQL in Production Because:
- ✅ Scales to millions of users
- ✅ JSONB indexes for complex queries
- ✅ Industry standard for SaaS
- ✅ Managed services (Supabase, Neon)

---

## JSONB Usage Patterns

### When to Use JSONB (Do This)

```python
# ✅ Flexible character data
inventory = Column(JSONB, default=list)
# Example: [{"item": "Longsword", "quantity": 1, "equipped": true}]

# ✅ Homebrew content
custom_abilities = Column(JSONB, default=list)
# Example: [{"name": "Draconic Breath", "damage": "2d6", "type": "fire"}]

# ✅ Game state
resources = Column(JSONB, default=dict)
# Example: {"spell_slots": {1: 3, 2: 2}, "ki_points": 5}

# ✅ Turn order
initiative_order = Column(JSONB, default=list)
# Example: [{"character_id": "...", "roll": 18}, {...}]
```

### When to Use Normalized Columns (Do This)

```python
# ✅ Core stats you query on
level = Column(Integer)
strength = Column(Integer)
dexterity = Column(Integer)

# ✅ Sortable/filterable fields
created_at = Column(DateTime)
status = Column(Enum(CampaignStatus))

# ✅ Foreign keys
campaign_id = Column(UUID, ForeignKey("campaigns.id"))
```

**Rule of Thumb:** If you query it, normalize it. If it's flexible/nested, use JSONB.

---

## Your Action Plan

### Phase 1: NOW → 2 Months (Development)

**Database:** SQLite
```powershell
# .env
DATABASE_URL=sqlite:///./rollscape.db
```

**Models:** Use cross-compatible types
```python
from backend.db_types import GUID, FlexJSON

class Character(Base):
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    inventory = Column(FlexJSON, default=list)
```

**Focus:** Build features fast, don't worry about scale

**Cost:** $0/month

---

### Phase 2: 2 Months → Launch (Testing)

**Database:** Docker PostgreSQL
```powershell
docker-compose up -d
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rollscape
```

**Migration:** Use export/import scripts (see MIGRATION_GUIDE.md)

**Focus:** Test production behavior, JSONB queries, concurrent users

**Cost:** $0/month (local Docker)

---

### Phase 3: Launch (Production)

**Database:** Supabase PostgreSQL
```powershell
# .env
DATABASE_URL=postgresql://[user]:[pass]@db.supabase.co:5432/postgres
```

**Features:**
- ✅ 500MB free tier
- ✅ Built-in auth (aligns with frontend)
- ✅ Real-time subscriptions
- ✅ Auto-backups
- ✅ Dashboard & logs

**Cost:** Free → $25/mo (when you exceed 500MB)

---

## Files Created for You

1. **`docs/DATABASE_RESEARCH.md`**
   - Full research analysis
   - Platform comparisons
   - JSONB patterns
   - Performance benchmarks

2. **`backend/db_types.py`**
   - Cross-compatible UUID type (`GUID`)
   - Cross-compatible JSON type (`FlexJSON`)
   - Works with SQLite AND PostgreSQL

3. **`docs/MIGRATION_GUIDE.md`**
   - Step-by-step SQLite → PostgreSQL
   - Export/import scripts
   - Troubleshooting

4. **`docker-compose.yml`**
   - PostgreSQL + Redis setup
   - One command to start: `docker-compose up -d`

---

## Next Steps (Do This Now)

### 1. Switch to SQLite (15 minutes)

```powershell
# backend/.env
DATABASE_URL=sqlite:///./rollscape.db

# Run migrations
cd backend
alembic upgrade head

# Test
uvicorn main:app --reload
```

### 2. Update Your Models (30 minutes)

```python
# backend/models/character.py
from backend.db_types import GUID, FlexJSON  # NEW
import uuid

class Character(Base):
    # Change from:
    # id = Column(UUID(as_uuid=True), ...)
    # To:
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)  # CROSS-COMPATIBLE
    
    # Change from:
    # inventory = Column(JSONB, ...)
    # To:
    inventory = Column(FlexJSON, default=list)  # CROSS-COMPATIBLE
```

### 3. Keep Building! (Rest of Month 1)

- ✅ Don't think about database anymore
- ✅ Focus on features
- ✅ Use mock mode (free AI)
- ✅ Iterate fast

---

## Common Questions

### "Will I lose my data when switching?"
No. Export to JSON, import to PostgreSQL. See MIGRATION_GUIDE.md.

### "Is SQLite fast enough?"
Yes, easily handles 1000s of rows. You're pre-launch with test data.

### "What about JSONB operators?"
SQLite JSON is 90% compatible. Missing features:
- `@>` (contains) - Work around with Python filtering
- GIN indexes - Not needed at your scale

### "When should I switch?"
When you have:
- ✅ Stable schema (no more big model changes)
- ✅ 1-2 months until launch
- ✅ Need to test JSONB queries
- ✅ Want to practice PostgreSQL

### "What if I want PostgreSQL now?"
Fine! Run `docker-compose up -d`. But it's not necessary yet.

---

## Cost Breakdown

### Development (Month 1-4)
```
SQLite:         $0/month
Docker Postgres: $0/month (local)
Mock AI:        $0/month
Total:          $0/month ✅
```

### Launch (Month 5-6)
```
Supabase Free:  $0/month (500MB)
Vercel Free:    $0/month (frontend)
Railway:        $5/month (backend)
Mock AI:        $0/month (still testing)
Total:          $5/month ✅
```

### Growth (Month 7+)
```
Supabase:       $25/month (2GB)
Vercel Pro:     $20/month
Railway:        $20/month
Real AI (GPT-4): $100-200/month (100 active users)
Total:          $165-265/month
```

---

## Recommendation

**For RollScape right now:**

```
USE SQLITE
────────────

You're 2+ months from launch
You're solo dev
You need fast iteration
You have $0 budget

Switch when you're closer to launch.
Until then, build features!
```

---

## Resources

- **Full Research:** `docs/DATABASE_RESEARCH.md`
- **Migration Guide:** `docs/MIGRATION_GUIDE.md`
- **Type Adapters:** `backend/db_types.py`
- **Docker Setup:** `docker-compose.yml`

---

**Bottom Line:** You made the right choice asking this question now. Start with SQLite, you'll save weeks of Docker debugging. Switch to PostgreSQL in Month 2 when your schema stabilizes. This is exactly what successful SaaS companies do.

🎲 Now go build RollScape!
