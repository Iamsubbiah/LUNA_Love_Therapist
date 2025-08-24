import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { createHeartModel } from './heart-model.js';

// Scene setup
let camera, scene, renderer, controls, composer;
let characterMesh, characterGroup;
let clock = new THREE.Clock();
let particles = [];
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let isDarkMode = false;
let heartBeatPulse = 0;

init();
animate();

function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    
    // Add renderer to page
    const container = document.getElementById('scene-container');
    container.appendChild(renderer.domElement);
    
    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Set up post-processing
    setupPostProcessing();
    
    // Add lights
    addLights();
    
    // Add background particles
    createParticles();
    
    // Load custom heart model
    loadHeartModel();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    
    // Listen for theme changes
    document.getElementById('theme-toggle').addEventListener('change', toggleTheme);
}

function setupPostProcessing() {
    // Create composer
    composer = new EffectComposer(renderer);
    
    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Add bloom pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Point lights with different colors for a dreamy effect
    const colors = [0xff4abb, 0x7b5bff, 0x00d8c5];
    const positions = [
        [15, 10, 15],
        [-15, -10, 15],
        [0, 15, -15]
    ];
    
    colors.forEach((color, i) => {
        const light = new THREE.PointLight(color, 1, 100);
        light.position.set(...positions[i]);
        scene.add(light);
    });
    
    // Add directional light for better shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
}

function createParticles() {
    // Create luxury background particles
    const particleGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    const particleCount = 200; // More particles for richness
    
    // Create particles with different materials
    for (let i = 0; i < particleCount; i++) {
        // Choose particle type
        const particleType = Math.floor(Math.random() * 4);
        let material;
        
        switch (particleType) {
            case 0: // Glowing bright particles
                material = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: Math.random() * 0.5 + 0.3
                });
                break;
                
            case 1: // Pink/magenta particles
                material = new THREE.MeshBasicMaterial({
                    color: 0xff4abb,
                    transparent: true,
                    opacity: Math.random() * 0.6 + 0.2
                });
                break;
                
            case 2: // Purple particles
                material = new THREE.MeshBasicMaterial({
                    color: 0x8b70ff,
                    transparent: true,
                    opacity: Math.random() * 0.5 + 0.2
                });
                break;
                
            case 3: // Teal/cyan accent particles (fewer)
                if (Math.random() > 0.7) {
                    material = new THREE.MeshBasicMaterial({
                        color: 0x00e2d9,
                        transparent: true,
                        opacity: Math.random() * 0.6 + 0.2
                    });
                } else {
                    material = new THREE.MeshBasicMaterial({
                        color: 0xf8f8ff,
                        transparent: true,
                        opacity: Math.random() * 0.4 + 0.1
                    });
                }
                break;
        }
        
        const particle = new THREE.Mesh(particleGeometry, material);
        
        // Distribute particles in a gentle sphere with bias toward center
        const radius = 60 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        // Apply positioning with some central bias
        particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
        particle.position.y = radius * Math.sin(phi) * Math.sin(theta) * 0.8; // Flatter distribution vertically
        particle.position.z = radius * Math.cos(phi);
        
        // Scale variation
        const scale = 0.5 + Math.random() * 2.5;
        particle.scale.set(scale, scale, scale);
        
        // Store animation properties with more variation
        particle.userData = {
            speed: Math.random() * 0.01 + 0.005,
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            startPosition: particle.position.clone(),
            randomOffset: Math.random() * Math.PI * 2,
            amplitude: 5 + Math.random() * 15,
            frequency: 0.05 + Math.random() * 0.1,
            phase: Math.random() * Math.PI * 2
        };
        
        particles.push(particle);
        scene.add(particle);
    }
}

function loadHeartModel() {
    // Show loading indicator
    document.querySelector('.loader-container').classList.remove('hidden');
    
    // Create a placeholder while loading
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff4abb,
        metalness: 0.5,
        roughness: 0.4,
        emissive: 0x440033,
        emissiveIntensity: 0.2
    });
    
    const placeholder = new THREE.Mesh(geometry, material);
    scene.add(placeholder);
    
    // Create heart model (with a slight delay to allow the page to render)
    setTimeout(() => {
        try {
            // Create our custom heart (a proper heart shape, not a knot)
            const heart = createLuxuryHeart();
            
            // Remove placeholder
            scene.remove(placeholder);
            
            // Add heart to scene
            characterMesh = heart.children[0]; // Main heart mesh
            characterGroup = heart;
            
            // Position the heart
            characterGroup.position.set(0, 0, 0);
            characterGroup.rotation.x = -Math.PI / 10;
            
            scene.add(characterGroup);
            
            // Hide loading screen
            document.querySelector('.loader-container').classList.add('hidden');
            
            console.log('Luxury heart model loaded successfully');
        } catch (error) {
            console.error('Error creating heart model:', error);
            document.querySelector('.loader-container').classList.add('hidden');
        }
    }, 500);
}

// Create a luxury heart model instead of a knot
function createLuxuryHeart() {
    // Create heart group
    const heartGroup = new THREE.Group();
    
    // Create a proper heart shape
    const heartShape = new THREE.Shape();
    
    // Heart shape curve coordinates
    const x = 0, y = 0;
    heartShape.moveTo(x, y + 5);
    heartShape.bezierCurveTo(x - 5, y + 5, x - 10, y, x - 10, y - 5);
    heartShape.bezierCurveTo(x - 10, y - 15, x, y - 20, x, y - 20);
    heartShape.bezierCurveTo(x, y - 20, x + 10, y - 15, x + 10, y - 5);
    heartShape.bezierCurveTo(x + 10, y, x + 5, y + 5, x, y + 5);
    
    // Create extrusion settings for more 3D feel
    const extrudeSettings = {
        depth: 8,
        bevelEnabled: true,
        bevelSegments: 8,
        bevelSize: 1.5,
        bevelThickness: 1.5,
        curveSegments: 32
    };
    
    // Create heart geometry
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    
    // Create luxury material with metallic finish
    const heartMaterial = new THREE.MeshPhysicalMaterial({
        color: isDarkMode ? 0xff4abb : 0xff3db2,
        metalness: 0.4,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color(0xff4abb).multiplyScalar(0.4),
        reflectivity: 1.0,
        ior: 1.8,
        side: THREE.DoubleSide
    });
    
    // Create heart mesh
    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    
    // Center the heart
    heartGeometry.computeBoundingBox();
    const centerOffset = heartGeometry.boundingBox.getCenter(new THREE.Vector3());
    heart.position.set(-centerOffset.x, -centerOffset.y, -centerOffset.z);
    
    // Scale the heart
    const scale = 0.9;
    heart.scale.set(scale, scale, scale);
    
    // Add the heart to the group
    heartGroup.add(heart);
    
    // Add multiple glowing layers for luxury effect
    const innerGlow = heart.clone();
    innerGlow.material = new THREE.MeshBasicMaterial({
        color: 0xff9dcc,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    innerGlow.scale.multiplyScalar(1.05);
    heartGroup.add(innerGlow);
    
    const outerGlow = heart.clone();
    outerGlow.material = new THREE.MeshBasicMaterial({
        color: 0xffa0e6,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    outerGlow.scale.multiplyScalar(1.15);
    heartGroup.add(outerGlow);
    
    const auraGlow = heart.clone();
    auraGlow.material = new THREE.MeshBasicMaterial({
        color: 0xff80c0,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    auraGlow.scale.multiplyScalar(1.3);
    heartGroup.add(auraGlow);
    
    // Create shimmering particles around the heart
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Generate particle colors from a luxury palette
    const colorPalette = [
        new THREE.Color(0xff4abb), // Pink
        new THREE.Color(0x8b70ff), // Purple
        new THREE.Color(0xffc0e0), // Light pink
        new THREE.Color(0x00e2d9), // Teal
        new THREE.Color(0xffffff)  // White
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Create beautiful distribution around heart
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 12 + Math.random() * 15;
        
        // Position with some heart shape bias
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) * 1.2; // Slightly taller
        const z = radius * Math.cos(phi) * 0.8; // Slightly flatter
        
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        
        // Vary particle sizes
        particleSizes[i] = 0.2 + Math.random() * 0.8;
        
        // Apply color from palette
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        particleColors[i * 3] = color.r;
        particleColors[i * 3 + 1] = color.g;
        particleColors[i * 3 + 2] = color.b;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.8,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const heartParticles = new THREE.Points(particleGeometry, particleMaterial);
    heartGroup.add(heartParticles);
    
    // Animation parameters
    heartGroup.userData.pulseParams = {
        speed: 0.7,
        intensity: 0.1,
        initialScale: scale,
        secondarySpeed: 2.5
    };
    
    // Update function for animation
    heartGroup.userData.update = function(time) {
        const params = this.userData.pulseParams;
        
        // Create complex triple-phase pulse animation
        const mainPulse = Math.sin(time * params.speed);
        const secondaryPulse = Math.sin(time * params.secondarySpeed + 0.4) * 0.3;
        const tertiaryPulse = Math.pow(Math.sin(time * params.secondarySpeed * 1.5), 6) * 0.1;
        
        // Combined pulse for realistic heartbeat
        const combinedPulse = mainPulse * 0.6 + secondaryPulse + tertiaryPulse;
        const pulseFactor = 1 + combinedPulse * params.intensity;
        
        // Apply non-uniform scaling for more organic movement
        const scaleX = params.initialScale * pulseFactor;
        const scaleY = params.initialScale * pulseFactor * 1.1;
        const scaleZ = params.initialScale * pulseFactor * 0.9;
        
        // Apply to main heart
        heart.scale.set(scaleX, scaleY, scaleZ);
        
        // Apply to glow layers with progressive scaling
        innerGlow.scale.set(scaleX * 1.05, scaleY * 1.05, scaleZ * 1.05);
        outerGlow.scale.set(scaleX * 1.15, scaleY * 1.15, scaleZ * 1.15);
        auraGlow.scale.set(scaleX * 1.3, scaleY * 1.3, scaleZ * 1.3);
        
        // Dynamic opacity for glow layers
        innerGlow.material.opacity = 0.4 + combinedPulse * 0.2;
        outerGlow.material.opacity = 0.2 + combinedPulse * 0.15;
        auraGlow.material.opacity = 0.1 + combinedPulse * 0.1;
        
        // Shimmer effect with time-based color shifts
        const hue = ((time * 0.05) % 1) * 0.1 + 0.9;
        const shimmerColor = new THREE.Color().setHSL(hue, 0.8, 0.7);
        
        // Apply color shifts to glow layers
        outerGlow.material.color.lerp(shimmerColor, 0.05);
        
        // Animate heart particles
        const positions = heartParticles.geometry.attributes.position.array;
        const sizes = heartParticles.geometry.attributes.size.array;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            // Calculate base values
            const distance = Math.sqrt(x * x + y * y + z * z);
            const nx = x / distance;
            const ny = y / distance;
            const nz = z / distance;
            
            // Different animation patterns for particles
            const timeOffset = i * 0.2;
            const particleType = i % 5;
            
            let breatheFactor, baseDistance, amplitude;
            
            switch (particleType) {
                case 0: // Regular pulsing
                    breatheFactor = Math.sin(time * 0.5 + timeOffset);
                    baseDistance = 15 + (i % 5);
                    amplitude = 4 + (i % 3);
                    break;
                    
                case 1: // Quick shimmer
                    breatheFactor = Math.pow(Math.sin(time * 1.2 + timeOffset), 3) * 0.7;
                    baseDistance = 18 + (i % 4);
                    amplitude = 3 + (i % 4);
                    break;
                    
                case 2: // Slow drift
                    breatheFactor = Math.sin(time * 0.3 + timeOffset) * 0.8;
                    baseDistance = 20 + (i % 6);
                    amplitude = 5 + (i % 3);
                    break;
                    
                case 3: // Orbital motion
                    breatheFactor = Math.sin(time * 0.4 + timeOffset);
                    baseDistance = 16 + (i % 3);
                    amplitude = 4;
                    // Add circular motion
                    nx += Math.cos(time * 0.2 + i) * 0.1;
                    ny += Math.sin(time * 0.3 + i) * 0.1;
                    break;
                    
                case 4: // Sparkle
                    breatheFactor = Math.random() * 0.4;
                    baseDistance = 14 + (i % 7);
                    amplitude = 3 + breatheFactor * 5;
                    break;
            }
            
            // Calculate new position with breathing effect
            const newDistance = baseDistance + breatheFactor * amplitude;
            
            // Update positions
            positions[i3] = nx * newDistance;
            positions[i3 + 1] = ny * newDistance;
            positions[i3 + 2] = nz * newDistance;
            
            // Pulsing sizes
            const sizePulse = 0.5 + 0.5 * Math.sin(time * 0.7 + i * 0.3);
            const baseSize = 0.2 + (i % 6) * 0.1;
            sizes[i] = baseSize + sizePulse * 0.4;
        }
        
        // Update geometry attributes
        heartParticles.geometry.attributes.position.needsUpdate = true;
        heartParticles.geometry.attributes.size.needsUpdate = true;
    };
    
    return heartGroup;
}

function updateParticles(time) {
    particles.forEach((particle, i) => {
        const { 
            speed, 
            rotationSpeed, 
            startPosition, 
            randomOffset,
            amplitude,
            frequency,
            phase
        } = particle.userData;
        
        // Create smoother, more elegant motion
        const timeOffset = time * frequency + phase;
        
        // Different motion algorithms for different particles
        const particleType = i % 3;
        
        // Base positions
        let xMovement, yMovement, zMovement;
        
        if (particleType === 0) {
            // Gentle sine waves
            xMovement = Math.sin(timeOffset) * amplitude;
            yMovement = Math.cos(timeOffset * 0.8) * (amplitude * 0.7);
            zMovement = Math.sin(timeOffset * 0.5) * (amplitude * 0.5);
        } else if (particleType === 1) {
            // More circular path
            xMovement = Math.sin(timeOffset) * amplitude;
            yMovement = Math.cos(timeOffset) * amplitude;
            zMovement = Math.sin(timeOffset * 0.7) * (amplitude * 0.3);
        } else {
            // Slower, more drifting motion
            xMovement = Math.sin(timeOffset * 0.4) * (amplitude * 1.2);
            yMovement = Math.cos(timeOffset * 0.3) * amplitude + Math.sin(time * 0.05) * 10;
            zMovement = Math.sin(timeOffset * 0.6) * (amplitude * 0.8);
        }
        
        // Apply smooth movement
        particle.position.x = startPosition.x + xMovement;
        particle.position.y = startPosition.y + yMovement;
        particle.position.z = startPosition.z + zMovement;
        
        // Gentle rotation
        particle.rotation.x += rotationSpeed * 0.2;
        particle.rotation.y += rotationSpeed * 0.3;
        
        // Subtle mouse influence
        particle.position.x += (targetMouseX - particle.position.x) * 0.0001;
        particle.position.y += (targetMouseY - particle.position.y) * 0.0001;
        
        // Gently pulsing opacity and scale for sparkle effect
        const opacityBase = particle.material.opacity;
        const opacityPulse = Math.sin(time + randomOffset * 10) * 0.2 + 0.8;
        particle.material.opacity = opacityBase * opacityPulse;
        
        // Scale pulse - subtle
        const scalePulse = 1 + Math.sin(time * 0.5 + randomOffset * 5) * 0.1;
        particle.scale.set(
            particle.scale.x * scalePulse,
            particle.scale.y * scalePulse,
            particle.scale.z * scalePulse
        );
        
        // Reset scale to avoid continuous growth
        setTimeout(() => {
            const baseScale = 0.5 + (i % 5) * 0.5;
            particle.scale.set(baseScale, baseScale, baseScale);
        }, 100);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls with less rotation speed
    controls.autoRotateSpeed = 0.15; // Slower rotation for more elegance
    controls.update();
    
    // Get elapsed time
    const time = clock.getElapsedTime();
    
    // Smooth mouse tracking with better easing
    targetMouseX = mouseX * 0.5; // Reduce mouse influence for subtler movement
    targetMouseY = mouseY * 0.5;
    
    // Heart beat pulse for more organic animation
    heartBeatPulse = Math.pow(Math.sin(time * 0.8) * 0.5 + 0.5, 3); // Cubic easing for more natural heartbeat
    
    // Update heart model animations
    if (characterGroup && characterGroup.userData.update) {
        characterGroup.userData.update(time);
        
        // More organic rotation with subtle wobble
        characterGroup.rotation.y += 0.0007;
        characterGroup.rotation.x = -Math.PI / 10 + Math.sin(time * 0.3) * 0.08;
        characterGroup.rotation.z = Math.sin(time * 0.2) * 0.02; // Add subtle z-axis rotation
        
        // Smoother heart following with gentler easing
        const targetX = (targetMouseX / windowHalfX) * 1.5;
        const targetY = (targetMouseY / windowHalfY) * 0.8;
        
        characterGroup.position.x += (targetX - characterGroup.position.x) * 0.01;
        characterGroup.position.y += (-targetY - characterGroup.position.y) * 0.01;
        
        // Add subtle breathing effect with non-uniform scaling for more organic feel
        const breathScaleX = 1 + heartBeatPulse * 0.06;
        const breathScaleY = 1 + heartBeatPulse * 0.08; // slightly more vertical scaling
        const breathScaleZ = 1 + heartBeatPulse * 0.04;
        characterGroup.scale.set(breathScaleX, breathScaleY, breathScaleZ);
    }
    
    // Update particles with more complexity
    updateParticles(time);
    
    // Render scene with post-processing
    composer.render();
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Smooth mouse movement
    mouseX = (event.clientX - windowHalfX) * 0.8;
    mouseY = (event.clientY - windowHalfY) * 0.8;
}

function toggleTheme(e) {
    isDarkMode = e.target.checked;
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // Adjust particle intensity for dark mode
    particles.forEach(particle => {
        particle.material.color.multiplyScalar(isDarkMode ? 1.2 : 0.8);
    });
    
    // Update heart colors based on theme
    if (characterMesh) {
        const heartColor = isDarkMode ? 0xff5dc8 : 0xff4abb;
        characterMesh.material.color.set(heartColor);
        characterMesh.material.emissive.set(new THREE.Color(heartColor).multiplyScalar(0.2));
    }
} 