# D20 Texture Atlas Reference

## Overview
This document describes the texture atlas layout for d20 dice skins and how they map to the actual die faces.

## Texture Atlas Layout

The d20 uses a **5×4 grid** texture atlas containing 20 cells (one for each face).

```
Grid Layout (20 cells):
┌─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  Row 0
├─────┼─────┼─────┼─────┼─────┤
│  5  │  6  │  7  │  8  │  9  │  Row 1
├─────┼─────┼─────┼─────┼─────┤
│ 10  │ 11  │ 12  │ 13  │ 14  │  Row 2
├─────┼─────┼─────┼─────┼─────┤
│ 15  │ 16  │ 17  │ 18  │ 19  │  Row 3
└─────┴─────┴─────┴─────┴─────┘
```

## Standard Number Assignment

For your texture atlas, assign d20 numbers **sequentially** to each cell:

```
Number Assignment:
┌─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  Row 0
├─────┼─────┼─────┼─────┼─────┤
│  6  │  7  │  8  │  9  │ 10  │  Row 1
├─────┼─────┼─────┼─────┼─────┤
│ 11  │ 12  │ 13  │ 14  │ 15  │  Row 2
├─────┼─────┼─────┼─────┼─────┤
│ 16  │ 17  │ 18  │ 19  │ 20  │  Row 3
└─────┴─────┴─────┴─────┴─────┘

Cell N → Number (N + 1)
```

## Detection & Correction Mapping

The system automatically corrects the geometric triangle detection to display the correct number:

| Atlas Cell | Number Displayed | Triangle Detected | Corrected To |
|------------|------------------|-------------------|--------------|
| 0          | 1                | 1                 | 15           |
| 1          | 2                | 2                 | *see below*  |
| 2          | 3                | 3                 | *see below*  |
| 3          | 4                | 4                 | *see below*  |
| 4          | 5                | 5                 | 20           |
| 5          | 6                | 6                 | 6 ✓          |
| 6          | 7                | 7                 | *see below*  |
| 7          | 8                | 8                 | 18           |
| 8          | 9                | 9                 | 17           |
| 9          | 10               | 10                | 16           |
| 10         | 11               | 11                | 11 ✓         |
| 11         | 12               | 12                | 7            |
| 12         | 13               | 13                | 8            |
| 13         | 14               | 14                | 2            |
| 14         | 15               | 15                | 10           |
| 15         | 16               | 16                | *see below*  |
| 16         | 17               | 17                | 14           |
| 17         | 18               | 18                | 3            |
| 18         | 19               | 19                | 4            |
| 19         | 20               | 20                | 5            |

**Complete Correction Mapping (Detected → Actual):**
- 1→15, 5→20, 6→6✓, 8→18, 9→17, 10→16, 11→11✓, 12→7, 13→8, 14→2, 15→10, 17→14, 18→3, 19→4, 20→5

## Creating New D20 Skins

### Requirements
1. **Image Size:** Create a texture image (recommended 1024×1024 or 2048×2048)
2. **Grid Layout:** Divide into 5 columns × 4 rows = 20 equal cells
3. **Number Assignment:** Place numbers 1-20 sequentially in cells 0-19
4. **File Format:** PNG with transparency or JPG

### Cell Dimensions
For a 1024×1024 texture:
- Cell Width: 204.8 pixels (1024 ÷ 5)
- Cell Height: 256 pixels (1024 ÷ 4)

### Example Layout
```
Your texture file should look like:
┌──────┬──────┬──────┬──────┬──────┐
│  "1" │  "2" │  "3" │  "4" │  "5" │
├──────┼──────┼──────┼──────┼──────┤
│  "6" │  "7" │  "8" │  "9" │ "10" │
├──────┼──────┼──────┼──────┼──────┤
│ "11" │ "12" │ "13" │ "14" │ "15" │
├──────┼──────┼──────┼──────┼──────┤
│ "16" │ "17" │ "18" │ "19" │ "20" │
└──────┴──────┴──────┴──────┴──────┘
```

### Guidelines
- **Center numbers** in each cell for best visibility
- Use **high contrast** between number and background
- Add **decorative elements** around numbers if desired
- Test readability at different viewing angles
- Ensure numbers are **right-side up** in the atlas

## Technical Details

### UV Mapping
The system uses `applyDiceUVMapping()` to map each triangular face to its atlas cell:
- Triangle N → Atlas Cell N → Number (N + 1)
- UV coordinates automatically calculated based on 5×4 grid

### Physics Detection
- Physics engine detects which face is pointing up
- Correction table translates geometric triangle to actual d20 number
- **Your texture/skin doesn't affect detection logic**

## Skin Compatibility

✅ **Works with any visual style:**
- Classic white/black numbers
- Colorful/gradient backgrounds  
- Metallic/glossy materials
- Stone/wood textures
- Fantasy/themed designs
- Glowing/neon effects

❌ **Don't do this:**
- Change the grid layout (must stay 5×4)
- Rearrange number positions
- Use non-sequential numbering

## Testing Your Skin

1. Create your texture following the grid layout above
2. Place numbers 1-20 sequentially in cells 0-19
3. Load the texture in the dice roller
4. The correction system will automatically map to proper d20 values
5. Roll several times to verify all faces display correctly

## Related Files
- **Texture Generation:** `frontend/lib/DiceTextureAtlas.ts`
- **Physics & Detection:** `frontend/components/dice/CannonDiceOverlay.tsx`
- **D10 Reference:** `docs/D10_QUICK_REFERENCE.md`

---

**Last Updated:** December 20, 2025  
**Version:** 1.0
