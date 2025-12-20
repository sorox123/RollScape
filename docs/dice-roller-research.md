# 3D Dice Roller Research - Top-Down Virtual Tabletop Implementation

**Research Date**: December 7, 2025  
**Focus**: Best practices for 3D dice animation in top-down POV for virtual tabletops

---

## Agent 1: GitHub Repository Analysis - dice-box

**Repository**: [3d-dice/dice-box](https://github.com/3d-dice/dice-box)  
**Tech Stack**: BabylonJS + AmmoJS (physics)  
**Architecture**: Web Workers + OffscreenCanvas

### Key Implementation Details

#### 1. **Physics-Driven Approach**
```javascript
// Physics worker handles simulation separately from rendering
async #makeRoll(parsedNotation, collectionId){
  parsedNotation.forEach(async notation => {
    const roll = {
      sides: notation.sides,
      dieType,
      groupId: index,
      collectionId: collection.id,
      rollId,
      id,
      theme,
      themeColor,
      meshName
    }
    // Add die to physics simulation
    this.#DiceWorld.add(roll)
  })
}
```

#### 2. **Asynchronous Roll Detection**
```javascript
async handleAsleep(die){
  // Mark die as asleep when physics settles
  die.asleep = true
  
  // Get the roll result for this die
  await Dice.getRollResult(die, this.#scene)
  
  // Handle d100 (pairs of d10+d100)
  if(die.d10Instance || die.dieParent) {
    if(die?.d10Instance?.asleep || die?.dieParent?.asleep) {
      const d100 = die.config.sides === 100 ? die : die.dieParent
      const d10 = die.config.sides === 10 ? die : die.d10Instance
      // Calculate combined roll result
    }
  }
}
```

#### 3. **Face Value Detection**
```javascript
static async getRollResult(die, scene) {
  const meshFaceIds = scene.themeData[meshName].colliderFaceMap
  const d4FaceDown = scene.themeData[meshName].d4FaceDown
  
  // Raycast from die position upward
  let vector = Dice.setVector3(0, 1, 0)
  if(d.dieType === 'd4' && d4FaceDown) {
    vector = Dice.setVector3(0, -1, 0)
  }
  
  Dice.ray.direction = vector
  Dice.ray.origin = die.mesh.position
  const picked = scene.pickWithRay(Dice.ray)
  
  // Map picked face to die value via colliderFaceMap
  d.value = meshFaceIds[d.dieType][picked.faceId]
}
```

#### 4. **Camera Setup for Top-Down View**
- Uses offscreen canvas for rendering in web worker
- Supports both onscreen and offscreen rendering modes
- Camera configured separately from physics simulation

### Strengths
✅ **Performance**: Web workers isolate physics from rendering  
✅ **Accuracy**: Raycast-based face detection  
✅ **Theming**: Extensive theme/material system  
✅ **Scalability**: Handles multiple dice efficiently  

### Weaknesses
❌ **Complexity**: Requires worker infrastructure  
❌ **Engine**: BabylonJS (not Three.js)  
❌ **Setup**: Complex initialization process  

---

## Agent 2: GitHub Repository Analysis - byWulf/threejs-dice

**Repository**: [byWulf/threejs-dice](https://github.com/byWulf/threejs-dice)  
**Tech Stack**: Three.js + Cannon.js  
**Architecture**: Direct scene manipulation

### Key Implementation Details

#### 1. **Pre-Calculated Roll Results**
```javascript
/**
 * prepareValues - The core innovation
 * Runs physics simulation, detects result, then shifts face values
 * to ensure target value lands face-up
 */
prepareValues(diceValues) {
  for (let i = 0; i < diceValues.length; i++) {
    diceValues[i].dice.simulationRunning = true
    diceValues[i].vectors = diceValues[i].dice.getCurrentVectors()
    diceValues[i].stableCount = 0
  }
  
  let check = () => {
    let allStable = true
    for (let i = 0; i < diceValues.length; i++) {
      if (diceValues[i].dice.isFinished()) {
        diceValues[i].stableCount++
      } else {
        diceValues[i].stableCount = 0
      }
      if (diceValues[i].stableCount < 50) {
        allStable = false
      }
    }
    
    if (allStable) {
      for (let i = 0; i < diceValues.length; i++) {
        // Shift the face values to match target
        diceValues[i].dice.shiftUpperValue(diceValues[i].value)
        diceValues[i].dice.resetBody()
        diceValues[i].dice.setVectors(diceValues[i].vectors)
        diceValues[i].dice.simulationRunning = false
      }
      this.throwRunning = false
    } else {
      DiceManager.world.step(DiceManager.world.dt)
    }
  }
  
  this.world.addEventListener('postStep', check)
}
```

#### 2. **Face Value Shifting**
```javascript
shiftUpperValue(toValue) {
  let geometry = this.object.geometry.clone()
  let fromValue = this.getUpsideValue()
  
  for (let i = 0, l = geometry.groups.length; i < l; ++i) {
    let materialIndex = geometry.groups[i].materialIndex
    if (materialIndex === 0) continue
    
    // Rotate material indices to make target value appear on top
    materialIndex += toValue - fromValue - 1
    while (materialIndex > this.values) materialIndex -= this.values
    while (materialIndex < 1) materialIndex += this.values
    
    geometry.groups[i].materialIndex = materialIndex + 1
  }
  
  this.updateMaterialsForValue(toValue - fromValue)
  this.object.geometry = geometry
}
```

#### 3. **Upside Value Detection**
```javascript
getUpsideValue() {
  let vector = new THREE.Vector3(0, this.invertUpside ? -1 : 1)
  let closest_face
  let closest_angle = Math.PI * 2
  
  let normals = this.object.geometry.getAttribute('normal').array
  for (let i = 0; i < this.object.geometry.groups.length; ++i) {
    let face = this.object.geometry.groups[i]
    if (face.materialIndex === 0) continue
    
    let startVertex = i * 9
    let normal = new THREE.Vector3(
      normals[startVertex], 
      normals[startVertex + 1], 
      normals[startVertex + 2]
    )
    let angle = normal.clone()
      .applyQuaternion(this.object.body.quaternion)
      .angleTo(vector)
      
    if (angle < closest_angle) {
      closest_angle = angle
      closest_face = face
    }
  }
  
  return closest_face.materialIndex - 1
}
```

#### 4. **Custom Geometry Generation**
```javascript
// Creates chamfered geometry for realistic dice
getChamferGeometry(vectors, faces, chamfer) {
  let chamfer_vectors = [], chamfer_faces = []
  let corner_faces = new Array(vectors.length)
  
  // Build chamfered vertices and faces
  for (let i = 0; i < faces.length; ++i) {
    let ii = faces[i], fl = ii.length - 1
    let center_point = new THREE.Vector3()
    let face = new Array(fl)
    
    for (let j = 0; j < fl; ++j) {
      let vv = vectors[ii[j]].clone()
      center_point.add(vv)
      corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1)
    }
    
    center_point.divideScalar(fl)
    for (let j = 0; j < fl; ++j) {
      let vv = chamfer_vectors[face[j]]
      vv.subVectors(vv, center_point)
        .multiplyScalar(chamfer)
        .addVectors(vv, center_point)
    }
    face.push(ii[fl])
    chamfer_faces.push(face)
  }
  
  return { vectors: chamfer_vectors, faces: chamfer_faces }
}
```

#### 5. **Top-Down Camera Setup**
```javascript
// From examples/rolling.html
camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)
camera.position.set(0, 30, 30)
scene.add(camera)

// Lighting for top-down view
let ambient = new THREE.AmbientLight('#ffffff', 0.3)
scene.add(ambient)

let directionalLight = new THREE.DirectionalLight('#ffffff', 0.5)
directionalLight.position.x = -1000
directionalLight.position.y = 1000
directionalLight.position.z = 1000
scene.add(directionalLight)

let light = new THREE.SpotLight(0xefdfd5, 1.3)
light.position.y = 100
light.target.position.set(0, 0, 0)
light.castShadow = true
light.shadow.camera.near = 50
light.shadow.camera.far = 110
scene.add(light)
```

### Strengths
✅ **Simplicity**: Direct Three.js implementation  
✅ **Reliability**: Pre-calculated results guarantee accuracy  
✅ **Physics**: Cannon.js provides realistic tumbling  
✅ **Proven**: Used in production applications  

### Weaknesses
❌ **Pre-calculation**: Requires running physics twice  
❌ **Geometry**: Custom geometry generation is complex  
❌ **Flexibility**: Harder to add custom die types  

---

## Agent 3: Virtual Tabletop Research

### D&D Beyond Approach (Inferred from behavior)

**Observations**:
- Instant physics simulation
- Smooth, natural tumbling
- Clean snap to final value
- No visible "correction" phase

**Likely Implementation**:
1. Generate random target value immediately
2. Run hidden physics simulation to completion
3. Detect which face lands up
4. Apply material/rotation correction
5. Replay animation from start with corrected initial conditions
6. OR: Use pre-rendered sprites/animations

### FoundryVTT Dice-So-Nice Module

**Approach**: Three.js + Cannon.js  
**Method**: Similar to byWulf - pre-calculate results

```javascript
// Pseudo-code based on behavior
function rollDice(notation) {
  const targetValue = calculateDiceResult(notation)
  
  // Run hidden simulation
  const simulation = runPhysicsOffscreen()
  const landedFace = detectFaceUp(simulation.finalState)
  
  // Calculate rotation correction
  const correction = calculateRotation(landedFace, targetValue)
  
  // Apply correction and replay
  applyInitialRotation(correction)
  playAnimation()
}
```

### Roll20 Implementation

**Approach**: 2D sprites with 3D illusion  
**Method**: Pre-rendered frames  
**Advantages**: Extremely performant  
**Disadvantages**: Not truly 3D

---

## Agent 4: General Best Practices

### 1. **Physics Engine Selection**

**Cannon.js** (Lightweight)
```javascript
const world = new CANNON.World()
world.gravity.set(0, -9.82 * 20, 0)
world.broadphase = new CANNON.NaiveBroadphase()
world.solver.iterations = 16

const floorBody = new CANNON.Body({
  mass: 0, 
  shape: new CANNON.Plane(), 
  material: floorMaterial
})
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.add(floorBody)
```

**Ammo.js** (Full-featured)
```javascript
const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
const broadphase = new Ammo.btDbvtBroadphase()
const solver = new Ammo.btSequentialImpulseConstraintSolver()

const World = new Ammo.btDiscreteDynamicsWorld(
  dispatcher,
  broadphase,
  solver,
  collisionConfiguration
)
World.setGravity(new Ammo.btVector3(0, -9.81 * gravity, 0))
```

### 2. **Face Detection Methods**

**Method A: Raycasting (dice-box approach)**
```javascript
// Cast ray from die center upward
const ray = new THREE.Ray(diePosition, new THREE.Vector3(0, 1, 0))
const picked = scene.pickWithRay(ray)
const faceValue = colliderFaceMap[dieType][picked.faceId]
```

**Method B: Normal Comparison (byWulf approach)**
```javascript
// Find face normal most aligned with up vector
const upVector = new THREE.Vector3(0, 1, 0)
let closestAngle = Math.PI * 2

for (let face of geometry.groups) {
  const normal = getFaceNormal(face)
  const angle = normal.applyQuaternion(rotation).angleTo(upVector)
  if (angle < closestAngle) {
    closestFace = face
  }
}
```

### 3. **Animation Phases**

**Standard Pattern**:
1. **Throw Phase** (0.5-1s): Initial velocity + rotation
2. **Tumble Phase** (1-2s): Physics simulation
3. **Settle Phase** (0.5s): Damping to rest
4. **Snap Phase** (0.1s): Final alignment
5. **Display Phase**: Show result with numbers

### 4. **Camera Configuration for Top-Down**

```javascript
// Orthographic for true top-down
const camera = new THREE.OrthographicCamera(
  width / -2, width / 2,
  height / 2, height / -2,
  1, 1000
)
camera.position.set(0, 50, 0)
camera.lookAt(0, 0, 0)

// Perspective for slight angle
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
camera.position.set(0, 30, 15)
camera.lookAt(0, 0, 0)
```

---

## Agent 5: Performance Optimization

### Web Workers Pattern
```javascript
// Main thread
const physicsWorker = new Worker('physics.worker.js')
const renderWorker = new Worker('render.worker.js')

physicsWorker.postMessage({ action: 'rollDice', notation: '2d6' })
physicsWorker.onmessage = (e) => {
  if (e.data.action === 'updates') {
    updateDicePositions(e.data.positions)
  }
}

// Physics worker
self.onmessage = (e) => {
  if (e.data.action === 'rollDice') {
    runSimulation()
    sendUpdates()
  }
}
```

### OffscreenCanvas Rendering
```javascript
// Offscreen rendering for non-blocking animation
const offscreen = canvas.transferControlToOffscreen()
const worker = new Worker('dice.worker.js')
worker.postMessage({ canvas: offscreen }, [offscreen])

// In worker
self.onmessage = (e) => {
  const canvas = e.data.canvas
  const gl = canvas.getContext('webgl2')
  // Render dice...
}
```

### Instancing for Multiple Dice
```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial()

const instancedMesh = new THREE.InstancedMesh(geometry, material, 100)
scene.add(instancedMesh)

// Update individual die positions
const matrix = new THREE.Matrix4()
matrix.setPosition(x, y, z)
instancedMesh.setMatrixAt(index, matrix)
instancedMesh.instanceMatrix.needsUpdate = true
```

---

## Summary of Findings

### Three Main Approaches Identified

1. **Pre-Rendered Physics** (byWulf/threejs-dice)
   - Run simulation to completion
   - Detect result
   - Shift materials/geometry
   - Replay animation

2. **Real-Time Physics** (dice-box)
   - Pure physics simulation
   - Detect face via raycast
   - Accept whatever lands naturally
   - Use crypto fallback if mismatch

3. **Hybrid Approach** (D&D Beyond suspected)
   - Calculate target immediately
   - Run quick simulation
   - Apply corrections invisibly
   - Play corrected animation

### Recommended Tech Stack

**Rendering**: Three.js  
**Physics**: Cannon.js (simpler) OR Ammo.js (more accurate)  
**Architecture**: Web Workers (optional, for performance)  
**Face Detection**: Normal comparison (simpler) OR Raycasting (more flexible)

### Critical Success Factors

1. ✅ **Realistic Physics**: Proper mass, friction, restitution values
2. ✅ **Accurate Detection**: Reliable face-up detection method
3. ✅ **Clean Snap**: Smooth transition to final alignment
4. ✅ **Performance**: 60fps during animation
5. ✅ **Reliability**: 100% correct results

