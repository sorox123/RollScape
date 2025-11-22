# 🎮 RollScape Quick Reference

## 🚀 Quick Start Commands

```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload

# Frontend  
cd frontend
npm run dev

# Test Mock Services
cd backend
python test_mock_services.py

# Test DM Agent
python test_dm.py
```

---

## 🔗 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Backend** | http://localhost:8000 | API Server |
| **API Docs** | http://localhost:8000/docs | Interactive API |
| **Frontend** | http://localhost:3000 | Web App |
| **Health Check** | http://localhost:8000/api/status/health | Status |
| **Mode Info** | http://localhost:8000/api/status/mode | Check if mock mode |

---

## 📍 Key API Endpoints

### Status & Health
- `GET /api/status/` - Full system status
- `GET /api/status/health` - Health check
- `GET /api/status/mode` - Current mode (mock/prod)
- `GET /api/status/costs` - Usage and costs

### DM Agent
- `GET /api/dm/test` - Test DM availability
- `POST /api/dm/respond` - Get DM response
- `POST /api/dm/start-campaign` - Start new campaign
- `POST /api/dm/generate-npc` - Create NPC
- `POST /api/dm/generate-encounter` - Create encounter
- `GET /api/dm/history` - Get conversation history
- `GET /api/dm/stats` - Get usage stats

### Characters
- `GET /api/characters` - List characters
- `POST /api/characters` - Create character
- `GET /api/characters/{id}` - Get character
- `PUT /api/characters/{id}` - Update character

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/{id}` - Get campaign

---

## 🎯 Current Mode Check

```powershell
# Quick check if you're in mock mode (free)
curl http://localhost:8000/api/status/mode
```

Should return:
```json
{
  "current_mode": "development",
  "mock_mode": true,
  "cost_warning": "No costs - using mock services"
}
```

✅ **mock_mode: true** = FREE ✅
❌ **mock_mode: false** = COSTS MONEY ❌

---

## 💰 Cost Summary

### Mock Mode (MOCK_MODE=true):
- **AI Calls:** FREE
- **Image Generation:** FREE
- **Cache/Redis:** FREE
- **Total:** $0.00

### Production Mode (MOCK_MODE=false):
- **GPT-4 Turbo:** ~$0.01 per call
- **DALL-E 3:** ~$0.04 per image
- **Monthly:** $200-500 (100 users)

---

## 🗂️ Project Structure

```
RollScape/
├── backend/
│   ├── agents/              # AI agents (DM, Player)
│   ├── api/                 # API endpoints
│   ├── models/              # Database models (TO DO)
│   ├── services/            # Services & mocks ✅
│   │   ├── mock_openai_service.py ✅
│   │   ├── mock_dalle_service.py ✅
│   │   ├── mock_redis_service.py ✅
│   │   └── service_factory.py ✅
│   ├── main.py              # App entry
│   ├── config.py            # Config ✅
│   └── .env                 # Environment ✅
│
├── frontend/
│   ├── app/                 # Pages
│   ├── components/          # React components
│   └── lib/                 # Utilities
│
└── docs/
    └── design/              # Technical specs
```

---

## 🛠️ Development Workflow

### Daily Routine:
1. Pull latest changes: `git pull`
2. Start backend: `uvicorn main:app --reload`
3. Start frontend: `npm run dev`
4. Code features
5. Test with mock data
6. Commit: `git add . && git commit -m "..."`

### Before Committing:
```powershell
# Check status
git status

# Test mock services
python test_mock_services.py

# Check mode (should be mock)
curl http://localhost:8000/api/status/mode
```

---

## 📝 What to Build Next

### Priority 1: Database (This Week)
```
backend/models/
  user.py
  character.py  
  campaign.py
  session.py
```

### Priority 2: Frontend (Next Week)
```
frontend/app/
  dashboard/page.tsx
  campaigns/[id]/page.tsx
  session/[id]/page.tsx
```

### Priority 3: Components (Week 3)
```
frontend/components/
  battle-map/BattleGrid.tsx
  game-session/ChatInterface.tsx
  character/CharacterSheet.tsx
```

---

## 🔑 Environment Variables

### Required (Already Set):
```env
MOCK_MODE=true              # Keep this!
DATABASE_URL=...            # Your DB
CORS_ORIGINS=...            # Frontend URL
```

### Optional (Don't set yet):
```env
# OPENAI_API_KEY=...        # Wait!
# SUPABASE_URL=...          # Wait!
# STRIPE_SECRET_KEY=...     # Wait!
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Python 3.11+, reinstall deps |
| 404 on API | Check prefix: `/api/...` |
| CORS error | Check CORS_ORIGINS in .env |
| Mock services not working | Run `python test_mock_services.py` |
| "OpenAI key not configured" | Ignore in mock mode! |

---

## ✅ Pre-Launch Checklist

Before switching to production mode:

- [ ] All features work with mock data
- [ ] Database fully implemented
- [ ] UI polished and tested
- [ ] No console errors
- [ ] Cost monitoring implemented
- [ ] Usage quotas in place
- [ ] Campaign archiving works
- [ ] Beta tested with 5-10 users
- [ ] Ready to pay $200-500/month
- [ ] Budget approved

---

## 📚 Quick Links

- **Full Setup:** [SETUP.md](SETUP.md)
- **Next Steps:** [NEXT_STEPS.md](NEXT_STEPS.md)
- **Roadmap:** [README.md](README.md)
- **Database Schema:** [docs/design/09-Database-Schema.md](docs/design/09-Database-Schema.md)
- **Tech Stack:** [docs/design/08-Technology-Stack.md](docs/design/08-Technology-Stack.md)

---

## 🎉 Remember

✅ **MOCK_MODE=true** = Build features for FREE
✅ Stay in mock mode for 2-3 months
✅ Test everything thoroughly
✅ Only enable production when launching

**You can build 80% of RollScape without spending a penny!**

---

Last Updated: November 21, 2025
