# D&D App - Agent Architecture Overview

## Executive Summary

This document outlines the minimum viable agent architecture for a comprehensive D&D application with AI integration, homebrew support, and full multiplayer capabilities.

## Minimum Agent Count: 4 Agents

### Agent List

1. **DM Agent** - Core game master logic and rules adjudication
2. **Player Agent** - AI player character behavior (scalable instances)
3. **Campaign Assistant Agent** - Interactive campaign creation guidance
4. **Creative Generator Agent** - Multi-modal content generation (maps, characters, items)

## Why Only 4 Agents?

- **Clear Separation of Concerns**: Each agent has distinct, non-overlapping responsibilities
- **Cost-Effective**: Only activates AI when reasoning is needed
- **Scalable**: Player agents can be instantiated per AI player
- **Maintainable**: Clear boundaries make debugging easier
- **Efficient**: Traditional code handles mechanics, agents handle intelligence

## What Doesn't Need Agents

- **Social/Matchmaking**: Database queries and API calls
- **Character Sheet Management**: Form validation and CRUD operations
- **Story Persistence**: Database operations
- **UI Interactions**: Frontend logic
- **Rule Calculations**: Deterministic math
- **Grid Systems**: Geometry calculations
- **Buff/Debuff Tracking**: State management

## Cost Estimates

**Per 4-Hour Game Session (4 players, 1 AI DM, 2 AI players):**
- DM Agent: ~150 calls × $0.03 = **$4.50**
- Player Agents: ~100 calls × $0.01 = **$1.00**
- Creative Generator: ~10 images × $0.04 = **$0.40**
- **Total: ~$6.00 per session**

**Campaign Creation (30-minute session):**
- Assistant Agent: ~20 exchanges × $0.03 = **$0.60**
- Creative Generator: ~5 images × $0.04 = **$0.20**
- **Total: ~$0.80**

## Architecture Principle

**AI for Intelligence, Code for Mechanics**

- Agents provide creative reasoning and decision-making
- Traditional backend handles deterministic rules and calculations
- Frontend manages UI/UX interactions
- This separation optimizes cost, performance, and reliability
