# RollScape Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
Copy-Item .env.example .env

# The .env file is already configured for FREE mock mode!
# MOCK_MODE=true means NO API COSTS

# Run the backend
uvicorn main:app --reload
```

Backend will start at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 2. Frontend Setup

```powershell
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env.local

# Run the frontend
npm run dev
```

Frontend will start at: http://localhost:3000

### 3. Test It Out!

Open http://localhost:8000/docs in your browser and try:

1. Click on `/api/dm/test` - Should show "Mock Mode" active
2. Try `/api/dm/start-campaign` with:
   ```json
   {
     "campaign_name": "Test Adventure",
     "setting": "fantasy",
     "personality": "storytelling"
   }
   ```
3. You'll get a full narrative response - **completely free!**

---

## ✅ What Works NOW (Mock Mode)

### Free Features (No API costs):
- ✅ DM narrative generation
- ✅ NPC descriptions
- ✅ Combat encounters
- ✅ Campaign openings
- ✅ Conversation history
- ✅ All game logic (dice, combat, turns)
- ✅ Character creation
- ✅ Image placeholders

### What You Can Build:
- Complete character creation flow
- Campaign management
- Game sessions with chat
- Turn-based combat
- Dice rolling
- All UI components
- Database operations
- API endpoints

**COST: $0.00** 💰

---

## 🔧 Database Setup

### Option 1: SQLite (Easiest)

Edit your `.env`:
```env
DATABASE_URL=sqlite:///./rollscape.db
```

Then run:
```powershell
# Create database tables
alembic upgrade head
```

### Option 2: PostgreSQL (Recommended)

1. Install PostgreSQL or use Docker:
```powershell
docker run -d `
  --name rollscape-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=rollscape `
  -p 5432:5432 `
  postgres:15
```

2. Your `.env` is already configured:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rollscape
```

3. Run migrations:
```powershell
alembic upgrade head
```

---

## 📝 Development Workflow

### Daily Development (Free):

1. **Start Backend:**
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Build Features** - Everything works with mock data!

4. **Test Endpoints** - Use http://localhost:8000/docs

### When MOCK_MODE=true:
- ✅ All AI responses are pre-written (free)
- ✅ Images use placeholders (free)
- ✅ Redis uses in-memory storage (free)
- ✅ No external API calls
- ✅ Perfect for development

---

## 🎯 Next Steps

### Phase 1: Core Features (This Week)
- [ ] Test all API endpoints with mock data
- [ ] Complete character creation UI
- [ ] Build campaign list/detail pages
- [ ] Implement game session page
- [ ] Add dice roller component
- [ ] Create battle map renderer (basic)

### Phase 2: Database (Next Week)
- [ ] Create all database models
- [ ] Write migration scripts
- [ ] Test CRUD operations
- [ ] Add data validation

### Phase 3: Game Logic (Week 3-4)
- [ ] Combat system
- [ ] Turn management
- [ ] Initiative tracking
- [ ] HP/damage calculations
- [ ] Buff/debuff system

### Phase 4: Polish (Week 5-6)
- [ ] UI improvements
- [ ] Error handling
- [ ] Testing
- [ ] Documentation

**Timeline: 6-8 weeks of FREE development**

---

## 🚫 When NOT to Enable Production Mode

Don't set MOCK_MODE=false until:
- [ ] All features work with mock data
- [ ] No critical bugs
- [ ] Database is fully tested
- [ ] UI is polished
- [ ] You have beta testers ready
- [ ] Cost monitoring is implemented
- [ ] Usage quotas are enforced
- [ ] You're ready to spend $50-200/month

---

## 💰 Cost Comparison

### Development Mode (MOCK_MODE=true):
- **Monthly Cost: $0**
- Features: 100%
- AI Quality: Good enough for testing
- Duration: Unlimited

### Production Mode (MOCK_MODE=false):
- **Monthly Cost: $200-500** (100 users)
- Features: 100%
- AI Quality: Excellent (GPT-4)
- Duration: Pay as you go

**Recommendation: Stay in mock mode for 2-3 months!**

---

## 🆘 Troubleshooting

### Backend won't start:
```powershell
# Check Python version (need 3.11+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if port 8000 is in use
netstat -ano | findstr :8000
```

### Frontend won't start:
```powershell
# Clear node modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install

# Try different port
npm run dev -- -p 3001
```

### "OpenAI API key not configured":
This is fine! You're in MOCK_MODE. The warning appears but doesn't affect functionality.

### Database connection error:
```powershell
# Use SQLite instead
# Edit .env:
DATABASE_URL=sqlite:///./rollscape.db
```

---

## 📚 Resources

- **API Documentation:** http://localhost:8000/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Next.js Docs:** https://nextjs.org/docs
- **SQLAlchemy:** https://docs.sqlalchemy.org

---

## ✨ Pro Tips

1. **Use Mock Mode for Everything First**
   - Build all features
   - Test thoroughly
   - Only enable production when launching

2. **Test with Real Data Locally**
   - Create realistic test characters
   - Run through full game sessions
   - Test edge cases

3. **Monitor Your Changes**
   ```powershell
   # Watch for errors
   git status
   git diff
   ```

4. **Keep Costs in Mind**
   - Implement usage quotas NOW
   - Add rate limiting NOW
   - Build cost monitoring dashboard NOW
   - Even though it's free, practice good habits

5. **Document As You Go**
   - Comment your code
   - Update API docs
   - Keep notes on design decisions

---

## 🎉 Success Criteria

You're ready to switch to production when:

✅ All features work perfectly in mock mode
✅ Database performs well with test data
✅ UI is polished and user-friendly
✅ No console errors or warnings
✅ Tests pass (if written)
✅ Documentation is complete
✅ You've tested with 5-10 beta users
✅ Cost monitoring is implemented
✅ You have a budget for API costs

**Until then: KEEP MOCK_MODE=true!**

---

**Happy coding! 🎲 You can build 80% of RollScape without spending a penny!**
