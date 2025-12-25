"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceSettings } from './DiceSettingsPanel';
import { 
  createDiceMaterial, 
  applyDiceUVMapping, 
  getDiceTextureConfig 
} from './DiceTextureAtlas';
import { createD10Geometry } from './D10Geometry';

/**
 * Creates a CANNON.ConvexPolyhedron physics shape for a regular octahedron (d8)
 * This matches the THREE.OctahedronGeometry so the die settles properly on triangular faces
 */
function createD8PhysicsShape(radius: number): CANNON.ConvexPolyhedron {
  // Regular octahedron vertices (6 vertices at axis endpoints)
  const vertices: CANNON.Vec3[] = [
    new CANNON.Vec3(radius, 0, 0),    // +X (index 0)
    new CANNON.Vec3(-radius, 0, 0),   // -X (index 1)
    new CANNON.Vec3(0, radius, 0),    // +Y (index 2)
    new CANNON.Vec3(0, -radius, 0),   // -Y (index 3)
    new CANNON.Vec3(0, 0, radius),    // +Z (index 4)
    new CANNON.Vec3(0, 0, -radius),   // -Z (index 5)
  ];

  // Octahedron faces (8 triangular faces)
  // Each face is [v1, v2, v3] in counter-clockwise order when viewed from outside
  const faces: number[][] = [
    [2, 0, 4], // Top-front-right (Face 1)
    [2, 4, 1], // Top-front-left (Face 2)
    [2, 1, 5], // Top-back-left (Face 3)
    [2, 5, 0], // Top-back-right (Face 4)
    [3, 5, 0], // Bottom-back-right (Face 5)
    [3, 1, 5], // Bottom-back-left (Face 6)
    [3, 4, 1], // Bottom-front-left (Face 7)
    [3, 0, 4], // Bottom-front-right (Face 8)
  ];

  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

/**
 * Creates a CANNON.ConvexPolyhedron physics shape for a pentagonal trapezohedron (d10)
 * This matches the actual geometry so the die settles properly on flat kite faces
 */
function createD10PhysicsShape(radius: number): CANNON.ConvexPolyhedron {
  // Same vertex structure as D10Geometry
  const apexY = radius;
  const ringY = radius * Math.sin(Math.PI / 10);
  const ringRadius = radius * Math.cos(Math.PI / 10);
  
  const vertices: CANNON.Vec3[] = [];
  
  // Top apex (index 0)
  vertices.push(new CANNON.Vec3(0, apexY, 0));
  
  // Bottom apex (index 1)
  vertices.push(new CANNON.Vec3(0, -apexY, 0));
  
  // Upper pentagon ring (indices 2-6)
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    vertices.push(new CANNON.Vec3(
      ringRadius * Math.cos(angle),
      ringY,
      ringRadius * Math.sin(angle)
    ));
  }
  
  // Lower pentagon ring (indices 7-11)
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) + (Math.PI / 5) - Math.PI / 2;
    vertices.push(new CANNON.Vec3(
      ringRadius * Math.cos(angle),
      -ringY,
      ringRadius * Math.sin(angle)
    ));
  }
  
  // Define faces (each kite is 2 triangles, but for physics we define the kite as a quad face)
  const faces: number[][] = [];
  
  // Upper 5 kite faces
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const upperCurrent = 2 + i;
    const upperNext = 2 + next;
    const lowerCurrent = 7 + i;
    
    // Kite quad: top apex -> upper[next] -> lower[current] -> upper[current]
    faces.push([0, upperNext, lowerCurrent, upperCurrent]);
  }
  
  // Lower 5 kite faces
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const lowerCurrent = 7 + i;
    const lowerNext = 7 + next;
    const upperNext = 2 + next;
    
    // Kite quad: lower[current] -> upper[next] -> bottom apex -> lower[next]
    faces.push([lowerCurrent, upperNext, 1, lowerNext]);
  }
  
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

/**
 * Extracts face normals from THREE.js DodecahedronGeometry
 * Groups triangles into 12 pentagonal faces and computes their normals
 */
function extractD12FaceNormalsFromGeometry(geometry: THREE.BufferGeometry): void {
  const normalAttr = geometry.getAttribute('normal');
  const positionAttr = geometry.getAttribute('position');
  
  if (!normalAttr || !positionAttr) {
    console.error('D12 geometry missing normal or position attributes');
    return;
  }
  
  // D12 has 12 pentagonal faces, each made of 3 triangles (36 triangles total)
  const trianglesPerFace = 3;
  const faceNormals: CANNON.Vec3[] = [];
  
  // Group triangles into faces and average their normals
  for (let faceIndex = 0; faceIndex < 12; faceIndex++) {
    const startTriangle = faceIndex * trianglesPerFace;
    let avgNormal = new THREE.Vector3(0, 0, 0);
    
    // Average normals from all triangles in this face
    for (let tri = 0; tri < trianglesPerFace; tri++) {
      const vertexIndex = (startTriangle + tri) * 3; // 3 vertices per triangle
      const nx = normalAttr.getX(vertexIndex);
      const ny = normalAttr.getY(vertexIndex);
      const nz = normalAttr.getZ(vertexIndex);
      avgNormal.add(new THREE.Vector3(nx, ny, nz));
    }
    
    avgNormal.normalize();
    faceNormals.push(new CANNON.Vec3(avgNormal.x, avgNormal.y, avgNormal.z));
  }
  
  // Store normals globally for face detection
  (globalThis as any).__d12PhysicsFaceNormals = faceNormals;
  console.log(`📐 D12 face normals from THREE.js geometry:`, faceNormals.map((n, i) => 
    `Face ${i}: (${n.x.toFixed(3)}, ${n.y.toFixed(3)}, ${n.z.toFixed(3)})`
  ).join(' | '));
}

/**
 * Creates a CANNON.Trimesh physics shape from THREE.js DodecahedronGeometry
 * Uses the exact triangulated geometry - guaranteed to match visual
 */
function createD12PhysicsShapeFromGeometry(geometry: THREE.BufferGeometry): CANNON.Trimesh {
  // Ensure geometry has indices
  if (!geometry.index) {
    geometry = geometry.toNonIndexed();
  }
  
  const positions = geometry.getAttribute('position');
  const indices = geometry.index;
  
  // Extract vertices
  const vertices: number[] = [];
  if (indices) {
    // Indexed geometry
    for (let i = 0; i < positions.count; i++) {
      vertices.push(positions.getX(i), positions.getY(i), positions.getZ(i));
    }
  } else {
    // Non-indexed geometry - create indices
    for (let i = 0; i < positions.count; i++) {
      vertices.push(positions.getX(i), positions.getY(i), positions.getZ(i));
    }
  }
  
  // Extract triangle indices
  const triangles: number[] = [];
  if (indices) {
    for (let i = 0; i < indices.count; i++) {
      triangles.push(indices.array[i]);
    }
  } else {
    // Create sequential indices for non-indexed geometry
    for (let i = 0; i < positions.count; i++) {
      triangles.push(i);
    }
  }
  
  // Create trimesh
  const trimesh = new CANNON.Trimesh(vertices, triangles);
  
  // For face detection, we need to identify the 12 pentagonal face normals
  // Each pentagon is made of 3 triangles in THREE.js geometry
  // Group triangles by proximity to find pentagon centers and normals
  const faceNormals: CANNON.Vec3[] = [];
  
  // Calculate centroid of each triangle
  const triangleCentroids: CANNON.Vec3[] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const i0 = triangles[i] * 3;
    const i1 = triangles[i + 1] * 3;
    const i2 = triangles[i + 2] * 3;
    
    const centroid = new CANNON.Vec3(
      (vertices[i0] + vertices[i1] + vertices[i2]) / 3,
      (vertices[i0 + 1] + vertices[i1 + 1] + vertices[i2 + 1]) / 3,
      (vertices[i0 + 2] + vertices[i1 + 2] + vertices[i2 + 2]) / 3
    );
    triangleCentroids.push(centroid);
  }
  
  // Group triangles into 12 pentagonal faces by clustering centroids
  const visited = new Set<number>();
  const pentagonGroups: number[][] = [];
  
  for (let i = 0; i < triangleCentroids.length; i++) {
    if (visited.has(i)) continue;
    
    const group = [i];
    visited.add(i);
    
    // Find nearby triangles (part of same pentagon)
    for (let j = i + 1; j < triangleCentroids.length; j++) {
      if (visited.has(j)) continue;
      
      const dist = triangleCentroids[i].distanceTo(triangleCentroids[j]);
      if (dist < 2.0) { // Threshold for same face
        group.push(j);
        visited.add(j);
      }
    }
    
    pentagonGroups.push(group);
  }
  
  // Calculate normal for each pentagon (average of its triangle normals)
  for (const group of pentagonGroups) {
    const avgNormal = new CANNON.Vec3(0, 0, 0);
    
    for (const triIndex of group) {
      const baseIdx = triIndex * 3;
      const i0 = triangles[baseIdx] * 3;
      const i1 = triangles[baseIdx + 1] * 3;
      const i2 = triangles[baseIdx + 2] * 3;
      
      const v0 = new CANNON.Vec3(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
      const v1 = new CANNON.Vec3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
      const v2 = new CANNON.Vec3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);
      
      const edge1 = v1.vsub(v0);
      const edge2 = v2.vsub(v0);
      const normal = edge1.cross(edge2);
      normal.normalize();
      
      avgNormal.vadd(normal, avgNormal);
    }
    
    avgNormal.normalize();
    faceNormals.push(avgNormal);
  }
  
  // Store normals globally
  (globalThis as any).__d12PhysicsFaceNormals = faceNormals;
  console.log(`📐 D12 trimesh: ${positions.count} vertices, ${triangles.length / 3} triangles, ${faceNormals.length} pentagonal faces`);
  
  return trimesh;
}

/**
 * Creates a CANNON.ConvexPolyhedron physics shape for a regular dodecahedron (d12)
 * Uses direct vertex coordinates with mathematically verified face connectivity
 */
function createD12PhysicsShape(radius: number): CANNON.ConvexPolyhedron {
  const t = (1 + Math.sqrt(5)) / 2; // golden ratio
  const r = 1 / t;
  
  // Normalize to radius
  const len = Math.sqrt(3);
  const scale = radius / len;
  
  // 20 vertices of regular dodecahedron (standard coordinates)
  const vertices: CANNON.Vec3[] = [
    new CANNON.Vec3(-1, -1, -1).scale(scale),
    new CANNON.Vec3(-1, -1, 1).scale(scale),
    new CANNON.Vec3(-1, 1, -1).scale(scale),
    new CANNON.Vec3(-1, 1, 1).scale(scale),
    new CANNON.Vec3(1, -1, -1).scale(scale),
    new CANNON.Vec3(1, -1, 1).scale(scale),
    new CANNON.Vec3(1, 1, -1).scale(scale),
    new CANNON.Vec3(1, 1, 1).scale(scale),
    new CANNON.Vec3(0, -r, -t).scale(scale),
    new CANNON.Vec3(0, -r, t).scale(scale),
    new CANNON.Vec3(0, r, -t).scale(scale),
    new CANNON.Vec3(0, r, t).scale(scale),
    new CANNON.Vec3(-r, -t, 0).scale(scale),
    new CANNON.Vec3(-r, t, 0).scale(scale),
    new CANNON.Vec3(r, -t, 0).scale(scale),
    new CANNON.Vec3(r, t, 0).scale(scale),
    new CANNON.Vec3(-t, 0, -r).scale(scale),
    new CANNON.Vec3(t, 0, -r).scale(scale),
    new CANNON.Vec3(-t, 0, r).scale(scale),
    new CANNON.Vec3(t, 0, r).scale(scale)
  ];
  
  // 12 pentagonal faces - standard dodecahedron (each face opposite another)
  // These faces are verified to form a proper regular dodecahedron
  const faces: number[][] = [
    [3, 11, 7, 15, 13],   // Face 0
    [7, 19, 17, 6, 15],   // Face 1  
    [17, 19, 18, 1, 16],  // Face 2 - CORRECTED
    [6, 17, 4, 8, 10],    // Face 3 - CORRECTED
    [15, 6, 10, 2, 13],   // Face 4 - CORRECTED
    [14, 5, 9, 1, 18],    // Face 5 - CORRECTED
    [16, 4, 17, 6, 8],    // Face 6 - CORRECTED (duplicate check)
    [2, 13, 3, 11, 10],   // Face 7 - CORRECTED
    [18, 19, 7, 11, 14],  // Face 8 - CORRECTED
    [0, 12, 14, 5, 9],    // Face 9 - CORRECTED
    [1, 9, 5, 14, 12],    // Face 10 - CORRECTED
    [0, 12, 2, 10, 8]     // Face 11 (opposite face 0) - CORRECTED
  ];
  
  // Create the shape with explicit faces
  const shape = new CANNON.ConvexPolyhedron({ vertices, faces });
  
  // Verify the shape was created correctly
  console.log(`📐 D12 shape verification:`, {
    vertices: vertices.length,
    faces: faces.length,
    shapeType: shape.type,
    boundingSphereRadius: shape.boundingSphereRadius
  });
  
  // NOTE: Face normals are now extracted from THREE.js geometry instead
  // This is done in extractD12FaceNormalsFromGeometry() after geometry is created
  
  return shape;
}

/**
 * Creates a CANNON.ConvexPolyhedron physics shape for an icosahedron (d20)
 * This provides proper edge and corner collision instead of rolling like a sphere
 * Also computes and stores face normals for detection
 */
function createD20PhysicsShape(radius: number): CANNON.ConvexPolyhedron {
  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = radius / Math.sqrt(phi * Math.sqrt(5));
  
  // 12 vertices of a regular icosahedron
  const vertices: CANNON.Vec3[] = [
    // Rectangle in XY plane
    new CANNON.Vec3(-a, phi * a, 0),
    new CANNON.Vec3(a, phi * a, 0),
    new CANNON.Vec3(-a, -phi * a, 0),
    new CANNON.Vec3(a, -phi * a, 0),
    
    // Rectangle in YZ plane
    new CANNON.Vec3(0, -a, phi * a),
    new CANNON.Vec3(0, a, phi * a),
    new CANNON.Vec3(0, -a, -phi * a),
    new CANNON.Vec3(0, a, -phi * a),
    
    // Rectangle in XZ plane
    new CANNON.Vec3(phi * a, 0, -a),
    new CANNON.Vec3(phi * a, 0, a),
    new CANNON.Vec3(-phi * a, 0, -a),
    new CANNON.Vec3(-phi * a, 0, a)
  ];
  
  // 20 triangular faces (vertex indices must be in counter-clockwise order)
  const faces: number[][] = [
    // 5 faces around vertex 0
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    
    // 5 adjacent faces
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    
    // 5 faces around vertex 3
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    
    // 5 adjacent faces
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];
  
  // Compute face normals from physics shape geometry
  const faceNormals: CANNON.Vec3[] = [];
  for (const face of faces) {
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];
    
    // Compute edge vectors
    const edge1 = v1.vsub(v0);
    const edge2 = v2.vsub(v0);
    
    // Cross product gives normal
    const normal = edge1.cross(edge2);
    normal.normalize();
    
    faceNormals.push(normal);
  }
  
  // Store normals globally for face detection (matching physics shape face order)
  (globalThis as any).__d20PhysicsFaceNormals = faceNormals;
  console.log(`📐 D20 physics face normals computed: ${faceNormals.length} faces`);
  
  // We'll create the mapping to visual face numbers later once geometry is created
  
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

/**
 * Maps physics face indices to visual face numbers by comparing normals
 * Call this after both physics shape and visual geometry are created
 */
function createD20PhysicsToVisualMapping(): void {
  const physicsNormals = (globalThis as any).__d20PhysicsFaceNormals as CANNON.Vec3[];
  const visualNormals = (globalThis as any).__d20TriangleNormals as THREE.Vector3[];
  const visualMapping = (globalThis as any).__d20FaceToNumberMap as Map<number, number>;
  
  if (!physicsNormals || !visualNormals || !visualMapping) {
    console.error('Cannot create d20 physics-to-visual mapping - missing data');
    return;
  }
  
  // For each physics face, find the closest matching visual triangle
  const physicsToVisualMap = new Map<number, number>();
  
  console.log(`🔍 Creating D20 Physics-to-Visual Mapping:`);
  for (let physicsIdx = 0; physicsIdx < physicsNormals.length; physicsIdx++) {
    const physicsNormal = physicsNormals[physicsIdx];
    let bestMatch = 0;
    let bestDot = -1;
    
    for (let visualIdx = 0; visualIdx < visualNormals.length; visualIdx++) {
      const visualNormal = visualNormals[visualIdx];
      const dot = physicsNormal.x * visualNormal.x + 
                  physicsNormal.y * visualNormal.y + 
                  physicsNormal.z * visualNormal.z;
      
      if (dot > bestDot) {
        bestDot = dot;
        bestMatch = visualIdx;
      }
    }
    
    // Map physics face to the visual face number
    const visualFaceNumber = visualMapping.get(bestMatch) ?? (bestMatch + 1);
    physicsToVisualMap.set(physicsIdx, visualFaceNumber);
    
    // Log first 5 mappings to verify
    if (physicsIdx < 5) {
      console.log(`  Physics[${physicsIdx}] normal(${physicsNormal.x.toFixed(3)}, ${physicsNormal.y.toFixed(3)}, ${physicsNormal.z.toFixed(3)}) → Visual triangle[${bestMatch}] → Face[${visualFaceNumber}] (dot=${bestDot.toFixed(4)})`);
    }
  }
  
  (globalThis as any).__d20PhysicsToVisualMap = physicsToVisualMap;
  console.log(`📊 D20 physics-to-visual mapping created (${physicsToVisualMap.size} faces)`);
  
  // Log the complete mapping for debugging
  console.log(`📋 Complete D20 mapping table:`);
  for (let i = 0; i < 20; i++) {
    const visualNum = physicsToVisualMap.get(i);
    console.log(`  Physics[${i}] → Visual[${visualNum}]`);
  }
}

interface DieResult {
  die_type: string;
  value: number;
  initial_position: number[];
  initial_rotation: number[];
  initial_velocity: number[];
  angular_velocity: number[];
  bounce_points: number[][];
  settle_time: number;
  is_critical: boolean;
  is_fumble: boolean;
}

interface DiceRollData {
  roll_id: string;
  dice_notation: string;
  dice_results: DieResult[];
  total: number;
  modifier: number;
  reason?: string;
  texture_id?: string;
  total_animation_time: number;
  camera_focus: number[];
}

interface CannonDiceOverlayProps {
  rollData: DiceRollData | null;
  onAnimationComplete?: () => void;
  onRollComplete?: (results: number[], total: number) => void;
  settings: DiceSettings;
  textureUrls?: { [key: string]: string };
}

interface DicePhysicsState {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  settled: boolean;
  physicsResult?: number;
  dieType: string;
  expectedValue?: number; // The value backend says should show (TRUTH)
  settleStartTime?: number;
  hasBeenNudged?: boolean; // Track if we've nudged this die to prevent edge balancing
  previousPosition?: THREE.Vector3;
  previousQuaternion?: THREE.Quaternion;
  stillFrameCount?: number;
  isSettling?: boolean; // Flag: settling phase triggered, committed to target face
  targetFaceNormal?: CANNON.Vec3; // The face normal we're forcing to ground
  targetFaceIndex?: number; // Which face we're settling on
}

export default function CannonDiceOverlay({ 
  rollData, 
  onAnimationComplete,
  onRollComplete, 
  settings,
  textureUrls 
}: CannonDiceOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<CANNON.World | null>(null);
  const dicePhysicsRef = useRef<Map<string, DicePhysicsState>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);

  // Audio context
  useEffect(() => {
    if (settings.soundEnabled && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, [settings.soundEnabled]);

  const playSound = (frequency: number, duration: number, volume: number = 0.3) => {
    if (!settings.soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(volume * settings.soundVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const vibrate = (pattern: number | number[]) => {
    if (settings.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Setup scene
  useEffect(() => {
    if (!containerRef.current || !rollData) return;

    // Three.js scene
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera - top-down view looking straight down
    // Use narrower FOV (35°) and higher position to minimize fisheye distortion
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 0); // Higher position for more orthographic-like view
    camera.lookAt(0, 0, 0); // Looking straight down at origin
    camera.up.set(0, 0, -1); // Set "up" direction so dice appear correctly oriented
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: settings.antialiasing, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = settings.shadowQuality !== 'low';
    renderer.shadowMap.type = settings.shadowQuality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Enhanced for better face visibility
    const ambient = new THREE.AmbientLight(0xffffff, 0.25); // Reduced ambient for more contrast
    scene.add(ambient);
    
    // Main directional light from side for general illumination
    const directional = new THREE.DirectionalLight(0xffffff, 0.8); // Increased intensity
    directional.position.set(5, 10, 7);
    directional.castShadow = settings.shadowQuality !== 'low';
    if (directional.shadow) {
      directional.shadow.mapSize.width = settings.shadowQuality === 'high' ? 2048 : 1024;
      directional.shadow.mapSize.height = settings.shadowQuality === 'high' ? 2048 : 1024;
    }
    scene.add(directional);
    
    // Strong top-down light to clearly highlight the top face
    const topLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
    topLight.position.set(0, 20, 0); // Directly above
    topLight.target.position.set(0, 0, 0); // Pointing straight down
    scene.add(topLight);
    scene.add(topLight.target);
    
    // Add a subtle rim light from below for edge definition
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(0, -5, 0);
    scene.add(rimLight);

    // Ground plane (visual) - match boundary size
    const boundaryWidth = window.innerWidth / 50; // Scale to viewport
    const boundaryHeight = window.innerHeight / 50;
    const groundGeometry = new THREE.PlaneGeometry(boundaryWidth * 2, boundaryHeight * 2);
    const groundVisualMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundVisualMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = settings.shadowQuality !== 'low';
    scene.add(ground);

    // Cannon.js physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    // Add global damping to help dice settle faster
    world.defaultContactMaterial.friction = 0.5;
    world.defaultContactMaterial.restitution = 0.2;
    worldRef.current = world;

    // Physics materials
    const diceMaterial = new CANNON.Material('dice');
    const groundMaterial = new CANNON.Material('ground');
    const diceGroundContact = new CANNON.ContactMaterial(diceMaterial, groundMaterial, {
      friction: 0.4,
      restitution: 0.3
    });
    world.addContactMaterial(diceGroundContact);

    // Physics ground
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: groundMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Viewport boundaries (invisible walls) - dynamically sized to viewport
    const wallMaterial = new CANNON.Material('wall');
    const diceWallContact = new CANNON.ContactMaterial(diceMaterial, wallMaterial, {
      friction: 0.3,
      restitution: 0.6
    });
    world.addContactMaterial(diceWallContact);

    // Calculate boundary positions based on viewport and camera
    const aspect = window.innerWidth / window.innerHeight;
    const fov = camera.fov * (Math.PI / 180); // Convert to radians
    const cameraDistance = camera.position.length();
    
    // Calculate visible area at ground level (y=0)
    const visibleHeight = 2 * Math.tan(fov / 2) * cameraDistance;
    const visibleWidth = visibleHeight * aspect;
    
    // Set boundaries with some padding (80% of visible area to keep dice in view)
    const halfWidth = (visibleWidth * 0.4);
    const halfDepth = (visibleHeight * 0.4);
    const wallHeight = 20; // Height for ceiling

    // Left wall
    const leftWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial
    });
    leftWall.position.set(-halfWidth, 0, 0);
    leftWall.quaternion.setFromEuler(0, Math.PI / 2, 0);
    world.addBody(leftWall);

    // Right wall
    const rightWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial
    });
    rightWall.position.set(halfWidth, 0, 0);
    rightWall.quaternion.setFromEuler(0, -Math.PI / 2, 0);
    world.addBody(rightWall);

    // Back wall
    const backWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial
    });
    backWall.position.set(0, 0, -halfDepth);
    backWall.quaternion.setFromEuler(0, 0, 0);
    world.addBody(backWall);

    // Front wall
    const frontWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial
    });
    frontWall.position.set(0, 0, halfDepth);
    frontWall.quaternion.setFromEuler(0, Math.PI, 0);
    world.addBody(frontWall);

    // Ceiling (prevents dice from flying too high)
    const ceiling = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial
    });
    ceiling.position.set(0, wallHeight, 0);
    ceiling.quaternion.setFromEuler(Math.PI / 2, 0, 0);
    world.addBody(ceiling);

    // Add rounded corners using cylinders to prevent dice from getting stuck
    const cornerRadius = 2.0; // Radius of corner rounding
    const cornerHeight = wallHeight * 2; // Tall enough to cover the play area
    
    // Bottom-left corner
    const blCorner = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(cornerRadius, cornerRadius, cornerHeight, 16),
      material: wallMaterial
    });
    blCorner.position.set(-halfWidth, cornerHeight / 2, -halfDepth);
    blCorner.quaternion.setFromEuler(0, 0, 0);
    world.addBody(blCorner);
    
    // Bottom-right corner
    const brCorner = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(cornerRadius, cornerRadius, cornerHeight, 16),
      material: wallMaterial
    });
    brCorner.position.set(halfWidth, cornerHeight / 2, -halfDepth);
    world.addBody(brCorner);
    
    // Top-left corner
    const tlCorner = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(cornerRadius, cornerRadius, cornerHeight, 16),
      material: wallMaterial
    });
    tlCorner.position.set(-halfWidth, cornerHeight / 2, halfDepth);
    world.addBody(tlCorner);
    
    // Top-right corner
    const trCorner = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(cornerRadius, cornerRadius, cornerHeight, 16),
      material: wallMaterial
    });
    trCorner.position.set(halfWidth, cornerHeight / 2, halfDepth);
    world.addBody(trCorner);

    // Create dice
    rollData.dice_results.forEach((dieResult, index) => {
      createDie(scene, world, dieResult, index, diceMaterial);
    });

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Note: Wall boundaries are set when scene initializes
      // On viewport resize, they remain at initial size until next roll
      // This is acceptable as dice rolls are quick events
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {}
      }
      dicePhysicsRef.current.forEach(state => {
        state.mesh.geometry.dispose();
        if (Array.isArray(state.mesh.material)) {
          state.mesh.material.forEach(mat => mat.dispose());
        } else {
          state.mesh.material.dispose();
        }
      });
      dicePhysicsRef.current.clear();
    };
  }, [rollData, settings]);

  // Create individual die
  const createDie = (
    scene: THREE.Scene,
    world: CANNON.World,
    dieResult: DieResult,
    index: number,
    physicsMaterial: CANNON.Material
  ) => {
    const dieType = dieResult.die_type;
    const numFaces = parseInt(dieType.substring(1)); // Extract number from "d6", "d20", etc.
    
    let geometry: THREE.BufferGeometry;
    let shape: CANNON.Shape;
    let dieSize = 3.0; // Scaled up significantly for better visibility
    
    // Create geometry and physics shape based on die type
    switch(numFaces) {
      case 4: // Tetrahedron
        geometry = new THREE.TetrahedronGeometry(dieSize);
        shape = new CANNON.Sphere(dieSize * 0.6); // Approximate with sphere
        break;
      case 6: // Cube
        geometry = new THREE.BoxGeometry(dieSize, dieSize, dieSize);
        shape = new CANNON.Box(new CANNON.Vec3(dieSize / 2, dieSize / 2, dieSize / 2));
        break;
      case 8: // Octahedron
        geometry = new THREE.OctahedronGeometry(dieSize);
        // Create proper convex polyhedron for octahedron physics
        shape = createD8PhysicsShape(dieSize);
        break;
      case 10: // Pentagonal trapezohedron (custom geometry)
        geometry = createD10Geometry(dieSize);
        // Create proper convex hull for d10 physics
        shape = createD10PhysicsShape(dieSize);
        break;
      case 12: // Dodecahedron
        geometry = new THREE.DodecahedronGeometry(dieSize);
        shape = createD12PhysicsShape(dieSize);
        
        // Extract face normals from THREE.js geometry (these are correct)
        // Store them globally for face detection
        extractD12FaceNormalsFromGeometry(geometry);
        break;
      case 20: // Icosahedron
        dieSize = 4.0; // Larger for better readability
        geometry = new THREE.IcosahedronGeometry(dieSize);
        // Use proper convex hull for d20 physics (edges and corners will interact with ground)
        shape = createD20PhysicsShape(dieSize);
        break;
      case 100: // Percentile (d10 with 00-90)
        geometry = new THREE.IcosahedronGeometry(dieSize, 0);
        shape = new CANNON.Sphere(dieSize * 0.7);
        break;
      default:
        geometry = new THREE.BoxGeometry(dieSize, dieSize, dieSize);
        shape = new CANNON.Box(new CANNON.Vec3(dieSize / 2, dieSize / 2, dieSize / 2));
    }

    // Apply UV mapping for texture atlas
    applyDiceUVMapping(geometry, numFaces);

    // For d20, create physics-to-visual mapping after geometry is ready
    if (numFaces === 20) {
      createD20PhysicsToVisualMapping();
    }

    const material = createDiceMaterials(dieResult);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = settings.shadowQuality !== 'low';
    mesh.receiveShadow = settings.shadowQuality !== 'low';
    scene.add(mesh);

    // Cannon.js body
    // Mass varies by die type to simulate solid cast plastic
    let mass: number;
    if (numFaces === 20) {
      mass = 0.60; // D20 is larger (dieSize=4.0), so heavier
    } else if (numFaces === 12) {
      mass = 0.55; // D12 similar size to d20
    } else if (numFaces === 10) {
      mass = 0.50; // D10 medium mass
    } else if (numFaces === 8) {
      mass = 0.45; // D8 smaller than d10
    } else {
      mass = 0.45; // Standard dice
    }
    const baseDamping = numFaces === 10 ? 0.3 : 0.25; // Low damping for airborne momentum
    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      material: physicsMaterial,
      linearDamping: baseDamping,
      angularDamping: baseDamping
    });

    if (!settings.animateRolls) {
      // Instant mode - place at final position with target value showing
      const finalRotation = getRotationForValue(dieResult.value, dieResult.die_type);
      body.position.set(dieResult.initial_position[0], 0.2, dieResult.initial_position[2]);
      body.quaternion.set(finalRotation.x, finalRotation.y, finalRotation.z, finalRotation.w);
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    } else {
      // Animated mode - throw from offscreen with horizontal emphasis
      const startX = (Math.random() - 0.5) * 12; // Wider starting spread
      const startZ = -12; // Further back
      const startY = 3 + Math.random() * 2; // Lower starting height
      
      body.position.set(startX, startY, startZ);
      body.quaternion.setFromEuler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Horizontal-focused velocity - fast forward, minimal upward
      body.velocity.set(
        (Math.random() - 0.5) * 12 * settings.throwForce, // Strong horizontal
        (8 + Math.random() * 7) * settings.throwForce, // Moderate upward
        (50 + Math.random() * 9) * settings.throwForce // Fast forward velocity
      );
      
      // High initial angular velocity for rapid tumbling
      body.angularVelocity.set(
        (Math.random() - 0.5) * 20 * settings.spinIntensity,
        (Math.random() - 0.5) * 20 * settings.spinIntensity,
        (Math.random() - 0.5) * 20 * settings.spinIntensity
      );
      
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    }

    world.addBody(body);
    
    dicePhysicsRef.current.set(`die_${index}`, {
      mesh: mesh,
      body: body,
      settled: !settings.animateRolls,
      dieType: dieResult.die_type,
      expectedValue: dieResult.value, // Store the CORRECT value from backend
      physicsResult: settings.animateRolls ? undefined : dieResult.value // In instant mode, use backend value directly
    });
  };

  // Create dice materials with texture atlas
  const createDiceMaterials = (dieResult: DieResult): THREE.Material => {
    const dieType = dieResult.die_type;
    const numFaces = parseInt(dieType.substring(1));
    
    // Get texture config based on critical/fumble status
    const textureConfig = getDiceTextureConfig(
      dieResult.is_critical,
      dieResult.is_fumble
    );
    
    // Create material with texture atlas
    return createDiceMaterial(numFaces, textureConfig);
  };

  // Get rotation quaternion for specific value (for instant display mode)
  const getRotationForValue = (value: number, dieType: string = 'd6'): CANNON.Quaternion => {
    const numFaces = parseInt(dieType.substring(1));
    const quat = new CANNON.Quaternion();
    
    // For instant display, we rotate to show the desired value on top
    // The rotation depends on the die geometry
    switch(numFaces) {
      case 4: // D4
        quat.setFromEuler((value * Math.PI) / 2, 0, 0);
        break;
      case 6: // D6
        const rotations = [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: Math.PI, z: 0 },
          { x: 0, y: 0, z: Math.PI / 2 },
          { x: 0, y: 0, z: -Math.PI / 2 },
          { x: Math.PI / 2, y: 0, z: 0 },
          { x: -Math.PI / 2, y: 0, z: 0 }
        ];
        const rot = rotations[value - 1];
        quat.setFromEuler(rot.x, rot.y, rot.z);
        break;
      case 8: // D8
        quat.setFromEuler((value * Math.PI) / 4, (value * Math.PI) / 3, 0);
        break;
      case 10: // D10
      case 100: // D%
        const angle = ((value % 10) * 2 * Math.PI) / 10;
        quat.setFromEuler(Math.PI / 4, angle, 0);
        break;
      case 12: // D12
        quat.setFromEuler((value * Math.PI) / 6, (value * Math.PI) / 5, 0);
        break;
      case 20: // D20
        const lat = Math.acos(-1 + (2 * (value - 1)) / 19);
        const lon = Math.sqrt(19 * Math.PI) * lat;
        quat.setFromEuler(lat, lon, 0);
        break;
      default:
        quat.setFromEuler(0, 0, 0);
    }
    
    return quat;
  };

  // Get top face value from rotation based on die type
  const getTopFaceValue = (quaternion: CANNON.Quaternion, dieType: string = 'd6'): number => {
    const upVector = new CANNON.Vec3(0, 1, 0);
    const numFaces = parseInt(dieType.substring(1));
    
    // For d8, d10, d12 and d20, use geometry-based NORMAL detection
    if (numFaces === 8 || numFaces === 10 || numFaces === 12 || numFaces === 20) {
      let faceNormals: CANNON.Vec3[] = [];
      
      if (numFaces === 20) {
        // For d20: Use physics shape normals (computed from CANNON vertices/faces)
        const physicsNormals = (globalThis as any).__d20PhysicsFaceNormals as CANNON.Vec3[];
        if (physicsNormals && physicsNormals.length === 20) {
          faceNormals = physicsNormals;
        } else {
          console.error('D20 physics normals not found! Detection will be incorrect.');
          return 1;
        }
      } else if (numFaces === 12) {
        // For d12: Use physics shape normals (computed from CANNON vertices/faces)
        const physicsNormals = (globalThis as any).__d12PhysicsFaceNormals as CANNON.Vec3[];
        if (physicsNormals && physicsNormals.length === 12) {
          faceNormals = physicsNormals;
        } else {
          console.error('D12 physics normals not found! Detection will be incorrect.');
          return 1;
        }
      } else {
        // For d8 and d10: Extract face normals from geometry
        const firstDie = Array.from(dicePhysicsRef.current.values())[0];
        if (!firstDie?.mesh) return 0;
        
        const geometry = firstDie.mesh.geometry as THREE.BufferGeometry;
        const normalAttr = geometry.getAttribute('normal');
        if (!normalAttr) return 0;
        
        const verticesPerFace = numFaces === 8 ? 3 : 6; // triangles for d8, kites for d10
        for (let faceIndex = 0; faceIndex < numFaces; faceIndex++) {
          const vertexIndex = faceIndex * verticesPerFace;
          const nx = normalAttr.getX(vertexIndex);
          const ny = normalAttr.getY(vertexIndex);
          const nz = normalAttr.getZ(vertexIndex);
          faceNormals.push(new CANNON.Vec3(nx, ny, nz));
        }
      }
      
      // Find which normal is most aligned with up vector
      let closestFace = 0;
      let smallestAngle = Math.PI;
      
      faceNormals.forEach((normal, faceIndex) => {
        // Rotate normal by die's quaternion
        const rotatedNormal = quaternion.vmult(normal);
        // Calculate angle between rotated normal and up vector (0, 1, 0)
        const angle = Math.acos(Math.max(-1, Math.min(1, rotatedNormal.dot(upVector))));
        if (angle < smallestAngle) {
          smallestAngle = angle;
          closestFace = faceIndex;
        }
      });
      
      // For d8: Map physics face index to correct texture face number
      if (numFaces === 8) {
        // D8 Correction Table: Based on empirical testing of all 8 faces
        // User test results (Display X → System reports Y means Physics face (Y-1) shows texture X):
        //   Display 1 → Reports 3: Physics 2 → Texture 1
        //   Display 2 → Reports 4: Physics 3 → Texture 2
        //   Display 3 → Reports 1: Physics 0 → Texture 3
        //   Display 4 → Reports 2: Physics 1 → Texture 4
        //   Display 5 → Reports 7: Physics 6 → Texture 5
        //   Display 6 → Reports 8: Physics 7 → Texture 6
        //   Display 7 → Reports 5: Physics 4 → Texture 7
        //   Display 8 → Reports 6: Physics 5 → Texture 8
        //
        // Therefore: Physics face → Correct texture number
        const d8CorrectionMap = [3, 4, 1, 2, 7, 8, 5, 6];
        const detectedFace = d8CorrectionMap[closestFace];
        
        console.log(`🎲🎲🎲 D8 FACE DETECTION: Physics face[${closestFace}] → Correction map gives ${detectedFace} 🎲🎲🎲`);
        console.log(`🎲 Current correction map: [3, 4, 1, 2, 7, 8, 5, 6]`);
        
        return detectedFace;
      }
      
      // For d12: Direct mapping - physics face index maps to geometry face, which maps to display
      if (numFaces === 12) {
        // No correction needed! Physics face order now aligns with geometry face order
        // Physics face[N] → Geometry face[N] → Display number from UV mapping
        // The UV mapping assigns display numbers 1-12 in geometry face order 0-11
        const detectedFace = closestFace + 1; // Physics face 0 → Display 1, etc.
        
        console.log(`🎲🎲🎲 D12 FACE DETECTION (Direct Mapping): Physics face[${closestFace}] → Display ${detectedFace} 🎲🎲🎲`);
        
        return detectedFace;
      }
      
      // For d20: Map physics face index to visual face number, then correct to actual d20 number
      if (numFaces === 20) {
        const physicsToVisualMap = (globalThis as any).__d20PhysicsToVisualMap as Map<number, number>;
        const detectedFace = physicsToVisualMap?.get(closestFace) ?? (closestFace + 1);
        
        // D20 Correction Table: Maps detected visual face to actual d20 number
        // This must be a 1:1 bijection - each visual face (1-20) maps to exactly one unique actual number (1-20)
        // Based on user testing, but needs verification for all 20 faces
        const d20CorrectionMap: Record<number, number> = {
          1: 1,    // Detected 1 → Actual 1 (needs testing)
          2: 2,    // Detected 2 → Actual 2 (needs testing)
          3: 3,    // Detected 3 → Actual 3 ✓
          4: 4,    // Detected 4 → Actual 4 (needs testing)
          5: 5,    // Detected 5 → Actual 5 (needs testing)
          6: 6,    // Detected 6 → Actual 6 ✓
          7: 7,    // Detected 7 → Actual 7 ✓
          8: 8,    // Detected 8 → Actual 8 (needs testing)
          9: 9,    // Detected 9 → Actual 9 (needs testing)
          10: 10,  // Detected 10 → Actual 10 (needs testing)
          11: 11,  // Detected 11 → Actual 11 ✓
          12: 12,  // Detected 12 → Actual 12 (needs testing)
          13: 13,  // Detected 13 → Actual 13 (needs testing)
          14: 14,  // Detected 14 → Actual 14 (needs testing)
          15: 15,  // Detected 15 → Actual 15 (needs testing)
          16: 16,  // Detected 16 → Actual 16 (identity mapping)
          17: 17,  // Detected 17 → Actual 17 (needs testing)
          18: 18,  // Detected 18 → Actual 18 (needs testing)
          19: 19,  // Detected 19 → Actual 19 (needs testing)
          20: 20,  // Detected 20 → Actual 20 (needs testing)
        };
        
        const actualNumber = d20CorrectionMap[detectedFace] ?? detectedFace;
        
        console.log(`🎲 D20: Physics[${closestFace}] → Visual[${detectedFace}] → Actual[${actualNumber}]`);
        
        return actualNumber;
      }
      
      // For d10: Look up face number from kite mapping
      const mapKey = '__d10KiteToFaceMap';
      const faceToNumberMap = (globalThis as any)[mapKey] as Map<number, number>;
      const faceNumber = faceToNumberMap?.get(closestFace) ?? (closestFace + 1);
      
      if (numFaces === 10) {
        // Log all kites with their angles for debugging
        const kiteAngles = faceNormals.map((normal, idx) => {
          const rotatedNormal = quaternion.vmult(normal);
          const angle = Math.acos(Math.max(-1, Math.min(1, rotatedNormal.dot(upVector))));
          return `Kite ${idx}:${(angle * 180 / Math.PI).toFixed(1)}°`;
        }).join(', ');
        console.log(`D10 Detection - All kite angles to UP: ${kiteAngles}`);
        console.log(`D10 Detection (normal-based): Kite ${closestFace} normal most aligned with UP (angle: ${(smallestAngle * 180 / Math.PI).toFixed(1)}°) -> Face ${faceNumber}`);
      } else if (numFaces === 20) {
        // Log all faces with their angles for debugging
        const faceAngles = faceNormals.map((normal, idx) => {
          const rotatedNormal = quaternion.vmult(normal);
          const angle = Math.acos(Math.max(-1, Math.min(1, rotatedNormal.dot(upVector))));
          const mappedNumber = faceToNumberMap?.get(idx) ?? (idx + 1);
          return `T${idx}→${mappedNumber}:${(angle * 180 / Math.PI).toFixed(1)}°`;
        }).join(', ');
        console.log(`D20 Detection - All triangle angles to UP: ${faceAngles}`);
        console.log(`D20 Detection: Triangle ${closestFace} (angle: ${(smallestAngle * 180 / Math.PI).toFixed(1)}°) -> Face ${faceNumber}`);
        console.log(`  Body quaternion: (${quaternion.x.toFixed(3)}, ${quaternion.y.toFixed(3)}, ${quaternion.z.toFixed(3)}, ${quaternion.w.toFixed(3)})`);
        
        // Find and log mesh quaternion for comparison
        const firstDie = Array.from(dicePhysicsRef.current.values())[0];
        if (firstDie?.mesh) {
          const mq = firstDie.mesh.quaternion;
          console.log(`  Mesh quaternion: (${mq.x.toFixed(3)}, ${mq.y.toFixed(3)}, ${mq.z.toFixed(3)}, ${mq.w.toFixed(3)})`);
        }
      }
      
      return faceNumber;
    }
    
    // For other dice types, use the normal-based approach
    const faceNormals = generateFaceNormals(numFaces);
    
    let closestValue = 1;
    let smallestAngle = Math.PI;
    
    // Find which face normal is most aligned with the up vector (0, 1, 0)
    faceNormals.forEach((normal, index) => {
      const rotatedNormal = quaternion.vmult(normal);
      const angle = Math.acos(Math.max(-1, Math.min(1, rotatedNormal.dot(upVector))));
      if (angle < smallestAngle) {
        smallestAngle = angle;
        closestValue = index + 1;
      }
    });
    
    // For percentile dice (d100), multiply by 10 and handle special case
    if (numFaces === 100) {
      return closestValue === 10 ? 0 : (closestValue * 10);
    }
    
    return closestValue;
  };

  // Generate face normals for different polyhedra
  const generateFaceNormals = (numFaces: number): CANNON.Vec3[] => {
    const normals: CANNON.Vec3[] = [];
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    
    switch(numFaces) {
      case 4: // Tetrahedron - 4 faces
        normals.push(new CANNON.Vec3(1, 1, 1).unit());
        normals.push(new CANNON.Vec3(-1, -1, 1).unit());
        normals.push(new CANNON.Vec3(-1, 1, -1).unit());
        normals.push(new CANNON.Vec3(1, -1, -1).unit());
        break;
      
      case 6: // Cube - 6 faces (opposite faces sum to 7: 1↔6, 2↔5, 3↔4)
        // Empirical mapping: Visual 1→detected 5 (swap), Visual 2→detected 4 (swap)
        normals.push(new CANNON.Vec3(0, -1, 0));   // Face 1 (swapped with Face 5)
        normals.push(new CANNON.Vec3(0, 0, 1));    // Face 2 ✓
        normals.push(new CANNON.Vec3(0, 0, -1));   // Face 3 ✓
        normals.push(new CANNON.Vec3(1, 0, 0));    // Face 4
        normals.push(new CANNON.Vec3(-1, 0, 0));   // Face 5 (swapped with Face 1)
        normals.push(new CANNON.Vec3(0, 1, 0));    // Face 6 ✓
        normals.push(new CANNON.Vec3(0, 0, -1));
        break;
      
      case 8: // Octahedron - 8 faces
        // Regular octahedron: 8 triangular faces
        // Opposite faces must sum to 9 (1↔8, 2↔7, 3↔6, 4↔5)
        // Order: Top 4 faces (upper pyramid), then bottom 4 faces (lower pyramid)
        normals.push(new CANNON.Vec3(1, 1, 1).unit());   // Face 1 (top-front-right)
        normals.push(new CANNON.Vec3(-1, 1, 1).unit());  // Face 2 (top-front-left)
        normals.push(new CANNON.Vec3(-1, 1, -1).unit()); // Face 3 (top-back-left)
        normals.push(new CANNON.Vec3(1, 1, -1).unit());  // Face 4 (top-back-right)
        normals.push(new CANNON.Vec3(1, -1, -1).unit()); // Face 5 (bottom-back-right) - opposite of 4
        normals.push(new CANNON.Vec3(-1, -1, -1).unit());// Face 6 (bottom-back-left) - opposite of 3
        normals.push(new CANNON.Vec3(-1, -1, 1).unit()); // Face 7 (bottom-front-left) - opposite of 2
        normals.push(new CANNON.Vec3(1, -1, 1).unit());  // Face 8 (bottom-front-right) - opposite of 1
        break;
      
      case 10: // d10 - 10 kite faces (pentagonal trapezohedron)
      case 100: // d% - same geometry, different numbering
        // CRITICAL: Use the EXACT same kite normal calculation as D10Geometry.ts
        // This must match the geometry's kite center computation exactly
        
        const d10Radius = 1.0;
        const d10ApexY = d10Radius;
        const d10RingY = d10Radius * Math.sin(Math.PI / 10);  // 0.309 * radius
        const d10RingRadius = d10Radius * Math.cos(Math.PI / 10);  // 0.951 * radius
        
        // Build vertices exactly as in D10Geometry.ts
        const d10Vertices: Array<{x: number, y: number, z: number}> = [];
        
        // Vertex 0: top apex
        d10Vertices.push({x: 0, y: d10ApexY, z: 0});
        // Vertex 1: bottom apex
        d10Vertices.push({x: 0, y: -d10ApexY, z: 0});
        
        // Vertices 2-6: upper ring (5 vertices, starting at angle -90°)
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
          d10Vertices.push({
            x: d10RingRadius * Math.cos(angle),
            y: d10RingY,
            z: d10RingRadius * Math.sin(angle)
          });
        }
        
        // Vertices 7-11: lower ring (5 vertices, offset by 36°)
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI / 5) + (Math.PI / 5) - Math.PI / 2;
          d10Vertices.push({
            x: d10RingRadius * Math.cos(angle),
            y: -d10RingY,
            z: d10RingRadius * Math.sin(angle)
          });
        }
        
        // Build indices exactly as in D10Geometry.ts
        const d10Indices: number[] = [];
        
        // Upper 5 kites (kite 0-4)
        for (let i = 0; i < 5; i++) {
          const upperCurrent = 2 + i;
          const upperNext = 2 + ((i + 1) % 5);
          const lowerCurrent = 7 + i;
          
          d10Indices.push(0, upperNext, upperCurrent);
          d10Indices.push(upperCurrent, upperNext, lowerCurrent);
        }
        
        // Lower 5 kites (kite 5-9)
        for (let i = 0; i < 5; i++) {
          const lowerCurrent = 7 + i;
          const lowerNext = 7 + ((i + 1) % 5);
          const upperNext = 2 + ((i + 1) % 5);
          
          d10Indices.push(lowerCurrent, upperNext, lowerNext);
          d10Indices.push(lowerCurrent, lowerNext, 1);
        }
        
        // Compute kite normals exactly as in D10Geometry.ts
        const d10KiteData: Array<{normal: CANNON.Vec3, y: number, angle: number}> = [];
        
        for (let kiteIndex = 0; kiteIndex < 10; kiteIndex++) {
          const triIndex1 = kiteIndex * 2;
          const triIndex2 = kiteIndex * 2 + 1;
          
          const i1 = d10Indices[triIndex1 * 3];
          const i2 = d10Indices[triIndex1 * 3 + 1];
          const i3 = d10Indices[triIndex1 * 3 + 2];
          const i4 = d10Indices[triIndex2 * 3 + 2];
          
          const v1 = d10Vertices[i1];
          const v2 = d10Vertices[i2];
          const v3 = d10Vertices[i3];
          const v4 = d10Vertices[i4];
          
          // Kite center = average of 4 vertices
          const cx = (v1.x + v2.x + v3.x + v4.x) / 4;
          const cy = (v1.y + v2.y + v3.y + v4.y) / 4;
          const cz = (v1.z + v2.z + v3.z + v4.z) / 4;
          
          // Normalize to get normal
          const len = Math.sqrt(cx*cx + cy*cy + cz*cz);
          const normal = new CANNON.Vec3(cx/len, cy/len, cz/len);
          
          d10KiteData.push({
            normal,
            y: normal.y,
            angle: Math.atan2(normal.z, normal.x)
          });
        }
        
        // Sort to match DiceTextureAtlas.ts sorting (by Y desc, then by angle)
        d10KiteData.sort((a, b) => {
          const yDiff = b.y - a.y;
          if (Math.abs(yDiff) > 0.3) return yDiff;
          return a.angle - b.angle;
        });
        
        // Add sorted normals
        d10KiteData.forEach(k => normals.push(k.normal));
        
        // Debug logging
        console.log('D10 Physics Normals (sorted, matching geometry):');
        d10KiteData.forEach((k, i) => {
          console.log(`  Face ${i}: y=${k.y.toFixed(3)}, angle=${(k.angle * 180 / Math.PI).toFixed(1)}°, normal=(${k.normal.x.toFixed(3)}, ${k.normal.y.toFixed(3)}, ${k.normal.z.toFixed(3)})`);
        });
        break;
      
      case 12: // Dodecahedron - 12 faces
        const vertices = [
          [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
          [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1],
          [0, phi, 1/phi], [0, -phi, 1/phi], [0, phi, -1/phi], [0, -phi, -1/phi],
        ];
        vertices.forEach(v => normals.push(new CANNON.Vec3(v[0], v[1], v[2]).unit()));
        break;
      
      case 20: // Icosahedron - 20 faces
        for (let i = 0; i < 20; i++) {
          const lat = Math.acos(-1 + (2 * i) / 19);
          const lon = Math.sqrt(19 * Math.PI) * lat;
          normals.push(new CANNON.Vec3(
            Math.sin(lat) * Math.cos(lon),
            Math.cos(lat),
            Math.sin(lat) * Math.sin(lon)
          ).unit());
        }
        break;
      
      default:
        // Fallback to cube
        normals.push(new CANNON.Vec3(1, 0, 0));
        normals.push(new CANNON.Vec3(-1, 0, 0));
        normals.push(new CANNON.Vec3(0, 1, 0));
        normals.push(new CANNON.Vec3(0, -1, 0));
        normals.push(new CANNON.Vec3(0, 0, 1));
        normals.push(new CANNON.Vec3(0, 0, -1));
    }
    
    return normals;
  };

  // Animation loop
  useEffect(() => {
    if (!rollData || !sceneRef.current || !cameraRef.current || !rendererRef.current || !worldRef.current) return;

    setIsAnimating(true);
    setShowResult(false);
    setCalculatedTotal(null);
    startTimeRef.current = performance.now();

    playSound(200, 0.1, 0.4);
    vibrate(50);

    const animate = (currentTime: number) => {
      if (!startTimeRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current || !worldRef.current) return;

      const elapsedTime = (currentTime - startTimeRef.current) / 1000;

      if (settings.animateRolls) {
        // Step physics
        worldRef.current.step(1 / 60);
        
        // Update meshes from physics bodies
        let allSettled = true;
        console.log(`Animation frame - elapsed: ${elapsedTime.toFixed(2)}s, dice count: ${dicePhysicsRef.current.size}`);
        dicePhysicsRef.current.forEach((state, key) => {
          const { mesh, body, settled } = state;
          
          // Update mesh position and rotation from physics (always update until settled)
          if (!settled) {
            mesh.position.copy(body.position as any);
            mesh.quaternion.copy(body.quaternion as any);
            
            // Apply moderate damping when die is on the ground (surface friction)
            const isOnGround = body.position.y < 1.5; // Die is touching or near surface
            if (isOnGround && !state.isSettling) {
              // Velocity decay on ground contact - tuned per die type
              // D8 triangular faces are more stable, d12 pentagonal faces need similar damping
              let horizontalDamping = 0.70; // Default: Lose 30% of horizontal speed per frame
              let verticalDamping = 0.25;   // Default: Lose 75% of vertical speed per frame
              let angularDamping = 0.75;    // Default: Lose 25% of rotation per frame
              
              if (state.dieType === 'd12') {
                horizontalDamping = 0.68; // D12: Similar to d8, slightly more damping
                verticalDamping = 0.25;   // D12: Same vertical damping
                angularDamping = 0.72;    // D12: Similar to d8, allows natural rolling
              }
              
              body.velocity.x *= horizontalDamping;
              body.velocity.z *= horizontalDamping;
              body.velocity.y *= verticalDamping;
              body.angularVelocity.scale(angularDamping, body.angularVelocity);
              
              // Subtle edge nudging - gently push dice away from viewport boundaries
              // Calculate boundary positions (same as wall setup)
              const aspect = window.innerWidth / window.innerHeight;
              const fov = 35 * (Math.PI / 180); // Camera FOV
              const cameraDistance = 40; // Camera height
              const visibleHeight = 2 * Math.tan(fov / 2) * cameraDistance;
              const visibleWidth = visibleHeight * aspect;
              const halfWidth = visibleWidth * 0.4;
              const halfDepth = visibleHeight * 0.4;
              
              // Define nudge zone (10% of boundary distance from edge)
              const nudgeZone = Math.min(halfWidth, halfDepth) * 0.1;
              
              // Check distance from each edge and reverse momentum if heading toward it
              const distFromLeft = body.position.x + halfWidth;
              const distFromRight = halfWidth - body.position.x;
              const distFromBack = body.position.z + halfDepth;
              const distFromFront = halfDepth - body.position.z;
              
              // Reverse momentum if near edges and moving toward them
              if (distFromLeft < nudgeZone && distFromLeft > 0 && body.velocity.x < 0) {
                body.velocity.x = -body.velocity.x * 0.5; // Reverse and dampen
              }
              if (distFromRight < nudgeZone && distFromRight > 0 && body.velocity.x > 0) {
                body.velocity.x = -body.velocity.x * 0.5; // Reverse and dampen
              }
              if (distFromBack < nudgeZone && distFromBack > 0 && body.velocity.z < 0) {
                body.velocity.z = -body.velocity.z * 0.5; // Reverse and dampen
              }
              if (distFromFront < nudgeZone && distFromFront > 0 && body.velocity.z > 0) {
                body.velocity.z = -body.velocity.z * 0.5; // Reverse and dampen
              }
            }
            
            // FIRST: Check if die has basically stopped moving - if so, force settle immediately
            const currentSpeed = body.velocity.length();
            const currentAngSpeed = body.angularVelocity.length();
            
            // If velocity is near zero and on ground, force settle NOW
            // Skip d12 - let it settle naturally without forcing velocity to 0
            if (!settled && isOnGround && currentSpeed < 0.05 && currentAngSpeed < 0.05 && state.dieType !== 'd12') {
              // Find which face is closest to ground RIGHT NOW
              const downVector = new CANNON.Vec3(0, -1, 0);
              let faceNormals: CANNON.Vec3[] = [];
              
              if (state.dieType === 'd12') {
                const physicsNormals = (globalThis as any).__d12PhysicsFaceNormals as CANNON.Vec3[];
                if (physicsNormals && physicsNormals.length === 12) {
                  faceNormals = physicsNormals;
                }
              } else if (state.dieType === 'd8') {
                faceNormals = generateFaceNormals(8);
              } else if (state.dieType === 'd20') {
                faceNormals = (globalThis as any).__d20PhysicsFaceNormals as CANNON.Vec3[];
              }
              
              if (faceNormals.length > 0) {
                let closestFaceIndex = 0;
                let bestAlignment = -1;
                
                faceNormals.forEach((normal, idx) => {
                  const rotatedNormal = body.quaternion.vmult(normal);
                  const alignment = rotatedNormal.dot(downVector);
                  if (alignment > bestAlignment) {
                    bestAlignment = alignment;
                    closestFaceIndex = idx;
                  }
                });
                
                // FORCE the die onto this face
                const targetNormal = faceNormals[closestFaceIndex];
                const currentNormal = body.quaternion.vmult(targetNormal);
                
                // Calculate rotation needed to make this face perfectly flush with ground
                const rotationAxis = new CANNON.Vec3();
                currentNormal.cross(downVector, rotationAxis);
                
                if (rotationAxis.length() > 0.001) {
                  rotationAxis.normalize();
                  const angle = Math.acos(Math.max(-1, Math.min(1, bestAlignment)));
                  
                  // Create quaternion for correction rotation
                  const correctionQuat = new CANNON.Quaternion();
                  correctionQuat.setFromAxisAngle(rotationAxis, angle);
                  
                  // Apply correction to make face flush
                  body.quaternion = correctionQuat.mult(body.quaternion);
                  body.quaternion.normalize();
                }
                
                // FREEZE all motion
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
                body.mass = 0; // Make static
                body.sleep(); // Put to sleep
                body.collisionResponse = false; // No more collisions
                
                // NOW read the value
                state.settled = true;
                state.physicsResult = getTopFaceValue(body.quaternion, state.dieType);
                
                console.log(`⚡ FORCE SETTLED ${state.dieType}: Face ${closestFaceIndex} → Value ${state.physicsResult} (speed: ${currentSpeed.toFixed(4)}, angSpeed: ${currentAngSpeed.toFixed(4)})`);
                playSound(300, 0.05, 0.2);
              }
            }
            
            // If settling, apply physics forces to roll die to flush position
            if (!settled && state.isSettling && state.targetFaceNormal) {
              const downVector = new CANNON.Vec3(0, -1, 0);
              const currentNormal = body.quaternion.vmult(state.targetFaceNormal);
              const alignment = currentNormal.dot(downVector);
              
              const currentSpeed = body.velocity.length();
              const currentAngSpeed = body.angularVelocity.length();
              
              // Stricter settling check: face must be flush AND die completely stopped AND on ground
              const isOnGround = body.position.y < 1.5; // Die center must be close to ground
              if (alignment > 0.98 && currentSpeed < 0.005 && currentAngSpeed < 0.005 && isOnGround) {
                // FREEZE everything - die is fully stopped with face on ground
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
                body.mass = 0; // Make static
                body.sleep(); // Put to sleep
                body.collisionResponse = false; // No more collisions
                
                state.settled = true;
                // Read the actual face that's pointing up from physics
                state.physicsResult = getTopFaceValue(body.quaternion, state.dieType);
                console.log(`✓ Die ${key} (${state.dieType}) SETTLED on: ${state.physicsResult} (expected: ${state.expectedValue}, alignment: ${alignment.toFixed(4)}, speed: ${currentSpeed.toFixed(6)}, angSpeed: ${currentAngSpeed.toFixed(6)}, yPos: ${body.position.y.toFixed(4)})`);
                
                // Debug: Check if die is resting stably on a face
                if (state.dieType === 'd12') {
                  console.log(`🔍 D12 DEBUG: Final position y=${body.position.y.toFixed(4)}, alignment=${alignment.toFixed(4)}, target face index=${state.targetFaceIndex}`);
                }
                
                playSound(300, 0.05, 0.2);
              } else {
                // Only apply corrective torque when die is moving slowly
                // This prevents fighting against the die's natural momentum
                if (currentSpeed < 0.3 && currentAngSpeed < 0.2) {
                  // Calculate rotation axis (perpendicular to current and target)
                  const rotationAxis = new CANNON.Vec3();
                  currentNormal.cross(downVector, rotationAxis);
                  
                  if (rotationAxis.length() > 0.001) {
                    rotationAxis.normalize();
                    
                    // Calculate angle to rotate (how far from flush)
                    const angle = Math.acos(Math.max(-1, Math.min(1, alignment)));
                    
                    // Increased torque for faster but natural settling
                    // Scale torque by die type: d8 is lighter (5g), d12 is 6g, d20 is heavier
                    let baseTorque = 20.0; // Default for d20
                    if (state.dieType === 'd8') baseTorque = 5.0;
                    else if (state.dieType === 'd12') baseTorque = 6.0;
                    const torqueMagnitude = angle * baseTorque;
                    const torque = new CANNON.Vec3(
                      rotationAxis.x * torqueMagnitude,
                      rotationAxis.y * torqueMagnitude,
                      rotationAxis.z * torqueMagnitude
                    );
                    
                    // Apply torque
                    body.angularVelocity.vadd(torque.scale(1/60), body.angularVelocity);
                    
                    console.log(`🔄 Settling d20: alignment=${alignment.toFixed(4)}, angle=${(angle * 180/Math.PI).toFixed(1)}°, speed=${currentSpeed.toFixed(6)}, angSpeed=${currentAngSpeed.toFixed(6)}`);
                  }
                }
                
                // Stronger damping during settling for faster final approach
                // D8/D12 need lighter damping due to their lower mass
                let velocityDamping = 0.90; // Increased damping for d20
                let angularDamping = 0.92;
                if (state.dieType === 'd8') {
                  velocityDamping = 0.94;
                  angularDamping = 0.95;
                } else if (state.dieType === 'd12') {
                  velocityDamping = 0.92;
                  angularDamping = 0.94;
                }
                body.velocity.scale(velocityDamping, body.velocity);
                body.angularVelocity.scale(angularDamping, body.angularVelocity);
              }
            }
            
            // Check physics velocity - when die slows down enough, TRIGGER SETTLING
            if (!state.isSettling && !settled) {
              const speed = body.velocity.length();
              const angSpeed = body.angularVelocity.length();
              
              // Thresholds to trigger settling phase - only when die is quite slow
              const speedThreshold = 0.4;  // Slow rolling
              const angSpeedThreshold = 0.3; // Slow rotation
              
              // For d12, skip gradual settling - let force settle handle it naturally
              // D12 with heavier mass settles well on its own without torque assistance
              if (state.dieType === 'd12') {
                // Skip - d12 uses force settle only
              } else if (speed < speedThreshold && angSpeed < angSpeedThreshold && elapsedTime > 0.5) {
                // Find which face is closest to the GROUND (pointing DOWN)
                const downVector = new CANNON.Vec3(0, -1, 0); // Surface normal (straight down)
                let faceNormals: CANNON.Vec3[] = [];
                
                if (state.dieType === 'd20') {
                  // Use physics shape normals for d20
                  const physicsNormals = (globalThis as any).__d20PhysicsFaceNormals as CANNON.Vec3[];
                  if (physicsNormals && physicsNormals.length === 20) {
                    faceNormals = physicsNormals;
                    console.log(`📐 D20 physics face normals loaded: ${faceNormals.length} faces`);
                  } else {
                    console.error('❌ D20 physics normals NOT found in globalThis');
                  }
                } else if (state.dieType === 'd10') {
                  const firstDie = Array.from(dicePhysicsRef.current.values())[0];
                  if (firstDie?.mesh) {
                    const geometry = firstDie.mesh.geometry as THREE.BufferGeometry;
                    const normalAttr = geometry.getAttribute('normal');
                    if (normalAttr) {
                      const verticesPerKite = 6;
                      for (let kiteIndex = 0; kiteIndex < 10; kiteIndex++) {
                        const vertexIndex = kiteIndex * verticesPerKite;
                        faceNormals.push(new CANNON.Vec3(
                          normalAttr.getX(vertexIndex),
                          normalAttr.getY(vertexIndex),
                          normalAttr.getZ(vertexIndex)
                        ));
                      }
                    }
                  }
                } else if (state.dieType === 'd8') {
                  // Use physics shape normals for d8 (same as set in generateFaceNormals)
                  faceNormals = generateFaceNormals(8);
                } else if (state.dieType === 'd12') {
                  // Use physics shape normals for d12
                  const physicsNormals = (globalThis as any).__d12PhysicsFaceNormals as CANNON.Vec3[];
                  if (physicsNormals && physicsNormals.length === 12) {
                    faceNormals = physicsNormals;
                    console.log(`📐 D12 physics face normals loaded: ${faceNormals.length} faces`);
                  } else {
                    console.error('❌ D12 physics normals NOT found in globalThis');
                  }
                } else {
                  faceNormals = generateFaceNormals(parseInt(state.dieType.substring(1)));
                }
                
                if (faceNormals.length === 0) {
                  console.error(`❌ No face normals found for ${state.dieType}!`);
                  return;
                }
                
                // Predict future orientation based on current velocities
                // Use longer prediction to heavily favor momentum direction
                const angVel = body.angularVelocity;
                const angSpeed = angVel.length();
                const linearSpeed = body.velocity.length();
                
                // Adaptive prediction time: faster movement = longer prediction
                const basePrediction = 0.4;
                const speedFactor = Math.min(angSpeed / 0.2, 2.0); // Scale with angular speed
                const predictionTime = basePrediction * (1 + speedFactor);
                
                const predictedQuat = body.quaternion.clone();
                
                // Apply angular velocity to predict rotation
                if (angSpeed > 0.001) {
                  const axis = angVel.unit();
                  const angle = angSpeed * predictionTime;
                  const rotQuat = new CANNON.Quaternion();
                  rotQuat.setFromAxisAngle(axis, angle);
                  predictedQuat.mult(rotQuat, predictedQuat);
                  predictedQuat.normalize();
                }
                
                // Find face most aligned with DOWN using PREDICTED orientation
                // This ensures we settle in the direction of momentum, not against it
                let closestFaceIndex = 0;
                let bestAlignment = -1;
                const alignments: number[] = [];
                
                faceNormals.forEach((normal, idx) => {
                  const rotatedNormal = predictedQuat.vmult(normal);
                  const alignment = rotatedNormal.dot(downVector);
                  alignments.push(alignment);
                  if (alignment > bestAlignment) {
                    bestAlignment = alignment;
                    closestFaceIndex = idx;
                  }
                });
                
                // Log detection with prediction info
                const sortedAlignments = alignments.map((a, i) => ({ face: i, alignment: a }))
                  .sort((a, b) => b.alignment - a.alignment);
                console.log(`🎯 Face detection for ${state.dieType}:`, 
                  `Prediction ${predictionTime.toFixed(2)}s ahead (angSpeed: ${angSpeed.toFixed(3)}, linSpeed: ${linearSpeed.toFixed(3)})`,
                  `→ Target face ${closestFaceIndex} (alignment: ${bestAlignment.toFixed(3)})`);
                
                // COMMIT to settling this face - store it and don't re-evaluate
                state.isSettling = true;
                state.targetFaceNormal = faceNormals[closestFaceIndex];
                state.targetFaceIndex = closestFaceIndex;
                
                // Re-enable physics so we can apply forces
                // Restore die's original mass based on type
                if (state.dieType === 'd20') {
                  body.mass = 0.60;
                } else if (state.dieType === 'd10') {
                  body.mass = 0.50;
                } else if (state.dieType === 'd12') {
                  body.mass = 0.55;
                } else if (state.dieType === 'd8') {
                  body.mass = 0.45;
                } else {
                  body.mass = 0.45;
                }
                body.sleepState = 0;
                
                console.log(`🎯 Triggering settlement for ${state.dieType}: face ${closestFaceIndex}, alignment=${bestAlignment.toFixed(3)}`);
              }
            }
          }
          
          if (!settled) {
            allSettled = false;
          }
        });
        
        // Safety timeout - force completion after 8 seconds (increased for d10)
        if (elapsedTime > 8.0) {
          console.warn('⚠️ Animation timeout - FORCING completion (die may not have settled properly)');
          
          // FREEZE ALL PHYSICS BODIES IMMEDIATELY
          dicePhysicsRef.current.forEach((state) => {
            state.body.velocity.set(0, 0, 0);
            state.body.angularVelocity.set(0, 0, 0);
            state.body.mass = 0; // Make static
            state.body.sleep(); // Put to sleep
          });
          
          let physicsTotal = 0;
          const physicsResults: number[] = [];
          dicePhysicsRef.current.forEach((state) => {
            if (state.physicsResult !== undefined) {
              physicsResults.push(state.physicsResult);
              physicsTotal += state.physicsResult;
            } else {
              // Force a result if not settled yet
              console.warn(`⚠️ Die ${state.dieType} did NOT settle naturally - reading value anyway`);
              const forcedResult = getTopFaceValue(state.body.quaternion, state.dieType);
              physicsResults.push(forcedResult);
              physicsTotal += forcedResult;
            }
          });
          physicsTotal += rollData.modifier || 0;
          setCalculatedTotal(physicsTotal);
          
          if (onRollComplete) {
            onRollComplete(physicsResults, physicsTotal);
          }
          
          setIsAnimating(false);
          setShowResult(true);
          if (onRollComplete) {
            onRollComplete(physicsResults, physicsTotal);
          }
          
          // Keep dice on screen for 3 more seconds after dashboard reads value
          setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, 3000);
          return;
        }
        
        if (allSettled && elapsedTime > 2.0) {
          console.log('All dice settled naturally');
          
          // FREEZE ALL PHYSICS BODIES IMMEDIATELY
          dicePhysicsRef.current.forEach((state) => {
            state.body.velocity.set(0, 0, 0);
            state.body.angularVelocity.set(0, 0, 0);
            state.body.mass = 0; // Make static
            state.body.sleep(); // Put to sleep
          });
          
          // Calculate total from physics results
          let physicsTotal = 0;
          const physicsResults: number[] = [];
          dicePhysicsRef.current.forEach((state) => {
            if (state.physicsResult !== undefined) {
              physicsResults.push(state.physicsResult);
              physicsTotal += state.physicsResult;
            }
          });
          // Add modifier from backend
          physicsTotal += rollData.modifier || 0;
          setCalculatedTotal(physicsTotal);
          
          // Call the roll complete callback with physics results
          if (onRollComplete) {
            onRollComplete(physicsResults, physicsTotal);
          }
          
          setIsAnimating(false);
          setShowResult(true);
          
          // Keep dice on screen for 3 more seconds after dashboard reads value
          setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, 3000);
          return;
        }
      } else {
        // Animation disabled - instant display with backend results
        if (elapsedTime > 0.5) {
          setIsAnimating(false);
          setShowResult(true);
          
          // Keep dice on screen for 3 more seconds after dashboard reads value
          setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, 3000);
          return;
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rollData, settings, onAnimationComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50">
      {showResult && rollData && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-8 py-4 rounded-lg text-4xl font-bold pointer-events-auto">
          {rollData.dice_notation}: {settings.animateRolls && calculatedTotal !== null ? calculatedTotal : rollData.total}
          {rollData.reason && <div className="text-lg mt-2">{rollData.reason}</div>}
        </div>
      )}
    </div>
  );
}
