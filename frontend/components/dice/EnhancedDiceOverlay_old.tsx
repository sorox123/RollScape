"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DiceSettings } from './DiceSettingsPanel';

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

interface EnhancedDiceOverlayProps {
  rollData: DiceRollData | null;
  onAnimationComplete?: () => void;
  settings: DiceSettings;
  textureUrls?: { [key: string]: string }; // e.g., { "d20": "url", "d6": "url" }
}

export default function EnhancedDiceOverlay({ 
  rollData, 
  onAnimationComplete, 
  settings,
  textureUrls 
}: EnhancedDiceOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diceRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const trailsRef = useRef<Map<string, THREE.Line>>(new Map());
  const particlesRef = useRef<THREE.Points[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Store current velocity and position for each die (for frame-by-frame physics)
  const dicePhysicsRef = useRef<Map<string, { 
    velocity: THREE.Vector3; 
    position: THREE.Vector3;
    angularVelocity: THREE.Vector3;
  }>>(new Map());
  
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize audio context
  useEffect(() => {
    if (settings.soundEnabled && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, [settings.soundEnabled]);

  // Play sound effect
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

  // Haptic feedback
  const vibrate = (pattern: number | number[]) => {
    if (settings.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !rollData) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    setCameraPosition(camera, settings.cameraAngle);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: settings.antialiasing, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = settings.shadowQuality !== 'low';
    renderer.shadowMap.type = settings.shadowQuality === 'high' 
      ? THREE.PCFSoftShadowMap 
      : THREE.BasicShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    setupLighting(scene, settings.shadowQuality);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = settings.shadowQuality !== 'low';
    scene.add(ground);

    // Calculate initial dynamic boundaries based on camera view
    const calculateBoundaries = () => {
      const distance = camera.position.y;
      const fov = camera.fov * (Math.PI / 180);
      const aspect = camera.aspect;
      
      const visibleHeight = 2 * Math.tan(fov / 2) * distance;
      const visibleWidth = visibleHeight * aspect;
      
      return {
        x: (visibleWidth * 0.4) - 0.5,
        z: (visibleHeight * 0.4) - 0.5
      };
    };
    
    let boundaries = calculateBoundaries();
    
    // Add invisible boundary walls to contain dice (updated dynamically)
    const boundaryMaterial = new THREE.MeshBasicMaterial({ 
      transparent: true, 
      opacity: 0,
      side: THREE.DoubleSide 
    });
    
    // Left and right walls (X axis)
    const sideWallGeometry = new THREE.PlaneGeometry(boundaries.z * 2, 10);
    const leftWall = new THREE.Mesh(sideWallGeometry, boundaryMaterial);
    leftWall.position.set(-boundaries.x, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, boundaryMaterial);
    rightWall.position.set(boundaries.x, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
    
    // Front and back walls (Z axis)
    const frontBackWallGeometry = new THREE.PlaneGeometry(boundaries.x * 2, 10);
    const frontWall = new THREE.Mesh(frontBackWallGeometry, boundaryMaterial);
    frontWall.position.set(0, 2.5, -boundaries.z);
    scene.add(frontWall);
    
    const backWall = new THREE.Mesh(frontBackWallGeometry, boundaryMaterial);
    backWall.position.set(0, 2.5, boundaries.z);
    backWall.rotation.y = Math.PI;
    scene.add(backWall);

    // Create dice meshes
    createDice(scene, rollData, textureUrls);

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Recalculate boundaries based on new aspect ratio
      boundaries = calculateBoundaries();
      
      // Update wall positions and sizes
      leftWall.position.x = -boundaries.x;
      rightWall.position.x = boundaries.x;
      frontWall.position.z = -boundaries.z;
      backWall.position.z = boundaries.z;
      
      // Update wall geometries
      leftWall.geometry.dispose();
      rightWall.geometry.dispose();
      frontWall.geometry.dispose();
      backWall.geometry.dispose();
      
      const newSideGeometry = new THREE.PlaneGeometry(boundaries.z * 2, 10);
      const newFrontBackGeometry = new THREE.PlaneGeometry(boundaries.x * 2, 10);
      
      leftWall.geometry = newSideGeometry;
      rightWall.geometry = newSideGeometry;
      frontWall.geometry = newFrontBackGeometry;
      backWall.geometry = newFrontBackGeometry;
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
        } catch (e) {
          // Already removed
        }
      }
      // Dispose of Three.js resources
      diceRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      diceRef.current.clear();
      dicePhysicsRef.current.clear();
      trailsRef.current.clear();
      particlesRef.current.forEach(p => p.geometry.dispose());
      particlesRef.current = [];
    };
  }, [rollData, settings, textureUrls]);

  // Animation loop
  useEffect(() => {
    if (!rollData || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    setIsAnimating(true);
    setShowResult(false);
    startTimeRef.current = performance.now();

    // Play initial roll sound
    playSound(200, 0.1, 0.4);
    vibrate(50);

    const animate = (currentTime: number) => {
      if (!startTimeRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const elapsedTime = (currentTime - startTimeRef.current) / 1000;

      // Log backend data on first frame
      if (elapsedTime < 0.1) {
        console.log('=== BACKEND ROLL DATA ===');
        rollData.dice_results.forEach((dieResult, index) => {
          console.log(`die_${index}: rolled ${dieResult.value}, position [${dieResult.initial_position[0].toFixed(2)}, ${dieResult.initial_position[1].toFixed(2)}, ${dieResult.initial_position[2].toFixed(2)}]`);
        });
        console.log('========================');
      }

      // Update each die
      rollData.dice_results.forEach((dieResult, index) => {
        const dieMesh = diceRef.current.get(`die_${index}`);
        if (!dieMesh) return;

        const dieKey = `die_${index}`;
        
        // Initialize physics state on first frame
        if (!dicePhysicsRef.current.has(dieKey)) {
          dicePhysicsRef.current.set(dieKey, {
            position: new THREE.Vector3(...dieResult.initial_position),
            velocity: new THREE.Vector3(
              dieResult.initial_velocity[0] * settings.throwForce,
              dieResult.initial_velocity[1] * settings.throwForce,
              dieResult.initial_velocity[2] * settings.throwForce
            ),
            angularVelocity: new THREE.Vector3(
              dieResult.angular_velocity[0] * settings.spinIntensity * Math.PI / 180,
              dieResult.angular_velocity[1] * settings.spinIntensity * Math.PI / 180,
              dieResult.angular_velocity[2] * settings.spinIntensity * Math.PI / 180
            )
          });
        }

        if (elapsedTime < dieResult.settle_time) {
          const physics = dicePhysicsRef.current.get(dieKey)!;
          const dt = 0.016; // 60 FPS frame time
          
          // Apply gravity
          const gravity = -9.8 * settings.throwForce;
          physics.velocity.y += gravity * dt;
          
          // Update position based on velocity
          physics.position.x += physics.velocity.x * dt;
          physics.position.y += physics.velocity.y * dt;
          physics.position.z += physics.velocity.z * dt;
          
          // Calculate dynamic boundaries based on camera view
          const camera = cameraRef.current!;
          const distance = camera.position.y; // Height of camera
          const fov = camera.fov * (Math.PI / 180); // Convert to radians
          const aspect = camera.aspect;
          
          // Calculate visible area at ground level (y=0)
          const visibleHeight = 2 * Math.tan(fov / 2) * distance;
          const visibleWidth = visibleHeight * aspect;
          
          // Set boundaries with margin (80% of visible area to keep dice on screen)
          const boundaryX = (visibleWidth * 0.4) - 0.5; // Half width minus die size
          const boundaryZ = (visibleHeight * 0.4) - 0.5; // Half height minus die size
          const boundaryY = 0.2; // Ground level
          
          // Dynamic restitution based on velocity and time
          const speed = physics.velocity.length();
          const timeUntilSettle = dieResult.settle_time - elapsedTime;
          const baseRestitution = timeUntilSettle > 1.0 ? 0.6 : 0.4; // More bouncy early on
          const restitution = speed > 2 ? baseRestitution : baseRestitution * (speed / 2);
          
          // Bounce off left wall
          if (physics.position.x < -boundaryX) {
            physics.position.x = -boundaryX; // Clamp position
            physics.velocity.x = Math.abs(physics.velocity.x) * restitution; // Reverse and dampen
            const bounceFreq = 150 + Math.random() * 100;
            playSound(bounceFreq, 0.05, 0.2);
            vibrate(20);
          }
          
          // Bounce off right wall
          if (physics.position.x > boundaryX) {
            physics.position.x = boundaryX; // Clamp position
            physics.velocity.x = -Math.abs(physics.velocity.x) * restitution; // Reverse and dampen
            const bounceFreq = 150 + Math.random() * 100;
            playSound(bounceFreq, 0.05, 0.2);
            vibrate(20);
          }
          
          // Bounce off back wall
          if (physics.position.z < -boundaryZ) {
            physics.position.z = -boundaryZ; // Clamp position
            physics.velocity.z = Math.abs(physics.velocity.z) * restitution; // Reverse and dampen
            const bounceFreq = 150 + Math.random() * 100;
            playSound(bounceFreq, 0.05, 0.2);
            vibrate(20);
          }
          
          // Bounce off front wall
          if (physics.position.z > boundaryZ) {
            physics.position.z = boundaryZ; // Clamp position
            physics.velocity.z = -Math.abs(physics.velocity.z) * restitution; // Reverse and dampen
            const bounceFreq = 150 + Math.random() * 100;
            playSound(bounceFreq, 0.05, 0.2);
            vibrate(20);
          }
          
          // Bounce off ground with reduced bounciness
          if (physics.position.y <= boundaryY) {
            physics.position.y = boundaryY;
            if (physics.velocity.y < 0) {
              // Bouncy throughout most of the roll
              const groundRestitution = timeUntilSettle > 1.0 ? 0.6 : (timeUntilSettle > 0.5 ? 0.3 : 0.1);
              physics.velocity.y = -physics.velocity.y * groundRestitution;
              
              // Only play sound for significant bounces
              if (Math.abs(physics.velocity.y) > 0.5) {
                const bounceFreq = 150 + Math.random() * 100;
                playSound(bounceFreq, 0.05, 0.2);
                vibrate(20);
              }
            }
            
            // Apply ground friction - prevent unnatural sliding
            const groundFriction = timeUntilSettle > 1.0 ? 0.985 : (timeUntilSettle > 0.5 ? 0.95 : 0.90);
            physics.velocity.x *= groundFriction;
            physics.velocity.z *= groundFriction;
          }
          
          // Apply air resistance (reduced to maintain momentum)
          const airResistance = physics.position.y > boundaryY + 0.1 ? 0.995 : 0.98;
          physics.velocity.multiplyScalar(airResistance);
          
          // Apply very light rotational damping to maintain tumbling
          const rotationalDamping = 0.99; // Keep spin going much longer
          physics.angularVelocity.multiplyScalar(rotationalDamping);
          
          // Check collision with other dice
          rollData.dice_results.forEach((otherDie, otherIndex) => {
            if (otherIndex === index) return; // Skip self
            
            const otherMesh = diceRef.current.get(`die_${otherIndex}`);
            const otherPhysics = dicePhysicsRef.current.get(`die_${otherIndex}`);
            if (!otherMesh || !otherPhysics) return;
            
            // Calculate distance between dice centers
            const dx = physics.position.x - otherPhysics.position.x;
            const dy = physics.position.y - otherPhysics.position.y;
            const dz = physics.position.z - otherPhysics.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Die size (approximate radius)
            const dieRadius = 0.3;
            const minDistance = dieRadius * 2;
            
            // If dice are colliding
            if (distance < minDistance && distance > 0) {
              // Calculate collision normal
              const nx = dx / distance;
              const ny = dy / distance;
              const nz = dz / distance;
              
              // Separate the dice
              const overlap = minDistance - distance;
              const separation = overlap / 2;
              physics.position.x += nx * separation;
              physics.position.y += ny * separation;
              physics.position.z += nz * separation;
              otherPhysics.position.x -= nx * separation;
              otherPhysics.position.y -= ny * separation;
              otherPhysics.position.z -= nz * separation;
              
              // Calculate relative velocity
              const relVelX = physics.velocity.x - otherPhysics.velocity.x;
              const relVelY = physics.velocity.y - otherPhysics.velocity.y;
              const relVelZ = physics.velocity.z - otherPhysics.velocity.z;
              
              // Calculate relative velocity in collision normal direction
              const velAlongNormal = relVelX * nx + relVelY * ny + relVelZ * nz;
              
              // Don't resolve if velocities are separating
              if (velAlongNormal < 0) {
                // Calculate impulse (simplified elastic collision)
                const restitution = 0.5; // Dice collisions are somewhat bouncy
                const impulse = -(1 + restitution) * velAlongNormal / 2;
                
                // Apply impulse to both dice
                physics.velocity.x += impulse * nx;
                physics.velocity.y += impulse * ny;
                physics.velocity.z += impulse * nz;
                otherPhysics.velocity.x -= impulse * nx;
                otherPhysics.velocity.y -= impulse * ny;
                otherPhysics.velocity.z -= impulse * nz;
                
                // Add rotational impulse from collision
                physics.angularVelocity.x += (Math.random() - 0.5) * 2;
                physics.angularVelocity.y += (Math.random() - 0.5) * 2;
                physics.angularVelocity.z += (Math.random() - 0.5) * 2;
                otherPhysics.angularVelocity.x += (Math.random() - 0.5) * 2;
                otherPhysics.angularVelocity.y += (Math.random() - 0.5) * 2;
                otherPhysics.angularVelocity.z += (Math.random() - 0.5) * 2;
                
                // Play collision sound
                const collisionFreq = 200 + Math.random() * 150;
                playSound(collisionFreq, 0.03, 0.15);
              }
            }
          });
          
          // ALWAYS convert angular velocity to rolling when on ground - this prevents spinning in place
          if (physics.position.y <= boundaryY + 0.05) {
            const rollSpeed = Math.sqrt(physics.velocity.x * physics.velocity.x + physics.velocity.z * physics.velocity.z);
            
            if (rollSpeed > 0.01) {
              // Calculate roll axis perpendicular to movement direction
              const rollAxisX = -physics.velocity.z / (rollSpeed + 0.001);
              const rollAxisZ = physics.velocity.x / (rollSpeed + 0.001);
              
              // Convert horizontal velocity to rolling - dice should roll not spin
              const rollAmount = rollSpeed * 4;
              
              // Replace spinning with rolling motion when on ground
              physics.angularVelocity.x = rollAxisX * rollAmount;
              physics.angularVelocity.y *= 0.8; // Dampen Y-axis spin (dice don't spin like tops)
              physics.angularVelocity.z = rollAxisZ * rollAmount;
            } else {
              // No horizontal movement - kill all rotation
              physics.angularVelocity.multiplyScalar(0.5);
            }
          }
          
          // Update mesh position
          dieMesh.position.copy(physics.position);
          
          // Update rotation naturally - no forced interpolation
          dieMesh.rotation.x += physics.angularVelocity.x * dt;
          dieMesh.rotation.y += physics.angularVelocity.y * dt;
          dieMesh.rotation.z += physics.angularVelocity.z * dt;

          // Motion trails
          if (settings.showTrails) {
            updateTrail(index, dieMesh.position);
          }
        } else {
          // Settled - dice naturally coming to rest
          const physics = dicePhysicsRef.current.get(dieKey)!;
          
          // Keep on ground level
          dieMesh.position.y = 0.2;
          physics.position.y = 0.2;
          
          // Calculate time since settling
          const timeSinceSettle = elapsedTime - dieResult.settle_time;
          
          // Initialize snap tracking ONCE (not every frame!)
          if ((dieMesh as any).hasSnapped === undefined) {
            (dieMesh as any).hasSnapped = false;
            console.log(`>>> Die ${dieResult.die_type} INITIALIZED at settled phase. settle_time=${dieResult.settle_time.toFixed(2)}s`);
          }
          
          // Debug log every second
          if (Math.floor(timeSinceSettle) !== Math.floor(timeSinceSettle - 0.016)) {
            console.log(`Die ${dieResult.die_type} timeSinceSettle: ${timeSinceSettle.toFixed(2)}s, hasSnapped: ${(dieMesh as any).hasSnapped}`);
          }
          
          // Phase 1: Dynamic dice movement (0-2.5 seconds)
          if (timeSinceSettle < 2.5) {
            // Natural physics only - let dice tumble and settle naturally
            // No intervention, just let physics work
          }
          // Phase 1.5: Pre-alignment stabilization (2.5-3.0 seconds)
          else if (timeSinceSettle >= 2.5 && timeSinceSettle < 3.0) {
            if ((dieMesh as any).phase1_5Logged !== true) {
              console.log(`>>> Die ${dieResult.die_type} PHASE 1.5 START at ${timeSinceSettle.toFixed(2)}s`);
              (dieMesh as any).phase1_5Logged = true;
            }
            
            // Aggressively force dice onto a face before alignment phase
            const downVector = new THREE.Vector3(0, -1, 0);
            const geometry = dieMesh.geometry as THREE.BufferGeometry;
            const normalAttr = geometry.getAttribute('normal');
            
            let targetNormal = new THREE.Vector3(0, -1, 0);
            let smallestAngle = Math.PI;
            
            // Find the face pointing most downward
            const samplePoints = Math.min(normalAttr.count, 100);
            const step = Math.max(1, Math.floor(normalAttr.count / samplePoints));
            
            for (let i = 0; i < normalAttr.count; i += step) {
              const normal = new THREE.Vector3(
                normalAttr.getX(i),
                normalAttr.getY(i),
                normalAttr.getZ(i)
              );
              normal.applyQuaternion(dieMesh.quaternion);
              const angle = normal.angleTo(downVector);
              
              if (angle < smallestAngle) {
                smallestAngle = angle;
                targetNormal = normal.clone();
              }
            }
            
            // Aggressive stabilization - force onto a face quickly
            const rotationAxis = new THREE.Vector3().crossVectors(targetNormal, downVector);
            
            if (rotationAxis.length() > 0.001 && smallestAngle > 0.01) {
              rotationAxis.normalize();
              const rotationAngle = targetNormal.angleTo(downVector);
              
              // Very aggressive - 40% per frame to quickly get onto a face
              const alignmentStep = rotationAngle * 0.4;
              
              const alignQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, alignmentStep);
              const currentQuat = dieMesh.quaternion.clone();
              dieMesh.quaternion.multiplyQuaternions(alignQuat, currentQuat);
            }
            
            // Kill all velocity
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
          } 
          // Phase 2: Continuous alignment (3.0-3.25 seconds)
          else if (timeSinceSettle >= 3.0 && timeSinceSettle < 3.25) {
            if ((dieMesh as any).phase2Logged !== true) {
              console.log(`>>> Die ${dieResult.die_type} PHASE 2 START at ${timeSinceSettle.toFixed(2)}s`);
              (dieMesh as any).phase2Logged = true;
            }
            
            // Gradually align the closest face to point perfectly downward
            const downVector = new THREE.Vector3(0, -1, 0);
            const geometry = dieMesh.geometry as THREE.BufferGeometry;
            const normalAttr = geometry.getAttribute('normal');
            
            let targetNormal = new THREE.Vector3(0, -1, 0);
            let smallestAngle = Math.PI;
            
            // Sample normals to find the face pointing most downward
            const samplePoints = Math.min(normalAttr.count, 100);
            const step = Math.max(1, Math.floor(normalAttr.count / samplePoints));
            
            for (let i = 0; i < normalAttr.count; i += step) {
              const normal = new THREE.Vector3(
                normalAttr.getX(i),
                normalAttr.getY(i),
                normalAttr.getZ(i)
              );
              normal.applyQuaternion(dieMesh.quaternion);
              const angle = normal.angleTo(downVector);
              
              if (angle < smallestAngle) {
                smallestAngle = angle;
                targetNormal = normal.clone();
              }
            }
            
            // Smooth continuous alignment over 0.25 seconds
            const rotationAxis = new THREE.Vector3().crossVectors(targetNormal, downVector);
            
            if (rotationAxis.length() > 0.001) {
              rotationAxis.normalize();
              const rotationAngle = targetNormal.angleTo(downVector);
              
              // Smooth alignment over the 0.25 second window
              const alignmentStep = rotationAngle * 0.25; // 25% per frame for smooth movement
              
              const alignQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, alignmentStep);
              const currentQuat = dieMesh.quaternion.clone();
              dieMesh.quaternion.multiplyQuaternions(alignQuat, currentQuat);
            }
            
            // Kill all velocity during alignment
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
          } 
          // Phase 3: Snap to perfect alignment (at 3.25 seconds and beyond)
          else if (timeSinceSettle >= 3.25 && (dieMesh as any).hasSnapped === false) {
            console.log(`\n>>> PHASE 3: SNAP TRIGGERED for ${dieResult.die_type} at time ${timeSinceSettle.toFixed(3)}s`);
            
            // SNAP - Force immediate perfect alignment (only once)
            const downVector = new THREE.Vector3(0, -1, 0);
            const geometry = dieMesh.geometry as THREE.BufferGeometry;
            const normalAttr = geometry.getAttribute('normal');
            
            let targetNormal = new THREE.Vector3(0, -1, 0);
            let smallestAngle = Math.PI;
            let closestFaceIndex = 0;
            
            // Find the face pointing most downward - sample ALL normals for accuracy
            for (let i = 0; i < normalAttr.count; i++) {
              const normal = new THREE.Vector3(
                normalAttr.getX(i),
                normalAttr.getY(i),
                normalAttr.getZ(i)
              );
              normal.applyQuaternion(dieMesh.quaternion);
              const angle = normal.angleTo(downVector);
              
              if (angle < smallestAngle) {
                smallestAngle = angle;
                targetNormal = normal.clone();
                closestFaceIndex = i;
              }
            }
            
            console.log(`Before snap - closest face angle: ${(smallestAngle * 180 / Math.PI).toFixed(2)}°`);
            
            // SNAP - Instant perfect alignment
            const rotationAxis = new THREE.Vector3().crossVectors(targetNormal, downVector);
            if (rotationAxis.length() > 0.0001) {
              rotationAxis.normalize();
              const rotationAngle = targetNormal.angleTo(downVector);
              
              // Create the rotation quaternion
              const alignQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
              const currentQuat = dieMesh.quaternion.clone();
              
              // Apply the rotation
              dieMesh.quaternion.multiplyQuaternions(alignQuat, currentQuat);
              
              // Verify the snap worked
              const checkNormal = targetNormal.clone().applyQuaternion(alignQuat);
              const finalAngle = checkNormal.angleTo(downVector);
              
              console.log(`SNAPPED ${dieResult.die_type}: corrected ${(rotationAngle * 180 / Math.PI).toFixed(2)}°, final angle: ${(finalAngle * 180 / Math.PI).toFixed(2)}°`);
            } else {
              console.log(`${dieResult.die_type} already aligned, no snap needed`);
            }
            
            // Verify orientation after snap
            console.log(`Post-snap verification for ${dieResult.die_type}...`);
            console.log(`  die_${index}: value=${dieResult.value}, position=(${dieMesh.position.x.toFixed(2)}, ${dieMesh.position.y.toFixed(2)}, ${dieMesh.position.z.toFixed(2)})`);
            
            // Remap faces based on rolled value
            remapDiceFaceMaterials(
              dieMesh,
              dieResult.die_type,
              dieResult.value,
              dieResult.is_critical,
              dieResult.is_fumble
            );
            
            // Play settle sound
            playSound(100, 0.2, 0.3);
            
            // Particle effects for criticals/fumbles
            if (settings.particleEffects && (dieResult.is_critical || dieResult.is_fumble) && sceneRef.current) {
              createParticleEffect(
                sceneRef.current,
                dieMesh.position,
                dieResult.is_critical ? 0xffd700 : 0xff0000
              );
            }
            
            // Mark as snapped so this only happens once
            (dieMesh as any).hasSnapped = true;
            
            // Fully lock down
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
          }
          // Phase 4: Linger phase - numbers visible, dice locked
          else if ((dieMesh as any).hasSnapped) {
            // Keep locked after snap
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
          }
          
        }
      });

      // Update particles
      updateParticles();

      // Camera movement based on setting
      updateCamera(cameraRef.current, rollData.camera_focus, elapsedTime, settings.cameraAngle);

      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Check if animation complete
      if (elapsedTime < rollData.total_animation_time + 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setShowResult(true);
        playSound(400, 0.3, 0.4);
        vibrate(100);
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 2000);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rollData, settings, onAnimationComplete]);

  // Setup lighting based on quality
  const setupLighting = (scene: THREE.Scene, quality: string) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    if (quality !== 'low') {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = quality === 'high' ? 2048 : 1024;
      directionalLight.shadow.mapSize.height = quality === 'high' ? 2048 : 1024;
    }
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.4);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);
  };

  // Set camera position based on angle setting
  const setCameraPosition = (camera: THREE.PerspectiveCamera, angle: string) => {
    switch (angle) {
      case 'top':
        camera.position.set(0, 8, 0.1);
        camera.lookAt(0, 0, 0);
        break;
      case 'side':
        camera.position.set(5, 2, 0);
        camera.lookAt(0, 0.5, 0);
        break;
      case 'dynamic':
      default:
        // Top-down view with slight angle to see dice faces - like a tabletop
        camera.position.set(0, 7, 2);
        camera.lookAt(0, 0, 0);
        break;
    }
  };

  // Update camera during animation
  const updateCamera = (
    camera: THREE.PerspectiveCamera,
    focus: number[],
    time: number,
    angle: string
  ) => {
    const focusTarget = new THREE.Vector3(...focus);
    
    if (angle === 'dynamic') {
      // Smooth follow maintaining top-down tabletop view
      const targetPos = new THREE.Vector3(
        focusTarget.x,
        7,  // Maintain consistent height
        focusTarget.z + 2  // Stay mostly overhead with slight forward offset
      );
      camera.position.lerp(targetPos, 0.02);
      camera.lookAt(focusTarget);
    }
    // Static angles don't need updates
  };

  // Create dice geometries with textures
  const createDice = (
    scene: THREE.Scene,
    rollData: DiceRollData,
    textureUrls?: { [key: string]: string }
  ) => {
    const textureLoader = new THREE.TextureLoader();

    rollData.dice_results.forEach((dieResult, index) => {
      const geometry = getDiceGeometry(dieResult.die_type);
      const materials = getDiceMaterials(
        dieResult.die_type,
        dieResult.is_critical,
        dieResult.is_fumble
      );
      
      const die = new THREE.Mesh(geometry, materials);
      die.position.set(dieResult.initial_position[0], dieResult.initial_position[1], dieResult.initial_position[2]);
      const rotations = dieResult.initial_rotation.map(r => r * Math.PI / 180);
      die.rotation.set(rotations[0], rotations[1], rotations[2]);
      die.castShadow = settings.shadowQuality !== 'low';
      die.receiveShadow = settings.shadowQuality !== 'low';
      
      scene.add(die);
      diceRef.current.set(`die_${index}`, die);
    });
  };

  // Get geometry for each die type
  const getDiceGeometry = (dieType: string): THREE.BufferGeometry => {
    const scale = 0.4;
    
    switch (dieType) {
      case 'd4':
        return new THREE.TetrahedronGeometry(scale * 1.2);
      case 'd6':
        // Box geometry - map material indices to die face values
        // BoxGeometry faces: right(+x), left(-x), top(+y), bottom(-y), front(+z), back(-z)
        // Each face uses 6 vertices (2 triangles)
        // We want: when getTopFace() returns 0, we show value 1; when it returns 1, we show value 2, etc.
        const boxGeom = new THREE.BoxGeometry(scale, scale, scale);
        boxGeom.clearGroups();
        
        // CRITICAL: Map BoxGeometry faces to material indices in a simple sequential order
        // This creates a mapping where materialIndex directly corresponds to face value - 1
        // BoxGeometry order: right(0-5), left(6-11), top(12-17), bottom(18-23), front(24-29), back(30-35)
        boxGeom.addGroup(0, 6, 0);   // right face -> material[0] = 1
        boxGeom.addGroup(6, 6, 1);   // left face -> material[1] = 2  
        boxGeom.addGroup(12, 6, 2);  // top face -> material[2] = 3
        boxGeom.addGroup(18, 6, 3);  // bottom face -> material[3] = 4
        boxGeom.addGroup(24, 6, 4);  // front face -> material[4] = 5
        boxGeom.addGroup(30, 6, 5);  // back face -> material[5] = 6
        
        return boxGeom;
      case 'd8':
        return new THREE.OctahedronGeometry(scale);
      case 'd10':
      case 'd100':
        return new THREE.CylinderGeometry(scale * 0.8, scale * 0.8, scale, 10);
      case 'd12':
        return new THREE.DodecahedronGeometry(scale);
      case 'd20':
        return new THREE.IcosahedronGeometry(scale);
      default:
        return new THREE.BoxGeometry(scale, scale, scale);
    }
  };

  // Create texture with number on it
  const createNumberTexture = (number: string | number, color: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 128, 128);
    
    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Create blank texture for hiding numbers during animation
  const createBlankTexture = (color: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Just solid color background, no number
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Check if die is resting on an edge or corner (unstable) vs a flat face
  const isRestingUnstably = (dieMesh: THREE.Mesh): boolean => {
    const upVector = new THREE.Vector3(0, 1, 0);
    const geometry = dieMesh.geometry as THREE.BufferGeometry;
    const normals = geometry.getAttribute('normal');
    const groups = geometry.groups;
    
    let closestAngle = Math.PI;
    
    // Check each face to find the one most aligned with "up"
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const normalIndex = group.start;
      const normal = new THREE.Vector3(
        normals.getX(normalIndex),
        normals.getY(normalIndex),
        normals.getZ(normalIndex)
      );
      
      normal.applyQuaternion(dieMesh.quaternion);
      const angle = normal.angleTo(upVector);
      
      if (angle < closestAngle) {
        closestAngle = angle;
      }
    }
    
    // If the closest face is more than 12 degrees off vertical, it's resting on edge/corner
    const threshold = 12 * Math.PI / 180; // 12 degrees (tighter tolerance)
    return closestAngle > threshold;
  };

  // Detect which face is currently pointing upward based on die rotation
  const getUpsideFace = (dieMesh: THREE.Mesh): number => {
    // Create upward vector in world space
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Get the die's geometry normals to find which face points most upward
    const geometry = dieMesh.geometry as THREE.BufferGeometry;
    const normals = geometry.getAttribute('normal');
    const groups = geometry.groups;
    
    let closestFace = 0;
    let closestAngle = Math.PI;
    
    // Check each face group
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      // Get normal for this face (first vertex of the group)
      const normalIndex = group.start;
      const normal = new THREE.Vector3(
        normals.getX(normalIndex),
        normals.getY(normalIndex),
        normals.getZ(normalIndex)
      );
      
      // Transform normal to world space
      normal.applyQuaternion(dieMesh.quaternion);
      
      // Calculate angle to upward vector
      const angle = normal.angleTo(upVector);
      
      if (angle < closestAngle) {
        closestAngle = angle;
        closestFace = group.materialIndex ?? i;
      }
    }
    
    return closestFace;
  };

  // Get the opposite face value for standard dice
  const getOppositeFace = (dieType: string, faceValue: number): number => {
    const faceCount = parseInt(dieType.substring(1));
    
    switch (dieType) {
      case 'd6':
        // Opposite faces sum to 7: 1-6, 2-5, 3-4
        return 7 - faceValue;
      case 'd8':
        // Opposite faces sum to 9: 1-8, 2-7, 3-6, 4-5
        return 9 - faceValue;
      case 'd10':
      case 'd100':
        // Opposite faces sum to 11: 1-10, 2-9, etc.
        return 11 - faceValue;
      case 'd12':
        // Opposite faces sum to 13: 1-12, 2-11, etc.
        return 13 - faceValue;
      case 'd20':
        // Opposite faces sum to 21: 1-20, 2-19, etc.
        return 21 - faceValue;
      case 'd4':
        // D4 doesn't have traditional opposite faces (it's a tetrahedron)
        // Each face touches 3 others, so just map directly
        return faceValue;
      default:
        return faceValue;
    }
  };

  // Get the face that is pointing upward (the one we see from top-down camera)
  const getTopFace = (dieMesh: THREE.Mesh): number => {
    const geometry = dieMesh.geometry as THREE.BufferGeometry;
    const normals = geometry.getAttribute('normal');
    const groups = geometry.groups;
    
    // Upward vector in world space
    const upVector = new THREE.Vector3(0, 1, 0);
    
    let closestAngle = Math.PI;
    let topFaceIndex = 0;
    
    // Find face with normal most aligned with up direction
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const normalIndex = group.start;
      const normal = new THREE.Vector3(
        normals.getX(normalIndex),
        normals.getY(normalIndex),
        normals.getZ(normalIndex)
      );
      
      // Transform to world space
      normal.applyQuaternion(dieMesh.quaternion);
      
      const angle = normal.angleTo(upVector);
      if (angle < closestAngle) {
        closestAngle = angle;
        topFaceIndex = group.materialIndex ?? i;
      }
    }
    
    return topFaceIndex;
  };

  // Shift the face values so the top face shows the target value
  // This mimics byWulf's shiftUpperValue() approach
  const remapDiceFaceMaterials = (
    dieMesh: THREE.Mesh,
    dieType: string,
    targetValue: number,
    isCritical?: boolean,
    isFumble?: boolean
  ) => {
    // Get which face is currently on top
    const topFaceIndex = getTopFace(dieMesh);
    const currentValueOnTop = topFaceIndex + 1; // material[0]=1, material[1]=2, etc.
    
    console.log(`${dieType}: Current top face is material[${topFaceIndex}] = value ${currentValueOnTop}, target is ${targetValue}`);
    
    // Calculate how much to shift the material indices
    const shift = targetValue - currentValueOnTop;
    
    // Create materials with shifted values
    const faceCount = parseInt(dieType.substring(1));
    const shiftedMaterials: THREE.Material[] = [];
    
    for (let i = 0; i < faceCount; i++) {
      // Shift the face value, wrapping around
      let shiftedValue = i + 1 + shift;
      while (shiftedValue > faceCount) shiftedValue -= faceCount;
      while (shiftedValue < 1) shiftedValue += faceCount;
      
      const texture = createNumberTexture(shiftedValue, isCritical ? 0x00ff00 : isFumble ? 0xff0000 : 0x8b4513);
      shiftedMaterials.push(new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        roughness: 0.5,
        metalness: 0.3,
      }));
    }
    
    console.log(`Shifting materials by ${shift}: material[${topFaceIndex}] will now show ${targetValue}`);
    
    // Dispose old materials
    if (Array.isArray(dieMesh.material)) {
      dieMesh.material.forEach(mat => {
        const meshMat = mat as THREE.MeshStandardMaterial;
        if (meshMat.map) meshMat.map.dispose();
        mat.dispose();
      });
    }
    
    // Apply shifted materials
    dieMesh.material = shiftedMaterials;
    
    // Force update
    numberedMaterials.forEach((mat: THREE.Material) => {
      mat.needsUpdate = true;
      const meshMat = mat as THREE.MeshStandardMaterial;
      if (meshMat.map) meshMat.map.needsUpdate = true;
    });
  };

  // Get materials array with target value on camera-facing face
  const getDiceMaterialsWithCameraValue = (
    dieType: string,
    cameraFacingIndex: number,
    targetValue: number,
    isCritical?: boolean,
    isFumble?: boolean
  ): THREE.Material[] => {
    let color = 0x1e40af;
    if (isCritical) {
      color = 0x10b981;
    } else if (isFumble) {
      color = 0xef4444;
    }
    
    const emissive = isCritical ? 0x10b981 : isFumble ? 0xef4444 : 0x000000;
    const emissiveIntensity = isCritical || isFumble ? 0.3 : 0;
    
    const faceCount = parseInt(dieType.substring(1));
    const materials: THREE.Material[] = [];
    
    // Get all possible values for this die type
    const remainingValues: number[] = [];
    for (let i = 1; i <= faceCount; i++) {
      if (i !== targetValue) {
        remainingValues.push(i);
      }
    }
    
    // Create material for each face
    for (let matIndex = 0; matIndex < faceCount; matIndex++) {
      let faceValue: number;
      
      if (matIndex === cameraFacingIndex) {
        // Camera-facing face shows the rolled value
        faceValue = targetValue;
      } else {
        // Other faces get remaining values
        faceValue = remainingValues.shift() || 1;
      }
      
      const texture = createNumberTexture(faceValue, color);
      materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.4,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity,
      }));
    }
    
    return materials;
  };

  // Get materials array for dice faces - material[i] shows value i+1
  const getDiceMaterials = (
    dieType: string,
    isCritical?: boolean,
    isFumble?: boolean,
    showNumbers: boolean = false
  ): THREE.Material[] => {
    let color = 0x1e40af;
    
    if (isCritical) {
      color = 0x10b981;
    } else if (isFumble) {
      color = 0xef4444;
    }
    
    const emissive = isCritical ? 0x10b981 : isFumble ? 0xef4444 : 0x000000;
    const emissiveIntensity = isCritical || isFumble ? 0.3 : 0;
    
    // Get number of faces for this die type
    const faceCount = parseInt(dieType.substring(1));
    const materials: THREE.Material[] = [];
    
    // Create a material for each face: material[0]=1, material[1]=2, etc.
    for (let i = 0; i < faceCount; i++) {
      const faceValue = i + 1;
      
      // Use blank texture during animation, numbered texture when settled
      const texture = showNumbers ? createNumberTexture(faceValue, color) : createBlankTexture(color);
      materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.4,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity,
      }));
    }
    
    return materials;
  };

  // Update motion trail for a die
  const updateTrail = (index: number, position: THREE.Vector3) => {
    // Trail implementation would store position history and render line
    // Simplified for now
  };

  // Create particle effect
  const createParticleEffect = (scene: THREE.Scene, position: THREE.Vector3, color: number) => {
    const particleCount = 50;
    const particles = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
      particles[i * 3 + 1] = position.y + Math.random() * 0.5;
      particles[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.05,
      transparent: true,
      opacity: 1.0
    });
    
    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particlesRef.current.push(particleSystem);
  };

  // Update particle animations
  const updateParticles = () => {
    particlesRef.current.forEach((particles, index) => {
      const material = particles.material as THREE.PointsMaterial;
      material.opacity *= 0.95;
      
      if (material.opacity < 0.01) {
        sceneRef.current?.remove(particles);
        particles.geometry.dispose();
        material.dispose();
        particlesRef.current.splice(index, 1);
      }
    });
  };

  // Get final rotation to show correct number
  const getFinalRotation = (dieType: string, value: number): [number, number, number] => {
    // Return rotation in radians [x, y, z] to show the specific face up
    
    switch (dieType) {
      case 'd4':
        // Tetrahedron - 4 faces, each face is a different number
        const d4Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [Math.PI * 0.666, 0, 0],
          3: [Math.PI * 0.666, Math.PI * 2/3, 0],
          4: [Math.PI * 0.666, Math.PI * 4/3, 0],
        };
        return d4Rotations[value] || [0, 0, 0];
      
      case 'd6':
        // Cube - rotate to show the rolled value facing UP (top-down view)
        // BoxGeometry material order: right(0), left(1), top(2), bottom(3), front(4), back(5)
        // We want the rolled face to be on TOP for top-down viewing
        const d6Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],                      // Face 1 on top
          2: [0, 0, -Math.PI / 2],           // Face 2 on top (roll right side up)
          3: [Math.PI / 2, 0, 0],            // Face 3 on top (roll front up)
          4: [-Math.PI / 2, 0, 0],           // Face 4 on top (roll back up)  
          5: [0, 0, Math.PI / 2],            // Face 5 on top (roll left side up)
          6: [Math.PI, 0, 0],                // Face 6 on top (flip upside down)
        };
        return d6Rotations[value] || [0, 0, 0];
      
      case 'd8':
        // Octahedron - 8 faces
        const d8Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [Math.PI * 0.5, 0, 0],
          3: [Math.PI, 0, 0],
          4: [Math.PI * 1.5, 0, 0],
          5: [Math.PI * 0.5, Math.PI * 0.5, 0],
          6: [Math.PI * 0.5, Math.PI, 0],
          7: [Math.PI * 0.5, Math.PI * 1.5, 0],
          8: [Math.PI * 0.5, Math.PI * 2, 0],
        };
        return d8Rotations[value] || [0, 0, 0];
      
      case 'd10':
      case 'd100':
        // Cylinder with 10 faces around the edge
        const angle = ((value - 1) * Math.PI * 2) / 10;
        return [Math.PI / 2, 0, -angle]; // Rotate to show correct face
      
      case 'd12':
        // Dodecahedron - 12 pentagonal faces
        const d12Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [1.107, 0, 0],
          3: [-1.107, 0, 0],
          4: [0, 1.107, 0],
          5: [0, -1.107, 0],
          6: [0, 0, 1.107],
          7: [0, 0, -1.107],
          8: [1.107, 1.107, 0],
          9: [1.107, -1.107, 0],
          10: [-1.107, 1.107, 0],
          11: [-1.107, -1.107, 0],
          12: [Math.PI, 0, 0],
        };
        return d12Rotations[value] || [0, 0, 0];
      
      case 'd20':
        // Icosahedron - 20 triangular faces
        const d20Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [0.553, 0, 0],
          3: [1.107, 0, 0],
          4: [1.661, 0, 0],
          5: [2.214, 0, 0],
          6: [2.768, 0, 0],
          7: [0, 0.628, 0],
          8: [0.553, 0.628, 0],
          9: [1.107, 0.628, 0],
          10: [1.661, 0.628, 0],
          11: [2.214, 0.628, 0],
          12: [2.768, 0.628, 0],
          13: [0, 1.257, 0],
          14: [0.553, 1.257, 0],
          15: [1.107, 1.257, 0],
          16: [1.661, 1.257, 0],
          17: [2.214, 1.257, 0],
          18: [2.768, 1.257, 0],
          19: [0, 1.885, 0],
          20: [Math.PI, 0, 0],
        };
        return d20Rotations[value] || [0, 0, 0];
      
      default:
        return [0, 0, 0];
    }
  };

  if (!rollData) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={containerRef} className="w-full h-full" />
      
      {showResult && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border-2 border-purple-500 rounded-2xl p-8 shadow-2xl animate-bounce-in">
            {rollData.reason && (
              <div className="text-purple-300 text-lg mb-2 text-center font-semibold">
                {rollData.reason}
              </div>
            )}
            
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-2">
                {rollData.total}
              </div>
              
              <div className="text-gray-300 text-sm">
                {rollData.dice_notation}
                {rollData.modifier !== 0 && (
                  <span className="ml-2">
                    ({rollData.modifier > 0 ? '+' : ''}{rollData.modifier})
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {rollData.dice_results.map((die, index) => (
                  <div
                    key={index}
                    className={`
                      px-3 py-1 rounded-lg text-sm font-mono
                      ${die.is_critical ? 'bg-green-500 text-white animate-pulse' : 
                        die.is_fumble ? 'bg-red-500 text-white animate-pulse' : 
                        'bg-gray-700 text-gray-200'}
                    `}
                  >
                    {die.die_type}: {die.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAnimating && !showResult && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900 bg-opacity-80 px-6 py-3 rounded-full border border-purple-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-white ml-2">Rolling...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
