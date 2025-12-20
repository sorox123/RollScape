# Dice Texture Atlas System

## Overview

The dice texture atlas system provides a flexible way to apply numbered textures to all dice types (d4, d6, d8, d10, d12, d20, d100) using a single texture image per die. This approach allows for:

- **Dynamic "skins"**: Easy theme changes by modifying texture configuration
- **Better performance**: Single texture per die instead of multiple materials
- **Consistent numbering**: All face numbers properly mapped to geometry
- **Scalability**: Easy to extend with custom designs

## How It Works

### 1. Texture Atlas Creation

Each die type gets a canvas texture atlas that contains all face numbers laid out in a grid:

```
+-----+-----+-----+
|  1  |  2  |  3  |  <- d6 example
+-----+-----+-----+
|  4  |  5  |  6  |
+-----+-----+-----+
```

The atlas size and layout adapt to the number of faces:
- **d4**: 2x2 grid (512x512)
- **d6**: 3x2 grid (768x512)
- **d8**: 4x2 grid (1024x512)
- **d10/d100**: 5x2 grid (1280x512)
- **d12**: 4x3 grid (1024x768)
- **d20**: 5x4 grid (1280x1024)

### 2. UV Mapping

UV coordinates are applied to the geometry to map each face to its corresponding cell in the atlas:

- **Box Geometry (d6)**: Direct face-to-cell mapping
- **Polyhedra (d4, d8, d12, d20)**: Face normal detection to assign correct cell

### 3. Material Creation

A single `MeshStandardMaterial` is created with the texture atlas applied, ensuring:
- Proper roughness and metalness for realistic appearance
- Critical hits show gold background (0xffd700)
- Fumbles show red background (0xff4444)
- Normal rolls show white background (0xffffff)

## API Reference

### `createDiceTextureAtlas(numFaces, config)`

Creates a canvas texture atlas with all face numbers.

**Parameters:**
- `numFaces` (number): Number of faces on the die (4, 6, 8, 10, 12, 20, 100)
- `config` (DiceTextureConfig): Configuration object
  - `backgroundColor` (number): Hex color for background
  - `textColor` (number): Hex color for text
  - `borderColor` (number): Hex color for borders
  - `font` (string): CSS font specification
  - `showBorder` (boolean): Whether to show borders

**Returns:** `THREE.CanvasTexture`

### `applyDiceUVMapping(geometry, numFaces)`

Applies UV coordinates to geometry for texture atlas mapping.

**Parameters:**
- `geometry` (THREE.BufferGeometry): The dice geometry
- `numFaces` (number): Number of faces on the die

**Returns:** void (modifies geometry in place)

### `createDiceMaterial(numFaces, config)`

Creates a complete material with texture atlas applied.

**Parameters:**
- `numFaces` (number): Number of faces on the die
- `config` (DiceTextureConfig): Texture configuration

**Returns:** `THREE.MeshStandardMaterial`

### `getDiceTextureConfig(isCritical, isFumble)`

Helper to get texture config based on roll outcome.

**Parameters:**
- `isCritical` (boolean): Whether this is a critical hit
- `isFumble` (boolean): Whether this is a fumble

**Returns:** `DiceTextureConfig`

## Usage Example

```typescript
import { 
  createDiceMaterial, 
  applyDiceUVMapping, 
  getDiceTextureConfig 
} from './DiceTextureAtlas';

// Create d20 geometry
const geometry = new THREE.IcosahedronGeometry(1.2);

// Apply UV mapping
applyDiceUVMapping(geometry, 20);

// Create material with texture atlas
const config = getDiceTextureConfig(false, false); // Normal roll
const material = createDiceMaterial(20, config);

// Create mesh
const mesh = new THREE.Mesh(geometry, material);
```

## Customization

### Custom Color Schemes

Modify the `getDiceTextureConfig` function or pass custom config:

```typescript
const customConfig: DiceTextureConfig = {
  backgroundColor: 0x4a90e2, // Blue
  textColor: 0xffffff,       // White
  borderColor: 0x2c5aa0,     // Dark blue
  font: 'bold 140px Georgia',
  showBorder: true
};

const material = createDiceMaterial(20, customConfig);
```

### Custom Fonts and Styling

Adjust the font size and style in the config:

```typescript
const config = {
  backgroundColor: 0xffffff,
  textColor: 0x000000,
  borderColor: 0xcccccc,
  font: 'italic bold 160px "Times New Roman"',
  showBorder: true
};
```

### Advanced: Custom Atlas Layouts

For special numbering systems or custom designs, modify the `createDiceTextureAtlas` function to draw custom graphics in each cell.

## Benefits Over Previous Approach

1. **Unified System**: All dice types use the same approach
2. **Performance**: Single material per die vs. multiple materials (especially for d6)
3. **Flexibility**: Easy to swap entire theme by changing config
4. **Maintainability**: Centralized texture generation logic
5. **Extensibility**: Easy to add new dice types or custom designs

## Future Enhancements

- **Texture Library**: Pre-rendered texture sets for different themes
- **Custom Symbols**: Support for special symbols instead of numbers
- **Image Textures**: Load custom images for dice faces
- **Normal Maps**: Add depth and detail with normal mapping
- **Animations**: Animated textures for special effects
