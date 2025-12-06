# Frontend App Structure

This app uses Next.js 14 App Router with route groups for organization.

## Route Groups (Parentheses)

Folders wrapped in parentheses `(name)` are **route groups** - they organize files without affecting URLs.

For example:
- File: `app/(game)/spells/page.tsx`
- URL: `/spells` (not `/game/spells`)

## Organization

```
app/
├── (game)/              # Game features & gameplay
│   ├── abilities/       → /abilities
│   ├── campaigns/       → /campaigns
│   ├── characters/      → /characters
│   ├── combat/          → /combat
│   ├── dice/            → /dice
│   ├── inventory/       → /inventory
│   ├── map/             → /map
│   ├── my-spells/       → /my-spells
│   ├── session-recap/   → /session-recap
│   ├── sessions/        → /sessions (formerly /game)
│   └── spells/          → /spells
│
├── (social)/            # Social features
│   ├── friends/         → /friends
│   └── messages/        → /messages
│
├── (tools)/             # AI & utility features
│   ├── ai/              → /ai
│   └── voice-to-text/   → /voice-to-text
│
├── dashboard/           → /dashboard
├── pricing/             → /pricing
├── offline/             → /offline
├── test/                → /test
│
├── layout.tsx           # Root layout
├── page.tsx             # Homepage (/)
└── globals.css          # Global styles
```

## Benefits

✅ **Logical grouping** - Related features are together
✅ **Clean URLs** - Route groups don't affect URLs
✅ **Easy navigation** - Clear separation of concerns
✅ **Scalable** - Easy to add new features to existing groups
✅ **Better IDE experience** - Easier to find files

## Adding New Features

**Game feature?** → Add to `(game)/`
**Social feature?** → Add to `(social)/`
**Tool/utility?** → Add to `(tools)/`
**Core UI?** → Add to root or create new group

## URL Routing

All URLs remain the same after reorganization:
- `/campaigns` → `(game)/campaigns/page.tsx`
- `/friends` → `(social)/friends/page.tsx`
- `/ai/maps` → `(tools)/ai/maps/page.tsx`

No breaking changes to links or navigation!
