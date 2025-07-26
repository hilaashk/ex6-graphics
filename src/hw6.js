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
    ballInFlight: false
};

// Basketball physics variables
let basketball = null; // Will reference the basketball sphere from hw5.js
let basketballSeams = null; // Will reference the basketball seams from hw5.js
let ballVelocity = new THREE.Vector3(0, 0, 0);
let ballPosition = new THREE.Vector3(0, 0.7, 0); // Starting position
let ballRotation = new THREE.Vector3(0, 0, 0);

// Physics constants
const PHYSICS = {
    GRAVITY: -9.8 * 1.2, // Slightly stronger gravity for better arc
    BOUNCE_DAMPING: 0.7, // Energy loss on bounce
    MOVEMENT_SPEED: 0.15,
    ROTATION_SPEED: 0.1,
    SHOT_BASE_SPEED: 14, // Increased base shooting speed
    SHOT_POWER_MULTIPLIER: 0.4, // Slightly increased power scaling
    GROUND_Y: 0.6, // Basketball radius
    HOOP_HEIGHT: 5.3, // Actual rim height from hw5.js
    HOOP_RADIUS: 0.45, // Actual rim radius from hw5.js
    HOOP_INNER_RADIUS: 0.35, // Inner scoring area
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
 * Uses realistic basketball physics with proper parabolic trajectory
 */
function calculateShotTrajectory(startPos, targetPos, power) {
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dz = targetPos.z - startPos.z;
    
    // Calculate horizontal distance to target
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    
    // Calculate realistic shot angle based on power and distance
    // Basketball shots typically use 35° to 55° launch angles
    const minAngle = Math.PI / 5; // 36 degrees
    const maxAngle = Math.PI / 3.3; // ~55 degrees
    const shotAngle = minAngle + (power / 100) * (maxAngle - minAngle);
    
    // Calculate required initial velocity using projectile motion physics
    const g = Math.abs(PHYSICS.GRAVITY);
    const sin2Theta = Math.sin(2 * shotAngle);
    const cosThetaSq = Math.cos(shotAngle) * Math.cos(shotAngle);
    
    // Calculate required speed to reach target with proper arc
    let initialSpeed;
    
    // Use simplified projectile motion for better consistency
    if (sin2Theta > 0) {
        initialSpeed = Math.sqrt((g * horizontalDistance * horizontalDistance) / 
                                (horizontalDistance * sin2Theta - 2 * dy * cosThetaSq));
    } else {
        initialSpeed = PHYSICS.SHOT_BASE_SPEED;
    }
    
    // Apply power scaling and ensure reasonable limits
    const powerFactor = 0.9 + (power / 100) * 0.6; // 0.9 to 1.5 multiplier
    initialSpeed = Math.max(PHYSICS.SHOT_BASE_SPEED, initialSpeed * powerFactor);
    initialSpeed = Math.min(initialSpeed, PHYSICS.SHOT_BASE_SPEED * 2.5);
    
    // Calculate velocity components
    const horizontalSpeed = initialSpeed * Math.cos(shotAngle);
    const verticalSpeed = initialSpeed * Math.sin(shotAngle);
    
    // Direction unit vector for horizontal movement
    const directionX = dx / horizontalDistance;
    const directionZ = dz / horizontalDistance;
    
    const velocity = new THREE.Vector3(
        directionX * horizontalSpeed,
        verticalSpeed,
        directionZ * horizontalSpeed
    );
    
    // Calculate expected maximum height for validation
    const timeToMax = verticalSpeed / g;
    const maxHeight = startPos.y + (verticalSpeed * timeToMax) - (0.5 * g * timeToMax * timeToMax);
    
    console.log(`Shot: Distance=${horizontalDistance.toFixed(1)}, Angle=${(shotAngle * 180/Math.PI).toFixed(1)}°, Speed=${initialSpeed.toFixed(1)}, Max Height=${maxHeight.toFixed(1)}, Power=${power}%`);
    
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
            showGameMessage('MISSED SHOT', 'red');
            console.log('Ball came to rest - missed shot');
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
        // Backboard is at (±13.5, 6, 0) with dimensions 0.1 × 2 × 3
        const backboardMinX = backboardX - 0.05;
        const backboardMaxX = backboardX + 0.05;
        const backboardMinY = 6 - 1; // 5.0
        const backboardMaxY = 6 + 1; // 7.0
        const backboardMinZ = -1.5;
        const backboardMaxZ = 1.5;
        
        // Check if ball is hitting backboard
        if (ballPosition.x >= backboardMinX - ballRadius && ballPosition.x <= backboardMaxX + ballRadius &&
            ballPosition.y >= backboardMinY && ballPosition.y <= backboardMaxY &&
            ballPosition.z >= backboardMinZ && ballPosition.z <= backboardMaxZ) {
            
            // Determine which side of backboard was hit
            if ((isLeftHoop && ballVelocity.x < 0) || (!isLeftHoop && ballVelocity.x > 0)) {
                // Ball hit the front of backboard - bounce back
                ballVelocity.x = -ballVelocity.x * PHYSICS.BACKBOARD_BOUNCE;
                ballVelocity.y *= 0.9; // Slight energy loss
                ballVelocity.z *= 0.9;
                
                // Move ball away from backboard to prevent sticking
                if (isLeftHoop) {
                    ballPosition.x = backboardMinX - ballRadius - 0.1;
                } else {
                    ballPosition.x = backboardMaxX + ballRadius + 0.1;
                }
                
                console.log(`Ball hit ${hoop.side} backboard and bounced`);
                return false; // Continue flight, don't score
            }
        }
        
        // 2. RIM COLLISION
        // Rim is a torus at (rimX, 5.3, 0) with radius 0.45
        const distanceToRimCenter = Math.sqrt(
            Math.pow(ballPosition.x - rimX, 2) + 
            Math.pow(ballPosition.z - 0, 2)
        );
        const heightDifference = Math.abs(ballPosition.y - PHYSICS.HOOP_HEIGHT);
        
        // Check if ball is hitting the rim (torus collision)
        if (distanceToRimCenter >= PHYSICS.HOOP_RADIUS - ballRadius && 
            distanceToRimCenter <= PHYSICS.HOOP_RADIUS + ballRadius &&
            heightDifference <= ballRadius) {
            
            // Ball hit the rim - bounce
            const bounceDirection = new THREE.Vector3(
                ballPosition.x - rimX,
                0,
                ballPosition.z - 0
            ).normalize();
            
            // Apply bounce in the direction away from rim center
            const bounceStrength = ballVelocity.length() * PHYSICS.RIM_BOUNCE;
            ballVelocity.x = bounceDirection.x * bounceStrength;
            ballVelocity.z = bounceDirection.z * bounceStrength;
            ballVelocity.y = Math.abs(ballVelocity.y) * 0.5; // Upward bounce
            
            console.log(`Ball hit ${hoop.side} rim and bounced`);
            return false; // Continue flight, don't score
        }
        
        // 3. SCORING DETECTION
        // Ball must pass through the inner area of the rim while moving downward
        if (distanceToRimCenter <= PHYSICS.HOOP_INNER_RADIUS &&
            Math.abs(ballPosition.y - PHYSICS.HOOP_HEIGHT) <= 0.5 &&
            ballVelocity.y < -1.0) { // Must be moving downward with good speed
            
            // Additional check: ball must have proper arc (came from above)
            if (ballPosition.y > PHYSICS.HOOP_HEIGHT - 0.5) {
                // Successful shot!
                gameState.score += 2;
                gameState.shotsMade++;
                gameState.ballInFlight = false;
                
                // Stop the ball near hoop level for visual effect
                ballPosition.y = PHYSICS.HOOP_HEIGHT - 1.0;
                ballPosition.x = rimX;
                ballPosition.z = 0;
                ballVelocity.set(0, 0, 0);
                
                // Update basketball position immediately
                basketball.position.copy(ballPosition);
                if (basketballSeams) {
                    basketballSeams.position.copy(ballPosition);
                }
                
                // Reset ball position after showing success
                setTimeout(() => {
                    resetBasketball();
                }, 1500);
                
                // Show success message
                showGameMessage('SHOT MADE! +2 POINTS', 'green');
                
                // Update UI
                updateUI();
                
                console.log(`SHOT MADE in ${hoop.side} hoop! Distance: ${distanceToRimCenter.toFixed(2)}, Score: ${gameState.score}`);
                return true;
            }
        }
    }
    return false;
}

// ============================================================================
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
