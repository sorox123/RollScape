import math
import numpy as np

n = 5  # pentagonal trapezohedron
R = 1.0  # circumradius

# Gaming d10 with spherical constraint
h = R * math.sin(math.radians(18))
r = math.sqrt(R**2 - h**2)
z_apex = R

print('=' * 75)
print('COMPLETE D10 GAMING DICE GEOMETRIC ANALYSIS')
print('=' * 75)
print()

print('BASIC DIMENSIONS (circumradius = 1):')
print(f'  Ring radius: {r:.6f}')
print(f'  Ring height: ±{h:.6f}')
print(f'  Apex height: ±{z_apex:.6f}')
print(f'  Ring offset: 36°')
print()

# Define vertices
apex_top = np.array([0, 0, z_apex])
apex_bottom = np.array([0, 0, -z_apex])

upper_ring = []
for i in range(n):
    angle = 2 * math.pi * i / n
    x = r * math.cos(angle)
    y = r * math.sin(angle)
    upper_ring.append(np.array([x, y, h]))

lower_ring = []
for i in range(n):
    angle = 2 * math.pi * i / n + math.pi/n  # offset by 36°
    x = r * math.cos(angle)
    y = r * math.sin(angle)
    lower_ring.append(np.array([x, y, -h]))

def angle_between_vectors(v1, v2):
    """Calculate angle between two vectors"""
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    cos_angle = np.clip(cos_angle, -1, 1)
    return math.degrees(math.acos(cos_angle))

print('=' * 75)
print('KITE FACE ANALYSIS:')
print('=' * 75)
print('Each face is a kite with 4 vertices.')
print('Face structure: apex -> upper_ring[i] -> lower_ring[j] -> upper_ring[i+1] -> apex')
print()

# Analyze a single kite face
# Pick apex_top, upper_ring[0], lower_ring[0], upper_ring[1]
v_apex = apex_top
v_upper_0 = upper_ring[0]
v_lower_0 = lower_ring[0]  # This is the closest lower vertex to upper[0]
v_upper_1 = upper_ring[1]

# Calculate edges
edge_apex_to_upper0 = v_upper_0 - v_apex
edge_upper0_to_lower0 = v_lower_0 - v_upper_0
edge_lower0_to_upper1 = v_upper_1 - v_lower_0
edge_upper1_to_apex = v_apex - v_upper_1

# Calculate interior angles
angle_at_apex = angle_between_vectors(-edge_apex_to_upper0, -edge_upper1_to_apex)
angle_at_upper0 = angle_between_vectors(-edge_apex_to_upper0, edge_upper0_to_lower0)
angle_at_lower0 = angle_between_vectors(-edge_upper0_to_lower0, edge_lower0_to_upper1)
angle_at_upper1 = angle_between_vectors(-edge_lower0_to_upper1, edge_upper1_to_apex)

print(f'Sample kite face angles:')
print(f'  At apex vertex: {angle_at_apex:.2f}°')
print(f'  At upper ring vertex: {angle_at_upper0:.2f}°')
print(f'  At lower ring vertex: {angle_at_lower0:.2f}°')
print(f'  At next upper ring vertex: {angle_at_upper1:.2f}°')
print(f'  Sum: {angle_at_apex + angle_at_upper0 + angle_at_lower0 + angle_at_upper1:.2f}°')
print()

# Calculate edge lengths
edge_short = np.linalg.norm(edge_apex_to_upper0)
edge_side = np.linalg.norm(edge_upper0_to_lower0)

print(f'Edge lengths:')
print(f'  Apex to ring: {edge_short:.6f}')
print(f'  Between rings (kite side): {edge_side:.6f}')
print()

print('=' * 75)
print('EXACT FORMULAS (for implementation):')
print('=' * 75)
print()
print('Given circumradius R:')
print('  h = R × sin(18°)')
print('  r = R × cos(18°) = R × √(1 - sin²(18°))')
print('  z = R')
print()
print(f'Numerical values:')
print(f'  sin(18°) = {math.sin(math.radians(18)):.6f}')
print(f'  cos(18°) = {math.cos(math.radians(18)):.6f}')
print()

# Golden ratio appears in pentagon geometry
phi = (1 + math.sqrt(5)) / 2
print('Note: Pentagon geometry involves golden ratio φ = 1.618034')
print(f'  sin(18°) = (√5 - 1) / 4 = 1/(2φ) = {(math.sqrt(5) - 1) / 4:.6f}')
print(f'  cos(18°) = √(10 + 2√5) / 4 = {math.sqrt(10 + 2*math.sqrt(5)) / 4:.6f}')
print()

print('=' * 75)
print('PRACTICAL PHYSICAL MEASUREMENTS:')
print('=' * 75)
print()
print('Chessex d10 measurements (approximate from various sources):')
print('  Option A: 16mm diameter → height ≈ 16.8mm')
print('  Option B: 15mm diameter → height ≈ 15.8mm')
print('  Option C: 18mm diameter → height ≈ 18.9mm')
print()

# Common Chessex d10 is about 15-16mm across
for diameter_mm in [14, 15, 16, 17, 18]:
    scale = diameter_mm / (2*r)
    height = 2 * z_apex * scale
    ring_h = h * scale
    print(f'If diameter = {diameter_mm}mm: height = {height:.1f}mm, ring_height = ±{ring_h:.2f}mm')

print()
print('=' * 75)
print('FINAL IMPLEMENTATION CONSTANTS:')
print('=' * 75)
print()
print('// For Three.js / WebGL implementation:')
print('// Option 1: Normalize to circumradius = 1')
print(f'const D10_RING_RADIUS = {r:.8f};')
print(f'const D10_RING_HEIGHT = {h:.8f};')
print(f'const D10_APEX_HEIGHT = {z_apex:.8f};')
print(f'const D10_RING_OFFSET = Math.PI / 5;  // 36 degrees')
print()
print('// Option 2: As ratios (most flexible)')
print(f'const D10_H_TO_R_RATIO = {h/R:.8f};  // sin(18°)')
print(f'const D10_RING_TO_R_RATIO = {r/R:.8f};  // cos(18°)')
print()
print('// Option 3: Exact mathematical expressions')
print('const D10_H_TO_R_RATIO = Math.sin(Math.PI / 10);  // sin(18°)')
print('const D10_RING_TO_R_RATIO = Math.cos(Math.PI / 10);  // cos(18°)')
print('const D10_APEX_TO_R_RATIO = 1.0;')
print()
print('// Derived values:')
print(f'const D10_HEIGHT_TO_DIAMETER = {2*z_apex / (2*r):.8f};')
print(f'const D10_RING_SEPARATION = {2*h:.8f};  // vertical distance between rings')
