# Creative Generator Agent - Technical Specification

## Core Responsibilities

- **Map Generation**: Battle maps, world maps, dungeon layouts
- **Character Visualization**: PC portraits, NPC appearances, monster depictions
- **Item & Artifact Design**: Magical items, weapons, treasures
- **Environment Art**: Taverns, dungeons, landscapes, cities
- **Asset Creation**: Props, obstacles, terrain features

## Input Schema

```json
{
  "requestType": "map|character|item|environment|monster",
  "prompt": {
    "description": "detailed text description",
    "style": "realistic|fantasy_art|sketch|isometric|token",
    "mood": "dark|bright|mysterious|epic|gritty"
  },
  "specifications": {
    "mapType": "battle|world|dungeon|null",
    "gridType": "square|hexagonal|null",
    "dimensions": "string (e.g., '30x40 squares')",
    "characterRace": "string|null",
    "characterClass": "string|null",
    "terrain": ["array for maps"],
    "lighting": "bright|dim|dark|null"
  },
  "context": {
    "campaignTheme": "string",
    "ruleSystem": "string",
    "relatedEntities": ["array of related items/characters"]
  },
  "options": {
    "numVariations": "number (1-4)",
    "includeTokenVersion": "boolean",
    "gridOverlay": "boolean"
  }
}
```

## Output Schema

```json
{
  "generatedAssets": [{
    "id": "uuid",
    "type": "image|map|token",
    "url": "string",
    "thumbnailUrl": "string",
    "metadata": {
      "dimensions": "string",
      "format": "png|jpg|svg",
      "fileSize": "number",
      "gridType": "square|hexagonal|null"
    }
  }],
  "generationDetails": {
    "model": "string",
    "refinedPrompt": "string",
    "seed": "number",
    "parameters": "object"
  },
  "suggestions": {
    "alternativePrompts": ["array"],
    "relatedAssets": ["array"]
  }
}
```

## Generation Pipeline

### For Images (Characters, Items, Environments)

**Step 1: Prompt Engineering (LLM)**

Refine user description into optimal image generation prompt:

- **Model**: GPT-4 or Claude
- **Temperature**: 0.3 (precise prompt construction)

```python
def refine_prompt(user_description, asset_type, campaign_theme, style):
    prompt = f"""
    You are an expert at crafting prompts for AI image generation for D&D content.
    
    INPUT: {user_description}
    CONTEXT: Campaign theme is {campaign_theme}
    TYPE: {asset_type}
    STYLE: {style}
    
    YOUR TASK:
    - Enhance descriptions with specific visual details
    - Include artistic style keywords
    - Specify composition, lighting, perspective
    - Ensure D&D thematic consistency
    - Optimize for DALL-E 3 / Stable Diffusion
    
    OUTPUT: Refined prompt string (max 400 characters)
    """
    
    return llm.generate(prompt)
```

**Example:**
```
Input: "A gruff dwarf fighter with a hammer"

Output: "Fantasy character portrait of a battle-hardened dwarf warrior, braided red 
beard with silver rings, wearing dented plate armor with clan symbols engraved, 
holding an ornate warhammer crackling with lightning, standing in a stone fortress 
with torches, dramatic rim lighting, highly detailed, dungeons and dragons art style, 
digital painting"
```

**Step 2: Image Generation**

- **Primary**: DALL-E 3 (highest quality, best prompt adherence)
- **Alternative**: Stable Diffusion XL (cost-effective, self-hosted)
- **Fallback**: Midjourney API (if available)
- **Resolution**: 1024x1024 standard, 2048x2048 for high detail

**Step 3: Post-Processing**

- Background removal for character tokens
- Grid overlay for battle maps
- Upscaling for print quality
- Format conversion (PNG for tokens, JPG for large maps)

### For Maps (Battle/Dungeon/World)

**Hybrid Approach:**

1. **Procedural Generation** for layout
   - Dungeon generation algorithms
   - Terrain generation for world maps
   - Room/corridor placement

2. **AI Enhancement** for styling
   - Apply textures and details
   - Add decorations and props
   - Style transfer for art consistency

3. **Grid Overlay**
   - Square grid (5ft squares)
   - Hexagonal grid (configurable size)
   - Coordinates and measurements

**Tools:**
- Dungeon Scrawl API
- Custom tile-based system
- Procedural terrain generation libraries

```python
def generate_battle_map(dimensions, terrain, grid_type, style):
    # Step 1: Generate layout
    layout = procedural_dungeon_generator(
        width=dimensions['width'],
        height=dimensions['height'],
        terrain_types=terrain
    )
    
    # Step 2: Enhance with AI
    style_prompt = f"""
    Battle map with {terrain} terrain, {style} art style, 
    top-down view, detailed textures, game-ready
    """
    
    enhanced_map = image_generator.generate(
        base_image=layout,
        prompt=style_prompt,
        mode='img2img'
    )
    
    # Step 3: Add grid
    final_map = add_grid_overlay(
        enhanced_map,
        grid_type=grid_type,
        square_size=5  # 5 feet per square
    )
    
    return final_map
```

## LLM Configuration (Prompt Refinement)

**System Prompt:**
```
You are an expert at crafting prompts for AI image generation for D&D content.

GUIDELINES:
- Be specific about composition, lighting, and perspective
- Include art style keywords (digital painting, concept art, etc.)
- Specify character details (race, class, equipment)
- Describe mood and atmosphere
- Use D&D-appropriate terminology
- Keep prompts under 400 characters
- Avoid copyrighted references

EXAMPLES:
Good: "Ancient red dragon perched on mountain peak, scales glinting in sunset, 
      treasure hoard visible in cave entrance, epic fantasy art"
Bad: "Dragon"

Good: "Cozy tavern interior, wooden beams, stone fireplace with roaring fire, 
      adventurers at tables, warm candlelight, isometric view"
Bad: "Tavern room"
```

## Integration Points

- **DM Agent**: Receives requests during gameplay for new locations/NPCs
- **Campaign Assistant Agent**: Generates assets during campaign creation
- **Asset Library Service**: Store and tag generated content
- **CDN**: Serve images to frontend efficiently
- **Database**: Track generation history and costs

## Optimization Strategies

### Caching
Store common requests to avoid regenerating:
- Generic tavern interiors
- Standard forest/mountain terrain
- Common monster tokens
- Basic dungeon layouts

### Batch Processing
Queue multiple requests for efficiency:
- Generate all NPC portraits for a session at once
- Create map variations in parallel
- Bulk process character tokens

### Quality Tiers

**Fast** (30 seconds):
- Lower resolution
- Less detail
- Cached results when possible
- Use: Quick previews, placeholder art

**Standard** (1-2 minutes):
- 1024x1024 resolution
- Good detail level
- Use: Regular gameplay

**High Quality** (3-5 minutes):
- 2048x2048 resolution
- Maximum detail
- Post-processing enhancements
- Use: Key story moments, final campaign assets

### User Feedback Loop

Allow regeneration with modifications:
```json
{
  "originalAssetId": "uuid",
  "modifications": [
    "Make the character look older",
    "Add more dramatic lighting",
    "Change background to forest"
  ]
}
```

## Cost Management

**Per Asset Costs:**
- DALL-E 3 (1024x1024): ~$0.04
- DALL-E 3 (2048x2048): ~$0.08
- Stable Diffusion (self-hosted): ~$0.002
- Prompt refinement LLM call: ~$0.01

**Recommendations:**
- Use Stable Diffusion for high-volume needs
- Reserve DALL-E 3 for key assets
- Cache aggressively
- Implement rate limits per user tier

## Special Features

### Style Consistency

Maintain visual cohesion across campaign:
```python
# Store style seed for campaign
campaign.visual_style = {
    "art_style": "oil painting",
    "color_palette": "muted earthy tones",
    "reference_images": ["url1", "url2"],
    "negative_prompts": ["anime", "cartoon"]
}

# Apply to all generation requests
prompt += f", {campaign.visual_style.art_style}, "
prompt += f"{campaign.visual_style.color_palette}"
```

### Character Consistency

Generate multiple poses of same character:
```python
def generate_character_set(character_description, style_seed):
    base_prompt = refine_prompt(character_description)
    
    poses = [
        "portrait headshot",
        "full body standing pose",
        "action pose mid-combat",
        "token top-down view"
    ]
    
    return [
        generate_image(f"{base_prompt}, {pose}", seed=style_seed)
        for pose in poses
    ]
```

### Map Feature Detection

Parse generated maps to identify features:
```python
def analyze_map(map_image):
    """Use vision model to identify map features"""
    prompt = """
    Analyze this battle map and identify:
    - Doors and entrances
    - Obstacles (walls, furniture, rocks)
    - Terrain types (water, forest, stone)
    - Points of interest
    
    Output JSON with coordinates and types.
    """
    
    return vision_model.analyze(map_image, prompt)
```

This enables automatic collision detection and movement validation.
