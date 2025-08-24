import * as THREE from 'three';

// Function to create a 3D heart model
export function createHeartModel(color = 0xff4abb, scale = 1.0) {
    // Create a heart shape
    const heartShape = new THREE.Shape();
    
    // Heart shape coordinates based on a parametric equation
    const x = 0, y = 0;
    
    heartShape.moveTo(x, y + 5);
    // Left curve - make slightly fuller
    heartShape.bezierCurveTo(x - 5, y + 5, x - 10, y, x - 10, y - 5);
    heartShape.bezierCurveTo(x - 10, y - 15, x, y - 20, x, y - 20);
    // Right curve - matching the fuller left side
    heartShape.bezierCurveTo(x, y - 20, x + 10, y - 15, x + 10, y - 5);
    heartShape.bezierCurveTo(x + 10, y, x + 5, y + 5, x, y + 5);
    
    // Create extrusion settings with higher quality
    const extrudeSettings = {
        depth: 5,
        bevelEnabled: true,
        bevelSegments: 5,       // Increased for smoother edges
        bevelSize: 1.2,         // Slightly larger bevel
        bevelThickness: 1.2,    // Slightly thicker bevel
        curveSegments: 24       // Higher resolution curves
    };
    
    // Create geometry
    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    
    // Create material with enhanced physical properties
    const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.1,           // Smoother surface
        clearcoat: 1.0,           // Max clearcoat for shine
        clearcoatRoughness: 0.1,  // Smoother clearcoat
        emissive: new THREE.Color(color).multiplyScalar(0.3),  // Brighter emissive
        reflectivity: 0.8,        // More reflective
        ior: 1.8,                 // Higher index of refraction
        transmission: 0.05,       // Slight transparency
        side: THREE.DoubleSide
    });
    
    // Create mesh
    const heart = new THREE.Mesh(geometry, material);
    
    // Center the heart
    geometry.computeBoundingBox();
    const centerOffset = geometry.boundingBox.getCenter(new THREE.Vector3());
    heart.position.set(-centerOffset.x, -centerOffset.y, -centerOffset.z);
    
    // Apply scale
    heart.scale.set(scale, scale, scale);
    
    // Create a group to hold heart and possible details/effects
    const heartGroup = new THREE.Group();
    heartGroup.add(heart);
    
    // Add enhanced pulsing animation behavior with better parameters
    heartGroup.userData.pulseParams = {
        speed: 0.7,             // Slightly faster
        intensity: 0.15,        // More prominent pulse
        initialScale: scale,
        secondarySpeed: 2.5     // Secondary faster pulse
    };
    
    // Add an improved glow effect with dynamic glow
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.BackSide
    });
    
    const glowGeometry = geometry.clone();
    const glowHeart = new THREE.Mesh(glowGeometry, glowMaterial);
    glowHeart.position.copy(heart.position);
    glowHeart.scale.multiplyScalar(1.15);  // Larger glow
    heartGroup.add(glowHeart);
    
    // Add a more detailed particle system around the heart
    const particlesCount = 80;  // More particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particlesCount * 3);
    const particleSizes = new Float32Array(particlesCount);
    const particleColors = new Float32Array(particlesCount * 3);
    
    // Generate unique colors for each particle (for better visual effect)
    const heartColorRGB = new THREE.Color(color);
    const secondaryColor = new THREE.Color(0x7b5bff); // Purple secondary color
    const accentColor = new THREE.Color(0x00d8c5);    // Teal accent color
    
    for (let i = 0; i < particlesCount; i++) {
        // Position particles in more of a heart shape distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 15 + Math.random() * 15;  // More spread out
        
        particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 5 * Math.random() - 2.5;
        particlePositions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Vary particle sizes for more interest
        particleSizes[i] = 0.2 + Math.random() * 0.8;
        
        // Vary particle colors between our palette
        let particleColor;
        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
            particleColor = heartColorRGB;  // Main color is more common
        } else if (colorChoice < 0.9) {
            particleColor = secondaryColor;
        } else {
            particleColor = accentColor;
        }
        
        particleColors[i * 3] = particleColor.r;
        particleColors[i * 3 + 1] = particleColor.g;
        particleColors[i * 3 + 2] = particleColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.7,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    heartGroup.add(particles);
    
    // Update function for improved animation
    heartGroup.userData.update = function(time) {
        const params = this.userData.pulseParams;
        
        // Create more complex heartbeat animation
        // Main slow pulse
        const mainPulse = Math.sin(time * params.speed);
        // Faster secondary pulse for systolic effect
        const secondaryPulse = Math.sin(time * params.secondarySpeed + 0.4) * 0.25;
        // Short, sharp tertiary pulse for heart 'kick'
        const tertiaryPulse = Math.pow(Math.sin(time * params.secondarySpeed * 1.5), 6) * 0.1;
        
        // Combine all three for realistic heartbeat
        const combinedPulse = mainPulse * 0.6 + secondaryPulse + tertiaryPulse;
        
        // Apply non-uniform scaling for more organic feel
        const pulseFactor = 1 + combinedPulse * params.intensity;
        const verticalEmphasis = 1.08; // Slightly taller when expanded
        
        // Apply pulse to main heart with more natural non-uniform scaling
        heart.scale.set(
            params.initialScale * pulseFactor,
            params.initialScale * pulseFactor * verticalEmphasis,
            params.initialScale * pulseFactor * 0.95 // Slightly less depth expansion
        );
        
        // Apply more exaggerated pulse to glow with different timing
        const glowPulseFactor = 1 + combinedPulse * (params.intensity * 1.8);
        const glowDelay = Math.sin(time * params.speed - 0.2); // Slightly delayed glow effect
        
        glowHeart.scale.set(
            params.initialScale * glowPulseFactor * 1.15,
            params.initialScale * glowPulseFactor * 1.25,
            params.initialScale * glowPulseFactor * 1.15
        );
        
        // Vary glow opacity with pulse for more dramatic effect
        glowHeart.material.opacity = 0.4 + combinedPulse * 0.3 + glowDelay * 0.1;
        
        // Shift heart color dynamically based on pulse intensity
        const hue = ((time * 0.05) % 1) * 0.1 + 0.9; // Subtle hue shift in pink/purple range
        const saturation = 0.7 + combinedPulse * 0.1; // Saturation increases with pulse
        const lightness = 0.6 + combinedPulse * 0.1; // Brightness increases with pulse
        
        const pulseColor = new THREE.Color().setHSL(hue, saturation, lightness);
        glowHeart.material.color.set(pulseColor);
        
        // Add subtle color shift to main heart as well
        const mainHeart = new THREE.Color(heart.material.color);
        mainHeart.lerp(pulseColor, 0.05); // Very subtle shift
        heart.material.emissive.set(mainHeart).multiplyScalar(0.2 + combinedPulse * 0.1);
        
        // Rotate particles with varying speeds and directions
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0003;
        
        // Animate particles with more complex motion
        const positions = particlesGeometry.attributes.position.array;
        const sizes = particlesGeometry.attributes.size.array;
        
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            // Calculate spherical coordinates for this particle
            const distance = Math.sqrt(x * x + y * y + z * z);
            const normalizedX = x / distance;
            const normalizedY = y / distance;
            const normalizedZ = z / distance;
            
            // Create different breathing patterns for different particles
            const timeOffset = i * 0.2;
            const particleType = i % 3; // Create 3 types of particles with different behaviors
            
            let breatheFactor;
            if (particleType === 0) {
                // Type 1: Regular breathing
                breatheFactor = Math.sin(time * 0.5 + timeOffset);
            } else if (particleType === 1) {
                // Type 2: Quicker, sharper breaths
                breatheFactor = Math.pow(Math.sin(time * 0.8 + timeOffset), 3);
            } else {
                // Type 3: Slower, gentler breaths
                breatheFactor = Math.sin(time * 0.3 + timeOffset) * 0.8;
            }
            
            // Particles move in and out from center with varied intensities
            const baseDistance = 15 + i % 5; // Varied base distances
            const breatheIntensity = 8 + (i % 5); // Varied intensities
            const newDistance = baseDistance + breatheFactor * breatheIntensity;
            
            // Add slight spiral motion to some particles
            const spiralFactor = (particleType === 2) ? Math.sin(time * 0.2) * 2 : 0;
            const spiralAngle = time * 0.1 + i * 0.01;
            
            // Apply new position with spiral motion
            positions[i3] = normalizedX * newDistance + Math.sin(spiralAngle) * spiralFactor;
            positions[i3 + 1] = normalizedY * newDistance + Math.cos(spiralAngle) * spiralFactor;
            positions[i3 + 2] = normalizedZ * newDistance;
            
            // Pulse particle sizes with varied intensities
            const sizePulse = 0.5 + 0.5 * Math.sin(time + i * 0.3);
            const baseSize = 0.2 + (i % 5) * 0.15 / 5; // Varied base sizes
            sizes[i] = baseSize + sizePulse * 0.6;
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.size.needsUpdate = true;
    };
    
    return heartGroup;
} 