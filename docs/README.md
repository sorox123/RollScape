# RollScape Documentation

Comprehensive documentation for the RollScape project, covering everything from getting started to deployment.

---

## 📚 Documentation Index

### 🚀 Getting Started
- **[Getting Started Guide](GETTING_STARTED.md)** - Complete onboarding for new users
  - Installation & setup
  - Creating your first character
  - Importing characters from PDF
  - Starting your first session
  - Using the dice roller
  - Generating AI art

### 📡 API Documentation
- **[API Reference](api/API_REFERENCE.md)** - Complete REST API documentation
  - Authentication endpoints
  - Character management
  - Campaign system
  - Dice rolling
  - DM Agent API
  - Player Agent API
  - AI image generation
  - PDF import
  - Messaging & social features
  - Error handling & rate limiting

### 🚀 Deployment
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
  - Backend deployment (Railway, Render, Fly.io)
  - Frontend deployment (Vercel, Netlify)
  - Database setup (Supabase, Neon)
  - Environment variables
  - Domain & SSL configuration
  - Monitoring & logging
  - Scaling considerations

### 🎨 Features
- **[Frontend Polish Summary](FRONTEND_POLISH_SUMMARY.md)** - UX improvements documentation
  - Toast notification system
  - Confirmation dialogs
  - Loading states & skeletons
  - Error boundaries
  - Form components
  - Animations

### 🏗️ Architecture & Design
- **[Design Documentation](design/)** - Technical specifications
  - Agent architecture overview
  - DM Agent specification
  - Player Agent specification
  - Campaign Assistant Agent
  - Creative Generator Agent
  - Feature requirements (100+)
  - Homebrew modularity system
  - Technology stack
  - Database schema
  - Agent communication & orchestration
  - Competitive analysis
  - Pricing strategy

---

## 🎯 Quick Reference

### Current Status (MVP)
- ✅ **Backend**: 100% test coverage (35/35 tests passing)
- ✅ **Frontend**: 100% TypeScript, modern UX
- ✅ **AI Features**: DM agent, player agents, image generation
- ✅ **Character Management**: Creation, import from PDF
- ✅ **Campaign System**: Public/private campaigns
- ✅ **Social Features**: Friends, messaging
- ✅ **Subscription Tiers**: Free, Creator ($7.99), Master ($14.99)

### Technology Stack

**Backend**:
- Python 3.11+
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Redis (caching)
- OpenAI API (GPT-4, DALL-E 3)
- LangChain (AI agent framework)
- Alembic (database migrations)

**Frontend**:
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (utility-first CSS)
- shadcn/ui (component library)
- Lucide Icons (icon system)
- Socket.io (real-time communication)

**Infrastructure**:
- Vercel (frontend hosting)
- Railway (backend hosting)
- Supabase (PostgreSQL + storage)
- Upstash (Redis)

### Pricing Tiers

| Tier | Price | Campaigns | AI Players | AI Images |
|------|-------|-----------|------------|-----------|
| **Free** | $0 | 2 | 2 | 10/month |
| **Creator** | $7.99/mo | Unlimited | 5 | 50/month |
| **Master** | $14.99/mo | Unlimited | Unlimited | Unlimited |

### API Endpoints Overview

- **Authentication**: Register, login, user profile
- **Characters**: CRUD operations, import from PDF
- **Campaigns**: Create, join, manage
- **Game Sessions**: Start, end, track history
- **Dice Rolling**: Advanced notation support
- **DM Agent**: Chat with AI DM, get suggestions
- **Player Agent**: Create AI players, get actions, voting
- **AI Images**: Character art, maps, tokens
- **Social**: Friends, messaging, conversations
- **Subscriptions**: Manage tiers, quotas

---

## 📖 Documentation by Role

### For Players
1. Start with **[Getting Started Guide](GETTING_STARTED.md)**
2. Learn about features in **[Frontend Polish Summary](FRONTEND_POLISH_SUMMARY.md)**
3. Reference **[API docs](api/API_REFERENCE.md)** for advanced usage

### For Developers
1. Read **[Technology Stack](design/08-Technology-Stack.md)**
2. Review **[Database Schema](design/09-Database-Schema.md)**
3. Study **[Agent Architecture](design/01-Agent-Architecture-Overview.md)**
4. Check **[API Reference](api/API_REFERENCE.md)**
5. Follow **[Deployment Guide](DEPLOYMENT_GUIDE.md)** for production

### For DMs
1. **[Getting Started Guide](GETTING_STARTED.md)** - Section on creating campaigns
2. **[DM Agent Specification](design/02-DM-Agent-Specification.md)** - How AI DM works
3. **[API Reference](api/API_REFERENCE.md)** - DM Agent endpoints

### For Designers
1. **[Frontend Polish Summary](FRONTEND_POLISH_SUMMARY.md)** - Current UX patterns
2. **[Feature Requirements](design/06-Feature-Requirements-Complete.md)** - Planned features
3. **[Competitive Analysis](design/11-Competitive-Analysis.md)** - Market landscape

---

## 🛠️ Development Phases

### ✅ Phase 1: MVP (Complete)
- Authentication & user management
- AI DM Agent (chat-based gameplay)
- AI Player Agent (with voting system)
- Character creation & management
- PDF character import
- Advanced dice rolling system
- Campaign system (create, join, manage)
- Social features (friends, messaging)
- AI image generation (DALL-E 3)
- Subscription tiers & quotas
- Modern UX (toasts, loading, errors)

### 🚧 Phase 2: Core Features (In Progress)
- Battle map renderer (Konva.js)
- Combat management system
- Inventory system
- Session recap AI
- Voice-to-text integration
- Stripe payment integration

### ⏳ Phase 3: Multiplayer (Planned)
- Real-time synchronization (WebSockets)
- Game browser & matchmaking
- Shared campaign journal
- Voice chat integration

### ⏳ Phase 4: Homebrew (Planned)
- Campaign Assistant Agent
- Custom rule systems
- AI balance validation
- Multi-edition support (3.5e, Pathfinder)

### ⏳ Phase 5: Polish (Ongoing)
- Hexagonal grids
- Voice synthesis for NPCs
- Mobile app (React Native)
- Public API access

---

## 📝 Contributing to Documentation

We welcome documentation feedback! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Reporting Issues

Found a typo, error, or gap in documentation?

1. Open a GitHub issue
2. Label it as `documentation`
3. Describe the problem clearly
4. Suggest a fix if possible

### Documentation Style

When writing documentation:

- **Use clear, concise language**
- **Include code examples** where relevant
- **Add screenshots** for UI features
- **Keep it up-to-date** with code changes
- **Use proper Markdown formatting**
- **Add table of contents** for long docs

---

## 🔗 External Resources

### Learning
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Docs](https://python.langchain.com/)
- [OpenAI API Guide](https://platform.openai.com/docs)

### Tools
- **API Testing**: http://localhost:8000/docs (Swagger UI)
- **Database**: Supabase Dashboard
- **Monitoring**: Sentry.io
- **Analytics**: Vercel Analytics

### Community
- **GitHub**: https://github.com/sorox123/RollScape
- **Discord**: Coming soon
- **Twitter**: Coming soon

---

## 📧 Questions?

If documentation is unclear or you need help:

1. Check existing documentation in `/docs`
2. Review **[Getting Started Guide](GETTING_STARTED.md)**
3. Check **[API Reference](api/API_REFERENCE.md)**
4. Open a GitHub issue
5. Contact maintainers (coming soon)

---

## 🏆 Documentation Milestones

- ✅ **Design Phase**: 13 comprehensive design documents
- ✅ **API Documentation**: Complete REST API reference (70+ endpoints)
- ✅ **Getting Started**: User onboarding guide with examples
- ✅ **Deployment**: Production deployment guide (3 hosting options)
- ✅ **Frontend Polish**: UX documentation with code examples
- ⏳ **Video Tutorials**: Planned
- ⏳ **Interactive Demos**: Planned

---

**Documentation Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Complete for MVP ✅

**Built with ❤️ for the D&D community**
