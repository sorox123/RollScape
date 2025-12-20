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
  textureUrls?: { [key: string]: string };
}

// Physics state for hidden simulation
interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
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
  const particlesRef = useRef<THREE.Points[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const dicePhysicsRef = useRef<Map<string, PhysicsState>>(new Map());
  
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

  // ====== METHOD 3: CALCULATED INITIAL ROTATION ======
  
  /**
   * Run a hidden physics simulation to determine final resting state
   */
  const simulateToCompletion = (
    initialPos: THREE.Vector3,
    initialVel: THREE.Vector3,
    initialRot: THREE.Quaternion,
    initialAngVel: THREE.Vector3,
    dieType: string
  ): PhysicsState => {
    const state: PhysicsState = {
      position: initialPos.clone(),
      velocity: initialVel.clone(),
      rotation: initialRot.clone(),
      angularVelocity: initialAngVel.clone()
    };

    const dt = 0.016; // 60 FPS
    const gravity = -9.8 * settings.throwForce;
    const maxIterations = 500; // ~8 seconds max
    
    const boundaryX = 6.0;
    const boundaryZ = 4.0;
    const groundY = 0.2;

    for (let i = 0; i < maxIterations; i++) {
      // Apply gravity
      state.velocity.y += gravity * dt;
      
      // Update position
      state.position.add(state.velocity.clone().multiplyScalar(dt));
      
      // Boundary collisions
      if (state.position.x < -boundaryX) {
        state.position.x = -boundaryX;
        state.velocity.x = Math.abs(state.velocity.x) * 0.5;
      }
      if (state.position.x > boundaryX) {
        state.position.x = boundaryX;
        state.velocity.x = -Math.abs(state.velocity.x) * 0.5;
      }
      if (state.position.z < -boundaryZ) {
        state.position.z = -boundaryZ;
        state.velocity.z = Math.abs(state.velocity.z) * 0.5;
      }
      if (state.position.z > boundaryZ) {
        state.position.z = boundaryZ;
        state.velocity.z = -Math.abs(state.velocity.z) * 0.5;
      }
      
      // Ground collision
      if (state.position.y <= groundY) {
        state.position.y = groundY;
        if (state.velocity.y < 0) {
          state.velocity.y = -state.velocity.y * 0.4;
        }
        // Ground friction
        state.velocity.x *= 0.95;
        state.velocity.z *= 0.95;
      }
      
      // Air resistance
      state.velocity.multiplyScalar(0.995);
      
      // Update rotation
      const angularDt = state.angularVelocity.clone().multiplyScalar(dt);
      const deltaQuat = new THREE.Quaternion();
      deltaQuat.setFromEuler(new THREE.Euler(angularDt.x, angularDt.y, angularDt.z));
      state.rotation.multiply(deltaQuat);
      
      // Rotational damping
      state.angularVelocity.multiplyScalar(0.99);
      
      // Check if settled (low velocity and on ground)
      const speed = state.velocity.length();
      const angSpeed = state.angularVelocity.length();
      if (speed < 0.05 && angSpeed < 0.05 && state.position.y <= groundY + 0.1) {
        break;
      }
    }

    return state;
  };

  /**
   * Get the face index that is pointing upward (top face)
   */
  const getTopFaceIndex = (rotation: THREE.Quaternion, dieType: string): number => {
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Create a temporary die to check face normals
    const geometry = getDiceGeometry(dieType);
    const normalAttr = geometry.getAttribute('normal');
    
    let closestFaceIndex = 0;
    let smallestAngle = Math.PI;
    
    // Check each face group
    for (let i = 0; i < geometry.groups.length; i++) {
      const group = geometry.groups[i];
      const normalIndex = group.start;
      const normal = new THREE.Vector3(
        normalAttr.getX(normalIndex),
        normalAttr.getY(normalIndex),
        normalAttr.getZ(normalIndex)
      );
      
      // Transform normal by rotation
      normal.applyQuaternion(rotation);
      
      const angle = normal.angleTo(upVector);
      if (angle < smallestAngle) {
        smallestAngle = angle;
        closestFaceIndex = group.materialIndex ?? i;
      }
    }
    
    geometry.dispose();
    return closestFaceIndex;
  };

  /**
   * Calculate the rotation needed to make a specific face point upward
   */
  const calculateFaceRotation = (fromFaceIndex: number, toFaceIndex: number, dieType: string): THREE.Quaternion => {
    if (fromFaceIndex === toFaceIndex) {
      return new THREE.Quaternion(); // Identity (no rotation needed)
    }
    
    // Get face normals for the die type
    const geometry = getDiceGeometry(dieType);
    const normalAttr = geometry.getAttribute('normal');
    
    const getGroupNormal = (faceIndex: number): THREE.Vector3 => {
      const group = geometry.groups[faceIndex];
      return new THREE.Vector3(
        normalAttr.getX(group.start),
        normalAttr.getY(group.start),
        normalAttr.getZ(group.start)
      );
    };
    
    const fromNormal = getGroupNormal(fromFaceIndex);
    const toNormal = getGroupNormal(toFaceIndex);
    
    geometry.dispose();
    
    // Calculate rotation quaternion from one normal to another
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(fromNormal.normalize(), toNormal.normalize());
    
    return quaternion;
  };

  /**
   * METHOD 3: Calculate initial rotation to show target value
   */
  const calculateCorrectedInitialRotation = (
    dieResult: DieResult
  ): THREE.Quaternion => {
    // Start with backend's initial rotation
    const initialRot = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        dieResult.initial_rotation[0] * Math.PI / 180,
        dieResult.initial_rotation[1] * Math.PI / 180,
        dieResult.initial_rotation[2] * Math.PI / 180
      )
    );
    
    // If animations are disabled, just set rotation to show correct face
    if (!settings.animateRolls) {
      return getRotationForValue(dieResult.die_type, dieResult.value);
    }
    
    // Run hidden simulation to see where it would naturally land
    const initialPos = new THREE.Vector3(...dieResult.initial_position);
    const initialVel = new THREE.Vector3(
      dieResult.initial_velocity[0] * settings.throwForce,
      dieResult.initial_velocity[1] * settings.throwForce,
      dieResult.initial_velocity[2] * settings.throwForce
    );
    const initialAngVel = new THREE.Vector3(
      dieResult.angular_velocity[0] * settings.spinIntensity * Math.PI / 180,
      dieResult.angular_velocity[1] * settings.spinIntensity * Math.PI / 180,
      dieResult.angular_velocity[2] * settings.spinIntensity * Math.PI / 180
    );
    
    const finalState = simulateToCompletion(
      initialPos,
      initialVel,
      initialRot,
      initialAngVel,
      dieResult.die_type
    );
    
    // Find which face landed up
    const landedFaceIndex = getTopFaceIndex(finalState.rotation, dieResult.die_type);
    
    // Calculate which face should be up for target value
    const targetFaceIndex = dieResult.value - 1; // material[0]=1, material[1]=2, etc.
    
    // Calculate rotation correction needed
    const rotationCorrection = calculateFaceRotation(landedFaceIndex, targetFaceIndex, dieResult.die_type);
    
    // Apply inverse correction to initial rotation
    const correctedInitial = initialRot.clone().multiply(rotationCorrection.invert());
    
    console.log(`${dieResult.die_type}: Simulated face=${landedFaceIndex+1}, target=${dieResult.value}, correction applied`);
    
    return correctedInitial;
  };

  /**
   * Get quaternion rotation to display a specific face value upward
   * Used for instant (non-animated) mode
   */
  const getRotationForValue = (dieType: string, value: number): THREE.Quaternion => {
    const rotations = getFinalRotation(dieType, value);
    return new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotations[0], rotations[1], rotations[2])
    );
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !rollData) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    setCameraPosition(camera, settings.cameraAngle);
    cameraRef.current = camera;

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

    setupLighting(scene, settings.shadowQuality);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = settings.shadowQuality !== 'low';
    scene.add(ground);

    // Create dice with Method 3 corrected rotations
    createDiceWithMethod3(scene, rollData);

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

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
      particlesRef.current.forEach(p => {
        p.geometry.dispose();
        (p.material as THREE.PointsMaterial).dispose();
      });
      particlesRef.current = [];
    };
  }, [rollData, settings, textureUrls]);

  // Animation loop
  useEffect(() => {
    if (!rollData || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    setIsAnimating(true);
    setShowResult(false);
    startTimeRef.current = performance.now();

    playSound(200, 0.1, 0.4);
    vibrate(50);

    const animate = (currentTime: number) => {
      if (!startTimeRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const elapsedTime = (currentTime - startTimeRef.current) / 1000;

      if (settings.animateRolls) {
        // Animated mode: update physics
        rollData.dice_results.forEach((dieResult, index) => {
          const dieMesh = diceRef.current.get(`die_${index}`);
          if (!dieMesh) return;

          const dieKey = `die_${index}`;
          const physics = dicePhysicsRef.current.get(dieKey);
          if (!physics) return;

          if (elapsedTime < dieResult.settle_time) {
            // Physics simulation
            const dt = 0.016;
            const gravity = -9.8 * settings.throwForce;
            physics.velocity.y += gravity * dt;
            
            physics.position.add(physics.velocity.clone().multiplyScalar(dt));
            
            // Boundaries
            const boundaryX = 6.0;
            const boundaryZ = 4.0;
            const groundY = 0.2;
            
            if (physics.position.x < -boundaryX) {
              physics.position.x = -boundaryX;
              physics.velocity.x = Math.abs(physics.velocity.x) * 0.5;
              playSound(150 + Math.random() * 100, 0.05, 0.2);
              vibrate(20);
            }
            if (physics.position.x > boundaryX) {
              physics.position.x = boundaryX;
              physics.velocity.x = -Math.abs(physics.velocity.x) * 0.5;
              playSound(150 + Math.random() * 100, 0.05, 0.2);
              vibrate(20);
            }
            if (physics.position.z < -boundaryZ) {
              physics.position.z = -boundaryZ;
              physics.velocity.z = Math.abs(physics.velocity.z) * 0.5;
              playSound(150 + Math.random() * 100, 0.05, 0.2);
              vibrate(20);
            }
            if (physics.position.z > boundaryZ) {
              physics.position.z = boundaryZ;
              physics.velocity.z = -Math.abs(physics.velocity.z) * 0.5;
              playSound(150 + Math.random() * 100, 0.05, 0.2);
              vibrate(20);
            }
            
            if (physics.position.y <= groundY) {
              physics.position.y = groundY;
              if (physics.velocity.y < 0) {
                physics.velocity.y = -physics.velocity.y * 0.4;
                if (Math.abs(physics.velocity.y) > 0.5) {
                  playSound(150 + Math.random() * 100, 0.05, 0.2);
                  vibrate(20);
                }
              }
              physics.velocity.x *= 0.95;
              physics.velocity.z *= 0.95;
            }
            
            physics.velocity.multiplyScalar(0.995);
            
            // Update rotation
            const angularDt = physics.angularVelocity.clone().multiplyScalar(dt);
            const deltaQuat = new THREE.Quaternion();
            deltaQuat.setFromEuler(new THREE.Euler(angularDt.x, angularDt.y, angularDt.z));
            physics.rotation.multiply(deltaQuat);
            
            physics.angularVelocity.multiplyScalar(0.99);
            
            dieMesh.position.copy(physics.position);
            dieMesh.quaternion.copy(physics.rotation);
          } else {
            // Settled - keep locked
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
            dieMesh.position.y = 0.2;
            
            // Create particles for critical/fumble (once)
            if (!(dieMesh as any).particlesCreated && (dieResult.is_critical || dieResult.is_fumble)) {
              if (settings.particleEffects && sceneRef.current) {
                createParticleEffect(
                  sceneRef.current,
                  dieMesh.position,
                  dieResult.is_critical ? 0xffd700 : 0xff0000
                );
                (dieMesh as any).particlesCreated = true;
              }
            }
          }
        });

        updateParticles();
        updateCamera(cameraRef.current, rollData.camera_focus, elapsedTime, settings.cameraAngle);
      } else {
        // Instant mode: dice already in final position
        // No physics updates needed
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Determine animation completion time
      const completionTime = settings.animateRolls 
        ? rollData.total_animation_time + 1 
        : 0.5; // Instant mode shows result after brief delay

      if (elapsedTime < completionTime) {
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

  // Setup lighting
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

  // Set camera position
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
        camera.position.set(0, 7, 2);
        camera.lookAt(0, 0, 0);
        break;
    }
  };

  // Update camera
  const updateCamera = (
    camera: THREE.PerspectiveCamera,
    focus: number[],
    time: number,
    angle: string
  ) => {
    const focusTarget = new THREE.Vector3(...focus);
    
    if (angle === 'dynamic') {
      const targetPos = new THREE.Vector3(
        focusTarget.x,
        7,
        focusTarget.z + 2
      );
      camera.position.lerp(targetPos, 0.02);
      camera.lookAt(focusTarget);
    }
  };

  // Create dice with Method 3
  const createDiceWithMethod3 = (
    scene: THREE.Scene,
    rollData: DiceRollData
  ) => {
    rollData.dice_results.forEach((dieResult, index) => {
      const geometry = getDiceGeometry(dieResult.die_type);
      const materials = getDiceMaterials(
        dieResult.die_type,
        dieResult.value,
        dieResult.is_critical,
        dieResult.is_fumble
      );
      
      const die = new THREE.Mesh(geometry, materials);
      
      // Set initial position
      die.position.set(
        dieResult.initial_position[0],
        dieResult.initial_position[1],
        dieResult.initial_position[2]
      );
      
      // Set CORRECTED initial rotation using Method 3
      const correctedRotation = calculateCorrectedInitialRotation(dieResult);
      die.quaternion.copy(correctedRotation);
      
      die.castShadow = settings.shadowQuality !== 'low';
      die.receiveShadow = settings.shadowQuality !== 'low';
      
      scene.add(die);
      diceRef.current.set(`die_${index}`, die);
      
      // Initialize physics state
      dicePhysicsRef.current.set(`die_${index}`, {
        position: new THREE.Vector3(...dieResult.initial_position),
        velocity: new THREE.Vector3(
          dieResult.initial_velocity[0] * settings.throwForce,
          dieResult.initial_velocity[1] * settings.throwForce,
          dieResult.initial_velocity[2] * settings.throwForce
        ),
        rotation: correctedRotation.clone(),
        angularVelocity: new THREE.Vector3(
          dieResult.angular_velocity[0] * settings.spinIntensity * Math.PI / 180,
          dieResult.angular_velocity[1] * settings.spinIntensity * Math.PI / 180,
          dieResult.angular_velocity[2] * settings.spinIntensity * Math.PI / 180
        )
      });
    });
  };

  // Get dice geometry
  const getDiceGeometry = (dieType: string): THREE.BufferGeometry => {
    const scale = 0.4;
    
    switch (dieType) {
      case 'd4':
        return new THREE.TetrahedronGeometry(scale * 1.2);
      case 'd6':
        const boxGeom = new THREE.BoxGeometry(scale, scale, scale);
        boxGeom.clearGroups();
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

  // Create number texture
  const createNumberTexture = (number: string | number, color: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Get materials with correct face mapping (material[i] = value i+1)
  const getDiceMaterials = (
    dieType: string,
    targetValue: number,
    isCritical?: boolean,
    isFumble?: boolean
  ): THREE.Material[] => {
    let color = 0x1e40af;
    if (isCritical) color = 0x10b981;
    else if (isFumble) color = 0xef4444;
    
    const emissive = isCritical ? 0x10b981 : isFumble ? 0xef4444 : 0x000000;
    const emissiveIntensity = isCritical || isFumble ? 0.3 : 0;
    
    const faceCount = parseInt(dieType.substring(1));
    const materials: THREE.Material[] = [];
    
    // Create materials: material[0] shows 1, material[1] shows 2, etc.
    for (let i = 0; i < faceCount; i++) {
      const faceValue = i + 1;
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

  // Particle effects
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

  // Get final rotation for each die type and value
  const getFinalRotation = (dieType: string, value: number): [number, number, number] => {
    switch (dieType) {
      case 'd4':
        const d4Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [Math.PI * 0.666, 0, 0],
          3: [Math.PI * 0.666, Math.PI * 2/3, 0],
          4: [Math.PI * 0.666, Math.PI * 4/3, 0],
        };
        return d4Rotations[value] || [0, 0, 0];
      
      case 'd6':
        const d6Rotations: { [key: number]: [number, number, number] } = {
          1: [0, 0, 0],
          2: [0, 0, -Math.PI / 2],
          3: [Math.PI / 2, 0, 0],
          4: [-Math.PI / 2, 0, 0],
          5: [0, 0, Math.PI / 2],
          6: [Math.PI, 0, 0],
        };
        return d6Rotations[value] || [0, 0, 0];
      
      case 'd8':
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
        const angle = ((value - 1) * Math.PI * 2) / 10;
        return [Math.PI / 2, 0, -angle];
      
      case 'd12':
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
              <span className="text-white ml-2">
                {settings.animateRolls ? 'Rolling...' : 'Rolling (instant)...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
