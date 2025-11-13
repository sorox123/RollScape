# RollScape Documentation

This directory contains comprehensive documentation for the RollScape project.

## Directory Structure

- **`design/`** - Complete technical specifications and architecture documents
- **`api/`** - API endpoint documentation (to be added)

## Design Documentation

The `/design` folder contains the complete planning and architecture documents created during the design phase:

1. **01-Agent-Architecture-Overview.md** - Executive summary of the 4-agent system
2. **02-DM-Agent-Specification.md** - Dungeon Master AI technical specification
3. **03-Player-Agent-Specification.md** - AI Player agent specification
4. **04-Campaign-Assistant-Agent-Specification.md** - Campaign creation assistant
5. **05-Creative-Generator-Agent-Specification.md** - Visual content generation
6. **06-Feature-Requirements-Complete.md** - Complete feature list (100+ features)
7. **07-Homebrew-Modularity-System.md** - Custom rules and PDF import system
8. **08-Technology-Stack.md** - Complete tech stack recommendations
9. **09-Database-Schema.md** - PostgreSQL schema with all tables
10. **10-Agent-Communication-Orchestration.md** - Message bus and orchestration patterns
11. **11-Competitive-Analysis.md** - Market research and competitor comparison
12. **12-Pricing-Strategy-Archiving.md** - Monetization and campaign archiving system
13. **README.md** - Design documentation index

## Quick Reference

### Cost Estimates
- **Per Session**: ~$6 for 4 hours (AI API costs)
- **Pricing Tiers**: Free / $7.99 / $14.99 per month

### Key Technologies
- **Backend**: Python + FastAPI, LangChain/LangGraph
- **Frontend**: Next.js 14 + TypeScript
- **Database**: PostgreSQL (Supabase), Redis, Pinecone
- **AI**: OpenAI GPT-4 Turbo, GPT-4o-mini, DALL-E 3

### Development Phases
1. **MVP** (Months 1-4): Auth, basic DM agent, character creation, chat gameplay
2. **Core Features** (Months 5-7): Battle maps, content generation, voice-to-text
3. **Multiplayer** (Months 8-9): Real-time sync, social features
4. **Homebrew** (Months 10-12): PDF import, custom rules
5. **Polish** (Ongoing): Hex grids, voice synthesis, mobile

## Contributing to Documentation

When adding new documentation:

1. Place API docs in `/api`
2. Keep design docs in `/design`
3. Use clear Markdown formatting
4. Include code examples where relevant
5. Update this README's table of contents

## For Developers

Before starting implementation, read these documents in order:

1. Agent Architecture Overview
2. Technology Stack
3. Database Schema
4. Feature Requirements
5. Relevant agent specification for your work

## Questions?

If documentation is unclear or missing information, please open an issue or contact the team.
