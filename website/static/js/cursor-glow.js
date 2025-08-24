// Cursor Glow Effect
document.addEventListener('DOMContentLoaded', function() {
  // Create canvas for cursor trail
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  document.body.appendChild(canvas);
  
  // Style the canvas
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  
  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Get context and set initial state
  const ctx = canvas.getContext('2d');
  let isDarkTheme = document.body.classList.contains('dark-theme');
  
  // Trail points array
  const points = [];
  const maxPoints = 60;
  const trailLifetime = 80;
  
  // Mouse position
  let mouseX = 0;
  let mouseY = 0;
  let mouseActive = false;
  let lastX = 0;
  let lastY = 0;
  
  // Colors
  let primaryColor = isDarkTheme ? '#ff45b5' : '#ff3db8';
  let secondaryColor = isDarkTheme ? '#7b5bff' : '#6a5aff';
  let accentColor = isDarkTheme ? '#00e2d9' : '#00d1c9';
  
  // Listen for theme changes
  const updateColors = () => {
    isDarkTheme = document.body.classList.contains('dark-theme');
    primaryColor = isDarkTheme ? '#ff45b5' : '#ff3db8';
    secondaryColor = isDarkTheme ? '#7b5bff' : '#6a5aff';
    accentColor = isDarkTheme ? '#00e2d9' : '#00d1c9';
  };
  
  // Add theme change listener
  document.addEventListener('themeChange', updateColors);
  document.getElementById('toggle-mode')?.addEventListener('click', updateColors);
  
  // Track mouse movement
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
    
    // Only add points if there's actual movement
    if (Math.abs(mouseX - lastX) > 1 || Math.abs(mouseY - lastY) > 1) {
      // Add current point to the trail
      points.push({
        x: mouseX,
        y: mouseY,
        size: Math.random() * 15 + 5,
        color: [primaryColor, secondaryColor, accentColor][Math.floor(Math.random() * 3)],
        life: trailLifetime,
        speedX: (mouseX - lastX) * 0.05,
        speedY: (mouseY - lastY) * 0.05
      });
      
      // Limit array size
      if (points.length > maxPoints) {
        points.shift();
      }
      
      lastX = mouseX;
      lastY = mouseY;
    }
  });
  
  // Handle mouse leave
  document.addEventListener('mouseleave', function() {
    mouseActive = false;
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  
  // Animation function
  function animate() {
    // Clear canvas with a transparent fill to create fade effect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw trail points
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      // Update point properties
      point.life -= 1;
      point.size -= 0.2;
      point.x += point.speedX;
      point.y += point.speedY;
      
      // Remove dead points
      if (point.life <= 0 || point.size <= 0) {
        points.splice(i, 1);
        i--;
        continue;
      }
      
      // Draw glow effect
      const opacity = point.life / trailLifetime;
      
      // Create gradient for glow
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, point.size
      );
      
      // Add color stops to gradient
      gradient.addColorStop(0, `${point.color}ff`);
      gradient.addColorStop(0.6, `${point.color}88`);
      gradient.addColorStop(1, `${point.color}00`);
      
      // Draw the glow circle
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    // Add current cursor position with bigger glow if mouse is moving
    if (mouseActive) {
      // Create cursor highlight
      const cursorGlow = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, 20
      );
      
      cursorGlow.addColorStop(0, `${primaryColor}ff`);
      cursorGlow.addColorStop(0.5, `${primaryColor}55`);
      cursorGlow.addColorStop(1, `${primaryColor}00`);
      
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
      ctx.fillStyle = cursorGlow;
      ctx.fill();
    }
    
    // Continue animation
    requestAnimationFrame(animate);
  }
  
  // Start animation
  animate();
}); 