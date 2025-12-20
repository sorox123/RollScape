# 3D Dice System Guide

## Overview

RollScape features a complete 3D dice rolling system with realistic physics, customizable textures, sound effects, and visual effects. This guide covers all features and how to use them.

## Features

### 🎲 3D Physics Simulation
- **Realistic Physics**: Full gravity (9.8 m/s²), bounce prediction, angular velocity, and damping
- **Customizable Throw**: Adjust throw force (0.5-2.0) and spin intensity (0.5-2.0)
- **7 Die Types**: d4, d6, d8, d10, d12, d20, d100 with accurate geometries
- **Collision Detection**: Realistic ground collisions with bounce effects

### 🎨 Texture System
- **Marketplace**: Browse and purchase custom dice textures
- **Texture Types**: Classic, Metal, Gemstone, Wood, Ice, Fire, Galaxy, and more
- **Preview System**: 3D preview before purchase
- **Free & Paid**: Mix of free community textures and premium paid options
- **Creator Tools**: Upload your own texture sets with per-die customization

### 🔊 Sound Effects
- **Procedural Audio**: Web Audio API generates realistic dice sounds
- **8 Sound Types**:
  - Roll start (when thrown)
  - 3 bounce variations (randomized on impact)
  - Settle sound (when dice stop)
  - Critical hit (natural 20)
  - Fumble (natural 1)
  - Rattle (ambient)
- **Volume Control**: Adjustable from 0-100%
- **Enable/Disable**: Quick toggle for silent mode

### 📱 Haptic Feedback
- **Mobile Support**: Vibration on rolls, bounces, and results
- **Patterns**:
  - Short pulse (50ms) on roll start
  - Quick tap (20ms) on each bounce
  - Medium pulse (100ms) on settle
  - Triple pulse [50,50,50] on critical
  - Double pulse [100,50,100] on fumble

### 🎥 Camera Modes
- **Top View**: Bird's eye view from directly above
- **Side View**: Angled side perspective (5 units away)
- **Dynamic** (Default): Smooth following camera with slight arc motion

### ✨ Visual Effects
- **Motion Trails**: Shows dice path through the air (optional)
- **Particle Effects**: Explosive particles on criticals (green) and fumbles (red)
- **Emissive Glow**: Dice glow green (critical) or red (fumble)
- **Shadow Quality**: Low/Medium/High with PCF soft shadows
- **Antialiasing**: Toggle for smoother edges (performance impact)

### ⚙️ Settings Panel

Access via the **Settings** button in the dice roller page header.

#### 3D Overlay
- Toggle 3D dice animation on/off
- Falls back to 2D animation when disabled

#### Physics Settings
- **Throw Force**: 0.5 (Gentle) to 2.0 (Aggressive)
  - Affects initial velocity and trajectory height
- **Spin Intensity**: 0.5 (Slow) to 2.0 (Fast)
  - Controls angular velocity and rotation speed

#### Camera Settings
- **Top**: Static overhead view
- **Side**: Static angled side view
- **Dynamic**: Following camera with smooth lerp (0.02 factor)

#### Visual Effects
- **Motion Trails**: Shows previous positions as fading line
- **Particle Effects**: Spawn particles on critical/fumble results
- **Antialiasing**: MSAA for smoother edges
- **Shadow Quality**:
  - Low: No shadows (best performance)
  - Medium: Basic shadows (1024x1024 map)
  - High: Soft shadows (2048x2048 PCF)

#### Audio Settings
- **Sound Enable/Disable**: Master toggle
- **Volume**: 0-100% slider with percentage display

#### Haptic Settings
- **Vibration**: Enable/disable mobile haptic feedback
- Only visible on mobile devices

#### Actions
- **Reset to Defaults**: Restore original settings
- **Done**: Close panel and apply changes

## API Endpoints

### Roll Dice with Animation
```http
POST /api/dice/rolls/
Content-Type: application/json

{
  "dice_notation": "2d20+5",
  "reason": "Attack roll",
  "character_id": "uuid",
  "campaign_id": "uuid",
  "texture_id": "uuid",
  "advantage": false,
  "disadvantage": false,
  "throw_force": 1.0,
  "throw_angle": 45,
  "spin_intensity": 1.0
}
```

**Response:**
```json
{
  "roll_id": "uuid",
  "dice_notation": "2d20+5",
  "dice_results": [
    {
      "die_type": "d20",
      "value": 18,
      "initial_position": [0.5, 2.0, 0.0],
      "initial_rotation": [0, 0, 0],
      "initial_velocity": [1.2, 3.5, 0.8],
      "angular_velocity": [45, 90, 30],
      "bounce_points": [[0.5, 0.2, 0.8], [0.6, 0.2, 1.2]],
      "settle_time": 2.3,
      "is_critical": false,
      "is_fumble": false
    }
  ],
  "total": 41,
  "modifier": 5,
  "total_animation_time": 2.5,
  "camera_focus": [0.5, 0.5, 1.0]
}
```

### Get Roll Presets
```http
GET /api/dice/presets
```

Returns predefined throw configurations (gentle, normal, aggressive).

## Dice Texture Marketplace

### Browse Textures
```http
GET /api/marketplace/dice-textures/?search=galaxy&free_only=false&style=fantasy
```

### Create Texture Set
```http
POST /api/marketplace/dice-textures/
Content-Type: application/json

{
  "name": "Cosmic Galaxy",
  "description": "Beautiful space-themed dice with stars",
  "preview_image_url": "https://...",
  "d4_texture_url": "https://...",
  "d6_texture_url": "https://...",
  "d8_texture_url": "https://...",
  "d10_texture_url": "https://...",
  "d12_texture_url": "https://...",
  "d20_texture_url": "https://...",
  "d100_texture_url": "https://...",
  "style": "fantasy",
  "tags": ["space", "cosmic", "purple"],
  "is_free": false,
  "price_cents": 299,
  "visibility": "public"
}
```

### Purchase Texture
```http
POST /api/marketplace/dice-textures/{texture_id}/purchase
```

Handles Stripe checkout and grants access.

## Frontend Integration

### Using EnhancedDiceOverlay Component

```tsx
import EnhancedDiceOverlay from '@/components/dice/EnhancedDiceOverlay'
import { DiceSettings, DEFAULT_DICE_SETTINGS } from '@/components/dice/DiceSettingsPanel'

const [settings, setSettings] = useState<DiceSettings>(DEFAULT_DICE_SETTINGS)
const [rollData, setRollData] = useState(null)
const [textureUrls, setTextureUrls] = useState(undefined)

// Roll dice
const response = await fetch('http://localhost:8000/api/dice/rolls/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dice_notation: '1d20+5',
    throw_force: settings.throwForce,
    spin_intensity: settings.spinIntensity,
    texture_id: selectedTextureId
  })
})
const data = await response.json()
setRollData(data)

// Render overlay
<EnhancedDiceOverlay
  rollData={rollData}
  settings={settings}
  textureUrls={textureUrls}
  onAnimationComplete={() => setRollData(null)}
/>
```

### Using DiceSettingsPanel

```tsx
import DiceSettingsPanel, { DEFAULT_DICE_SETTINGS } from '@/components/dice/DiceSettingsPanel'

const [settings, setSettings] = useState(DEFAULT_DICE_SETTINGS)
const [showSettings, setShowSettings] = useState(false)

<DiceSettingsPanel
  settings={settings}
  onSettingsChange={setSettings}
  onClose={() => setShowSettings(false)}
/>
```

### Using DiceTextureSelector

```tsx
import DiceTextureSelector from '@/components/dice/DiceTextureSelector'

const [selectedTextureId, setSelectedTextureId] = useState<string>()
const [textureUrls, setTextureUrls] = useState<{ [key: string]: string }>()
const [showSelector, setShowSelector] = useState(false)

<DiceTextureSelector
  selectedTextureId={selectedTextureId}
  onSelectTexture={(id, urls) => {
    setSelectedTextureId(id)
    setTextureUrls(urls)
    setShowSelector(false)
  }}
  onClose={() => setShowSelector(false)}
/>
```

## Performance Optimization

### Low-End Devices
- Disable antialiasing
- Set shadow quality to "low"
- Disable motion trails
- Disable particle effects
- Use simpler textures

### High-End Devices
- Enable all visual effects
- Set shadow quality to "high"
- Enable antialiasing
- Use high-resolution textures (4K)

### Mobile Optimization
- Auto-detect device capabilities
- Reduce particle count on mobile
- Lower shadow resolution
- Disable trails by default
- Enable haptic feedback

## Browser Compatibility

- **Chrome/Edge**: Full support (WebGL 2.0, Web Audio API)
- **Firefox**: Full support
- **Safari**: Full support (iOS 15+)
- **Mobile**: PWA support with offline capabilities

## Technical Details

### Three.js Setup
- **Version**: 0.160.0
- **Renderer**: WebGLRenderer with alpha transparency
- **Camera**: PerspectiveCamera (60° FOV)
- **Lighting**: Ambient + Directional + Rim
- **Materials**: MeshStandardMaterial with metalness/roughness

### Physics Engine
- Custom implementation (can upgrade to Cannon.js)
- Gravity: 9.8 m/s²
- Damping coefficient: 0.7
- Ground collision at y=0.2
- 30 frames at 0.1s intervals

### Audio System
- Web Audio API (AudioContext)
- Procedural sound generation (oscillators)
- Frequency ranges:
  - Roll start: 200 Hz
  - Bounce: 150-250 Hz (randomized)
  - Settle: 100 Hz
  - Critical: 800 Hz
  - Fumble: 200 Hz

## Future Enhancements

### Planned Features
1. **Advanced Textures**:
   - Animated textures (shimmer, glow)
   - Normal maps for depth
   - Environment maps for reflections
   - Procedural texture generation

2. **Physics Improvements**:
   - Upgrade to Cannon.js for die-to-die collisions
   - Table surface materials (felt, wood, metal)
   - Die weight/balance customization
   - Wind/gravity modifiers

3. **Social Features**:
   - Share dice textures
   - Texture of the week
   - Community voting
   - Texture bundles/collections

4. **Marketplace Enhancements**:
   - Texture editor tools
   - Template system
   - Revenue sharing (70/30 split)
   - Subscription perks (1 free premium/month)

5. **AR Mode**:
   - Roll dice on real surfaces via camera
   - ARCore/ARKit integration
   - Spatial audio

## Troubleshooting

### Dice Not Appearing
- Check browser WebGL support: `chrome://gpu`
- Disable browser extensions (ad blockers)
- Clear cache and reload
- Check console for Three.js errors

### Performance Issues
- Lower shadow quality to "low"
- Disable antialiasing
- Disable visual effects
- Reduce throw force (fewer calculations)
- Close other browser tabs

### Textures Not Loading
- Check network connection
- Verify texture URLs are accessible
- Check CORS headers on texture server
- Try different texture set

### Sound Not Playing
- Check browser sound permissions
- Unmute browser tab
- Verify Web Audio API support
- Check volume settings (not 0%)

### Haptic Not Working
- Only available on mobile devices
- Check browser vibration API support
- Enable haptic in settings
- Verify device supports vibration

## Support

For issues or feature requests:
- GitHub: https://github.com/sorox123/RollScape/issues
- Discord: [Server link]
- Email: support@rollscape.gg

## Credits

- **Three.js**: 3D rendering engine
- **Web Audio API**: Sound effects
- **FastAPI**: Backend physics simulation
- **OpenAI GPT-4**: Content generation
