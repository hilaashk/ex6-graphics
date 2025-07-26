/**
 * HW6 - Interactive Basketball Shooting Game with Physics
 * 
 * This file extends the HW5 basketball court implementation with:
 * - Interactive basketball controls (arrow keys, W/S for power, spacebar to shoot, R to reset)
 * - Physics-based movement with gravity and collision detection
 * - Basketball rotation animations
 * - Comprehensive scoring system
 * - Enhanced user interface
 */

// ============================================================================
// GLOBAL VARIABLES AND STATE
// ============================================================================

// Game state variables
let gameState = {
    score: 0,
    shotsMade: 0,
    shotAttempts: 0,
    shotPower: 50, // 0-100%
    isShootingMode: false,
    ballInFlight: false,
    hasScored: false // Track if current shot has scored to avoid double counting
};

// Basketball physics variables
let basketball = null; // Will reference the basketball sphere from hw5.js
let basketballSeams = null; // Will reference the basketball seams from hw5.js
let ballVelocity = new THREE.Vector3(0, 0, 0);
let ballPosition = new THREE.Vector3(0, 0.7, 0); // Starting position
let ballRotation = new THREE.Vector3(0, 0, 0);

// Confetti system
let confettiParticles = [];
let confettiGeometry = null;
let confettiMaterial = null;
let confettiSystem = null;

// Physics constants
const PHYSICS = {
    GRAVITY: -9.8, // Realistic gravity
    BOUNCE_DAMPING: 0.7, // Energy loss on bounce
    MOVEMENT_SPEED: 0.15,
    ROTATION_SPEED: 0.1,
    SHOT_BASE_SPEED: 12, // Base shooting speed
    SHOT_POWER_MULTIPLIER: 0.3, // Power scaling
    GROUND_Y: 0.6, // Basketball radius
    HOOP_HEIGHT: 5.3, // Actual rim height from hw5.js
    HOOP_RADIUS: 0.45, // Actual rim radius from hw5.js
    HOOP_INNER_RADIUS: 0.4, // Slightly larger inner scoring area for easier scoring
    BACKBOARD_BOUNCE: 0.8, // Backboard bounce coefficient
    RIM_BOUNCE: 0.6, // Rim bounce coefficient
    MIN_ARC_HEIGHT: 2 // Minimum arc height to clear rim
};

// Court boundaries
const COURT_BOUNDS = {
    MIN_X: -14,
    MAX_X: 14,
    MIN_Z: -25,
    MAX_Z: 25
};

// Hoop positions (matching hw5.js structure exactly)
const HOOPS = [
    { position: new THREE.Vector3(-13.5 + 0.45, PHYSICS.HOOP_HEIGHT, 0), side: 'left' },
    { position: new THREE.Vector3(13.5 - 0.45, PHYSICS.HOOP_HEIGHT, 0), side: 'right' }
];

// Input state tracking
let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyW: false,
    KeyS: false,
    Space: false,
    KeyR: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize HW6 interactive features
 * Called after HW5 initialization is complete
 */
function initHW6() {
    console.log('Initializing HW6 Interactive Features...');
    
    // Find the basketball object created by hw5.js
    findBasketballObject();
    
    // Setup input handlers
    setupInputHandlers();
    
    // Initialize UI
    updateUI();
    
    // Override the animate function to include physics
    setupPhysicsLoop();
    
    // Initialize confetti system
    initConfettiSystem();
    
    console.log('HW6 Interactive Features initialized successfully');
}

/**
 * Find and reference the basketball object created in hw5.js
 */
function findBasketballObject() {
    scene.traverse((object) => {
        // Find the basketball sphere
        if (object instanceof THREE.Mesh && 
            object.geometry instanceof THREE.SphereGeometry &&
            object.material && object.material.map) {
            // This is likely our basketball sphere
            basketball = object;
            ballPosition.copy(basketball.position);
            console.log('Found basketball sphere:', basketball);
        }
        
        // Find the basketball seams group
        if (object instanceof THREE.Group && object.children.length > 0) {
            // Check if this group contains line objects (seams)
            const hasLines = object.children.some(child => child instanceof THREE.Line);
            if (hasLines) {
                basketballSeams = object;
                console.log('Found basketball seams:', basketballSeams);
            }
        }
    });
    
    if (!basketball) {
        console.error('Could not find basketball sphere from hw5.js');
    }
    if (!basketballSeams) {
        console.error('Could not find basketball seams from hw5.js');
    }
}

// ============================================================================
// CONFETTI SYSTEM
// ============================================================================

/**
 * Initialize the confetti particle system
 */
function initConfettiSystem() {
    // Create confetti geometry (larger rectangles for better visibility)
    confettiGeometry = new THREE.PlaneGeometry(0.3, 0.15); // Increased size from 0.1, 0.05
    
    // Create confetti material with multiple colors
    confettiMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00, // Default yellow, will be changed per particle
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9 // Increased opacity for better visibility
    });
    
    console.log('Confetti system initialized');
}

/**
 * Create confetti explosion all over the screen
 */
function createConfettiExplosion(hoopPosition) {
    const particleCount = 150; // Reduced from 1200 for better performance and visibility
    const colors = [
        0xff0000, // Red
        0x00ff00, // Green
        0xffff00, // Yellow
        0xff00ff, // Magenta
        0x00ffff, // Cyan
        0xffa500, // Orange
        0x800080, // Purple
        0xffd700, // Gold
        0xff69b4  // Hot Pink
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Create individual confetti piece
        const confettiPiece = new THREE.Mesh(
            confettiGeometry.clone(),
            confettiMaterial.clone()
        );
        
        // Random color for each piece
        confettiPiece.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
        
        // Position confetti all across the screen/court area
        // Use camera position and court bounds to spread confetti across visible area
        const screenWidth = 20; // Reduced visible court width to keep confetti closer
        const screenHeight = 10; // Reduced visible court height
        const screenDepth = 15;  // Reduced visible court depth
        
        confettiPiece.position.set(
            (Math.random() - 0.5) * screenWidth,     // Spread across court width
            Math.random() * screenHeight + 5,        // Start above court but not too high
            (Math.random() - 0.5) * screenDepth      // Spread across court depth
        );
        
        // Random initial velocity for more dynamic spread
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,  // Reduced horizontal spread to keep visible
            Math.random() * 6 + 2,      // Strong upward velocity
            (Math.random() - 0.5) * 8   // Reduced horizontal spread to keep visible
        );
        
        // Random rotation velocity for more dynamic spinning
        const rotationVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12
        );
        
        // Random size variation for more visual interest - FIXED SCALE
        const scale = 0.8 + Math.random() * 1.0; // Scale between 0.8x and 1.8x (reasonable size)
        confettiPiece.scale.set(scale, scale, scale);
        
        // Store physics data
        confettiPiece.userData = {
            velocity: velocity,
            rotationVelocity: rotationVelocity,
            lifetime: 4.0 + Math.random() * 2.0, // Varied lifetime 4-6 seconds
            age: 0
        };
        
        // Add to scene and tracking array
        scene.add(confettiPiece);
        confettiParticles.push(confettiPiece);
    }
    
    console.log(`Created full-screen confetti explosion with ${particleCount} particles!`);
}

/**
 * Update confetti particles physics and remove expired ones
 */
function updateConfetti(deltaTime) {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i];
        const userData = particle.userData;
        
        // Update age
        userData.age += deltaTime;
        
        // Apply gravity (lighter for confetti)
        userData.velocity.y += PHYSICS.GRAVITY * deltaTime * 0.3; // Even lighter gravity for floating effect
        
        // Add air resistance for more realistic floating motion
        userData.velocity.x *= 0.998; // Slight air resistance
        userData.velocity.z *= 0.998;
        
        // Add some random air currents for more dynamic movement
        userData.velocity.x += (Math.random() - 0.5) * 0.1;
        userData.velocity.z += (Math.random() - 0.5) * 0.1;
        
        // Update position
        particle.position.add(userData.velocity.clone().multiplyScalar(deltaTime));
        
        // Update rotation with more dramatic spinning
        particle.rotation.x += userData.rotationVelocity.x * deltaTime;
        particle.rotation.y += userData.rotationVelocity.y * deltaTime;
        particle.rotation.z += userData.rotationVelocity.z * deltaTime;
        
        // Fade out over time with more gradual transition
        const fadeProgress = userData.age / userData.lifetime;
        const fadeStart = 0.7; // Start fading when 70% of lifetime is reached
        
        if (fadeProgress > fadeStart) {
            const fadeAmount = (fadeProgress - fadeStart) / (1 - fadeStart);
            particle.material.opacity = Math.max(0, 0.8 * (1 - fadeAmount));
        } else {
            particle.material.opacity = 0.8; // Full opacity during main display time
        }
        
        // Remove expired particles
        if (userData.age >= userData.lifetime) {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
            confettiParticles.splice(i, 1);
        }
    }
}

// ============================================================================
// INPUT HANDLING (Phase 1 & 2)
// ============================================================================

/**
 * Setup keyboard input handlers for all game controls
 */
function setupInputHandlers() {
    // Keydown events
    document.addEventListener('keydown', (event) => {
        // Prevent default for game keys to avoid page scrolling
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
        
        // Update key state
        keys[event.code] = true;
        
        // Handle specific key actions
        handleKeyDown(event);
    });
    
    // Keyup events
    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
}

/**
 * Handle individual key press events
 */
function handleKeyDown(event) {
    switch (event.code) {
        case 'Space':
            if (!gameState.ballInFlight) {
                shootBasketball();
            }
            break;
            
        case 'KeyR':
            resetBasketball();
            break;
            
        // Note: 'O' key is already handled by hw5.js for orbit controls
    }
}

// ============================================================================
// BASKETBALL MOVEMENT (Phase 1)
// ============================================================================

/**
 * Update basketball position based on arrow key input
 */
function updateBasketballMovement(deltaTime) {
    if (!basketball || gameState.ballInFlight) return;
    
    let moved = false;
    const movement = new THREE.Vector3();
    
    // Horizontal movement (left/right)
    if (keys.ArrowLeft) {
        movement.x -= PHYSICS.MOVEMENT_SPEED;
        moved = true;
    }
    if (keys.ArrowRight) {
        movement.x += PHYSICS.MOVEMENT_SPEED;
        moved = true;
    }
    
    // Forward/backward movement
    if (keys.ArrowUp) {
        movement.z -= PHYSICS.MOVEMENT_SPEED;
        moved = true;
    }
    if (keys.ArrowDown) {
        movement.z += PHYSICS.MOVEMENT_SPEED;
        moved = true;
    }
    
    if (moved) {
        // Apply movement with boundary checking
        const newPos = ballPosition.clone().add(movement);
        
        // Check court boundaries
        newPos.x = Math.max(COURT_BOUNDS.MIN_X, Math.min(COURT_BOUNDS.MAX_X, newPos.x));
        newPos.z = Math.max(COURT_BOUNDS.MIN_Z, Math.min(COURT_BOUNDS.MAX_Z, newPos.z));
        
        ballPosition.copy(newPos);
        
        // Update both basketball sphere and seams positions
        basketball.position.copy(ballPosition);
        if (basketballSeams) {
            basketballSeams.position.copy(ballPosition);
        }
        
        // Add rotation animation for movement (Phase 5)
        addMovementRotation(movement);
    }
}

/**
 * Add realistic rotation animation during movement
 */
function addMovementRotation(movement) {
    if (!basketball) return;
    
    // Calculate rotation based on movement direction and distance
    const rotationAmount = movement.length() * PHYSICS.ROTATION_SPEED * 3; // Increased multiplier
    
    // Rotate around appropriate axis based on movement direction
    if (Math.abs(movement.x) > Math.abs(movement.z)) {
        // Horizontal movement - rotate around Z axis (ball rolls left/right)
        basketball.rotation.z += movement.x > 0 ? -rotationAmount : rotationAmount;
        if (basketballSeams) {
            basketballSeams.rotation.z += movement.x > 0 ? -rotationAmount : rotationAmount;
        }
    } else {
        // Forward/backward movement - rotate around X axis (ball rolls forward/back)
        basketball.rotation.x += movement.z > 0 ? rotationAmount : -rotationAmount;
        if (basketballSeams) {
            basketballSeams.rotation.x += movement.z > 0 ? rotationAmount : -rotationAmount;
        }
    }
}

// ============================================================================
// SHOT POWER SYSTEM (Phase 2)
// ============================================================================

/**
 * Update shot power based on W/S key input
 */
function updateShotPower() {
    let powerChanged = false;
    
    // Faster power adjustment for better control
    const powerStep = 3;
    
    if (keys.KeyW && gameState.shotPower < 100) {
        gameState.shotPower = Math.min(100, gameState.shotPower + powerStep);
        powerChanged = true;
    }
    if (keys.KeyS && gameState.shotPower > 0) {
        gameState.shotPower = Math.max(0, gameState.shotPower - powerStep);
        powerChanged = true;
    }
    
    if (powerChanged) {
        updatePowerIndicator();
    }
}

/**
 * Update the visual power indicator in the UI
 */
function updatePowerIndicator() {
    const powerFill = document.getElementById('power-fill');
    const powerText = document.getElementById('power-text');
    
    if (powerFill && powerText) {
        powerFill.style.width = gameState.shotPower + '%';
        powerText.textContent = Math.round(gameState.shotPower) + '%';
    }
}

// ============================================================================
// PHYSICS AND SHOOTING (Phase 3)
// ============================================================================

/**
 * Shoot the basketball toward the nearest hoop
 */
function shootBasketball() {
    if (!basketball || gameState.ballInFlight) return;
    
    // Increment shot attempts
    gameState.shotAttempts++;
    
    // Find nearest hoop
    const nearestHoop = findNearestHoop();
    const distance = ballPosition.distanceTo(nearestHoop.position);
    
    // Calculate shot trajectory
    const trajectory = calculateShotTrajectory(ballPosition, nearestHoop.position, gameState.shotPower);
    
    // Set ball velocity
    ballVelocity.copy(trajectory);
    
    // Enter flight mode
    gameState.ballInFlight = true;
    gameState.hasScored = false; // Reset scoring flag for new shot
    
    console.log(`Shot taken! Power: ${gameState.shotPower}%, Distance to hoop: ${distance.toFixed(1)}, Target: ${nearestHoop.side}`);
    console.log(`Initial velocity: (${trajectory.x.toFixed(2)}, ${trajectory.y.toFixed(2)}, ${trajectory.z.toFixed(2)})`);
    
    // Update UI
    updateUI();
}

/**
 * Find the nearest hoop to the basketball
 */
function findNearestHoop() {
    let nearestHoop = HOOPS[0];
    let nearestDistance = ballPosition.distanceTo(HOOPS[0].position);
    
    for (let i = 1; i < HOOPS.length; i++) {
        const distance = ballPosition.distanceTo(HOOPS[i].position);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestHoop = HOOPS[i];
        }
    }
    
    return nearestHoop;
}

/**
 * Calculate shot trajectory to reach the target hoop
 * Uses simplified basketball physics with proper parabolic trajectory
 */
function calculateShotTrajectory(startPos, targetPos, power) {
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dz = targetPos.z - startPos.z;
    
    // Calculate horizontal distance to target
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    
    // Simplified trajectory calculation considering hoop height
    // Calculate required trajectory to reach hoop height (5.3 units)
    const targetHeight = PHYSICS.HOOP_HEIGHT; // 5.3 units
    const heightDifference = targetHeight - startPos.y; // How much higher we need to go
    
    // Improved shot angle calculation that considers target height
    let shotAngle;
    
    // Calculate optimal angle based on distance and height difference
    if (horizontalDistance > 0) {
        // Use projectile motion to find optimal angle
        const g = Math.abs(PHYSICS.GRAVITY);
        
        // For basketball shots, we want the ball to reach peak height above the hoop
        const extraHeight = Math.max(1.0, horizontalDistance * 0.1); // Higher arc for longer shots
        const peakHeight = targetHeight + extraHeight;
        const totalHeightGain = peakHeight - startPos.y;
        
        // Calculate angle needed to reach this height at this distance
        // Using tan(θ) = (4h)/d where h is height gain and d is distance
        const tangentAngle = (4 * totalHeightGain) / horizontalDistance;
        shotAngle = Math.atan(tangentAngle);
        
        // Ensure reasonable angle limits
        const minAngle = Math.PI / 8; // 22.5 degrees minimum
        const maxAngle = Math.PI / 2.2; // ~82 degrees maximum
        shotAngle = Math.max(minAngle, Math.min(maxAngle, shotAngle));
    } else {
        // Fallback for very close shots
        shotAngle = Math.PI / 3; // 60 degrees
    }
    
    // Calculate required initial speed to reach target with proper physics
    const g = Math.abs(PHYSICS.GRAVITY);
    
    // Calculate required speed using projectile motion equations
    const sinAngle = Math.sin(shotAngle);
    const cosAngle = Math.cos(shotAngle);
    
    // Calculate time to reach target horizontally
    const timeToTarget = horizontalDistance / (Math.cos(shotAngle));
    
    // Calculate required initial speed to reach target height
    let requiredSpeed;
    if (timeToTarget > 0 && sinAngle > 0) {
        // v₀ = √(g * d² / (d * sin(2θ) - 2 * Δy * cos²(θ)))
        const sin2Theta = Math.sin(2 * shotAngle);
        const cosSq = cosAngle * cosAngle;
        
        if (sin2Theta > 0) {
            requiredSpeed = Math.sqrt((g * horizontalDistance * horizontalDistance) / 
                                    (horizontalDistance * sin2Theta - 2 * heightDifference * cosSq));
        } else {
            requiredSpeed = 10.0; // Fallback
        }
    } else {
        requiredSpeed = 10.0; // Fallback
    }
    
    // Apply power scaling to the calculated speed
    let powerMultiplier;
    if (power <= 10) {
        powerMultiplier = 0.3 + (power / 10) * 0.4; // 0.3 to 0.7
    } else if (power <= 50) {
        powerMultiplier = 0.7 + ((power - 10) / 40) * 0.3; // 0.7 to 1.0
    } else {
        powerMultiplier = 1.0 + ((power - 50) / 50) * 0.5; // 1.0 to 1.5
    }
    
    let finalSpeed = requiredSpeed * powerMultiplier;
    
    // Ensure reasonable speed limits
    finalSpeed = Math.max(4.0, Math.min(25.0, finalSpeed));
    
    // Calculate velocity components using the shot angle
    const horizontalSpeed = finalSpeed * Math.cos(shotAngle);
    const verticalSpeed = finalSpeed * Math.sin(shotAngle);
    
    // Direction unit vector for horizontal movement
    const directionX = horizontalDistance > 0 ? dx / horizontalDistance : 0;
    const directionZ = horizontalDistance > 0 ? dz / horizontalDistance : 0;
    
    const velocity = new THREE.Vector3(
        directionX * horizontalSpeed,
        verticalSpeed,
        directionZ * horizontalSpeed
    );
    
    // Calculate trajectory info for debugging
    const flightTime = horizontalDistance / horizontalSpeed;
    const maxHeight = startPos.y + (verticalSpeed * verticalSpeed) / (2 * g);
    const finalHeight = startPos.y + verticalSpeed * flightTime - 0.5 * g * flightTime * flightTime;
    
    console.log(`Shot: Distance=${horizontalDistance.toFixed(1)}, Angle=${(shotAngle * 180/Math.PI).toFixed(1)}°, Speed=${finalSpeed.toFixed(1)}, Max Height=${maxHeight.toFixed(1)}, Final Height=${finalHeight.toFixed(1)}, Power=${power}%`);
    
    return velocity;
}

/**
 * Reset basketball to center court
 */
function resetBasketball() {
    if (!basketball) return;
    
    // Reset position
    ballPosition.set(0, 0.7, 0);
    basketball.position.copy(ballPosition);
    if (basketballSeams) {
        basketballSeams.position.copy(ballPosition);
    }
    
    // Reset velocity and rotation
    ballVelocity.set(0, 0, 0);
    basketball.rotation.set(0, 0, 0); // Reset all rotations
    if (basketballSeams) {
        basketballSeams.rotation.set(0, 0, 0); // Reset seams rotation too
    }
    
    // Reset game state
    gameState.ballInFlight = false;
    gameState.hasScored = false; // Reset scoring flag
    gameState.shotPower = 50;
    
    // Update UI
    updatePowerIndicator();
    hideGameMessage();
    
    console.log('Basketball reset to center court');
}

// ============================================================================
// PHYSICS SIMULATION (Phase 4)
// ============================================================================

/**
 * Update basketball physics simulation
 * Implements realistic gravity, bouncing, and collision detection
 */
function updatePhysics(deltaTime) {
    if (!basketball || !gameState.ballInFlight) return;
    
    // Apply gravity (constant downward acceleration)
    ballVelocity.y += PHYSICS.GRAVITY * deltaTime;
    
    // Update position based on velocity
    ballPosition.add(ballVelocity.clone().multiplyScalar(deltaTime));
    
    // Check for successful shot before ground collision
    if (checkHoopCollision()) {
        return; // Shot was successful, stop physics
    }
    
    // Check for ground collision
    if (ballPosition.y <= PHYSICS.GROUND_Y) {
        ballPosition.y = PHYSICS.GROUND_Y;
        
        // Bounce with energy loss (coefficient of restitution)
        if (Math.abs(ballVelocity.y) > 0.2) {
            ballVelocity.y = -ballVelocity.y * PHYSICS.BOUNCE_DAMPING;
            ballVelocity.x *= PHYSICS.BOUNCE_DAMPING;
            ballVelocity.z *= PHYSICS.BOUNCE_DAMPING;
            
            console.log(`Ball bounced: velocity = ${ballVelocity.length().toFixed(2)}`);
        } else {
            // Ball has stopped bouncing (comes to rest)
            ballVelocity.set(0, 0, 0);
            gameState.ballInFlight = false;
            
            // Show appropriate message based on whether shot was made
            if (gameState.hasScored) {
                console.log('Ball came to rest after successful shot');
                // Reset after a short delay for successful shots
                setTimeout(() => {
                    resetBasketball();
                }, 1000);
            } else {
                showGameMessage('MISSED SHOT', 'red');
                console.log('Ball came to rest - missed shot');
            }
        }
    }
    
    // Update basketball position (both sphere and seams)
    basketball.position.copy(ballPosition);
    if (basketballSeams) {
        basketballSeams.position.copy(ballPosition);
    }
    
    // Add flight rotation animation
    addFlightRotation(deltaTime);
    
    // Check if ball goes too far out of bounds
    if (ballPosition.x < COURT_BOUNDS.MIN_X - 15 || ballPosition.x > COURT_BOUNDS.MAX_X + 15 ||
        ballPosition.z < COURT_BOUNDS.MIN_Z - 15 || ballPosition.z > COURT_BOUNDS.MAX_Z + 15 ||
        ballPosition.y < -5) {
        gameState.ballInFlight = false;
        showGameMessage('OUT OF BOUNDS', 'orange');
        console.log('Ball went out of bounds');
        
        // Reset after a delay
        setTimeout(() => {
            resetBasketball();
        }, 1500);
    }
}

/**
 * Add rotation animation during ball flight
 */
function addFlightRotation(deltaTime) {
    if (!basketball || !gameState.ballInFlight) return;
    
    // Rotate based on velocity - basketball should spin during flight
    const speed = ballVelocity.length();
    const rotationSpeed = speed * PHYSICS.ROTATION_SPEED * deltaTime * 2; // Increased rotation speed
    
    // Create realistic basketball spin during flight
    if (speed > 0.1) {
        // Main rotation around horizontal axis (backspin)
        basketball.rotation.x += rotationSpeed;
        if (basketballSeams) {
            basketballSeams.rotation.x += rotationSpeed;
        }
        
        // Slight rotation around movement axis for realism
        const axis = new THREE.Vector3(-ballVelocity.z, 0, ballVelocity.x).normalize();
        basketball.rotateOnAxis(axis, rotationSpeed * 0.3);
        if (basketballSeams) {
            basketballSeams.rotateOnAxis(axis, rotationSpeed * 0.3);
        }
    }
}

/**
 * Check if basketball passes through any hoop or collides with hoop components
 * Includes backboard collision, rim collision, and scoring detection
 */
function checkHoopCollision() {
    const ballRadius = 0.6; // Basketball radius
    
    for (const hoop of HOOPS) {
        const isLeftHoop = hoop.side === 'left';
        const backboardX = isLeftHoop ? -13.5 : 13.5;
        const rimX = isLeftHoop ? -13.05 : 13.05;
        
        // 1. BACKBOARD COLLISION
        // Backboard exact dimensions from hw5.js: BoxGeometry(0.1, 2, 3) at (±13.5, 6, 0)
        const backboardThickness = 0.1;
        const backboardHeight = 2;
        const backboardWidth = 3;
        
        const backboardMinX = backboardX - backboardThickness/2;
        const backboardMaxX = backboardX + backboardThickness/2;
        const backboardMinY = 6 - backboardHeight/2; // 5.0
        const backboardMaxY = 6 + backboardHeight/2; // 7.0
        const backboardMinZ = -backboardWidth/2; // -1.5
        const backboardMaxZ = backboardWidth/2;  // 1.5
        
        // Enhanced backboard collision detection
        const ballMinX = ballPosition.x - ballRadius;
        const ballMaxX = ballPosition.x + ballRadius;
        const ballMinY = ballPosition.y - ballRadius;
        const ballMaxY = ballPosition.y + ballRadius;
        const ballMinZ = ballPosition.z - ballRadius;
        const ballMaxZ = ballPosition.z + ballRadius;
        
        // Check if ball overlaps with backboard
        const xOverlap = ballMaxX >= backboardMinX && ballMinX <= backboardMaxX;
        const yOverlap = ballMaxY >= backboardMinY && ballMinY <= backboardMaxY;
        const zOverlap = ballMaxZ >= backboardMinZ && ballMinZ <= backboardMaxZ;
        
        if (xOverlap && yOverlap && zOverlap) {
            // Determine collision direction based on ball's velocity direction
            const wasMovingTowardBackboard = (isLeftHoop && ballVelocity.x < 0) || (!isLeftHoop && ballVelocity.x > 0);
            
            if (wasMovingTowardBackboard) {
                // Immediate bounce - reverse X velocity and apply energy loss
                ballVelocity.x = -ballVelocity.x * PHYSICS.BACKBOARD_BOUNCE;
                ballVelocity.y *= 0.85; // Some energy loss
                ballVelocity.z *= 0.85;
                
                // Immediately move ball outside backboard to prevent penetration
                if (isLeftHoop) {
                    ballPosition.x = backboardMinX - ballRadius - 0.1;
                } else {
                    ballPosition.x = backboardMaxX + ballRadius + 0.1;
                }
                
                // Update basketball position immediately to prevent penetration
                basketball.position.copy(ballPosition);
                if (basketballSeams) {
                    basketballSeams.position.copy(ballPosition);
                }
                
                console.log(`Ball hit ${hoop.side} backboard and bounced back immediately`);
                return false; // Continue flight, don't score
            }
        }
        
        // 2. SCORING DETECTION - Check this FIRST with very generous detection
        // Ball must pass through the inner area of the rim while moving downward
        const distanceToRimCenter = Math.sqrt(
            Math.pow(ballPosition.x - rimX, 2) + 
            Math.pow(ballPosition.z - 0, 2)
        );
        
        // Very generous scoring detection - allow shots that are reasonably close to center
        if (distanceToRimCenter <= PHYSICS.HOOP_INNER_RADIUS &&
            Math.abs(ballPosition.y - PHYSICS.HOOP_HEIGHT) <= 1.0 && // Larger vertical tolerance
            ballVelocity.y < -0.3) { // Less strict downward velocity requirement
            
            // Additional check: ball must have come from above the rim
            if (ballPosition.y >= PHYSICS.HOOP_HEIGHT - 1.0) {
                // Check if we haven't already scored this shot
                if (!gameState.hasScored) {
                    // Successful shot!
                    gameState.score += 2;
                    gameState.shotsMade++;
                    gameState.hasScored = true; // Mark that we've scored to avoid double counting
                    
                    // Show success message
                    showGameMessage('SHOT MADE! +2 POINTS', 'green');
                    
                    // Create confetti explosion at the hoop
                    const hoopPosition = new THREE.Vector3(rimX, PHYSICS.HOOP_HEIGHT, 0);
                    createConfettiExplosion(hoopPosition);
                    
                    // Update UI
                    updateUI();
                    
                    console.log(`SHOT MADE in ${hoop.side} hoop! Distance: ${distanceToRimCenter.toFixed(2)}, Height: ${ballPosition.y.toFixed(2)}, Score: ${gameState.score}`);
                }
                
                // Let the ball continue falling through the hoop
                // Simulate net effect - ball should fall more vertically and slower
                ballVelocity.x *= 0.3; // Much stronger horizontal dampening (net catches ball)
                ballVelocity.z *= 0.3;
                ballVelocity.y *= 0.6; // Slow down vertical velocity more (net resistance)
                
                // Make the ball fall straight down through the net
                const netEffect = 1.0; // Stronger net pulling effect
                ballVelocity.y = Math.min(ballVelocity.y - netEffect, -2.0); // Ensure downward motion
                
                // Center the ball horizontally toward the hoop center for clean net effect
                const pullToCenter = 0.1;
                ballVelocity.x += (rimX - ballPosition.x) * pullToCenter;
                ballVelocity.z += (0 - ballPosition.z) * pullToCenter;
                
                console.log(`Ball passing through net with modified velocity: (${ballVelocity.x.toFixed(2)}, ${ballVelocity.y.toFixed(2)}, ${ballVelocity.z.toFixed(2)})`);
                
                // Don't check rim collision for successful shots - let it fall through
                return false; // Continue physics simulation
            }
        }
        
        // 3. RIM COLLISION - ONLY check if ball hasn't scored AND hasn't been marked as scored
        const heightDifference = Math.abs(ballPosition.y - PHYSICS.HOOP_HEIGHT);
        
        // Only bounce if ball is clearly hitting the outer edge of the rim AND has not scored
        if (!gameState.hasScored && // NEVER bounce if we've already scored
            distanceToRimCenter >= PHYSICS.HOOP_RADIUS - ballRadius && 
            distanceToRimCenter <= PHYSICS.HOOP_RADIUS + ballRadius + 0.1 &&
            heightDifference <= ballRadius + 0.3) {
            
            // Ball is hitting the outer rim edge - bounce it
            
            // Calculate bounce direction away from rim center
            const bounceDirection = new THREE.Vector3(
                ballPosition.x - rimX,
                0,
                ballPosition.z - 0
            );
            
            // Normalize and ensure minimum bounce strength
            if (bounceDirection.length() > 0) {
                bounceDirection.normalize();
            } else {
                // Fallback direction if ball is exactly at rim center
                bounceDirection.set(ballVelocity.x > 0 ? 1 : -1, 0, ballVelocity.z > 0 ? 1 : -1);
                bounceDirection.normalize();
            }
            
            // Apply bounce
            const currentSpeed = ballVelocity.length();
            const bounceStrength = Math.max(currentSpeed * PHYSICS.RIM_BOUNCE, 3.0);
            
            ballVelocity.x = bounceDirection.x * bounceStrength;
            ballVelocity.z = bounceDirection.z * bounceStrength;
            ballVelocity.y = Math.max(Math.abs(ballVelocity.y) * 0.3, 1.0);
            
            // Move ball away from rim immediately
            ballPosition.x = rimX + bounceDirection.x * (PHYSICS.HOOP_RADIUS + ballRadius + 0.2);
            ballPosition.z = 0 + bounceDirection.z * (PHYSICS.HOOP_RADIUS + ballRadius + 0.2);
            ballPosition.y = Math.max(ballPosition.y, PHYSICS.HOOP_HEIGHT + 0.2);
            
            // Update basketball position immediately
            basketball.position.copy(ballPosition);
            if (basketballSeams) {
                basketballSeams.position.copy(ballPosition);
            }
            
            // Show rim hit message ONLY if no score has been made
            showGameMessage('So close! Don\'t hit the rim next time!', 'orange');
            
            console.log(`Ball hit ${hoop.side} rim and bounced back (outer edge hit)`);
            return false; // Continue flight, don't score
        }
    }
    return false;
}// ============================================================================
// USER INTERFACE (Phase 7)
// ============================================================================

/**
 * Update all UI elements with current game state
 */
function updateUI() {
    // Update score display
    const scoreElement = document.getElementById('score');
    const shotsMadeElement = document.getElementById('shots-made');
    const attemptsElement = document.getElementById('shot-attempts');
    const accuracyElement = document.getElementById('accuracy');
    
    if (scoreElement) scoreElement.textContent = gameState.score;
    if (shotsMadeElement) shotsMadeElement.textContent = gameState.shotsMade;
    if (attemptsElement) attemptsElement.textContent = gameState.shotAttempts;
    
    // Calculate and update accuracy
    const accuracy = gameState.shotAttempts > 0 ? 
        Math.round((gameState.shotsMade / gameState.shotAttempts) * 100) : 0;
    if (accuracyElement) accuracyElement.textContent = accuracy + '%';
}

/**
 * Show game message (shot made/missed feedback)
 */
function showGameMessage(message, color = 'white') {
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = color;
        messageElement.style.opacity = '1';
        
        // Hide message after 2 seconds
        setTimeout(() => {
            hideGameMessage();
        }, 2000);
    }
}

/**
 * Hide game message
 */
function hideGameMessage() {
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
        messageElement.style.opacity = '0';
    }
}

// ============================================================================
// PHYSICS LOOP INTEGRATION
// ============================================================================

/**
 * Setup the physics loop by extending the existing animate function
 */
function setupPhysicsLoop() {
    // Store reference to original animate function
    const originalAnimate = window.animate;
    
    // Create new animate function that includes physics
    window.animate = function() {
        requestAnimationFrame(window.animate);
        
        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - (window.lastTime || currentTime)) / 1000;
        window.lastTime = currentTime;
        
        // Update HW6 physics and interactions
        updateBasketballMovement(deltaTime);
        updateShotPower();
        updatePhysics(deltaTime);
        updateConfetti(deltaTime); // Update confetti particles
        
        // Update orbit controls if enabled
        if (controls && isOrbitEnabled) {
            controls.update();
        }
        
        // Render the scene
        if (scene && camera) {
            renderer.render(scene, camera);
        }
    };
    
    console.log('Physics loop integrated with existing animate function');
}

// ============================================================================
// INITIALIZATION TRIGGER
// ============================================================================

// Wait for hw5.js to complete initialization, then initialize hw6
// We'll use a small delay to ensure hw5 is fully loaded
setTimeout(() => {
    if (typeof scene !== 'undefined' && scene) {
        initHW6();
    } else {
        console.error('HW5 scene not found. Make sure hw5.js loads before hw6.js');
    }
}, 100);

console.log('HW6 Interactive Basketball Game loaded');
