# Marketplace System

## Overview

RollScape features two major marketplace systems:
1. **World Marketplace** - Share and discover complete D&D campaign settings
2. **Dice Texture Marketplace** - Buy, sell, and collect custom dice skins

## World Marketplace

### Features
- **Content Packaging**: Bundle NPCs, locations, quests, monsters, items, and lore
- **Visibility Levels**: Private, Unlisted (link-only), Public
- **Community Metrics**: Likes, shares, uses, ratings
- **Categorization**: Tags, themes, game systems (5e, Pathfinder, etc.)
- **Featured Worlds**: Editorial picks and trending

### Creating a World

```http
POST /api/marketplace/worlds/
Content-Type: application/json

{
  "name": "Shadowfen Vale",
  "description": "A dark fantasy swamp setting with political intrigue",
  "tagline": "Where shadows hide secrets and every ally could be a foe",
  "setting": "Dark fantasy swamp kingdom",
  "lore": "Long-form lore content...",
  "rules": "Modified 5e with corruption mechanics",
  "game_system": "dnd_5e",
  "tags": ["dark fantasy", "political", "swamp", "intrigue"],
  "themes": ["corruption", "survival", "mystery"],
  "visibility": "public",
  "cover_image_url": "https://..."
}
```

### Linking World to Campaign

When creating a campaign:
```http
POST /api/campaigns/
{
  "name": "Shadowfen Campaign",
  "world_id": "uuid-of-world",
  ...
}
```

The campaign will automatically inherit:
- World setting and lore
- Custom rules
- NPCs, locations, quests (optional import)
- Thematic elements

### Browsing Worlds

```http
GET /api/marketplace/worlds/?search=shadowfen&tags=dark%20fantasy&sort=popular
```

**Sort Options:**
- `popular`: Most likes/uses
- `recent`: Newest first
- `top_rated`: Highest ratings
- `trending`: Recent popularity spike

### Using a World

When someone uses your world in their campaign:
```http
POST /api/marketplace/worlds/{world_id}/use
```

This increments the `uses_count` and shows popularity.

## Dice Texture Marketplace

### Features
- **7 Die Types**: Separate textures for d4, d6, d8, d10, d12, d20, d100
- **3D Models**: Optional custom geometry (STL/OBJ format)
- **Monetization**: Free or paid (Stripe integration)
- **Styles**: Fantasy, Realistic, Abstract, Sci-Fi, Horror, Minimalist, etc.
- **Community Metrics**: Downloads, purchases, likes, ratings
- **Official Sets**: Curated by RollScape team

### Creating a Texture Set

```http
POST /api/marketplace/dice-textures/
Content-Type: application/json

{
  "name": "Cosmic Galaxy",
  "description": "Beautiful space-themed dice with twinkling stars",
  "preview_image_url": "https://cdn.example.com/preview.jpg",
  
  // Required: One texture per die type
  "d4_texture_url": "https://cdn.example.com/d4.jpg",
  "d6_texture_url": "https://cdn.example.com/d6.jpg",
  "d8_texture_url": "https://cdn.example.com/d8.jpg",
  "d10_texture_url": "https://cdn.example.com/d10.jpg",
  "d12_texture_url": "https://cdn.example.com/d12.jpg",
  "d20_texture_url": "https://cdn.example.com/d20.jpg",
  "d100_texture_url": "https://cdn.example.com/d100.jpg",
  
  // Optional: Custom 3D models
  "d4_model_url": "https://cdn.example.com/d4.glb",
  "d6_model_url": "https://cdn.example.com/d6.glb",
  // ... etc
  
  // Pricing
  "is_free": false,
  "price_cents": 299,  // $2.99
  
  // Categorization
  "style": "fantasy",
  "tags": ["space", "cosmic", "purple", "premium"],
  "visibility": "public",
  
  // Optional flags
  "is_official": false,
  "is_featured": false
}
```

### Texture Requirements

**Image Specifications:**
- Format: JPG, PNG, WebP
- Resolution: 1024x1024 minimum (2048x2048 recommended)
- Color Space: sRGB
- UV Mapping: Standard cube/sphere/polyhedron unwrap

**Preview Image:**
- Format: JPG, PNG
- Resolution: 512x512 or 1024x1024
- Shows all 7 dice with the texture applied
- Good lighting and presentation

**3D Models (Optional):**
- Format: glTF 2.0 (.glb preferred)
- Vertex count: <5000 per die
- Materials: PBR (Metallic-Roughness workflow)
- Scale: Standard die dimensions

### Browsing Textures

```http
GET /api/marketplace/dice-textures/
  ?search=galaxy
  &style=fantasy
  &free_only=false
  &official_only=false
  &featured_only=false
  &min_rating=4.0
  &sort=popular
```

**Filters:**
- `search`: Text search in name/description
- `style`: fantasy, realistic, abstract, sci-fi, horror, minimalist, custom
- `free_only`: Show only free textures
- `official_only`: Show only RollScape official sets
- `featured_only`: Show only featured sets
- `min_rating`: Minimum average rating (0-5)
- `sort`: popular, recent, top_rated, price_low, price_high

### Purchasing Textures

```http
POST /api/marketplace/dice-textures/{texture_id}/purchase
Content-Type: application/json

{
  "payment_method_id": "pm_xxxx"  // Stripe payment method
}
```

**Response:**
```json
{
  "purchase_id": "uuid",
  "texture_id": "uuid",
  "price_paid_cents": 299,
  "stripe_payment_intent_id": "pi_xxxx",
  "created_at": "2025-12-06T10:30:00Z"
}
```

### My Purchased Textures

```http
GET /api/marketplace/dice-textures/purchased
```

Returns all textures the current user has purchased or created.

### Downloading Textures

```http
POST /api/marketplace/dice-textures/{texture_id}/download
```

Increments `downloads_count` for analytics. Users can download:
- Their own textures
- Free textures
- Purchased textures

## Monetization

### Revenue Sharing

**For Creators:**
- 70% of sales go to texture creator
- 30% to RollScape platform
- Automatic payouts via Stripe Connect
- Minimum payout threshold: $25
- Monthly payment schedule

**Subscription Perks:**
- Free users: Browse and buy
- Premium subscribers ($9.99/mo):
  - 1 free premium texture per month
  - 20% discount on all purchases
  - Early access to featured sets
  - Creator tools (texture editor)

### Pricing Strategy

**Free Textures:**
- Good for building audience
- Showcase style/quality
- Can upsell premium variations
- No transaction fees

**Paid Textures:**
- Recommended: $0.99 - $4.99 per set
- Sweet spot: $2.99
- Premium/animated: $4.99 - $9.99
- Bundle discounts: 20-30% off

### Featured Placement

**Cost:** $49 for 7 days featured placement
**Benefits:**
- Homepage banner slot
- "Featured" badge
- Priority in search results
- Social media promotion
- Expected 500-1000 extra views

## Community Features

### Likes
- Users can like worlds and textures
- Creators get notifications
- Affects "popular" sorting
- No gameplay impact

### Ratings
- 1-5 star system
- Can only rate after use/purchase
- Average displayed on cards
- Minimum 3 ratings to show average

### Comments (Coming Soon)
- Discussion threads on marketplace items
- Creator responses
- Moderation tools

### Collections (Coming Soon)
- Curated texture bundles
- "Texture of the Week"
- Seasonal collections
- Creator spotlights

## API Reference

### Worlds

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketplace/worlds/` | POST | Create world |
| `/api/marketplace/worlds/` | GET | Browse worlds |
| `/api/marketplace/worlds/my` | GET | My worlds |
| `/api/marketplace/worlds/{id}` | GET | Get world details |
| `/api/marketplace/worlds/{id}` | PATCH | Update world |
| `/api/marketplace/worlds/{id}` | DELETE | Delete world |
| `/api/marketplace/worlds/{id}/like` | POST | Like world |
| `/api/marketplace/worlds/{id}/like` | DELETE | Unlike world |
| `/api/marketplace/worlds/{id}/use` | POST | Mark as used |

### Dice Textures

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketplace/dice-textures/` | POST | Create texture set |
| `/api/marketplace/dice-textures/` | GET | Browse textures |
| `/api/marketplace/dice-textures/my` | GET | My textures |
| `/api/marketplace/dice-textures/purchased` | GET | Purchased textures |
| `/api/marketplace/dice-textures/{id}` | GET | Get texture details |
| `/api/marketplace/dice-textures/{id}` | PATCH | Update texture |
| `/api/marketplace/dice-textures/{id}` | DELETE | Delete texture |
| `/api/marketplace/dice-textures/{id}/like` | POST | Like texture |
| `/api/marketplace/dice-textures/{id}/like` | DELETE | Unlike texture |
| `/api/marketplace/dice-textures/{id}/download` | POST | Download texture |
| `/api/marketplace/dice-textures/{id}/purchase` | POST | Purchase texture |

## Database Schema

### Worlds Table
```sql
CREATE TABLE worlds (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tagline VARCHAR(200),
  setting TEXT,
  lore TEXT,
  rules TEXT,
  game_system VARCHAR(50),
  visibility VARCHAR(20),  -- private, unlisted, public
  tags VARCHAR[],
  themes VARCHAR[],
  cover_image_url VARCHAR(500),
  npc_count INTEGER DEFAULT 0,
  location_count INTEGER DEFAULT 0,
  quest_count INTEGER DEFAULT 0,
  monster_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Dice Textures Table
```sql
CREATE TABLE dice_textures (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_image_url VARCHAR(500),
  
  -- Texture URLs for each die
  d4_texture_url VARCHAR(500),
  d6_texture_url VARCHAR(500),
  d8_texture_url VARCHAR(500),
  d10_texture_url VARCHAR(500),
  d12_texture_url VARCHAR(500),
  d20_texture_url VARCHAR(500),
  d100_texture_url VARCHAR(500),
  
  -- Optional 3D models
  d4_model_url VARCHAR(500),
  d6_model_url VARCHAR(500),
  d8_model_url VARCHAR(500),
  d10_model_url VARCHAR(500),
  d12_model_url VARCHAR(500),
  d20_model_url VARCHAR(500),
  d100_model_url VARCHAR(500),
  
  -- Pricing
  is_free BOOLEAN DEFAULT TRUE,
  price_cents INTEGER,
  
  -- Categorization
  style VARCHAR(50),
  tags VARCHAR[],
  visibility VARCHAR(20),
  
  -- Metrics
  downloads_count INTEGER DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2),
  
  -- Flags
  is_official BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Frontend Components

### WorldCard
Display world in marketplace grid:
```tsx
<WorldCard
  world={world}
  onLike={handleLike}
  onUse={handleUse}
  onClick={() => router.push(`/marketplace/worlds/${world.id}`)}
/>
```

### DiceTextureCard
Display texture in marketplace grid:
```tsx
<DiceTextureCard
  texture={texture}
  isOwned={isPurchased}
  onLike={handleLike}
  onSelect={handleSelect}
  onPurchase={handlePurchase}
/>
```

### TexturePreview3D
3D preview of dice with texture applied:
```tsx
<TexturePreview3D
  textureUrls={texture.textureUrls}
  autoRotate={true}
  showAllDice={true}
/>
```

## Testing

### Test Data Seeds

**Official Worlds:**
1. Forgotten Realms Inspired (free)
2. Dark Medieval (free)
3. Cyberpunk City (free)

**Official Dice Textures:**
1. Classic Ivory (free)
2. Wooden Oak (free)
3. Metal Steel (free)
4. Gemstone Ruby ($2.99)
5. Ice Crystal ($2.99)
6. Fire Elemental ($2.99)
7. Galaxy Cosmic ($4.99)
8. Dragonscale Gold ($4.99)

### Test Purchases

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## Future Enhancements

### Phase 1 (Q1 2026)
- [ ] Texture editor with filters/adjustments
- [ ] Texture templates system
- [ ] Bundle creation tools
- [ ] Creator analytics dashboard

### Phase 2 (Q2 2026)
- [ ] Animated textures (shimmer, glow)
- [ ] Normal/bump maps for 3D depth
- [ ] Environment maps for reflections
- [ ] Procedural texture generation

### Phase 3 (Q3 2026)
- [ ] World builder UI (drag-drop)
- [ ] Campaign templates from worlds
- [ ] Collaborative world editing
- [ ] Version control for worlds

### Phase 4 (Q4 2026)
- [ ] AR texture preview (mobile)
- [ ] Texture contests/challenges
- [ ] Creator verification badges
- [ ] Affiliate program

## Support

For marketplace-related questions:
- Creator Guide: `/docs/marketplace/creator-guide.md`
- Buyer Guide: `/docs/marketplace/buyer-guide.md`
- API Docs: `/docs/api/marketplace.md`
- Discord: Creator channel
