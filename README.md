# 🎲 RollScape

**The AI-Native Virtual Tabletop for D&D**

RollScape is a next-generation virtual tabletop platform that combines traditional D&D gameplay with cutting-edge AI technology. Play solo with an AI Dungeon Master, run campaigns with AI players, or enhance your human-led games with intelligent assistance.

---

## 🌟 Key Features

### AI-Powered Gameplay
- **AI Dungeon Master** - Play solo anytime with a fully automated DM
- **AI Players** - Add intelligent party members to fill out your group
- **Natural Language Commands** - Chat your way through gameplay
- **Session Recap Generator** - Auto-generated summaries after each session
- **Smart Encounter Builder** - AI-suggested balanced encounters

### Virtual Tabletop
- **Dual Grid Support** - Square or hexagonal grids
- **Chat + Map Modes** - Pure chat or visual battle maps
- **Automatic Combat Management** - Turn tracking, initiative, ranges
- **Real-time Multiplayer** - Synchronized gameplay for remote parties
- **Dynamic Lighting & Fog of War** - Modern VTT features

### Content Generation
- **AI Map Generation** - Battle maps, dungeons, world maps on-demand
- **Character Art** - Generate portraits for PCs and NPCs
- **Item Visualization** - Artwork for magical items and artifacts

### Homebrew & Modularity
- **PDF Rulebook Import** - Use any D&D edition or RPG system
- **Custom Magic Systems** - Create mana pools, spell points, or unique mechanics
- **AI-Validated Homebrew** - Balance checking for custom rules
- **Modular Rule Systems** - Mix and match rules from different sources

### Social Features
- **Game Browser** - Find campaigns looking for players
- **Friend System** - Build your gaming network
- **Shared Campaign Journal** - Collaborative note-taking
- **Voice Synthesis** (Optional) - AI-generated NPC voices

### Campaign Management
- **Auto-Archiving** - Inactive campaigns preserved efficiently
- **Character Import** - Bring characters from D&D Beyond or Roll20
- **Voice-to-Text** - Accessibility and hands-free play
- **Multi-Edition Support** - D&D 3.5e, 5e, Pathfinder, and custom systems

---

## 🚀 Why RollScape?

**Problem**: Existing VTTs are complex, require hours of prep, and need a full group to play.

**Solution**: RollScape uses AI to eliminate prep time, enable solo play, and make D&D accessible to everyone.

### What Makes Us Different

| Feature | RollScape | Roll20 | D&D Beyond | Foundry VTT |
|---------|-----------|--------|------------|-------------|
| **AI DM** | ✅ Full | ❌ | ❌ | ❌ |
| **AI Players** | ✅ Unlimited* | ❌ | ❌ | ❌ |
| **Solo Play** | ✅ | ❌ | ❌ | ❌ |
| **Content Gen** | ✅ On-demand | ❌ | ❌ | ❌ |
| **Any Rule System** | ✅ PDF import | Limited | ❌ 5e only | ✅ |
| **Modern UI** | ✅ | ⚠️ Dated | ✅ | ✅ |

*Tier-dependent

---

## 💰 Pricing

### 🆓 Free Tier - "Adventurer"
- 1 campaign as player
- 1 solo AI DM campaign
- 2 AI players
- 10 AI images/month
- Perfect for trying out the platform

### 💎 Creator Tier - $7.99/month
- Unlimited campaigns
- 5 AI players
- 50 AI images/month
- PDF imports (3 books)
- Session recaps
- Character import

### 👑 Master Tier - $14.99/month
- **Unlimited everything**
- Voice synthesis
- API access
- Beta features
- Never auto-archive

**Save 20% with annual billing**

---

## 🏗️ Architecture

### Agent System (4 Agents)

1. **DM Agent** - Game master logic, rules enforcement, narrative generation
2. **Player Agent** - AI player behavior (multiple instances)
3. **Campaign Assistant Agent** - Interactive campaign creation guidance
4. **Creative Generator Agent** - Visual content generation

### Tech Stack

**Backend**:
- FastAPI (Python)
- PostgreSQL (Supabase)
- Redis (caching & sessions)
- Pinecone (vector DB for rules)

**AI/ML**:
- LangChain + LangGraph
- OpenAI GPT-4 Turbo (DM/Assistant)
- GPT-4o-mini (Players)
- DALL-E 3 (images)

**Frontend**:
- Next.js 14 (React + TypeScript)
- shadcn/ui + Tailwind CSS
- Socket.io (real-time)
- Konva.js (battle maps)

---

## 📂 Project Structure

```
RollScape/
├── backend/              # FastAPI backend
│   ├── agents/          # AI agent implementations
│   ├── api/             # REST API endpoints
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── frontend/            # Next.js frontend
│   ├── components/      # React components
│   ├── pages/           # Next.js pages
│   ├── lib/             # Utilities
│   └── styles/          # CSS/Tailwind
├── docs/                # Documentation
├── tests/               # Test suites
└── infrastructure/      # Docker, K8s, etc.
```

---

## 🛠️ Development Roadmap

### Phase 1: MVP (Months 1-4)
- [ ] Authentication & user management
- [ ] Basic DM Agent
- [ ] Character creation (D&D 5e)
- [ ] Chat-only gameplay
- [ ] Dice rolling system
- [ ] Campaign persistence
- [ ] Free tier subscription

### Phase 2: Core Features (Months 5-7)
- [ ] Battle map renderer
- [ ] Creative Generator Agent
- [ ] Session recap AI
- [ ] Voice-to-text
- [ ] Character import
- [ ] Paid tiers implementation

### Phase 3: Multiplayer (Months 8-9)
- [ ] Real-time synchronization
- [ ] Game browser
- [ ] Social features
- [ ] Shared journal

### Phase 4: Homebrew (Months 10-12)
- [ ] Campaign Assistant Agent
- [ ] PDF import pipeline
- [ ] Custom rule systems
- [ ] AI balance validation

### Phase 5: Polish (Ongoing)
- [ ] Hexagonal grids
- [ ] Voice synthesis
- [ ] Mobile app
- [ ] API access

---

## 🎯 Target Metrics (Year 1)

- **10,000+ total users**
- **12-15% paid conversion rate**
- **<5% monthly churn**
- **LTV:CAC ratio > 3:1**
- **20%+ profit margin**

---

## 🤝 Contributing

We're not accepting external contributions yet, but we'll open source parts of the platform in the future!

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Links

- **Website**: Coming soon
- **Discord**: Coming soon
- **Twitter**: Coming soon
- **Documentation**: See `/docs` folder

---

## 📧 Contact

For inquiries: [Contact information to be added]

---

**Built with ❤️ for the D&D community**

*RollScape - The DM that never cancels*
