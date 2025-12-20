"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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

interface DiceOverlayProps {
  rollData: DiceRollData | null;
  onAnimationComplete?: () => void;
  textureSet?: string; // URL or ID of texture set
}

export default function DiceOverlay({ rollData, onAnimationComplete, textureSet }: DiceOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diceRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !rollData) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.4);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    // Ground plane (invisible, for shadows)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create dice meshes
    createDice(scene, rollData, textureSet);

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      diceRef.current.clear();
    };
  }, [rollData, textureSet]);

  // Animation loop
  useEffect(() => {
    if (!rollData || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    setIsAnimating(true);
    setShowResult(false);
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const elapsedTime = (currentTime - startTimeRef.current) / 1000; // Convert to seconds

      // Update each die
      rollData.dice_results.forEach((dieResult, index) => {
        const dieMesh = diceRef.current.get(`die_${index}`);
        if (!dieMesh) return;

        if (elapsedTime < dieResult.settle_time) {
          // Simulate physics
          const t = elapsedTime;
          const gravity = -9.8;
          
          // Position
          const pos = [...dieResult.initial_position];
          const vel = [...dieResult.initial_velocity];
          pos[0] += vel[0] * t;
          pos[1] += vel[1] * t + 0.5 * gravity * t * t;
          pos[2] += vel[2] * t;

          // Bounce if hit ground
          if (pos[1] <= 0.2) {
            pos[1] = 0.2;
          }

          dieMesh.position.set(pos[0], pos[1], pos[2]);

          // Rotation (angular velocity)
          const angVel = dieResult.angular_velocity;
          dieMesh.rotation.x += (angVel[0] * Math.PI / 180) * 0.016;
          dieMesh.rotation.y += (angVel[1] * Math.PI / 180) * 0.016;
          dieMesh.rotation.z += (angVel[2] * Math.PI / 180) * 0.016;

          // Damping (slow down over time)
          const damping = Math.max(0, 1 - (t / dieResult.settle_time));
          dieResult.angular_velocity[0] *= damping;
          dieResult.angular_velocity[1] *= damping;
          dieResult.angular_velocity[2] *= damping;
        } else {
          // Settled - rotate to show final value
          const finalRotation = getFinalRotation(dieResult.die_type, dieResult.value);
          dieMesh.rotation.set(finalRotation[0], finalRotation[1], finalRotation[2]);
        }
      });

      // Camera follow (smooth)
      const focusTarget = new THREE.Vector3(...rollData.camera_focus);
      cameraRef.current.position.lerp(
        new THREE.Vector3(focusTarget.x, focusTarget.y + 3, focusTarget.z + 5),
        0.02
      );
      cameraRef.current.lookAt(focusTarget);

      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Check if animation complete
      if (elapsedTime < rollData.total_animation_time + 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setShowResult(true);
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 2000); // Show result for 2 seconds
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rollData, onAnimationComplete]);

  // Create dice geometries
  const createDice = (scene: THREE.Scene, rollData: DiceRollData, textureSet?: string) => {
    rollData.dice_results.forEach((dieResult, index) => {
      const geometry = getDiceGeometry(dieResult.die_type);
      const material = getDiceMaterial(dieResult.die_type, textureSet, dieResult.is_critical, dieResult.is_fumble);
      
      const die = new THREE.Mesh(geometry, material);
      die.position.set(
        dieResult.initial_position[0],
        dieResult.initial_position[1],
        dieResult.initial_position[2]
      );
      const rot = dieResult.initial_rotation.map(r => r * Math.PI / 180);
      die.rotation.set(rot[0], rot[1], rot[2]);
      die.castShadow = true;
      die.receiveShadow = true;
      
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
        return new THREE.BoxGeometry(scale, scale, scale);
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

  // Get material for each die (with textures or colors)
  const getDiceMaterial = (
    dieType: string, 
    textureSet?: string, 
    isCritical?: boolean, 
    isFumble?: boolean
  ): THREE.Material => {
    // TODO: Load custom textures from textureSet
    // For now, use colors
    
    let color = 0x1e40af; // Default blue
    
    if (isCritical) {
      color = 0x10b981; // Green for critical
    } else if (isFumble) {
      color = 0xef4444; // Red for fumble
    }
    
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: isCritical ? 0x10b981 : isFumble ? 0xef4444 : 0x000000,
      emissiveIntensity: isCritical || isFumble ? 0.3 : 0,
    });
  };

  // Get final rotation to show correct number face-up
  const getFinalRotation = (dieType: string, value: number): [number, number, number] => {
    // Simplified - in production, calculate exact face rotations
    return [0, (value * Math.PI) / 6, 0];
  };

  if (!rollData) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Result Display */}
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
              
              {/* Individual dice results */}
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {rollData.dice_results.map((die, index) => (
                  <div
                    key={index}
                    className={`
                      px-3 py-1 rounded-lg text-sm font-mono
                      ${die.is_critical ? 'bg-green-500 text-white' : 
                        die.is_fumble ? 'bg-red-500 text-white' : 
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
      
      {/* Loading indicator during animation */}
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
