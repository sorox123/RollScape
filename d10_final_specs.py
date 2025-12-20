import math
import numpy as np

print('=' * 80)
print('DEFINITIVE D10 PENTAGONAL TRAPEZOHEDRON SPECIFICATIONS')
print('For Standard Gaming Dice (Chessex-style)')
print('=' * 80)
print()

n = 5  # pentagonal
R = 1.0  # circumradius

# CRITICAL CONSTRAINT: All vertices on sphere, radius R
# For gaming d10: h = R × sin(18°), r = R × cos(18°)
h = R * math.sin(math.radians(18))
r = math.sqrt(R**2 - h**2)
z = R

print('GEOMETRIC PARAMETERS (normalized to circumradius R = 1):')
print('─' * 80)
print(f'Circumradius R:           {R:.8f}')
print(f'Ring radius r:            {r:.8f}  = R × cos(18°)')
print(f'Ring height ±h:           ±{h:.8f}  = R × sin(18°)')
print(f'Apex height ±z:           ±{z:.8f}  = R')
print(f'Angular offset:           36° = π/5 radians')
print()

print('KEY RATIOS:')
print('─' * 80)
print(f'Height to diameter:       {2*z / (2*r):.8f}')
print(f'Ring separation (2h):     {2*h:.8f}')
print(f'Total height (2z):        {2*z:.8f}')
print(f'h/R ratio:                {h/R:.8f}  = sin(18°) = (√5-1)/4')
print(f'r/R ratio:                {r/R:.8f}  = cos(18°) = √(10+2√5)/4')
print()

# Verify spherical constraint
ring_dist = math.sqrt(r**2 + h**2)
apex_dist = abs(z)
print(f'SPHERICAL VERIFICATION:')
print('─' * 80)
print(f'Distance to ring vertices:  {ring_dist:.8f}')
print(f'Distance to apex vertices:  {apex_dist:.8f}')
print(f'Difference:                 {abs(ring_dist - apex_dist):.2e}')
if abs(ring_dist - apex_dist) < 1e-10:
    print('✓ All vertices lie on circumsphere')
print()

# Define all 12 vertices
apex_top = np.array([0, 0, z])
apex_bottom = np.array([0, 0, -z])

upper_ring = []
for i in range(n):
    angle = 2 * math.pi * i / n
    upper_ring.append(np.array([r * math.cos(angle), r * math.sin(angle), h]))

lower_ring = []
for i in range(n):
    angle = 2 * math.pi * i / n + math.pi/n  # offset by 36°
    lower_ring.append(np.array([r * math.cos(angle), r * math.sin(angle), -h]))

def vector_angle(v1, v2):
    """Angle between two vectors from origin"""
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    return math.degrees(math.acos(np.clip(cos_angle, -1, 1)))

def interior_angle(center, v1, v2):
    """Interior angle at center between vectors to v1 and v2"""
    edge1 = v1 - center
    edge2 = v2 - center
    cos_angle = np.dot(edge1, edge2) / (np.linalg.norm(edge1) * np.linalg.norm(edge2))
    return math.degrees(math.acos(np.clip(cos_angle, -1, 1)))

print('FACE TOPOLOGY:')
print('─' * 80)
print('10 kite faces, each connecting:')
print('  - Top apex to two adjacent upper ring vertices')
print('  - One lower ring vertex between them')
print()
print('Example: Face 0 connects:')
print('  Apex_top -> Upper[0] -> Lower[0] -> Upper[1] -> back to Apex_top')
print()

# Analyze face 0 (top pyramid face)
v0 = apex_top
v1 = upper_ring[0]
v2 = lower_ring[0]
v3 = upper_ring[1]

angle_at_apex = interior_angle(v0, v1, v3)
angle_at_v1 = interior_angle(v1, v0, v2)
angle_at_v2 = interior_angle(v2, v1, v3)
angle_at_v3 = interior_angle(v3, v2, v0)

print('KITE FACE ANGLES (Face 0 - upper pyramid):')
print('─' * 80)
print(f'At apex (top):         {angle_at_apex:.4f}°')
print(f'At upper ring [0]:     {angle_at_v1:.4f}°')
print(f'At lower ring [0]:     {angle_at_v2:.4f}°')
print(f'At upper ring [1]:     {angle_at_v3:.4f}°')
print(f'Sum:                   {angle_at_apex + angle_at_v1 + angle_at_v2 + angle_at_v3:.4f}°')
print()

# Check bottom face
v0_b = apex_bottom
v1_b = lower_ring[0]
v2_b = upper_ring[1]
v3_b = lower_ring[1]

angle_at_apex_b = interior_angle(v0_b, v1_b, v3_b)
angle_at_v1_b = interior_angle(v1_b, v0_b, v2_b)
angle_at_v2_b = interior_angle(v2_b, v1_b, v3_b)
angle_at_v3_b = interior_angle(v3_b, v2_b, v0_b)

print('KITE FACE ANGLES (Face 5 - lower pyramid):')
print('─' * 80)
print(f'At apex (bottom):      {angle_at_apex_b:.4f}°')
print(f'At lower ring [0]:     {angle_at_v1_b:.4f}°')
print(f'At upper ring [1]:     {angle_at_v2_b:.4f}°')
print(f'At lower ring [1]:     {angle_at_v3_b:.4f}°')
print(f'Sum:                   {angle_at_apex_b + angle_at_v1_b + angle_at_v2_b + angle_at_v3_b:.4f}°')
print()

# Edge lengths
edge_apex_to_ring = np.linalg.norm(v1 - v0)
edge_ring_to_ring_adjacent = np.linalg.norm(v2 - v1)
edge_ring_to_ring_same = np.linalg.norm(v3 - v1)

print('EDGE LENGTHS:')
print('─' * 80)
print(f'Apex to ring vertex:         {edge_apex_to_ring:.8f}')
print(f'Ring to opposite ring:       {edge_ring_to_ring_adjacent:.8f}')
print(f'Between adjacent ring verts: {edge_ring_to_ring_same:.8f}')
print()

print('=' * 80)
print('EXACT MATHEMATICAL FORMULAS:')
print('=' * 80)
print()
print('For circumradius R:')
print('  Ring radius:  r = R × cos(18°) = R × cos(π/10)')
print('  Ring height:  h = R × sin(18°) = R × sin(π/10)')
print('  Apex height:  z = R')
print()
print('Pentagon offset angle: 36° = 2π/10 = π/5')
print()
print('Exact values using golden ratio φ = (1+√5)/2:')
print(f'  sin(18°) = (√5 - 1) / 4 = 1/(2φ) = {(math.sqrt(5)-1)/4:.10f}')
print(f'  cos(18°) = √(10 + 2√5) / 4      = {math.sqrt(10 + 2*math.sqrt(5))/4:.10f}')
print()

print('=' * 80)
print('IMPLEMENTATION CODE:')
print('=' * 80)
print()
print('// JavaScript/TypeScript for Three.js')
print('const D10_GEOMETRY = {')
print(f'  circumradius: 1.0,')
print(f'  ringRadius: Math.cos(Math.PI / 10),  // {r:.8f}')
print(f'  ringHeight: Math.sin(Math.PI / 10),  // {h:.8f}')
print(f'  apexHeight: 1.0,')
print(f'  ringOffset: Math.PI / 5,  // 36 degrees')
print(f'  numSides: 5')
print('};')
print()
print('// Generate vertices:')
print('function generateD10Vertices(radius = 1) {')
print('  const r = radius * D10_GEOMETRY.ringRadius;')
print('  const h = radius * D10_GEOMETRY.ringHeight;')
print('  const z = radius * D10_GEOMETRY.apexHeight;')
print('  ')
print('  const vertices = [')
print('    [0, 0, z],   // top apex')
print('    [0, 0, -z],  // bottom apex')
print('  ];')
print('  ')
print('  // Upper ring (5 vertices)')
print('  for (let i = 0; i < 5; i++) {')
print('    const angle = (Math.PI * 2 * i) / 5;')
print('    vertices.push([r * Math.cos(angle), r * Math.sin(angle), h]);')
print('  }')
print('  ')
print('  // Lower ring (5 vertices, offset by 36°)')
print('  for (let i = 0; i < 5; i++) {')
print('    const angle = (Math.PI * 2 * i) / 5 + Math.PI / 5;')
print('    vertices.push([r * Math.cos(angle), r * Math.sin(angle), -h]);')
print('  }')
print('  ')
print('  return vertices;')
print('}')
print()

print('=' * 80)
print('PHYSICAL MEASUREMENTS:')
print('=' * 80)
print()
print('Typical Chessex d10 physical dimensions:')
print()
for diam in [15, 16, 17]:
    scale = diam / (2*r)
    height = 2 * z * scale
    ring_h = h * scale
    apex_h = z * scale
    print(f'Diameter {diam}mm:')
    print(f'  Total height:     {height:.2f} mm')
    print(f'  Apex height:      ±{apex_h:.2f} mm')
    print(f'  Ring height:      ±{ring_h:.2f} mm')
    print(f'  Ring separation:  {2*ring_h:.2f} mm')
    print()
