// Particles.js Configuration
const particlesConfig = {
  "particles": {
    "number": {
      "value": 100,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": ["#ff45b5", "#7b5bff", "#00e2d9"]
    },
    "shape": {
      "type": ["circle", "triangle", "polygon"],
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 6
      }
    },
    "opacity": {
      "value": 0.3,
      "random": true,
      "anim": {
        "enable": true,
        "speed": 0.5,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 5,
      "random": true,
      "anim": {
        "enable": true,
        "speed": 1,
        "size_min": 0.1,
        "sync": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#7b5bff",
      "opacity": 0.2,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 1,
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": {
        "enable": true,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "bubble"
      },
      "onclick": {
        "enable": true,
        "mode": "push"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 140,
        "line_linked": {
          "opacity": 0.8
        }
      },
      "bubble": {
        "distance": 200,
        "size": 7,
        "duration": 2,
        "opacity": 0.8,
        "speed": 3
      },
      "repulse": {
        "distance": 100,
        "duration": 0.4
      },
      "push": {
        "particles_nb": 4
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true
};

// Function to initialize particles
function initParticles() {
  if (window.particlesJS) {
    window.particlesJS('particles-js', particlesConfig);
  }
}

// Function to update particles theme
function updateParticlesTheme(isLight) {
  if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
    const particles = window.pJSDom[0].pJS.particles;
    
    // Update particle colors based on theme
    particles.color.value = isLight ? 
      ["#ff3db8", "#6a5aff", "#00d1c9"] : 
      ["#ff45b5", "#7b5bff", "#00e2d9"];
    
    // Update line linked color
    particles.line_linked.color = isLight ? "#6a5aff" : "#7b5bff";
    
    // Refresh particles
    particles.array = [];
    window.pJSDom[0].pJS.fn.particlesRefresh();
  }
}

// Listen for theme changes
document.addEventListener('themeChange', function(e) {
  updateParticlesTheme(e.detail.isLight);
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initParticles); 