# HW6 - Interactive Basketball Shooting Game

An immersive 3D basketball shooting game built with Three.js, extending the static basketball court from HW5 with interactive gameplay, realistic physics, and celebratory effects.

![Final Implementation 1](ex6-1.gif)

![Final Implementation 2](ex6-2.gif)

## 🎮 Complete List of Implemented Controls

### Basketball Movement
- **Arrow Keys**: Move basketball around the court
  - `←` / `→`: Move left/right
  - `↑` / `↓`: Move forward/backward
- **Boundary Detection**: Ball cannot move outside court boundaries

### Shooting System
- **W / S Keys**: Adjust shot power (0-100%)
  - `W`: Increase power
  - `S`: Decrease power
- **Spacebar**: Shoot basketball toward nearest hoop
- **Visual Power Meter**: Real-time display of current shot power

### Game Controls
- **R Key**: Reset basketball to center court
- **O Key**: Toggle orbit camera controls (inherited from HW5)

### User Interface
- **Score Display**: Current points, shots made, attempts, and accuracy percentage
- **Power Meter**: Visual indicator with percentage display
- **Game Messages**: Real-time feedback for shots made, missed, rim hits, and out-of-bounds
- **Live Statistics**: Automatic calculation and display of shooting accuracy

## ⚡ Physics System Implementation

### Realistic Basketball Physics
- **Gravity**: Constant downward acceleration (-9.8 m/s²)
- **Projectile Motion**: Parabolic trajectory calculations using physics equations
- **Energy Conservation**: Bounce damping and energy loss on collisions
- **Rotation Animation**: Realistic ball spinning during movement and flight

### Trajectory Calculation
- **Height-Aware Targeting**: Calculates optimal arc to reach hoop height (5.3 units)
- **Distance-Based Arcing**: Higher arcs for longer shots, lower for close shots
- **Power Scaling**: Non-linear power curve for realistic shot control
- **Angle Optimization**: Automatic calculation of launch angle based on distance and target height

### Collision Detection System
- **Backboard Collision**: Accurate collision with backboard geometry (0.1×2×3 units)
- **Rim Collision**: Smart rim detection that distinguishes between scoring attempts and rim hits
- **Ground Bouncing**: Realistic bouncing with energy loss until ball comes to rest
- **Boundary Checking**: Out-of-bounds detection and automatic reset

### Scoring System
- **Generous Detection**: Ball scores when passing through inner hoop radius (0.4 units)
- **Height Validation**: Ensures ball approaches from above rim level
- **Velocity Checking**: Confirms downward movement for valid scoring
- **Duplicate Prevention**: Prevents double-scoring on single shot

### Net Physics Simulation
- **Horizontal Dampening**: 70% velocity reduction in X/Z directions
- **Vertical Resistance**: 40% velocity reduction in Y direction
- **Center-Pull Effect**: Subtle gravitational pull toward hoop center
- **Smooth Fall-Through**: Realistic net interaction without bouncing

## 🌟 Additional Features Implemented

### Confetti Celebration System
- **Full-Screen Explosion**: 150 colorful particles spread across visible area
- **Physics-Based Movement**: Particles follow realistic gravity and air resistance
- **Dynamic Colors**: 9 vibrant colors with random assignment per particle
- **Particle Lifecycle**: 4-6 second lifespan with gradual fade-out
- **Performance Optimized**: Automatic cleanup and memory management

### Enhanced Visual Feedback
- **Color-Coded Messages**: 
  - Green for successful shots
  - Red for missed shots
  - Orange for rim hits and out-of-bounds
- **Automatic Message Timing**: Messages disappear after 2 seconds
- **Smooth Transitions**: Fade-in/fade-out effects for all UI elements

### Advanced Game Statistics
- **Real-Time Accuracy**: Automatic percentage calculation
- **Shot Tracking**: Separate counters for attempts and successful shots
- **Performance Metrics**: Live updating of all statistics

### Basketball Animation System
- **Movement Rotation**: Ball rotates based on movement direction and speed
- **Flight Spin**: Realistic backspin during shot trajectory
- **Multi-Axis Rotation**: Complex rotation around multiple axes for realism
- **Speed-Based Animation**: Rotation speed correlates with ball velocity

## 🐛 Known Issues or Limitations

### Physics Edge Cases
- **Very Close Shots**: Extremely close shots (< 1 unit) may have unrealistic trajectories
- **Maximum Range**: Shots beyond ~25 units may not reach target due to power limitations
- **Rapid Fire**: Multiple rapid shots may cause velocity accumulation (prevented by flight state checking)

### Performance Considerations
- **Confetti Particles**: Large numbers of particles may impact performance on lower-end devices
- **Collision Detection**: Complex collision calculations run every frame during ball flight
- **Memory Usage**: Confetti particles create/destroy geometry which may cause brief stutters

### Visual Limitations
- **Camera Constraints**: Best viewed from default camera position for optimal gameplay experience
- **Lighting Effects**: Static lighting may not highlight ball movement optimally in all positions
- **Texture Quality**: Ball texture resolution limited by original asset quality

## 📁 Sources of External Assets Used

### Three.js Library
- **Three.js r128**: Core 3D graphics library
  - Source: https://threejs.org/
  - License: MIT License
- **OrbitControls**: Camera control system
  - Source: Three.js examples
  - File: `src/OrbitControls.js`

### Texture Assets
- **Basketball Texture**: `src/texture/ball-texture.jpg`
  - Source: Custom basketball texture asset
  - Used for: Basketball sphere material mapping
- **Court Texture**: `src/texture/court-texture.jpg`
  - Source: Basketball court floor texture
  - Used for: Court surface material

### Base Implementation
- **HW5 Foundation**: Static basketball court and basic Three.js setup
  - Source: Previous assignment (hw5.js)
  - Preserved unchanged as per requirements
  - Includes: Court geometry, hoop structures, basic lighting, camera setup

### Code Architecture
- **MVC Pattern**: Separation of game state, physics, and rendering
- **Modular Design**: Clear separation between different game systems
- **Event-Driven**: Input handling through browser event system
- **Object-Oriented**: Proper encapsulation of game components

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Use arrow keys to position the basketball
3. Adjust power with W/S keys
4. Press spacebar to shoot
5. Try to score points and beat your accuracy record!

## 📸 How to Run

1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000
5. Feel free to clone and customize this court to suit your own game or simulation!

## 🏆 Game Features Summary

- **Interactive 3D Environment**: Full court with proper perspective and lighting
- **Realistic Physics**: Gravity, projectile motion, and collision detection
- **Dynamic Scoring**: Automatic point tracking with visual feedback
- **Celebration Effects**: Spectacular confetti explosions for successful shots
- **Performance Analytics**: Real-time accuracy and statistics tracking
- **Responsive Controls**: Smooth, intuitive gameplay controls
- **Visual Polish**: Professional UI with color-coded feedback system

Enjoy the game and see how high you can score! 🏀
