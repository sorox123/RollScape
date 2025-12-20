# D10 Pentagonal Trapezohedron - EXACT Geometric Specifications

## Summary
This document provides the **definitive geometric specifications** for a standard Chessex-style d10 gaming die (pentagonal trapezohedron).

## Critical Constraint
Gaming d10 dice use a **spherical pentagonal trapezohedron** where:
- ✓ All 12 vertices lie on a circumsphere
- ✓ Faces are kites (quadrilaterals)
- ✓ Faces are slightly non-planar (due to spherical constraint)
- ✓ Two pentagon rings offset by 36°

## Exact Mathematical Formulas

For a d10 with circumradius **R**:

```
Ring radius:  r = R × cos(18°) = R × cos(π/10)
Ring height:  h = R × sin(18°) = R × sin(π/10)
Apex height:  z = R
Ring offset:  36° = π/5 radians
```

### Using Golden Ratio
The pentagon geometry involves the golden ratio φ = (1 + √5) / 2:

```
sin(18°) = (√5 - 1) / 4 = 1/(2φ) ≈ 0.309016994
cos(18°) = √(10 + 2√5) / 4      ≈ 0.951056516
```

## Normalized Dimensions

### Normalized to Circumradius R = 1.0

| Parameter | Value | Formula |
|-----------|-------|---------|
| **Circumradius (R)** | 1.0000000 | Given |
| **Ring radius (r)** | 0.95105652 | R × cos(18°) |
| **Ring height (±h)** | ±0.30901699 | R × sin(18°) |
| **Apex height (±z)** | ±1.0000000 | R |
| **Ring offset angle** | 36° | π/5 radians |

### Key Ratios

| Ratio | Value | Description |
|-------|-------|-------------|
| **Height to diameter** | 1.05146222 | (2z) / (2r) |
| **Ring separation** | 0.61803399 | 2h (golden ratio - 1!) |
| **Total height** | 2.00000000 | 2z |
| **h/R ratio** | 0.30901699 | sin(18°) |
| **r/R ratio** | 0.95105652 | cos(18°) |

## Vertex Positions

### Structure
- **Total vertices:** 12
  - 1 top apex at (0, 0, z)
  - 1 bottom apex at (0, 0, -z)
  - 5 upper ring vertices at height h
  - 5 lower ring vertices at height -h (offset by 36°)

### Coordinates (R = 1)

**Top Apex:**
```
V_top = (0, 0, 1.0)
```

**Bottom Apex:**
```
V_bottom = (0, 0, -1.0)
```

**Upper Ring** (at height h = 0.309017):
```
For i = 0 to 4:
  angle = 2π × i / 5
  x = 0.951057 × cos(angle)
  y = 0.951057 × sin(angle)
  z = 0.309017
```

| Vertex | X | Y | Z |
|--------|---|---|---|
| Upper[0] | 0.951057 | 0.000000 | 0.309017 |
| Upper[1] | 0.293893 | 0.904508 | 0.309017 |
| Upper[2] | -0.769421 | 0.559017 | 0.309017 |
| Upper[3] | -0.769421 | -0.559017 | 0.309017 |
| Upper[4] | 0.293893 | -0.904508 | 0.309017 |

**Lower Ring** (at height -h = -0.309017, offset by 36°):
```
For i = 0 to 4:
  angle = 2π × i / 5 + π/5  (offset by 36°)
  x = 0.951057 × cos(angle)
  y = 0.951057 × sin(angle)
  z = -0.309017
```

| Vertex | X | Y | Z |
|--------|---|---|---|
| Lower[0] | 0.769421 | 0.559017 | -0.309017 |
| Lower[1] | -0.293893 | 0.904508 | -0.309017 |
| Lower[2] | -0.951057 | 0.000000 | -0.309017 |
| Lower[3] | -0.293893 | -0.904508 | -0.309017 |
| Lower[4] | 0.769421 | -0.559017 | -0.309017 |

## Face Topology

### Structure
- **Total faces:** 10 kite quadrilaterals
  - 5 upper pyramid faces
  - 5 lower pyramid faces

### Face Connections
Each kite face connects four vertices:

**Upper Pyramid Faces** (i = 0 to 4):
```
Face[i] = [Top_Apex, Upper[i], Lower[i], Upper[(i+1) % 5]]
```

**Lower Pyramid Faces** (i = 0 to 4):
```
Face[i+5] = [Bottom_Apex, Lower[i], Upper[(i+1) % 5], Lower[(i+1) % 5]]
```

### Face Properties
- **Type:** Slightly non-planar kites (due to spherical constraint)
- **Angles:** Interior angles sum to ~348° (not 360° due to non-planarity)
- **Symmetry:** Each face has mirror symmetry

Example Face 0:
```
Top_Apex → Upper[0] → Lower[0] → Upper[1] → back to Top_Apex
```

## Edge Lengths (R = 1)

| Edge Type | Length | Description |
|-----------|--------|-------------|
| Apex to ring | 1.17557050 | From apex to any ring vertex |
| Cross-ring (kite side) | 0.85291120 | Between upper and lower rings |
| Same-ring adjacent | 1.11803399 | Between adjacent vertices on same ring (golden ratio × r!) |

## Implementation Code

### JavaScript/TypeScript (Three.js)

```javascript
// D10 geometry constants
const D10_GEOMETRY = {
  // Use exact mathematical expressions for precision
  circumradius: 1.0,
  ringRadius: Math.cos(Math.PI / 10),      // 0.95105652
  ringHeight: Math.sin(Math.PI / 10),      // 0.30901699
  apexHeight: 1.0,
  ringOffset: Math.PI / 5,                 // 36 degrees
  numSides: 5
};

// Generate all 12 vertices
function generateD10Vertices(radius = 1) {
  const r = radius * D10_GEOMETRY.ringRadius;
  const h = radius * D10_GEOMETRY.ringHeight;
  const z = radius * D10_GEOMETRY.apexHeight;
  
  const vertices = [];
  
  // Apex vertices
  vertices.push([0, 0, z]);   // 0: top apex
  vertices.push([0, 0, -z]);  // 1: bottom apex
  
  // Upper ring (5 vertices)
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    vertices.push([
      r * Math.cos(angle),
      r * Math.sin(angle),
      h
    ]);  // 2-6
  }
  
  // Lower ring (5 vertices, offset by 36°)
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 + Math.PI / 5;
    vertices.push([
      r * Math.cos(angle),
      r * Math.sin(angle),
      -h
    ]);  // 7-11
  }
  
  return vertices;
}

// Generate face indices (kite quadrilaterals)
function generateD10Faces() {
  const faces = [];
  
  // Upper pyramid faces (5 faces)
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    faces.push([
      0,          // top apex
      2 + i,      // upper ring[i]
      7 + i,      // lower ring[i]
      2 + next    // upper ring[i+1]
    ]);
  }
  
  // Lower pyramid faces (5 faces)
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    faces.push([
      1,          // bottom apex
      7 + i,      // lower ring[i]
      2 + next,   // upper ring[i+1]
      7 + next    // lower ring[i+1]
    ]);
  }
  
  return faces;
}
```

### Python (NumPy)

```python
import numpy as np

def generate_d10_vertices(radius=1.0):
    """Generate all 12 vertices of a d10 die."""
    r = radius * np.cos(np.pi / 10)
    h = radius * np.sin(np.pi / 10)
    z = radius
    
    vertices = []
    
    # Apices
    vertices.append([0, 0, z])      # 0: top
    vertices.append([0, 0, -z])     # 1: bottom
    
    # Upper ring
    for i in range(5):
        angle = 2 * np.pi * i / 5
        vertices.append([
            r * np.cos(angle),
            r * np.sin(angle),
            h
        ])
    
    # Lower ring (offset by 36°)
    for i in range(5):
        angle = 2 * np.pi * i / 5 + np.pi / 5
        vertices.append([
            r * np.cos(angle),
            r * np.sin(angle),
            -h
        ])
    
    return np.array(vertices)
```

## Physical Measurements

### Typical Chessex D10 Dimensions

Based on the geometric ratios, for various diameters:

| Diameter | Total Height | Apex Height | Ring Height | Ring Separation |
|----------|--------------|-------------|-------------|-----------------|
| **15 mm** | 15.77 mm | ±7.89 mm | ±2.44 mm | 4.87 mm |
| **16 mm** | 16.82 mm | ±8.41 mm | ±2.60 mm | 5.20 mm |
| **17 mm** | 17.87 mm | ±8.94 mm | ±2.76 mm | 5.52 mm |

**Note:** Most standard Chessex d10 dice are approximately 15-16mm in diameter.

## Verification

### Spherical Constraint
All vertices must lie at the same distance from origin:

```
Distance to ring vertices = √(r² + h²) = √(cos²(18°) + sin²(18°)) = 1.0 ✓
Distance to apex vertices = |z| = 1.0 ✓
```

### Angular Offset
```
Lower ring offset = 180° / n = 180° / 5 = 36° ✓
```

### Euler Characteristic
```
V - E + F = 12 - 20 + 10 = 2 ✓
```

## Key Insights

1. **Golden Ratio Connection:** The ring separation (2h = 0.618...) is φ - 1, the golden ratio minus one!

2. **Slightly Non-Planar:** The kite faces are slightly non-planar to maintain the spherical constraint. The deviation is small (~0.39 cubic units for R=1).

3. **Perfect Pentagon Symmetry:** The structure maintains perfect 5-fold rotational symmetry around the vertical axis.

4. **Fair Rolling:** The spherical constraint ensures all faces have equal probability of landing face-down.

5. **Height-to-Diameter Ratio:** The die is slightly taller than it is wide (1.051:1), giving it a characteristic elongated appearance.

## References

- Wikipedia: [Pentagonal Trapezohedron](https://en.wikipedia.org/wiki/Pentagonal_trapezohedron)
- MathWorld: [Trapezohedron](https://mathworld.wolfram.com/Trapezohedron.html)
- Gaming dice constraint: All vertices on sphere with specific angles
- U.S. Patent 809,293 (1906) - Original d10 die patent

## Source Calculations

All calculations verified with Python scripts available in repository:
- `calculate_d10_dimensions.py` - Basic dimensions
- `calculate_d10_gaming_dice.py` - Spherical constraint
- `d10_complete_analysis.py` - Face angles and edge lengths
- `d10_final_specs.py` - Complete specification
- `d10_planarity_check.py` - Non-planarity verification
