import * as THREE from 'three';

/**
 * UV coordinate mapping for different dice types
 * Each die face is mapped to a region in the texture atlas
 */

interface FaceUVMapping {
  faceIndex: number;
  uvCoords: [number, number][]; // Array of [u, v] pairs for each vertex
}

interface DiceTextureConfig {
  backgroundColor: number;
  textColor: number;
  borderColor: number;
  font?: string;
  showBorder?: boolean;
}

/**
 * Creates a canvas texture atlas with numbered faces for a die
 * @param numFaces Number of faces on the die (4, 6, 8, 10, 12, 20, 100)
 * @param config Configuration for texture appearance
 * @returns THREE.CanvasTexture with all face numbers laid out
 */
export function createDiceTextureAtlas(
  numFaces: number, 
  config: DiceTextureConfig
): THREE.CanvasTexture {
  const { 
    backgroundColor = 0xffffff, 
    textColor = 0x000000, 
    borderColor = 0xcccccc,
    font = 'bold 120px Arial',
    showBorder = true
  } = config;

  // Determine atlas size based on number of faces
  const { atlasWidth, atlasHeight, layout } = calculateAtlasLayout(numFaces);
  
  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, atlasWidth, atlasHeight);

  // Calculate cell size
  const cellWidth = atlasWidth / layout.cols;
  const cellHeight = atlasHeight / layout.rows;
  
  // Calculate optimal font size based on cell dimensions
  // D6 typically looks good with numbers filling ~70% of face
  // D10 uses 20% for good visibility while staying centered on kite faces
  const fillRatio = numFaces === 10 ? 0.2 : 0.7;
  const baseFontSize = Math.min(cellWidth, cellHeight) * fillRatio;
  const fontToUse = font.replace(/\d+px/, `${Math.round(baseFontSize)}px`);

  // Draw each face number
  for (let i = 0; i < numFaces; i++) {
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    const x = col * cellWidth;
    const y = row * cellHeight;

    // Draw cell background
    ctx.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(x, y, cellWidth, cellHeight);

    // Draw border
    if (showBorder) {
      ctx.strokeStyle = `#${borderColor.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
    }

    // Determine face number
    let faceNumber: string;
    if (numFaces === 100) {
      // For d100/d%: 00, 10, 20, ..., 90
      faceNumber = i === 0 ? '00' : `${i * 10}`;
    } else if (numFaces === 10) {
      // For d10: 0-9 (standard pentagonal trapezohedron numbering)
      faceNumber = `${i}`;
    } else {
      // Regular numbering: 1, 2, 3, ...
      faceNumber = `${i + 1}`;
    }
    
    // Save context for potential rotation
    ctx.save();
    
    // For d10, DO NOT rotate lower hemisphere faces
    // The geometry/UV mapping handles orientation automatically
    // Rotating here causes mismatch with physics detection
    
    // Draw face number
    ctx.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`;
    ctx.font = fontToUse;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the number
    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2;
    ctx.fillText(faceNumber, centerX, centerY);
    
    // Add underline to 6 and 9 to distinguish them
    if (faceNumber === '6' || faceNumber === '9') {
      const metrics = ctx.measureText(faceNumber);
      const textWidth = metrics.width;
      const underlineY = centerY + baseFontSize * 0.35; // Position below text
      const underlineThickness = Math.max(2, baseFontSize * 0.05);
      
      ctx.strokeStyle = `#${textColor.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = underlineThickness;
      ctx.beginPath();
      ctx.moveTo(centerX - textWidth / 2, underlineY);
      ctx.lineTo(centerX + textWidth / 2, underlineY);
      ctx.stroke();
    }
    
    // Restore context
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Calculate optimal atlas layout for given number of faces
 */
function calculateAtlasLayout(numFaces: number): { 
  atlasWidth: number; 
  atlasHeight: number; 
  layout: { rows: number; cols: number } 
} {
  let cols: number, rows: number;
  
  switch (numFaces) {
    case 4:
      cols = 2; rows = 2; // 2x2 grid
      break;
    case 6:
      cols = 3; rows = 2; // 3x2 grid
      break;
    case 8:
      cols = 4; rows = 2; // 4x2 grid
      break;
    case 10:
    case 100:
      cols = 5; rows = 2; // 5x2 grid
      break;
    case 12:
      cols = 4; rows = 3; // 4x3 grid
      break;
    case 20:
      cols = 5; rows = 4; // 5x4 grid
      break;
    default:
      cols = Math.ceil(Math.sqrt(numFaces));
      rows = Math.ceil(numFaces / cols);
  }

  const cellSize = 256; // Each cell is 256x256
  return {
    atlasWidth: cols * cellSize,
    atlasHeight: rows * cellSize,
    layout: { rows, cols }
  };
}

/**
 * Apply UV mapping to geometry to use the texture atlas
 * @param geometry The dice geometry
 * @param numFaces Number of faces on the die
 */
export function applyDiceUVMapping(geometry: THREE.BufferGeometry, numFaces: number): void {
  const { layout } = calculateAtlasLayout(numFaces);
  const cellUWidth = 1 / layout.cols;
  const cellVHeight = 1 / layout.rows;

  // Get or create UV attribute
  const positions = geometry.attributes.position;
  const uvs: number[] = [];

  // For each face, we need to map its vertices to the correct cell in the atlas
  // The approach differs based on geometry type
  
  if (geometry instanceof THREE.BoxGeometry) {
    // Box geometry has 6 faces, straightforward mapping
    applyBoxUVMapping(geometry, cellUWidth, cellVHeight);
  } else {
    // For polyhedra (Tetrahedron, Octahedron, Icosahedron, Dodecahedron)
    applyPolyhedronUVMapping(geometry, numFaces, cellUWidth, cellVHeight);
  }
}

/**
 * Apply UV mapping for box geometry (d6)
 * BoxGeometry already has UVs (0-1 for each face), we just remap them to atlas cells
 */
function applyBoxUVMapping(geometry: THREE.BoxGeometry, cellUWidth: number, cellVHeight: number): void {
  const uvAttribute = geometry.attributes.uv;
  const uvArray = uvAttribute.array as Float32Array;
  
  // BoxGeometry has 6 faces with 4 vertices each = 24 UV coordinates (48 values)
  // Each face uses UVs in 0-1 range, we need to remap to the correct atlas cell
  const layout = calculateAtlasLayout(6).layout;
  
  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    // Calculate which cell this face maps to in the atlas
    const cellIndex = faceIndex; // Face 0 -> cell 0 (number 1), Face 1 -> cell 1 (number 2), etc.
    const col = cellIndex % layout.cols;
    const row = Math.floor(cellIndex / layout.cols);
    
    const uOffset = col * cellUWidth;
    const vOffset = row * cellVHeight;
    
    // Each face has 4 vertices in the UV array
    const baseIndex = faceIndex * 4;
    
    for (let i = 0; i < 4; i++) {
      const uvIndex = (baseIndex + i) * 2;
      // Scale existing 0-1 UVs to cell size and offset to correct position
      uvArray[uvIndex] = uvArray[uvIndex] * cellUWidth + uOffset;
      uvArray[uvIndex + 1] = uvArray[uvIndex + 1] * cellVHeight + vOffset;
    }
  }
  
  uvAttribute.needsUpdate = true;
}

/**
 * Assigns proper face numbers to face groups based on normal direction
 * Ensures proper die conventions (opposite faces sum correctly, etc.)
 */
function assignDiceFaceNumbers(
  faceGroups: Array<{ normal: THREE.Vector3; triangleIndices: number[]; center: THREE.Vector3 }>,
  numFaces: number
): Map<number, number> {
  const faceNumberMap = new Map<number, number>();
  
  // Create a list of faces with their indices for sorting
  const indexedFaces = faceGroups.map((group, index) => ({ 
    index, 
    normal: group.normal.clone(),
    center: group.center.clone()
  }));
  
  if (numFaces === 4) {
    // D4: Tetrahedron - number faces 1-4 from top to bottom
    indexedFaces.sort((a, b) => {
      const yDiff = b.normal.y - a.normal.y;
      if (Math.abs(yDiff) > 0.1) return yDiff;
      // Secondary sort by angle for consistency
      const angleA = Math.atan2(a.normal.z, a.normal.x);
      const angleB = Math.atan2(b.normal.z, b.normal.x);
      return angleA - angleB;
    });
  } else if (numFaces === 6) {
    // D6: Cube - handled by BoxGeometry, but just in case
    // Standard d6: opposite faces sum to 7 (1-6, 2-5, 3-4)
    indexedFaces.sort((a, b) => {
      // Sort by axis dominance: +X, -X, +Y, -Y, +Z, -Z
      const absA = new THREE.Vector3(Math.abs(a.normal.x), Math.abs(a.normal.y), Math.abs(a.normal.z));
      const absB = new THREE.Vector3(Math.abs(b.normal.x), Math.abs(b.normal.y), Math.abs(b.normal.z));
      
      // Z-axis faces first, then Y, then X
      if (absA.z > 0.9 && absB.z < 0.9) return -1;
      if (absA.z < 0.9 && absB.z > 0.9) return 1;
      if (absA.y > 0.9 && absB.y < 0.9) return -1;
      if (absA.y < 0.9 && absB.y > 0.9) return 1;
      
      // Within same axis, sort by direction
      if (absA.z > 0.9) return b.normal.z - a.normal.z;
      if (absA.y > 0.9) return b.normal.y - a.normal.y;
      return b.normal.x - a.normal.x;
    });
  } else if (numFaces === 8) {
    // D8: Octahedron - number faces 1-8
    // Top half (1-4), bottom half (5-8), opposite faces sum to 9
    indexedFaces.sort((a, b) => {
      const yDiff = b.normal.y - a.normal.y;
      if (Math.abs(yDiff) > 0.1) return yDiff;
      
      // Within same hemisphere, sort by angle
      const angleA = Math.atan2(a.normal.z, a.normal.x);
      const angleB = Math.atan2(b.normal.z, b.normal.x);
      return angleA - angleB;
    });
  } else if (numFaces === 10) {
    // D10: Pentagonal trapezohedron - number 0-9
    // EMPIRICAL MAPPING - Textures are applied with an offset pattern
    // Confirmed from test rolls:
    // - Kite 3 shows Face 8 ✓ (rolled 8, detected kite 3)
    // - Kite 0 shows Face 5 ✓ (rolled 5, detected kite 0)
    // - Kite 1 shows Face 6 ✓ (rolled 6, detected kite 1)
    // - Kite 2 shows Face 7 ✓ (rolled 7, detected kite 2)
    // - Kite 5 shows Face 0 ✓ (rolled 0, detected kite 5)
    // - Kite 9 shows Face 4 ✓ (rolled 4, detected kite 9)
    //
    // Pattern: Upper ring kites (0-4) display faces 5-9
    //          Lower ring kites (5-9) display faces 0-4
    const kiteToFaceMapping = [
      5, // Kite 0 → Face 5 ✓
      6, // Kite 1 → Face 6 ✓
      7, // Kite 2 → Face 7 ✓
      8, // Kite 3 → Face 8 ✓
      9, // Kite 4 → Face 9
      0, // Kite 5 → Face 0 ✓
      1, // Kite 6 → Face 1
      2, // Kite 7 → Face 2
      3, // Kite 8 → Face 3
      4  // Kite 9 → Face 4 ✓
    ];
    
    indexedFaces.sort((a, b) => a.index - b.index);
    
    // Apply the mapping and store for detection
    indexedFaces.forEach((face, idx) => {
      face.mappedFace = kiteToFaceMapping[face.index];
    });
    
    // Debug logging for d10
    console.log('D10 Texture Atlas Face Assignment (offset mapping: kites 0-4→faces 5-9, kites 5-9→faces 0-4):');
    indexedFaces.forEach((face) => {
      const angle = Math.atan2(face.normal.z, face.normal.x) * 180 / Math.PI;
      console.log(`  Kite ${face.index}: Face ${face.mappedFace}, y=${face.normal.y.toFixed(3)}, angle=${angle.toFixed(1)}°`);
    });
  } else if (numFaces === 12) {
    // D12: Dodecahedron - 12 regular pentagonal faces, opposite faces sum to 13
    // Structure: 1 top, 5 upper ring, 5 lower ring, 1 bottom
    indexedFaces.sort((a, b) => {
      const yDiff = b.normal.y - a.normal.y;
      if (Math.abs(yDiff) > 0.3) return yDiff;
      
      // Within same ring, sort by angle
      const angleA = Math.atan2(a.normal.z, a.normal.x);
      const angleB = Math.atan2(b.normal.z, b.normal.x);
      return angleA - angleB;
    });
  } else if (numFaces === 20) {
    // D20: Icosahedron - 20 equilateral triangular faces, opposite faces sum to 21
    // Ring structure provides natural ordering
    indexedFaces.sort((a, b) => {
      const yDiff = b.normal.y - a.normal.y;
      if (Math.abs(yDiff) > 0.3) return yDiff;
      
      // Within same ring, sort by angle around Y axis
      const angleA = Math.atan2(a.normal.z, a.normal.x);
      const angleB = Math.atan2(b.normal.z, b.normal.x);
      return angleA - angleB;
    });
  }
  
  // Assign sequential numbers to sorted faces
  indexedFaces.forEach((face, sortedIndex) => {
    // D10 uses mapped face numbers (with +5/-5 offset), others use sequential numbering
    let faceNumber: number;
    if (numFaces === 10 && face.mappedFace !== undefined) {
      faceNumber = face.mappedFace; // Use the offset mapping
    } else if (numFaces === 10) {
      faceNumber = sortedIndex; // Fallback
    } else {
      faceNumber = sortedIndex + 1; // Others use 1-N
    }
    faceNumberMap.set(face.index, faceNumber);
  });
  
  // For D10, also store the kite-to-face mapping globally so physics can access it
  if (numFaces === 10) {
    (globalThis as any).__d10KiteToFaceMap = faceNumberMap;
    console.log('D10 Kite-to-Face Mapping (Kite Index → Face Number):');
    const entries = Array.from(faceNumberMap.entries()).sort((a, b) => a[0] - b[0]);
    entries.forEach(([kiteIdx, faceNum]) => {
      console.log(`  Kite ${kiteIdx} → Face ${faceNum}`);
    });
  }
  
  return faceNumberMap;
}

/**
 * Apply UV mapping for polyhedron geometries (d4, d8, d12, d20)
 * Uses planar projection based on face normals to map each face to atlas cells
 * Method 3: Face Grouping with Texture Atlas
 */
function applyPolyhedronUVMapping(
  geometry: THREE.BufferGeometry, 
  numFaces: number,
  cellUWidth: number, 
  cellVHeight: number
): void {
  const layout = calculateAtlasLayout(numFaces).layout;
  const positions = geometry.attributes.position;
  const count = positions.count;
  
  // Initialize UV attribute if it doesn't exist
  if (!geometry.attributes.uv) {
    const uvs = new Float32Array(count * 2); // 2 components per vertex (u, v)
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  
  const uvAttribute = geometry.attributes.uv;
  const uvArray = uvAttribute.array as Float32Array;
  
  console.log(`Applying UV mapping for ${numFaces}-sided die, ${count / 3} triangles`);
  
  // Store face data for grouping triangles
  interface FaceGroup {
    normal: THREE.Vector3;
    triangleIndices: number[];
    center: THREE.Vector3;
  }
  
  const faceGroups: FaceGroup[] = [];
  const triangleFaceMap: number[] = new Array(count / 3);
  
  // Special handling for D10 (pentagonal trapezohedron)
  // D10 kite faces are non-planar, so we need to explicitly pair triangles
  if (numFaces === 10) {
    console.log('D10 detected - using kite-based triangle pairing');
    const totalTriangles = count / 3;
    
    if (totalTriangles !== 20) {
      console.error(`D10 should have exactly 20 triangles, but found ${totalTriangles}`);
    }
    
    // In D10Geometry.ts, triangles are paired into kites as follows:
    // Upper 5 kites: triangles (0,1), (2,3), (4,5), (6,7), (8,9)
    // Lower 5 kites: triangles (10,11), (12,13), (14,15), (16,17), (18,19)
    
    for (let kiteIndex = 0; kiteIndex < 10; kiteIndex++) {
      const triangle1Index = kiteIndex * 2;
      const triangle2Index = kiteIndex * 2 + 1;
      
      // Compute average center of both triangles in the kite
      const centers: THREE.Vector3[] = [];
      
      for (const triIdx of [triangle1Index, triangle2Index]) {
        const i = triIdx * 3;
        const v0 = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
        const v1 = new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
        const v2 = new THREE.Vector3(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));
        const center = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);
        centers.push(center);
      }
      
      // Use average of both triangle centers as kite center
      const kiteCenter = new THREE.Vector3()
        .add(centers[0])
        .add(centers[1])
        .divideScalar(2);
      
      const kiteNormal = kiteCenter.clone().normalize();
      
      faceGroups.push({
        normal: kiteNormal,
        triangleIndices: [triangle1Index, triangle2Index],
        center: kiteCenter
      });
      
      triangleFaceMap[triangle1Index] = kiteIndex;
      triangleFaceMap[triangle2Index] = kiteIndex;
    }
    
    console.log(`D10: Created ${faceGroups.length} kite faces from ${totalTriangles} triangles`);
  } else {
    // Standard face detection for other dice types
    // First pass: Group triangles by their face normals
    for (let i = 0; i < count; i += 3) {
      const triangleIndex = i / 3;
      
      // Get triangle vertices
      const v0 = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const v1 = new THREE.Vector3(
        positions.getX(i + 1),
        positions.getY(i + 1),
        positions.getZ(i + 1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i + 2),
        positions.getY(i + 2),
        positions.getZ(i + 2)
      );
      
      // Calculate triangle center (for polyhedra, center direction = face normal direction)
      const center = new THREE.Vector3()
        .add(v0)
        .add(v1)
        .add(v2)
        .divideScalar(3);
      
      // Normalize to get direction from origin (works for convex polyhedra)
      const normal = center.clone().normalize();
      
      // Try to find an existing face group this triangle belongs to
      let matchedFaceIndex = -1;
      // Use stricter threshold based on dice type
      const threshold = numFaces === 20 ? 0.999 :
                       numFaces === 12 ? 0.999 :
                       numFaces === 8 ? 0.995 :
                       0.99;
      
      for (let j = 0; j < faceGroups.length; j++) {
        const dotProduct = normal.dot(faceGroups[j].normal);
        if (dotProduct > threshold) {
          matchedFaceIndex = j;
          break;
        }
      }
      
      // If no match found, create a new face group
      if (matchedFaceIndex === -1) {
        matchedFaceIndex = faceGroups.length;
        faceGroups.push({
          normal: normal.clone(),
          triangleIndices: [],
          center: center.clone()
        });
      }
      
      // Add this triangle to the face group
      faceGroups[matchedFaceIndex].triangleIndices.push(triangleIndex);
      triangleFaceMap[triangleIndex] = matchedFaceIndex;
    }
  }
  
  console.log(`Detected ${faceGroups.length} face groups for d${numFaces} (expected: ${numFaces})`);
  if (faceGroups.length !== numFaces) {
    console.warn(`Face count mismatch! Got ${faceGroups.length}, expected ${numFaces}`);
    // Log face group details for debugging
    faceGroups.forEach((group, idx) => {
      console.log(`  Group ${idx}: ${group.triangleIndices.length} triangles, normal: (${group.normal.x.toFixed(3)}, ${group.normal.y.toFixed(3)}, ${group.normal.z.toFixed(3)})`);
    });
  }
  
  // Map each face group to its proper die number based on normal direction
  const faceNumberMap = assignDiceFaceNumbers(faceGroups, numFaces);
  
  // Rebuild the triangle face map with proper face numbers
  const triangleToFaceNumberMap = new Map<number, number>();
  faceGroups.forEach((group, groupIndex) => {
    // For D10: use kite index directly for texture application (0-9)
    // The mapping is ONLY for detection, not for texture placement
    const faceNumber = numFaces === 10 ? groupIndex : (faceNumberMap.get(groupIndex) ?? 1);
    group.triangleIndices.forEach(triIndex => {
      triangleToFaceNumberMap.set(triIndex, faceNumber);
    });
  });
  
  // Calculate UVs per face group (not per triangle) for consistency
  const faceGroupUVs = new Map<number, { vertices: THREE.Vector3[], uvs: THREE.Vector2[] }>();
  
  // Collect all vertices for each face group
  faceGroups.forEach((group, faceIndex) => {
    const vertices: THREE.Vector3[] = [];
    
    group.triangleIndices.forEach(triIndex => {
      const i = triIndex * 3;
      vertices.push(
        new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i)),
        new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1)),
        new THREE.Vector3(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2))
      );
    });
    
    faceGroupUVs.set(faceIndex, { vertices, uvs: [] });
  });
  
  // Calculate bounding box and UVs for each face group
  faceGroups.forEach((group, faceIndex) => {
    const faceData = faceGroupUVs.get(faceIndex)!;
    const faceNormal = group.normal;
    
    // Calculate a proper local coordinate system for this face
    // This ensures numbers are oriented correctly
    
    // Choose an up vector that's not parallel to the normal
    let upVector = new THREE.Vector3(0, 1, 0);
    if (Math.abs(faceNormal.dot(upVector)) > 0.9) {
      upVector = new THREE.Vector3(0, 0, 1);
    }
    
    // Calculate tangent (right vector) and bitangent (up vector) for the face
    const tangent = new THREE.Vector3().crossVectors(upVector, faceNormal).normalize();
    const bitangent = new THREE.Vector3().crossVectors(faceNormal, tangent).normalize();
    
    // Project all vertices onto the 2D plane defined by tangent and bitangent
    const projected2D: THREE.Vector2[] = [];
    for (const vertex of faceData.vertices) {
      // Project vertex onto the tangent and bitangent axes
      const u = vertex.dot(tangent);
      const v = vertex.dot(bitangent);
      
      projected2D.push(new THREE.Vector2(u, v));
    }
    
    // Find bounding box for the entire face (not per triangle)
    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    
    for (const p of projected2D) {
      minU = Math.min(minU, p.x);
      maxU = Math.max(maxU, p.x);
      minV = Math.min(minV, p.y);
      maxV = Math.max(maxV, p.y);
    }
    
    const rangeU = maxU - minU || 1;
    const rangeV = maxV - minV || 1;
    const maxRange = Math.max(rangeU, rangeV); // Use max range to prevent stretching
    
    // Calculate center for padding
    const centerU = (minU + maxU) / 2;
    const centerV = (minV + maxV) / 2;
    
    // Add padding to keep numbers away from edges
    // D10 kite faces need more padding (25%) to center numbers better on non-planar faces
    const padding = numFaces === 10 ? 0.25 : 0.15;
    
    // Normalize UVs with uniform scaling and padding
    for (const p of projected2D) {
      // Center the coordinates
      const centeredU = p.x - centerU;
      const centeredV = p.y - centerV;
      
      // Scale uniformly using max range
      const scaledU = centeredU / maxRange;
      const scaledV = centeredV / maxRange;
      
      // Apply padding: map from [-0.5, 0.5] to [padding, 1-padding]
      const paddedU = (scaledU + 0.5) * (1 - 2 * padding) + padding;
      const paddedV = (scaledV + 0.5) * (1 - 2 * padding) + padding;
      
      faceData.uvs.push(new THREE.Vector2(
        Math.max(0, Math.min(1, paddedU)),
        Math.max(0, Math.min(1, paddedV))
      ));
    }
  });
  
  // Second pass: Apply calculated UVs to geometry
  for (let i = 0; i < count; i += 3) {
    const triangleIndex = i / 3;
    const faceNumber = triangleToFaceNumberMap.get(triangleIndex) ?? (numFaces === 10 ? 0 : 1);
    
    // Map face number to atlas cell (d10 uses 0-9, matches directly; others are 1-indexed so subtract 1)
    const atlasCell = numFaces === 10 ? faceNumber : (faceNumber - 1);
    const clampedCell = Math.min(Math.max(0, atlasCell), numFaces - 1);
    
    // Find which face group this triangle belongs to
    let groupIndex = -1;
    for (let g = 0; g < faceGroups.length; g++) {
      if (faceGroups[g].triangleIndices.includes(triangleIndex)) {
        groupIndex = g;
        break;
      }
    }
    
    if (groupIndex === -1) continue;
    
    // Get the pre-calculated UVs for this face
    const faceData = faceGroupUVs.get(groupIndex)!;
    const group = faceGroups[groupIndex];
    const triIndexInGroup = group.triangleIndices.indexOf(triangleIndex);
    const uvStartIndex = triIndexInGroup * 3;
    
    // Calculate atlas cell position based on actual face number
    const col = clampedCell % layout.cols;
    const row = Math.floor(clampedCell / layout.cols);
    const uOffset = col * cellUWidth;
    const vOffset = row * cellVHeight;
    
    // Apply UVs with atlas offset
    for (let j = 0; j < 3; j++) {
      const uvIndex = (i + j) * 2;
      const faceUV = faceData.uvs[uvStartIndex + j];
      
      if (faceUV) {
        uvArray[uvIndex] = faceUV.x * cellUWidth + uOffset;
        uvArray[uvIndex + 1] = faceUV.y * cellVHeight + vOffset;
      }
    }
  }
  
  uvAttribute.needsUpdate = true;
}

/**
 * Create a complete dice material with texture atlas applied
 * @param numFaces Number of faces on the die
 * @param config Texture configuration
 * @returns THREE.MeshStandardMaterial with texture atlas
 */
export function createDiceMaterial(
  numFaces: number,
  config: DiceTextureConfig
): THREE.MeshStandardMaterial {
  const texture = createDiceTextureAtlas(numFaces, config);
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.1,
  });
}

/**
 * Helper function to get texture config based on die result
 */
export function getDiceTextureConfig(
  isCritical: boolean = false,
  isFumble: boolean = false
): DiceTextureConfig {
  let backgroundColor: number;
  
  if (isCritical) {
    backgroundColor = 0xffd700; // Gold
  } else if (isFumble) {
    backgroundColor = 0xff4444; // Red
  } else {
    backgroundColor = 0xffffff; // White
  }
  
  return {
    backgroundColor,
    textColor: 0x000000, // Black
    borderColor: 0xcccccc, // Light gray
    font: 'bold 140px Arial',
    showBorder: true
  };
}
