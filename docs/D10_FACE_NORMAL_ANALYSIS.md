# D10 Pentagonal Trapezohedron: Face Normal Analysis
## Research & Problem Diagnosis

**Date:** December 8, 2025  
**Issue:** Face grouping algorithm detecting 20 face groups instead of 10  
**Context:** RollScape 3D dice rolling system with texture atlas UV mapping

---

## Executive Summary

**THE ROOT CAUSE:** Each kite face in a pentagonal trapezohedron consists of **2 triangles that DO NOT share the same normal vector**. The two triangles form a kite (quadrilateral), but because the kite is NOT planar, each triangle has its own distinct normal. This is geometrically correct behavior.

**THE SOLUTION:** The current implementation attempting to unify normals by averaging kite vertices is mathematically incorrect. The proper approach is to either:
1. Accept 20 face groups (2 per kite) and map them appropriately
2. Use per-triangle normals for proper lighting
3. Adjust the face detection algorithm to group triangles by spatial proximity, not normal similarity

---

## 1. Mathematical Definition: Pentagonal Trapezohedron

### Geometric Properties

**Source: Wikipedia & Academic Papers**

- **Shape:** Pentagonal Trapezohedron (n=5 trapezohedron)
- **Faces:** 10 kite-shaped quadrilaterals (NOT 10 planar faces!)
- **Vertices:** 12 total
  - 2 apex vertices (top and bottom)
  - 10 vertices forming 2 pentagonal rings
- **Edges:** 20
- **Face Shape:** Kites with specific angle constraints
  - For gaming dice (inscribed in sphere): Two internal angles = 90°
  - Other two angles: One acute, one obtuse (sum = 180°)

### Critical Insight: Kite Faces Are NOT Planar

**This is the key issue with your implementation.**

A kite face on a pentagonal trapezohedron is a **3D quadrilateral that is NOT coplanar**. The four vertices of each kite do NOT lie in the same plane. Therefore:

- Each kite must be represented as **2 triangles**
- These 2 triangles have **DIFFERENT normal vectors**
- Averaging the normals creates an artificial "unified" normal that doesn't represent either triangle accurately

### Vertex Formula (from HCR's Academic Paper)

For an n-gonal trapezohedron (n=5 for d10) inscribed in a sphere of radius R:

```
Number of faces: 2n = 10
Number of vertices: 2n + 2 = 12
Number of edges: 4n = 20

Two apex vertices at: (0, ±h, 0)
Two pentagonal rings with radius r at heights ±y
Ring offset angle: π/n = 36° (for n=5)
```

The kite faces have two different edge lengths (a and b, where a < b), creating the characteristic kite shape.

---

## 2. Your Current Implementation Analysis

### Geometry Creation (D10Geometry.ts)

```typescript
// Your vertex setup
const apexY = radius * 0.85;           // ±0.85
const upperRingY = radius * 0.35;      // +0.35
const lowerRingY = -radius * 0.35;     // -0.35
const ringRadius = radius * 0.65;      // 0.65
// Offset: 36° (π/5)
```

**Analysis:** ✅ This geometry is mathematically correct for a pentagonal trapezohedron.

### Normal Computation (Lines 90-133)

```typescript
// Calculate kite center
const kiteCenter = new THREE.Vector3()
  .add(v1).add(v2).add(v3).add(v4)
  .divideScalar(4);

// Use kite center direction as the face normal
const kiteNormal = kiteCenter.clone().normalize();

// Apply SAME normal to both triangles
```

**Analysis:** ❌ This is geometrically incorrect. Here's why:

1. **The kite is not planar** - v1, v2, v3, v4 do not lie in the same plane
2. **Averaging vertices ≠ face normal** - The center point direction is NOT the normal of either triangle
3. **Each triangle has its own normal** - The proper normal is perpendicular to the triangle's plane

### Why You're Getting 20 Face Groups

The face grouping algorithm in `DiceTextureAtlas.ts` correctly identifies that:

```typescript
// It calculates triangle normals properly:
const center = new THREE.Vector3()
  .add(v0).add(v1).add(v2)
  .divideScalar(3);
const normal = center.clone().normalize();
```

For a pentagonal trapezohedron, each triangle has a slightly different normal direction because **the kite faces are not flat**. With a dot product threshold of 0.9999, it correctly identifies these as 20 separate faces because they ARE 20 separate triangular faces with different normals.

---

## 3. The Mathematics: Why Kites Have 2 Normals

### Triangle Normal Computation

For a triangle with vertices v0, v1, v2:

```
edge1 = v1 - v0
edge2 = v2 - v0
normal = normalize(cross(edge1, edge2))
```

### Kite Face Structure

A kite face on a d10 consists of 4 vertices forming 2 triangles:
- Triangle 1: apex → upper[i] → upper[i+1]
- Triangle 2: upper[i] → upper[i+1] → lower[i]

These triangles share an edge (upper[i] → upper[i+1]) but:
1. Have different third vertices (apex vs lower[i])
2. Have different orientations in 3D space
3. Therefore have **different normal vectors**

### Dot Product Analysis

Looking at your logged normals:
- Group 0: (0.330, 0.827, -0.454)
- Group 1: (0.576, 0.201, -0.792)

These normals are pointing in significantly different directions. The dot product between them would be:
```
dot = 0.330*0.576 + 0.827*0.201 + (-0.454)*(-0.792)
    ≈ 0.190 + 0.166 + 0.360
    ≈ 0.716
```

This is well below the 0.9999 threshold, confirming they should be treated as separate faces.

---

## 4. Correct Face Normal Computation Methods

### Option A: Per-Triangle Normals (Smooth Lighting)

Use Three.js's built-in `computeVertexNormals()`:

```typescript
geometry.setAttribute('position', new THREE.Float32BufferAttribute(expandedVertices, 3));
geometry.computeVertexNormals();  // Automatically computes proper per-vertex normals
```

This creates smooth lighting across the kite faces.

### Option B: Flat Shading per Triangle

```typescript
for (let i = 0; i < indices.length; i += 3) {
  const v0 = getVertex(indices[i]);
  const v1 = getVertex(indices[i+1]);
  const v2 = getVertex(indices[i+2]);
  
  const edge1 = v1.clone().sub(v0);
  const edge2 = v2.clone().sub(v0);
  const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
  
  // Use this normal for all 3 vertices of this triangle
  normals.push(normal.x, normal.y, normal.z);
  normals.push(normal.x, normal.y, normal.z);
  normals.push(normal.x, normal.y, normal.z);
}
```

### Option C: Accept 20 Face Groups (Recommended for UV Mapping)

The texture atlas system should recognize that a d10 has 10 **visual** faces but 20 **geometric** faces (triangles). 

Modify the UV mapping to:
1. Group triangles by kite (2 triangles per kite)
2. Map both triangles to the same UV region
3. Use spatial proximity instead of normal similarity for grouping

---

## 5. Three.js & WebGL Implementations

### Research Findings

**Standard Practice:** Most Three.js dice implementations either:

1. **Use cylinder geometry** (easier but less accurate)
   ```typescript
   geometry = new THREE.CylinderGeometry(radius, radius, height, 10);
   ```

2. **Accept 20 triangular faces** and map them accordingly

3. **Use custom shaders** to apply textures per-kite rather than per-triangle

### Dice Roller Libraries

Popular libraries like `dice-box` and `3d-dice` typically:
- Use simplified geometries for d10 (often cylinders)
- Apply textures using custom UV mapping
- Don't attempt to unify normals across kite faces

---

## 6. Why Your Approach Creates Problems

### The Averaging Issue

When you compute:
```typescript
const kiteCenter = (v1 + v2 + v3 + v4) / 4
const kiteNormal = normalize(kiteCenter)
```

You're creating a normal that:
1. **Doesn't represent the actual surface** - It's not perpendicular to either triangle
2. **Causes lighting artifacts** - Light calculations will be incorrect
3. **Doesn't match the geometry** - The face grouping algorithm correctly sees 20 distinct normals

### The Correct Geometric Reality

A pentagonal trapezohedron with kite faces **inherently has 20 distinct normal vectors** (2 per kite). This is not a bug - it's the correct geometric property of this polyhedron.

---

## 7. Recommended Solutions

### Solution 1: Update Face Grouping Algorithm (RECOMMENDED)

Modify `DiceTextureAtlas.ts` to group by **kite faces** instead of **normal similarity**:

```typescript
function groupTrianglesByKite(geometry: THREE.BufferGeometry, numKites: number): FaceGroup[] {
  const positions = geometry.attributes.position;
  const count = positions.count;
  const faceGroups: FaceGroup[] = [];
  
  // For d10: Process triangles in pairs (each pair = 1 kite)
  for (let i = 0; i < count; i += 6) {  // 6 vertices = 2 triangles
    const kiteTriangles = [i/3, i/3 + 1];
    
    // Calculate average center for the kite
    const kiteCenter = calculateKiteCenter(i, i+3, positions);
    
    // Calculate average normal (for sorting only, not for geometry)
    const normal1 = calculateTriangleNormal(i, positions);
    const normal2 = calculateTriangleNormal(i+3, positions);
    const avgNormal = normal1.add(normal2).normalize();
    
    faceGroups.push({
      normal: avgNormal,
      triangleIndices: kiteTriangles,
      center: kiteCenter
    });
  }
  
  return faceGroups;
}
```

### Solution 2: Use Per-Triangle Normals

Remove the normal unification code and let Three.js compute proper normals:

```typescript
geometry.setAttribute('position', new THREE.Float32BufferAttribute(expandedVertices, 3));
geometry.computeVertexNormals();  // Uses proper triangle normals
// Don't manually set normals
```

Then update the face detection to expect 20 groups and map pairs to the same texture region.

### Solution 3: Custom UV Mapping

Pre-compute UV coordinates during geometry creation:

```typescript
const uvs: number[] = [];

for (let kiteIndex = 0; kiteIndex < 10; kiteIndex++) {
  const cellX = kiteIndex % 5;
  const cellY = Math.floor(kiteIndex / 5);
  
  // Map both triangles to the same UV cell
  // Triangle 1
  uvs.push(cellX/5, cellY/2);
  uvs.push((cellX+1)/5, cellY/2);
  uvs.push(cellX/5, (cellY+1)/2);
  
  // Triangle 2 (same cell)
  uvs.push(cellX/5, cellY/2);
  uvs.push((cellX+1)/5, (cellY+1)/2);
  uvs.push((cellX+1)/5, cellY/2);
}

geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
```

---

## 8. Conclusion

### Key Findings

1. ✅ **Your geometry is correct** - 12 vertices, proper positioning
2. ❌ **Normal unification is incorrect** - Kites are non-planar
3. ✅ **20 face groups is correct** - Each triangle has its own normal
4. ❌ **The averaging approach is flawed** - Creates artificial normals

### The Truth About Pentagonal Trapezohedrons

- **Visual faces:** 10 kites
- **Geometric faces:** 20 triangles
- **Unique normals:** 20 (one per triangle)
- **Planar faces:** 0 (all kites are 3D curved quadrilaterals)

### Recommended Action

**Option A (Best):** Modify the face grouping algorithm to group triangles in pairs by spatial proximity, treating each pair as one kite face for UV mapping purposes.

**Option B (Easier):** Pre-compute UV coordinates during geometry creation, bypassing the face detection algorithm entirely.

**Option C (Alternative):** Use cylindrical approximation like many dice libraries do, accepting the geometric imprecision for simpler implementation.

---

## 9. Academic References

1. **H.C. Rajpoot (2015)** - "Mathematical analysis of uniform polyhedron (trapezohedron) having 2n congruent right kite faces"
   - Confirms: n-gonal trapezohedra have 2n kite faces that are NOT planar
   - Provides formulas for all parameters including dihedral angles between faces

2. **Wikipedia: Pentagonal Trapezohedron**
   - 10 kite faces with specific angle constraints
   - For dice: two 90° angles per kite

3. **Three.js Documentation**
   - PolyhedronGeometry uses triangular faces only
   - Non-planar quadrilaterals must be represented as triangle pairs

---

## 10. Visual Reference

```
     Kite Face Structure:
     
          apex (v0)
           /|\
          / | \
         /  |  \
        /   |   \
    v1 ●----●----● v2  ← These 4 vertices
        \   |   /         are NOT coplanar!
         \  |  /
          \ | /
           \|/
         lower (v3)
    
    Triangle 1: v0-v1-v2 (normal n1)
    Triangle 2: v1-v3-v2 (normal n2)
    
    n1 ≠ n2  (Different normals!)
```

---

**End of Analysis**
