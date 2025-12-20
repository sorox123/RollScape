# 🎲 Quick Start Guide - 3D Dice System

## Prerequisites
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ Three.js installed (`npm install` completed)

## 1. Access the Dice Roller
Navigate to: **http://localhost:3000/dice**

## 2. Try Basic 2D Roll
1. Enter dice notation: `1d20+5`
2. Click **Roll Dice**
3. See the 2D animation and result

## 3. Enable 3D Mode
1. Click **Settings** button (top right)
2. Ensure "Use 3D Overlay" is **ON** (default)
3. Click **Done**

## 4. Roll in 3D
1. Click **Roll Dice**
2. Watch the 3D dice:
   - Throw animation
   - Realistic physics (gravity, bounce, spin)
   - Sound effects (procedural)
   - Result display

## 5. Customize Physics
1. Click **Settings**
2. Adjust **Throw Force** slider (0.5 = gentle, 2.0 = aggressive)
3. Adjust **Spin Intensity** slider (0.5 = slow, 2.0 = fast)
4. Click **Done**
5. Roll again to see the difference

## 6. Change Camera Angle
1. Click **Settings**
2. Under Camera, select:
   - **Top**: Overhead view
   - **Side**: Angled side view
   - **Dynamic**: Following camera (default, recommended)
3. Click **Done**

## 7. Adjust Visual Quality
1. Click **Settings**
2. Under Visual Effects:
   - **Shadow Quality**: Low (fastest) | Medium | High (best)
   - **Antialiasing**: On/Off (smoother edges vs. performance)
   - **Motion Trails**: On/Off (shows dice path)
   - **Particle Effects**: On/Off (explosions on critical/fumble)
3. Click **Done**

## 8. Configure Sound
1. Click **Settings**
2. Under Audio Settings:
   - Toggle **Sound Enabled** On/Off
   - Adjust **Volume** slider (0-100%)
3. Click **Done**
4. Roll to hear:
   - Roll start sound
   - Bounce sounds (randomized)
   - Settle sound
   - Critical/fumble special sounds

## 9. Test Different Dice
Try these dice notations:
- `1d20` - Single d20
- `2d20kh1` - Advantage (keep highest)
- `2d20kl1` - Disadvantage (keep lowest)
- `3d6` - Three d6
- `4d6dl1` - Character stats (drop lowest)
- `8d6` - Fireball damage
- `1d100` - Percentile die

## 10. Browse Textures (Coming Soon)
1. Click **Textures** button
2. Browse available dice textures
3. Select a texture set
4. Roll with custom texture

**Note:** Marketplace is empty until sample textures are created. See "Creating Sample Textures" below.

---

## Creating Sample Textures

To test the texture marketplace, you'll need to create sample texture images:

### Requirements
- 7 images (one per die type): d4, d6, d8, d10, d12, d20, d100
- Resolution: 1024x1024 or 2048x2048
- Format: JPG or PNG
- UV mapping: Standard cube/sphere unwrap

### Option 1: Use AI Generation
1. Use DALL-E or Midjourney
2. Prompt example: "seamless texture for dice, [style], 2048x2048, high quality"
3. Styles: ivory, wood grain, metal, gemstone, cosmic, etc.

### Option 2: Use Existing Textures
1. Find free textures on:
   - Poly Haven (polyhaven.com)
   - Texture.com
   - CC0 Textures
2. Resize to 1024x1024 or 2048x2048
3. Ensure seamless wrapping

### Option 3: Create Your Own
1. Use Photoshop/GIMP/Blender
2. Create base material
3. Add numbers/markings (optional for texture, can be in shader)
4. Export as PNG

### Upload Texture Set (API)
```bash
# Example using curl
curl -X POST http://localhost:8000/api/marketplace/dice-textures/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Classic Ivory",
    "description": "Traditional white dice with black numbers",
    "preview_image_url": "https://your-cdn.com/preview.jpg",
    "d4_texture_url": "https://your-cdn.com/d4.jpg",
    "d6_texture_url": "https://your-cdn.com/d6.jpg",
    "d8_texture_url": "https://your-cdn.com/d8.jpg",
    "d10_texture_url": "https://your-cdn.com/d10.jpg",
    "d12_texture_url": "https://your-cdn.com/d12.jpg",
    "d20_texture_url": "https://your-cdn.com/d20.jpg",
    "d100_texture_url": "https://your-cdn.com/d100.jpg",
    "is_free": true,
    "style": "classic",
    "tags": ["ivory", "traditional", "classic"]
  }'
```

---

## Troubleshooting

### Dice Don't Appear
- Check browser console for Three.js errors
- Verify WebGL support: chrome://gpu
- Try disabling browser extensions
- Refresh the page

### No Sound
- Check browser sound permissions
- Unmute browser tab
- Verify Web Audio API support
- Check volume slider in settings (not 0%)

### Poor Performance
1. Lower settings:
   - Shadow Quality: Low
   - Antialiasing: Off
   - Particle Effects: Off
   - Motion Trails: Off
2. Close other tabs/applications
3. Try different browser (Chrome recommended)

### Settings Don't Save
- Settings are per-session (not persisted)
- localStorage persistence coming soon

### Textures Don't Load
- Check network tab for 404s
- Verify texture URLs are accessible
- Check CORS headers if cross-origin
- Try different texture set

---

## Performance Tips

### For Low-End Devices
```
✅ Shadow Quality: Low
✅ Antialiasing: Off
✅ Particle Effects: Off
✅ Motion Trails: Off
✅ Throw Force: 0.8 (less calculation)
```

### For High-End Devices
```
✅ Shadow Quality: High
✅ Antialiasing: On
✅ Particle Effects: On
✅ Motion Trails: On
✅ Throw Force: 1.5 (dramatic throws)
```

### For Mobile
```
✅ Shadow Quality: Low or Medium
✅ Antialiasing: Off (performance)
✅ Particle Effects: On (looks good)
✅ Motion Trails: Off (performance)
✅ Haptic: On (vibration feedback)
```

---

## Advanced Usage

### API Direct Access
Test the dice animation API directly:

1. Open http://localhost:8000/docs
2. Find **POST /api/dice/rolls/**
3. Click "Try it out"
4. Use this body:
```json
{
  "dice_notation": "2d20+5",
  "reason": "Attack Roll",
  "throw_force": 1.2,
  "throw_angle": 45,
  "spin_intensity": 1.5,
  "advantage": false
}
```
5. Click Execute
6. See full physics data in response

### Custom Integrations
The dice system can be integrated into other pages:

```tsx
import EnhancedDiceOverlay from '@/components/dice/EnhancedDiceOverlay'
import { DEFAULT_DICE_SETTINGS } from '@/components/dice/DiceSettingsPanel'

// In your component
const [rollData, setRollData] = useState(null)

// Roll dice
const response = await fetch('http://localhost:8000/api/dice/rolls/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dice_notation: '1d20+5',
    throw_force: 1.0,
    spin_intensity: 1.0
  })
})
const data = await response.json()
setRollData(data)

// Render overlay
<EnhancedDiceOverlay
  rollData={rollData}
  settings={DEFAULT_DICE_SETTINGS}
  onAnimationComplete={() => setRollData(null)}
/>
```

---

## Next Steps

1. ✅ Test basic dice rolling
2. ✅ Experiment with settings
3. ⏳ Create sample textures
4. ⏳ Test texture selection
5. ⏳ Test on mobile device
6. ⏳ Profile performance
7. ⏳ Give feedback

---

## Feedback & Support

Found a bug? Have a suggestion?
- Create GitHub issue
- Check documentation: `docs/DICE_SYSTEM_GUIDE.md`
- Review marketplace guide: `docs/MARKETPLACE_GUIDE.md`

---

**Status:** ✅ Ready to use!
**Last Updated:** December 6, 2025

🎲 **Happy Rolling!** 🎲
