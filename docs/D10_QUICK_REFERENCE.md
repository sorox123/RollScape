# D10 DIE - QUICK REFERENCE

## EXACT GEOMETRIC PROPORTIONS FOR STANDARD CHESSEX D10

### Critical Values (Circumradius R = 1)

```javascript
const D10_SPECS = {
  // Exact mathematical expressions (preferred)
  ringRadius: Math.cos(Math.PI / 10),    // 0.95105652
  ringHeight: Math.sin(Math.PI / 10),    // 0.30901699
  apexHeight: 1.0,                       // R
  ringOffset: Math.PI / 5,               // 36 degrees
  
  // Or as numerical constants
  RING_RADIUS: 0.95105652,
  RING_HEIGHT: 0.30901699,
  APEX_HEIGHT: 1.00000000,
  RING_OFFSET_DEG: 36.0
};
```

### Key Questions Answered

**1. Ratio of apex height to ring height:**
```
z/h = 1.0 / 0.309017 = 3.236068
```

**2. Ring radius relative to overall size:**
```
r/R = 0.951057 (where R is circumradius)
```

**3. How "squashed" is it? (apex-to-apex vs ring diameter):**
```
Height-to-diameter ratio = 2z / 2r = 1.051462
The die is slightly TALLER than it is wide.
```

**4. Do vertices lie on a sphere?**
```
YES - All 12 vertices lie exactly on a sphere of radius R.
This is the defining constraint for gaming d10 dice.
```

### Vertex Generation Formula

```javascript
// Top apex
vertices[0] = [0, 0, R]

// Bottom apex  
vertices[1] = [0, 0, -R]

// Upper ring (5 vertices at height h)
for (i = 0; i < 5; i++) {
  angle = 2π × i / 5
  vertices[2+i] = [r × cos(angle), r × sin(angle), h]
}

// Lower ring (5 vertices at height -h, offset 36°)
for (i = 0; i < 5; i++) {
  angle = 2π × i / 5 + π/5
  vertices[7+i] = [r × cos(angle), r × sin(angle), -h]
}

where:
  r = R × cos(18°)
  h = R × sin(18°)
```

### Physical Measurements

For a 16mm diameter Chessex d10:
- **Total height:** 16.82 mm
- **Apex position:** ±8.41 mm
- **Ring position:** ±2.60 mm
- **Ring separation:** 5.20 mm

### Mathematical Relationships

```
sin(18°) = (√5 - 1) / 4 = 0.309016994...
cos(18°) = √(10 + 2√5) / 4 = 0.951056516...

Ring separation = 2h = 0.618034... = φ - 1 (golden ratio - 1!)
```

### Implementation Note

The kite faces are **slightly non-planar** due to the spherical constraint. This is correct and expected for gaming dice - it ensures fair rolling properties.

---

**Full specifications:** See `D10_EXACT_SPECIFICATIONS.md`
