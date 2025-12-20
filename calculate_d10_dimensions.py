import math

n = 5  # pentagonal trapezohedron

print('PENTAGONAL TRAPEZOHEDRON (d10) CANONICAL PROPORTIONS:')
print('=' * 70)
print(f'For n={n} (pentagonal):')
print()

# Calculate dimensions using MathWorld formulas for canonical trapezohedron
# These formulas ensure all vertices lie on a sphere (gaming dice constraint)

# Ring radius at midradius = 1
a = 0.5 / math.sin(math.pi/n)

# Ring height
h = math.sqrt(4 - (1/math.cos(math.pi/(2*n)))**2) / (4 + 8*math.cos(math.pi/n))

# Apex height
z = 0.25 * math.cos(math.pi/(2*n)) * (1/math.tan(math.pi/(2*n))) * (1/math.sin(3*math.pi/(2*n))) * math.sqrt(4 - (1/math.cos(math.pi/(2*n)))**2)

# Calculate face angles
theta1_rad = math.acos(0.5 - math.cos(math.pi/n))
theta1 = math.degrees(theta1_rad)

theta2_rad = math.acos(2 - 3*math.cos(math.pi/n) + 3*math.cos(2*math.pi/n) - math.cos(3*math.pi/n))
theta2 = math.degrees(theta2_rad)

print(f'Ring radius (a): {a:.6f} units')
print(f'Ring height (±h): ±{h:.6f} units')
print(f'Apex height (±z): ±{z:.6f} units')
print()

print(f'CRITICAL RATIOS:')
print(f'Apex-to-ring height ratio (z/h): {z/h:.6f}')
print(f'Ring separation (2h): {2*h:.6f}')
print(f'Total height (2z): {2*z:.6f}')
print(f'Ring diameter (2a): {2*a:.6f}')
print(f'Apex-to-apex / Ring diameter: {2*z / (2*a):.6f}')
print(f'Height-to-diameter ratio: {2*z / (2*a):.6f}')
print()

print(f'KITE FACE ANGLES:')
print(f'Three equal angles (θ₁): {theta1:.4f}° (should be ~90° for gaming dice)')
print(f'Apex angle (θ₂): {theta2:.4f}°')
print(f'Sum check: {3*theta1 + theta2:.2f}° (should be 360°)')
print()

print('ANGULAR OFFSET:')
print(f'Upper/lower ring offset: {180/n:.1f}° = 36°')
print()

print('=' * 70)
print('VERTEX POSITIONS (normalized to midradius = 1):')
print('=' * 70)
print(f'Top apex: (0, 0, {z:.6f})')
print(f'Bottom apex: (0, 0, {-z:.6f})')
print()

print(f'Upper ring (at height h = {h:.6f}):')
for i in range(n):
    angle = 2 * math.pi * i / n
    x = a * math.cos(angle)
    y = a * math.sin(angle)
    print(f'  V{i}: ({x:8.5f}, {y:8.5f}, {h:8.5f})')

print()
print(f'Lower ring (at height -h = {-h:.6f}, offset by 36°):')
for i in range(n):
    angle = 2 * math.pi * i / n + math.pi/n
    x = a * math.cos(angle)
    y = a * math.sin(angle)
    print(f'  V{i+n}: ({x:8.5f}, {y:8.5f}, {-h:8.5f})')

print()
print('=' * 70)
print('SPHERICAL CONSTRAINT VERIFICATION:')
print('=' * 70)
r_upper = math.sqrt(a**2 + h**2)
r_apex = abs(z)
print(f'Distance from origin to ring vertices: {r_upper:.6f}')
print(f'Distance from origin to apex vertices: {r_apex:.6f}')
print(f'Ratio (should be 1.0 for perfect sphere): {r_upper/r_apex:.6f}')

if abs(r_upper/r_apex - 1.0) < 0.001:
    print('✓ CONFIRMED: All vertices lie on a sphere (gaming dice standard)')
else:
    print('✗ WARNING: Vertices do not lie on a sphere')

print()
print('=' * 70)
print('IMPLEMENTATION VALUES FOR CODE:')
print('=' * 70)
print(f'const RING_RADIUS = {a:.6f};  // Relative to midradius = 1')
print(f'const RING_HEIGHT = {h:.6f};  // Height of pentagon rings')
print(f'const APEX_HEIGHT = {z:.6f};  // Height of top/bottom vertices')
print(f'const RING_OFFSET_ANGLE = {math.degrees(math.pi/n):.1f};  // 36 degrees')
print()
print('// Height-to-diameter ratio (how "squashed" the die is):')
print(f'const SQUASH_RATIO = {2*z / (2*a):.6f};')
print()
print('// Alternatively, normalized to ring diameter = 1:')
normalized_h = h / a
normalized_z = z / a
print(f'const RING_HEIGHT_NORMALIZED = {normalized_h:.6f};  // Ring height / radius')
print(f'const APEX_HEIGHT_NORMALIZED = {normalized_z:.6f};  // Apex height / radius')
