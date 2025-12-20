# D10 Polyhedron Texture Mapping in Three.js
## Research Analysis & Implementation Options

**Date:** December 8, 2025  
**Context:** RollScape 3D dice rolling system  
**Current Issue:** D10 (pentagonal trapezohedron) requires proper geometry and UV mapping

---

## Current Implementation Analysis

### Existing Code Structure
From `CannonDiceOverlay.tsx` (lines 280-320):
```typescript
case 10: // d10
  geometry = new THREE.IcosahedronGeometry(dieSize, 0);
  shape = new CANNON.Sphere(dieSize * 0.7);
  break;
```

**Problem:** Using `IcosahedronGeometry` (20 triangular faces) for a d10 (10 kite faces) is geometrically incorrect.

### Correct D10 Geometry
- **Shape:** Pentagonal Trapezohedron
- **Faces:** 10 kite-shaped quadrilaterals
- **Vertices:** 12 total
  - 2 sharp apex vertices (top/bottom)
  - 10 blunter vertices forming two pentagonal rings
- **Edges:** 20
- **Numbering:** 0-9 (standard for percentile dice)

---

## Option 1: Create Custom BufferGeometry (RECOMMENDED)

### Approach
Build the pentagonal trapezohedron from scratch using vertex positions and face indices.

### Implementation

```typescript
function createD10Geometry(radius: number = 1): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Calculate vertices for pentagonal trapezohedron
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  
  // Top apex vertex (index 0)
  vertices.push(0, radius, 0);
  
  // Bottom apex vertex (index 1)
  vertices.push(0, -radius, 0);
  
  // Upper pentagon ring (indices 2-6)
  const upperY = radius * 0.5;
  const upperRadius = radius * 0.6;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    vertices.push(
      upperRadius * Math.cos(angle),
      upperY,
      upperRadius * Math.sin(angle)
    );
  }
  
  // Lower pentagon ring (indices 7-11) - offset by 36 degrees
  const lowerY = -radius * 0.5;
  const lowerRadius = radius * 0.6;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) + (Math.PI / 5) - Math.PI / 2; // Offset by 36°
    vertices.push(
      lowerRadius * Math.cos(angle),
      lowerY,
      lowerRadius * Math.sin(angle)
    );
  }
  
  // Create kite faces
  // Upper 5 faces (connecting top apex to upper and lower rings)
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const upperCurrent = 2 + i;
    const upperNext = 2 + next;
    const lowerCurrent = 7 + i;
    
    // Each kite is two triangles
    // Top triangle: apex -> upper[i] -> upper[i+1]
    indices.push(0, upperNext, upperCurrent);
    
    // Bottom triangle: upper[i] -> lower[i] -> upper[i+1]
    indices.push(upperCurrent, upperNext, lowerCurrent);
  }
  
  // Lower 5 faces (connecting bottom apex to lower and upper rings)
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const lowerCurrent = 7 + i;
    const lowerNext = 7 + next;
    const upperNext = 2 + next;
    
    // Each kite is two triangles
    // Top triangle: lower[i] -> upper[i+1] -> lower[i+1]
    indices.push(lowerCurrent, upperNext, lowerNext);
    
    // Bottom triangle: lower[i] -> lower[i+1] -> bottom apex
    indices.push(lowerCurrent, lowerNext, 1);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}
```

### Usage in CannonDiceOverlay.tsx
```typescript
case 10: // d10
  geometry = createD10Geometry(dieSize);
  // For physics, approximate with convex hull or sphere
  shape = new CANNON.Sphere(dieSize * 0.7);
  break;
```

### Advantages
✅ Geometrically accurate pentagonal trapezohedron  
✅ Proper 10 faces (not 20)  
✅ Correct vertex distribution  
✅ Full control over face topology  
✅ Can optimize for physics collision

### Disadvantages
❌ Requires manual vertex calculations  
❌ More complex UV mapping setup  
❌ Need to manually compute normals (though Three.js can help)

---

## Option 2: Use PolyhedronGeometry with Custom Parameters

### Approach
Three.js `PolyhedronGeometry` accepts vertex and index arrays, allowing custom polyhedra.

### Implementation

```typescript
function createD10GeometryFromPolyhedron(radius: number = 1): THREE.PolyhedronGeometry {
  // Define vertices (same as Option 1)
  const vertices = [
    0, radius, 0,                    // 0: top apex
    0, -radius, 0,                   // 1: bottom apex
    // Upper pentagon (2-6)
    ...calculatePentagonVertices(radius * 0.5, radius * 0.6, 0),
    // Lower pentagon (7-11) 
    ...calculatePentagonVertices(-radius * 0.5, radius * 0.6, Math.PI / 5)
  ];
  
  // Define face indices (groups of 3 for triangulation)
  const indices = [
    // Upper kites (10 triangles for 5 faces)
    0, 3, 2,  0, 4, 3,  0, 5, 4,  0, 6, 5,  0, 2, 6,
    2, 3, 7,  3, 4, 8,  4, 5, 9,  5, 6, 10, 6, 2, 11,
    // Lower kites (10 triangles for 5 faces)
    7, 3, 8,  8, 4, 9,  9, 5, 10, 10, 6, 11, 11, 2, 7,
    7, 8, 1,  8, 9, 1,  9, 10, 1, 10, 11, 1, 11, 7, 1
  ];
  
  return new THREE.PolyhedronGeometry(vertices, indices, radius, 0);
}

function calculatePentagonVertices(y: number, radius: number, offset: number): number[] {
  const verts: number[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) + offset - Math.PI / 2;
    verts.push(
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    );
  }
  return verts;
}
```

### Usage
```typescript
case 10: // d10
  geometry = createD10GeometryFromPolyhedron(dieSize);
  shape = new CANNON.Sphere(dieSize * 0.7);
  break;
```

### Advantages
✅ Leverages Three.js built-in polyhedron system  
✅ Automatic UV coordinate generation  
✅ Subdivision support (detail parameter)  
✅ Cleaner API than raw BufferGeometry

### Disadvantages
❌ Still requires manual vertex/index calculation  
❌ Default UV mapping may not align with face numbers  
❌ Less control over face organization

---

## Option 3: Hybrid - Use IcosahedronGeometry with Modified UV Mapping

### Approach
Keep existing `IcosahedronGeometry` but create custom UV mapping that groups triangular faces into 10 logical faces.

### Implementation

```typescript
function remapIcosahedronAsD10(geometry: THREE.IcosahedronGeometry): void {
  // Icosahedron has 20 triangular faces
  // Group them into 10 pairs to simulate kite faces
  // Each "kite" face on d10 = 2 triangular faces on icosahedron
  
  const positions = geometry.attributes.position;
  const uvAttribute = geometry.attributes.uv;
  const uvArray = uvAttribute.array as Float32Array;
  
  // Analyze face normals and group adjacent triangles
  const faceGroups: number[][] = [];
  const triangleCount = positions.count / 3;
  const processed = new Set<number>();
  
  for (let i = 0; i < triangleCount; i++) {
    if (processed.has(i)) continue;
    
    const i1 = i * 3;
    const normal1 = calculateFaceNormal(positions, i1);
    const center1 = calculateFaceCenter(positions, i1);
    
    // Find adjacent triangle with similar orientation
    for (let j = i + 1; j < triangleCount; j++) {
      if (processed.has(j)) continue;
      
      const j1 = j * 3;
      const normal2 = calculateFaceNormal(positions, j1);
      const center2 = calculateFaceCenter(positions, j1);
      
      // Check if triangles are adjacent and coplanar-ish
      const dotProduct = normal1.dot(normal2);
      const distance = center1.distanceTo(center2);
      
      if (dotProduct > 0.95 && distance < geometry.parameters.radius * 0.5) {
        faceGroups.push([i, j]);
        processed.add(i);
        processed.add(j);
        break;
      }
    }
  }
  
  // Apply UV mapping per face group (each group = one d10 face)
  // Map each group to one of 10 cells in texture atlas
  // ... (similar to existing applyPolyhedronUVMapping logic)
}
```

### Advantages
✅ Minimal changes to existing codebase  
✅ Reuses working physics approximation  
✅ No need to define custom geometry

### Disadvantages
❌ Geometrically incorrect (still 20 faces, not 10)  
❌ Complex face grouping logic  
❌ May confuse players visually  
❌ Harder to get proper face orientation

---

## Option 4: Import Pre-Made D10 Model

### Approach
Use a 3D modeling tool (Blender) to create accurate d10, export as glTF/GLB, load with Three.js loaders.

### Implementation

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('/models/d10.glb', (gltf) => {
  geometry = gltf.scene.children[0].geometry;
  // Apply UV mapping
  applyDiceUVMapping(geometry, 10);
});
```

### File Requirements
- `public/models/d10.glb`: Pre-modeled pentagonal trapezohedron
- Proper UV unwrapping in Blender
- Optimized polygon count for real-time rendering

### Advantages
✅ Perfect geometry from 3D modeling software  
✅ Professional UV unwrapping tools  
✅ Can include pre-baked details  
✅ Easy to iterate in modeling software

### Disadvantages
❌ Adds external file dependency  
❌ Async loading complexity  
❌ Requires 3D modeling expertise  
❌ Larger bundle size  
❌ Caching considerations

---

## Option 5: Parametric Geometry Generator Library

### Approach
Use a library like `three-mesh-bvh` or create parametric generator for various dice polyhedra.

### Implementation

```typescript
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';

function d10ParametricFunction(u: number, v: number, target: THREE.Vector3) {
  // Map [0,1]x[0,1] parameter space to pentagonal trapezohedron surface
  // Complex mathematics involving pentagonal rings and kite faces
  // ...
}

const geometry = new ParametricGeometry(d10ParametricFunction, 20, 10);
```

### Advantages
✅ Highly flexible  
✅ Can adjust detail level  
✅ Mathematically precise

### Disadvantages
❌ Very complex mathematics  
❌ Difficult UV parameterization  
❌ Overkill for dice geometry  
❌ Performance overhead

---

## Comparison Matrix

| Option | Accuracy | Complexity | Performance | UV Control | Maintenance |
|--------|----------|------------|-------------|-----------|-------------|
| **Option 1: Custom BufferGeometry** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Option 2: PolyhedronGeometry** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Option 3: Modified Icosahedron** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Option 4: Import Model** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Option 5: Parametric** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## Recommended Solution: Option 1 (Custom BufferGeometry)

### Rationale
1. **Geometric Accuracy**: True pentagonal trapezohedron with 10 faces
2. **UV Control**: Complete control over texture coordinate assignment
3. **Performance**: Native Three.js geometry, no external dependencies
4. **Integration**: Fits seamlessly into existing `DiceTextureAtlas.ts` system
5. **Physics Compatibility**: Works with current Cannon.js approximation
6. **0-9 Numbering**: Can properly map faces to 0-9 texture atlas cells

### Integration with Existing Code

#### Step 1: Add Geometry Function
Create new file: `frontend/components/dice/D10Geometry.ts`

```typescript
import * as THREE from 'three';

export function createD10Geometry(radius: number = 1): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // [Implementation from Option 1 above]
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}
```

#### Step 2: Update CannonDiceOverlay.tsx

```typescript
import { createD10Geometry } from './D10Geometry';

// In createDie function:
case 10: // d10
  geometry = createD10Geometry(dieSize);
  shape = new CANNON.Sphere(dieSize * 0.7);
  break;
```

#### Step 3: Update DiceTextureAtlas.ts UV Mapping

The existing `applyPolyhedronUVMapping` function should work correctly with proper face detection, but may need adjustment for d10's unique topology:

```typescript
// In applyPolyhedronUVMapping:
if (numFaces === 10) {
  // D10-specific face grouping
  // Each kite face is composed of 2 triangles
  // Threshold should group adjacent triangles into kite faces
  const threshold = 0.9999; // Already implemented correctly
}
```

#### Step 4: Verify Face Numbering

Ensure `assignDiceFaceNumbers` properly handles d10:

```typescript
} else if (numFaces === 10) {
  // D10: 0-9 numbering
  // Odd numbers (1,3,5,7,9) at top apex
  // Even numbers (0,2,4,6,8) at bottom apex
  indexedFaces.sort((a, b) => {
    const yDiff = b.normal.y - a.normal.y;
    if (Math.abs(yDiff) > 0.3) return yDiff;
    
    const angleA = Math.atan2(a.normal.z, a.normal.x);
    const angleB = Math.atan2(b.normal.z, b.normal.x);
    return angleA - angleB;
  });
}
```

---

## Physics Considerations

### Collision Shape Options

1. **Sphere (Current)**: `CANNON.Sphere(radius * 0.7)`
   - ✅ Fast collision detection
   - ✅ Stable rolling behavior
   - ❌ Doesn't match visual geometry

2. **ConvexPolyhedron** (Better):
```typescript
import * as CANNON from 'cannon-es';

function createD10PhysicsShape(radius: number): CANNON.ConvexPolyhedron {
  // Extract vertices from geometry
  const vertices = [/* d10 vertices */];
  
  // Define faces (each face has 4 vertices for kite shape)
  const faces = [
    [0, 2, 7, 3],   // Face 0
    [0, 3, 8, 4],   // Face 1
    // ... etc for all 10 faces
  ];
  
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}
```
   - ✅ Accurate collision
   - ✅ Realistic rolling
   - ❌ More computational overhead

3. **Hybrid Approach**:
   - Use Sphere for initial throwing/rolling
   - Switch to ConvexPolyhedron when velocity drops for accurate settling

---

## Testing Strategy

### Visual Verification
1. Render d10 in isolation with wireframe mode
2. Verify 10 distinct faces (not 20)
3. Check vertex positions match pentagonal trapezohedron
4. Confirm kite-shaped faces (not triangles)

### UV Mapping Verification
1. Apply test texture with numbered cells 0-9
2. Roll d10 multiple times
3. Verify each number appears exactly once
4. Check number orientation (upright on face)
5. Confirm no stretching or distortion

### Physics Verification
1. Roll d10 1000 times
2. Record frequency distribution of results
3. Confirm approximately equal distribution (±5%)
4. Check for bias toward certain faces
5. Verify proper settling behavior

### Code Verification
```typescript
// Test geometry properties
const geometry = createD10Geometry(1);
console.assert(geometry.attributes.position.count === 12, 'D10 should have 12 vertices');

// Count unique faces
const faceCount = geometry.index!.count / 3; // Triangles
console.log(`D10 has ${faceCount} triangles (should be 20 for 10 kite faces)`);
```

---

## Implementation Timeline

### Phase 1: Geometry Creation (1-2 hours)
- Create `D10Geometry.ts` with vertex calculations
- Implement face indices for kite topology
- Test rendering in isolation

### Phase 2: Integration (1 hour)
- Update `CannonDiceOverlay.tsx` case statement
- Verify geometry renders correctly in scene
- Check physics approximation

### Phase 3: UV Mapping (2-3 hours)
- Test existing UV mapping with d10
- Adjust face grouping threshold if needed
- Verify 0-9 numbering displays correctly
- Fix any stretching or orientation issues

### Phase 4: Physics Tuning (1-2 hours)
- Test rolling behavior
- Adjust sphere radius if needed
- Optionally implement ConvexPolyhedron
- Verify fair distribution of results

### Phase 5: Testing & Polish (1-2 hours)
- Comprehensive visual testing
- Statistical fairness testing
- Cross-browser verification
- Performance profiling

**Total Estimated Time: 6-10 hours**

---

## Future Enhancements

### Render Quality Options
- **LOD (Level of Detail)**: Lower polygon count for distant dice
- **Instanced Rendering**: Multiple d10s with shared geometry
- **Subsurface Scattering**: Translucent dice material

### Geometric Variations
- **Rounded Edges**: Chamfer vertices for more realistic appearance
- **Variable Proportions**: Adjust height-to-radius ratio
- **Patent Variations**: Different d10 designs (1906 patent vs modern)

### Texture Options
- **Material Types**: Plastic, metal, wood, stone
- **Wear Patterns**: Procedural aging for vintage look
- **Custom Logos**: User-uploaded face decals
- **Animated Textures**: Glowing or shifting patterns

---

## References

### Mathematical
- Pentagonal Trapezohedron properties from geometric research document
- Kite face angles: 108° × 3 and 36° × 1
- Golden ratio relationships in pentagon construction

### Three.js Documentation
- [`BufferGeometry`](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [`PolyhedronGeometry`](https://threejs.org/docs/#api/en/geometries/PolyhedronGeometry)
- [Geometry Creation Examples](https://threejs.org/examples/#webgl_geometry_shapes)

### Cannon.js Physics
- [`ConvexPolyhedron`](https://pmndrs.github.io/cannon-es/docs/classes/ConvexPolyhedron.html)
- [Collision Detection](https://pmndrs.github.io/cannon-es/docs/modules.html#collision)

### Existing Code
- `frontend/components/dice/DiceTextureAtlas.ts` - UV mapping system
- `frontend/components/dice/CannonDiceOverlay.tsx` - Physics integration
- `docs/Dice_Geometry_Reference.md` - Polyhedral dice geometry research

---

## Conclusion

**Option 1 (Custom BufferGeometry)** provides the best balance of accuracy, performance, and maintainability for implementing a proper d10 pentagonal trapezohedron in Three.js. The geometry can be mathematically constructed with 12 vertices and 10 kite faces, integrated seamlessly with the existing UV mapping system, and approximated with sphere physics for optimal performance.

The implementation is straightforward, requires no external dependencies, and gives complete control over the geometry topology and texture mapping. This ensures players see an authentic d10 with proper 0-9 numbering and realistic rolling behavior.
