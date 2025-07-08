// ==========================================
// General Site Script
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("SpaceWatch Frontend Initialized");

    // --- Navigation Active State ---
    // Simple logic to highlight the current page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sticky-nav ul li a');

    navLinks.forEach(link => {
        // Normalize href to match currentPage format (e.g., remove leading '/')
        const linkHref = (link.getAttribute('href') || '').replace(/^\//, '');
        if (linkHref === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active'); // Ensure only one is active
        }
    });

    // --- Placeholder for Future Interactivity ---

    // Example: Smooth scrolling for internal links (if any)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Example: Handle Contact Form Submission (Placeholder)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Contact form submitted (placeholder)');
            // Add actual form submission logic here (e.g., using fetch API)
            // Using a simple non-blocking message box instead of alert()
            displayMessageBox('Message sent (placeholder)!');
            contactForm.reset();
        });
    }

    // Example: Handle API Request Form Submission (Placeholder)
     const apiRequestForm = document.getElementById('api-request-form');
    if (apiRequestForm) {
        apiRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('API request form submitted (placeholder)');
            // Add actual API request logic here
            displayMessageBox('API Access Requested (placeholder)!');
            apiRequestForm.reset();
        });
    }

    // --- Simple Message Box Function ---
    function displayMessageBox(message) {
        // Remove existing message box if any
        const existingBox = document.getElementById('simple-message-box');
        if (existingBox) {
            existingBox.remove();
        }

        // Create message box elements
        const messageBox = document.createElement('div');
        messageBox.id = 'simple-message-box';
        messageBox.style.position = 'fixed';
        messageBox.style.top = '20px';
        messageBox.style.left = '50%';
        messageBox.style.transform = 'translateX(-50%)';
        messageBox.style.padding = '15px 25px';
        messageBox.style.backgroundColor = 'rgba(0, 123, 255, 0.9)'; // Use primary color
        messageBox.style.color = 'white';
        messageBox.style.borderRadius = '8px';
        messageBox.style.zIndex = '2000';
        messageBox.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        messageBox.style.fontSize = '1rem';
        messageBox.textContent = message;

        // Append to body
        document.body.appendChild(messageBox);

        // Auto-remove after a few seconds
        setTimeout(() => {
            messageBox.style.transition = 'opacity 0.5s ease';
            messageBox.style.opacity = '0';
            setTimeout(() => messageBox.remove(), 500);
        }, 3000); // Display for 3 seconds
    }

    // ================================================
    // Orbit Visualization Script (Conditional Load)
    // ================================================
    // Check if we are on the orbit visualization page by looking for a specific element ID
    if (document.getElementById('orbit-visualization-page')) {
        console.log("Initializing Orbit Visualization Script...");
        initializeOrbitVisualization();
    }

});


// ================================================
// Orbit Visualization Script Function
// ================================================
// ================================================
// Orbit Visualization Script Function
// ================================================
function initializeOrbitVisualization() {

    // Check if required libraries are loaded
    if (typeof THREE === 'undefined' || typeof satellite === 'undefined') {
        console.error("Three.js or Satellite.js library not loaded. Visualization cannot start.");
        // Optionally display an error message to the user
        const container = document.getElementById('canvas-container');
        if (container) {
            container.innerHTML = '<p style="color: red; text-align: center; padding-top: 50px;">Error: Required 3D libraries failed to load. Cannot display visualization.</p>';
        }
        // Hide loading screen if it exists
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        return;
    }

    // Satellite database with sample TLE data and visualization properties
    const satelliteDatabase = {
        "ISS": {
            name: "ISS (ZARYA)",
            tle1: '1 25544U 98067A   21275.53605787  .00000912  00000-0  24110-4 0  9992', // Note: TLE data is static example
            tle2: '2 25544  51.6434 208.9163 0002766 108.2533 251.9169 15.48907855290874',
            color: 0xcccccc, // Main body color (e.g., silver/gray)
            panelColor: 0x003366, // Solar panel color (dark blue)
            size: 0.03 // Base size factor for the model
        },
        "HST": {
            name: "Hubble Space Telescope",
            tle1: '1 20580U 90037B   21275.53240765  .00000696  00000-0  25300-4 0  9991', // Note: TLE data is static example
            tle2: '2 20580  28.4699 288.0972 0002835 319.0821 149.0318 15.09265408328952',
            color: 0xb0b0b0,
            panelColor: 0x555577,
            size: 0.04
        },
        "GPS": {
            name: "GPS IIF-12 (USA 248)",
            tle1: '1 40730U 15036A   21275.53333333  .00000000  00000-0  00000-0 0  9998', // Note: TLE data is static example
            tle2: '2 40730  55.0403  62.0118 0191006 258.9336  97.5336  2.00557480 12345',
            color: 0xd4af37, // Gold-ish color
            panelColor: 0x222244,
            size: 0.03
        },
        "STARLINK": {
            name: "Starlink-1234",
            tle1: '1 44238U 19029E   21275.53333333  .00001234  00000-0  12345-3 0  9997', // Note: TLE data is static example
            tle2: '2 44238  53.0000 280.0000 0001234 100.0000 260.0000 15.12345678901234',
            color: 0xffffff, // White/silver
            panelColor: 0x111133,
            size: 0.03 // Starlinks are small
        }
        // --- Add more satellites here ---
        // Example:
        // "GenericSat": {
        //     name: "Generic Communications Sat",
        //     tle1: '...',
        //     tle2: '...',
        //     color: 0xeeeeee,
        //     panelColor: 0x0055aa,
        //     size: 0.005
        // }
    };

    // Initialize Three.js scene variables
    let scene, camera, renderer, controls;
    let satelliteMesh, debrisGroup, earthMesh;
    let raycaster, mouse;
    let showDebris = true;
    let showLabels = false;
    let hoveredObject = null;
    let lastUpdateTime = new Date();
    let currentSatellite = "ISS"; // Default satellite
    const earthRadiusKm = 6371; // Approx Earth radius
    const scaleFactor = 1 / earthRadiusKm; // Scale factor for Three.js units (1 unit = Earth radius)
    const minDistanceFromEarthSurface = 1000; // Minimum distance from surface in km for visualization placement
    const minDistanceScaled = 1 + (minDistanceFromEarthSurface * scaleFactor); // Min distance in Three.js units
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let infoPanelVisible = !isMobile; // Panel visible by default on desktop, hidden on mobile
    let lastPosition = new THREE.Vector3(); // For velocity calculation
    let velocityVector = new THREE.Vector3(); // For satellite orientation
    let lastUpdateTimestamp = 0; // For delta time calculation
    let animationFrameId; // To store the requestAnimationFrame ID

    // DOM Elements
    const canvasContainer = document.getElementById('canvas-container');
    const infoPanel = document.getElementById('info-panel');
    const loadingScreen = document.getElementById('loading-screen');
    const toggleInfoButton = document.getElementById('toggle-info');
    const satelliteSelect = document.getElementById('satellite-select');
    const toggleDebrisButton = document.getElementById('toggle-debris');
    const toggleLabelsButton = document.getElementById('toggle-labels');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetViewButton = document.getElementById('reset-view');
    const tooltipElement = document.getElementById('tooltip');
    const satelliteLabelElement = document.getElementById('satellite-label');
    const satNameElement = document.getElementById('sat-name');
    const satPositionElement = document.getElementById('sat-position');
    const satAltitudeElement = document.getElementById('sat-altitude');
    const satVelocityElement = document.getElementById('sat-velocity');
    const lastUpdateElement = document.getElementById('last-update');

    // Start initialization
    initVisualization();

    async function initVisualization() {
        // Ensure container exists
        if (!canvasContainer) {
            console.error("Canvas container #canvas-container not found.");
            return;
        }

        // Set up loading screen
        updateLoadingProgress(10, "Initializing 3D scene...");

        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Keep black background

        // Create camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 100); // Adjust near plane for closer objects
        camera.position.set(0, 0, isMobile ? 3.5 : 2.5); // Closer initial view

        // Create renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: isMobile ? "low-power" : "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Enable physically correct lighting
        renderer.physicallyCorrectLights = true; // Use physically correct lighting model
        renderer.outputEncoding = THREE.sRGBEncoding; // Use sRGB for color accuracy
        canvasContainer.appendChild(renderer.domElement);

        // Add orbit controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.minDistance = 1.05; // Prevent zooming inside Earth slightly more
            controls.maxDistance = 25; // Increase max zoom out slightly
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.15; // Slightly slower rotation
            controls.enablePan = !isMobile; // Disable panning on mobile
            // ============================ //
            // FIRST UPDATE: Enable zoom on mobile
            controls.enableZoom = true;
            // ============================ //
            controls.target.set(0, 0, 0); // Ensure controls target the center
        } else {
            console.warn("OrbitControls not loaded. Camera interaction will be limited.");
        }


        // Add lights (Adjusted for better model visibility)
        scene.add(new THREE.AmbientLight(0x505050)); // Slightly brighter ambient light

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); // More intense directional light
        dirLight.position.set(5, 5, 5); // Adjust position for better angles
        dirLight.castShadow = false; // Shadows can be expensive, disable for now
        scene.add(dirLight);

        // Add a secondary light from another angle
        const dirLight2 = new THREE.DirectionalLight(0xaaaaaa, 0.5);
        dirLight2.position.set(-5, -3, -5);
        scene.add(dirLight2);

        updateLoadingProgress(20, "Creating Earth model...");

        // Create Earth
        try {
            await createEarth();
        } catch (error) {
            console.error("Failed to create Earth:", error);
            updateLoadingProgress(100, "Error loading Earth model.");
            // Display error message in canvas container
             canvasContainer.innerHTML = '<p style="color: red; text-align: center; padding-top: 50px;">Error: Failed to load Earth model. Cannot display visualization.</p>';
             if (loadingScreen) loadingScreen.style.display = 'none'; // Hide loading screen on error
            return; // Stop initialization if Earth fails
        }


        updateLoadingProgress(40, "Setting up satellite tracking...");

        // Create satellite and debris
        createSatellite(); // Create initial satellite mesh
        createDebris(); // Create debris group

        updateLoadingProgress(60, "Finalizing setup...");

        // Set up raycaster for interaction
        raycaster = new THREE.Raycaster();
        // Increase raycaster precision for small objects if needed
        raycaster.params.Points.threshold = 0.01;
        raycaster.params.Line.threshold = 0.01;
        mouse = new THREE.Vector2();

        // Add event listeners
        window.addEventListener('resize', onWindowResize);

        // Interaction listeners (desktop vs mobile)
        if (isMobile) {
            renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
            renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
            renderer.domElement.addEventListener('touchend', onTouchEnd);
        } else {
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('click', onClick);
        }

        // UI event listeners (check if elements exist first)
        if (toggleDebrisButton) toggleDebrisButton.addEventListener('click', toggleDebris);
        if (toggleLabelsButton) toggleLabelsButton.addEventListener('click', toggleLabels);
        if (satelliteSelect) satelliteSelect.addEventListener('change', changeSatellite);

        // ==================================================== //
        // SECOND UPDATE: Modified Zoom Button Listeners
        if (zoomInButton) zoomInButton.addEventListener('click', () => {
            if (controls) { // Check if controls exist
                controls.dollyIn(1.2);
                controls.update(); // Explicitly update controls after zooming in
            }
        });
        if (zoomOutButton) zoomOutButton.addEventListener('click', () => {
            if (controls) { // Check if controls exist
                controls.dollyOut(1.2);
                controls.update(); // Explicitly update controls after zooming out
            }
        });
        // ==================================================== //

        if (resetViewButton) resetViewButton.addEventListener('click', resetCameraView);
        if (toggleInfoButton) toggleInfoButton.addEventListener('click', toggleInfoPanel);

        // Create stars background
        createStars();

        // Initial update of objects and UI
        updateObjects();
        updateInfoPanelVisibility(); // Set initial visibility

        // Start animation loop
        animate();

        // Set interval for updating satellite positions and UI
        setInterval(() => {
            updateObjects();
            lastUpdateTime = new Date();
            if (lastUpdateElement) {
                lastUpdateElement.textContent = lastUpdateTime.toLocaleTimeString();
            }
        }, 1000); // Update every second

        // Hide loading screen
        updateLoadingProgress(100, "Loading complete.");
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500); // Wait for fade out
            }
        }, 500); // Short delay before hiding
    }

    async function createEarth() {
        const segments = isMobile ? 48 : 96; // Increase segments for smoother Earth
        const earthGeometry = new THREE.SphereGeometry(1, segments, segments); // Earth radius is 1 unit

        // Load textures with error handling
        const textureLoader = new THREE.TextureLoader();
        const loadTexture = async (url, fallbackColor) => {
            try {
                const texture = await textureLoader.loadAsync(url);
                texture.encoding = THREE.sRGBEncoding; // Ensure correct color space
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improve texture filtering
                return texture;
            } catch (error) {
                console.warn(`Failed to load texture: ${url}. Using fallback color.`);
                return new THREE.MeshPhongMaterial({ color: fallbackColor }); // Return a material as fallback
            }
        };

        const textureUrl = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
        const specularUrl = 'https://threejs.org/examples/textures/planets/earth_specular_map.tif'; // Often problematic, use fallback
        const normalUrl = 'https://threejs.org/examples/textures/planets/earth_normal_map.tif'; // Also often problematic
        const bumpUrl = 'https://threejs.org/examples/textures/planets/earth_topology_512.jpg'; // Bump map for surface detail

        const earthTexture = await loadTexture(textureUrl, 0x2255ff);
        const specularMap = await loadTexture(specularUrl, null); // Fallback is no specular map
        const normalMap = await loadTexture(normalUrl, null); // Fallback is no normal map
        const bumpMap = await loadTexture(bumpUrl, null); // Fallback is no bump map

        updateLoadingProgress(30, "Applying Earth textures...");

        // Use MeshStandardMaterial for more realistic lighting
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: earthTexture instanceof THREE.Texture ? earthTexture : null,
            color: earthTexture instanceof THREE.Material ? earthTexture.color : 0xffffff, // Use fallback color if texture failed
            metalness: 0.1, // Earth is not very metallic
            roughness: 0.8, // Earth surface is quite rough
            normalMap: normalMap instanceof THREE.Texture ? normalMap : null,
            normalScale: new THREE.Vector2(0.5, 0.5), // Adjust normal map intensity
            bumpMap: bumpMap instanceof THREE.Texture ? bumpMap : null,
            bumpScale: 0.01, // Subtle bump effect
            // specularMap: specularMap instanceof THREE.Texture ? specularMap : null, // Often less realistic with PBR
            // specular: new THREE.Color('grey'), // Less important with PBR metalness/roughness
        });
         // If texture failed, set the color directly
        if (earthTexture instanceof THREE.Material) {
             earthMaterial.color.set(earthTexture.color);
        }


        earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        earthMesh.userData = { type: 'earth' }; // Add identifier
        earthMesh.rotation.y = Math.PI; // Start with a different view of Earth
        scene.add(earthMesh);

        // Improved atmosphere effect using shaders
        const atmosphereGeometry = new THREE.SphereGeometry(1.03, segments, segments); // Slightly larger radius
        const atmosphereMaterial = new THREE.ShaderMaterial({
             vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition; // Pass vertex position
                void main() {
                    vNormal = normalize( normalMatrix * normal );
                    vPosition = vec3(modelMatrix * vec4( position, 1.0 )); // World position
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition; // Receive world position

                uniform vec3 uSunDirection; // Pass sun direction for lighting effect

                void main() {
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float intensity = pow( 0.6 - dot( vNormal, viewDirection ), 4.0 ); // Rim lighting based on view
                    intensity = clamp(intensity, 0.0, 1.0);

                    // Add a subtle sun glow effect
                    // float sunDot = dot(normalize(vPosition), uSunDirection); // Simplified sun effect
                    // float sunGlow = smoothstep(0.95, 1.0, sunDot) * 0.3;

                    // Atmospheric scattering color (blueish)
                    vec3 atmosphereColor = vec3( 0.3, 0.6, 1.0 );

                    // Combine effects
                    gl_FragColor = vec4( atmosphereColor, intensity * 0.8 ); // Adjust alpha multiplier (0.8)
                    // gl_FragColor.rgb += atmosphereColor * sunGlow; // Add sun glow
                }
            `,
            uniforms: {
                 // uSunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() } // Pass light direction later if needed
            },
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false // Don't write to depth buffer
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
    }

    function createSatellite() {
        // --- Remove old satellite ---
        if (satelliteMesh) {
            scene.remove(satelliteMesh);
            // Dispose geometries and materials of the old mesh
            satelliteMesh.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        // Dispose textures if they exist
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                        // ... dispose other maps ...
                        child.material.dispose();
                    }
                }
            });
        }

        const satData = satelliteDatabase[currentSatellite];
        if (!satData) {
            console.error("Satellite data not found for:", currentSatellite);
            return;
        }

        // --- Create New Satellite Model (Programmatic) ---
        const satelliteGroup = new THREE.Group();
        const baseSize = satData.size; // Use size from database

        // --- Materials ---
        // Use MeshStandardMaterial for realistic lighting
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: satData.color,
            metalness: 0.8, // Satellites are often metallic
            roughness: 0.4, // Moderately reflective
        });

        const panelMaterial = new THREE.MeshStandardMaterial({
            color: satData.panelColor,
            metalness: 0.2,
            roughness: 0.8, // Solar panels are often less glossy
            // Optional: Add a subtle emissive property if needed
            // emissive: satData.panelColor,
            // emissiveIntensity: 0.1
        });

        // --- Components ---
        // Main Body (e.g., a box)
        const bodyWidth = baseSize;
        const bodyHeight = baseSize * 0.8;
        const bodyDepth = baseSize * 0.8;
        const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        satelliteGroup.add(bodyMesh);

        // Solar Panels (e.g., two planes) - adjust dimensions as needed
        const panelWidth = baseSize * 3; // Wider panels
        const panelHeight = baseSize * 1.5; // Taller panels
        const panelDepth = baseSize * 0.05; // Very thin
        const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);

        // Left Panel
        const leftPanelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanelMesh.position.set(-(bodyWidth / 2 + panelWidth / 2), 0, 0); // Position relative to body center
        satelliteGroup.add(leftPanelMesh);

        // Right Panel
        const rightPanelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanelMesh.position.set(bodyWidth / 2 + panelWidth / 2, 0, 0); // Position relative to body center
        satelliteGroup.add(rightPanelMesh);

        // Optional: Antenna (e.g., a cylinder or cone)
        const antennaRadius = baseSize * 0.1;
        const antennaHeight = baseSize * 0.5;
        const antennaGeometry = new THREE.CylinderGeometry(0, antennaRadius, antennaHeight, 8); // Cone shape
        const antennaMesh = new THREE.Mesh(antennaGeometry, bodyMaterial); // Use body material
        antennaMesh.position.set(0, bodyHeight / 2, 0); // Position on top of the body
        antennaMesh.rotation.x = Math.PI; // Point it upwards (relative to body)
        satelliteGroup.add(antennaMesh);


        // --- Assign to global variable and add to scene ---
        satelliteMesh = satelliteGroup;
        satelliteMesh.userData = { type: 'satellite', name: satData.name };
        // Rotate slightly for better initial view (optional)
        // satelliteMesh.rotation.y = Math.PI / 4;
        // satelliteMesh.rotation.x = Math.PI / 16;
        scene.add(satelliteMesh);

        // Update satellite name in UI
        if (satNameElement) satNameElement.textContent = satData.name;
    }

    function createDebris() {
        // Remove old debris group if exists
        if (debrisGroup) {
            scene.remove(debrisGroup);
             debrisGroup.traverse(child => { // Dispose geometry/material
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }

        debrisGroup = new THREE.Group();
        debrisGroup.userData = { type: 'debris_group' };
        debrisGroup.visible = showDebris; // Set initial visibility
        scene.add(debrisGroup);

        // Generate mock debris (fewer for mobile)
        generateMockDebris(isMobile ? 100 : 250); // Increased count slightly
    }

    function generateMockDebris(count) {
        // Increase the base size of the debris geometry
        const debrisGeometry = new THREE.DodecahedronGeometry(0.015, 0); // Increased from 0.0035

        // Material for debris - less reflective than satellites
        const debrisMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888, // Darker gray
            metalness: 0.6, // Somewhat metallic
            roughness: 0.7, // Quite rough
        });

        const instancedDebris = new THREE.InstancedMesh(debrisGeometry, debrisMaterial, count);
        const dummy = new THREE.Object3D(); // Dummy object for transformations

        for (let i = 0; i < count; i++) {
            // Random position around Earth (adjust range for desired distribution)
            const distance = 1.1 + Math.random() * 3.0; // Spread out further (1.1 to 4.1 Earth radii)
            const theta = Math.random() * Math.PI * 2; // Angle around Z axis
            const phi = Math.acos(2 * Math.random() - 1); // Angle from Z axis

            dummy.position.set(
                distance * Math.sin(phi) * Math.cos(theta),
                distance * Math.sin(phi) * Math.sin(theta),
                distance * Math.cos(phi)
            );

            // Random rotation
            dummy.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Random scale variation (optional, but adds realism)
            const scale = 0.8 + Math.random() * 0.3; // Scale between 80% and 160%
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            instancedDebris.setMatrixAt(i, dummy.matrix);
        }

        instancedDebris.userData = { type: 'debris' }; // Mark the instanced mesh
        instancedDebris.instanceMatrix.needsUpdate = true; // Important!
        debrisGroup.add(instancedDebris);
    }

    function updateObjects() {
        const satData = satelliteDatabase[currentSatellite];
        if (!satData || !satelliteMesh) return; // Exit if data or mesh is missing

        // Parse TLE data
        let satrec;
        try {
            satrec = satellite.twoline2satrec(satData.tle1, satData.tle2);
        } catch (e) {
            console.error("Error parsing TLE data for", satData.name, e);
            if (satPositionElement) satPositionElement.textContent = "TLE Error";
            if (satAltitudeElement) satAltitudeElement.textContent = "-";
            if (satVelocityElement) satVelocityElement.textContent = "-";
            if (satelliteMesh) satelliteMesh.visible = false; // Hide if TLE is bad
            return;
        }

        // Get current time
        const now = new Date();

        // Calculate position and velocity in ECI (Earth-Centered Inertial) frame
        let positionAndVelocity;
         try {
            positionAndVelocity = satellite.propagate(satrec, now);
         } catch (e) {
             // Handle propagation errors (e.g., decayed satellite)
             console.warn("Propagation error for", satData.name, e.message);
             if (e.message.includes("decayed")) {
                 if (satPositionElement) satPositionElement.textContent = "Decayed";
             } else {
                 if (satPositionElement) satPositionElement.textContent = "Prop Error";
             }
             if (satAltitudeElement) satAltitudeElement.textContent = "-";
             if (satVelocityElement) satVelocityElement.textContent = "-";
             // Optionally hide or remove the satellite mesh
             if (satelliteMesh) satelliteMesh.visible = false;
             return;
         }

        // Ensure the satellite mesh is visible if it was previously hidden due to error
        if (satelliteMesh) satelliteMesh.visible = true;

        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;

        if (positionEci && velocityEci) {
            // Calculate position in Three.js coordinates (scaled ECI)
            // ECI X -> Three.js X
            // ECI Y -> Three.js Z (Negative) - Corrected for Right-Handed System
            // ECI Z -> Three.js Y
            const currentPosition = new THREE.Vector3(
                positionEci.x * scaleFactor,
                positionEci.z * scaleFactor, // ECI Z maps to Three Y
                -positionEci.y * scaleFactor // ECI Y maps to negative Three Z
            );

             // --- Velocity and Orientation ---
            const currentTimestamp = Date.now();
            const timeDelta = (currentTimestamp - lastUpdateTimestamp) / 1000.0; // Delta in seconds
            lastUpdateTimestamp = currentTimestamp;

            if (lastPosition.length() > 0 && timeDelta > 0.01) { // Avoid division by zero or tiny delta
                 // Calculate displacement vector
                const displacement = currentPosition.clone().sub(lastPosition);
                velocityVector = displacement.divideScalar(timeDelta); // Velocity in Three.js space units per second

                // Orient satellite to roughly face direction of movement
                if (velocityVector.lengthSq() > 0.000001) { // Check if velocity is significant enough to orient
                    const lookAtTarget = currentPosition.clone().add(velocityVector.normalize()); // Look slightly ahead
                    // Preserve the satellite's "up" direction (relative Y-axis) as much as possible
                    // This prevents unrealistic rolling. We assume satellite's local Y is its 'up'.
                    const currentUp = satelliteMesh.up.clone().applyQuaternion(satelliteMesh.quaternion); // Get current world up
                    satelliteMesh.lookAt(lookAtTarget);
                    // Optional: Re-apply a constraint to keep solar panels roughly level with orbit plane if needed (more complex)
                 }
            }
            lastPosition.copy(currentPosition); // Store current position for next frame

            // --- Update Satellite Position ---
            // Ensure the satellite is drawn outside the Earth model visually
            const distanceFromCenter = currentPosition.length();
            if (distanceFromCenter < minDistanceScaled) {
                currentPosition.setLength(minDistanceScaled); // Push it out slightly
            }
            satelliteMesh.position.copy(currentPosition);


            // --- Update UI Stats ---
            const distanceKm = Math.sqrt(positionEci.x**2 + positionEci.y**2 + positionEci.z**2);
            const altitude = distanceKm - earthRadiusKm;
            const velocityKmS = Math.sqrt(velocityEci.x**2 + velocityEci.y**2 + velocityEci.z**2);

            if (satPositionElement) satPositionElement.textContent =
                `${positionEci.x.toFixed(0)}, ${positionEci.y.toFixed(0)}, ${positionEci.z.toFixed(0)} km (ECI)`;
            if (satAltitudeElement) satAltitudeElement.textContent = `${altitude.toFixed(0)} km`;
            if (satVelocityElement) satVelocityElement.textContent = `${velocityKmS.toFixed(2)} km/s`;

            // Update satellite label position if visible
            if (showLabels) updateSatelliteLabel();
        } else {
             // Handle case where propagation returns invalid data
             console.warn("Invalid position/velocity returned for", satData.name);
             if (satPositionElement) satPositionElement.textContent = "Invalid Data";
             if (satAltitudeElement) satAltitudeElement.textContent = "-";
             if (satVelocityElement) satVelocityElement.textContent = "-";
             if (satelliteMesh) satelliteMesh.visible = false; // Hide mesh if data is bad
        }
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate); // Store the ID

        // Rotate Earth slowly for visual effect
        if (earthMesh) earthMesh.rotation.y += 0.0003; // Slower rotation

        // Update controls (if they exist)
        controls?.update();

        // Render scene
        renderer.render(scene, camera);
    }

    function updateSatelliteLabel() {
        if (!satelliteLabelElement || !satelliteMesh || !camera) return;

        const satData = satelliteDatabase[currentSatellite];
        if (!satData) return;

        // Calculate label position based on the group's world position
        const labelPosition = new THREE.Vector3();
        satelliteMesh.getWorldPosition(labelPosition); // Get world position of the group

        // Convert 3D position to 2D screen coordinates
        const vector = labelPosition.clone().project(camera);

        // Check if the satellite is behind the camera or too far left/right/top/bottom
        if (vector.z > 1 || vector.x < -1.1 || vector.x > 1.1 || vector.y < -1.1 || vector.y > 1.1) {
            satelliteLabelElement.style.display = 'none';
            return;
        }

        // Calculate position in CSS pixels
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

        // Update label position and text
        satelliteLabelElement.textContent = satData.name;
        satelliteLabelElement.style.left = `${x}px`;
        satelliteLabelElement.style.top = `${y}px`; // Adjust vertical offset if needed
        satelliteLabelElement.style.display = 'block'; // Make sure it's visible
    }

    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- Interaction Handlers ---

    function handleRaycast(clientX, clientY) {
        if (!raycaster || !mouse || !camera || !scene || !tooltipElement) return;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);

        // Find intersected objects (check satellite and debris group)
        const objectsToCheck = [];
        if (satelliteMesh) objectsToCheck.push(satelliteMesh); // Check satellite group
        if (debrisGroup) objectsToCheck.push(debrisGroup);   // Check debris group (contains InstancedMesh)

        const intersects = raycaster.intersectObjects(objectsToCheck, true); // Recursive check

        let intersectedDebris = null;
        let intersectedSatellite = null;

        if (intersects.length > 0) {
            // Find the closest intersection
            const closestIntersect = intersects[0];
            let targetObject = closestIntersect.object;

            // Traverse up to find the main group (satellite) or the InstancedMesh (debris)
            while (targetObject.parent && !targetObject.userData.type) {
                 // Special check for InstancedMesh parent which is the debrisGroup
                 if (targetObject.parent === debrisGroup && targetObject instanceof THREE.InstancedMesh) {
                     targetObject = targetObject; // Found the InstancedMesh
                     break;
                 }
                 // Check if parent is the satellite group
                 if (targetObject.parent === satelliteMesh) {
                     targetObject = satelliteMesh; // Found the satellite group
                     break;
                 }
                 targetObject = targetObject.parent; // Keep traversing up
            }
             // Final check if the loop finished on the group itself
             if (targetObject === satelliteMesh) {
                 intersectedSatellite = targetObject;
             } else if (targetObject instanceof THREE.InstancedMesh && targetObject.userData.type === 'debris') {
                 intersectedDebris = { object: targetObject, instanceId: closestIntersect.instanceId };
             }

        }


        // --- Tooltip Logic ---
        let currentHoverTarget = null; // Track the specific object being hovered (group or instance)

        if (intersectedSatellite) {
            currentHoverTarget = intersectedSatellite; // Hovering over the satellite group
        } else if (intersectedDebris) {
            currentHoverTarget = `debris-${intersectedDebris.instanceId}`; // Unique ID for debris instance hover
        }

        if (currentHoverTarget) {
            let tooltipText = "Unknown Object";
            if (intersectedSatellite) {
                tooltipText = intersectedSatellite.userData.name || "Satellite";
            } else if (intersectedDebris) {
                 tooltipText = `Space Debris #${intersectedDebris.instanceId}`; // Give instance ID
            }

            if (hoveredObject !== currentHoverTarget) { // Show tooltip only if it's a new object/instance
                hoveredObject = currentHoverTarget;
                tooltipElement.textContent = tooltipText;
                tooltipElement.style.left = `${clientX + 10}px`; // Offset slightly from cursor
                tooltipElement.style.top = `${clientY - 15}px`; // Position above cursor
                tooltipElement.style.opacity = '1';
                tooltipElement.style.visibility = 'visible'; // Ensure visibility

                 // Optional: Add visual feedback (e.g., highlight)
                 // highlightObject(intersectedSatellite || intersectedDebris?.object, intersectedDebris?.instanceId);
            }
        } else {
            // Hide tooltip if no intersection or hovering over something else
            if (hoveredObject) {
                tooltipElement.style.opacity = '0';
                tooltipElement.style.visibility = 'hidden'; // Hide completely
                hoveredObject = null;
                 // Optional: Remove visual feedback
                 // unhighlightObject();
            }
        }

        return { intersectedSatellite, intersectedDebris }; // Return what was hit
    }

    function onMouseMove(event) {
        handleRaycast(event.clientX, event.clientY);
    }

    function onClick(event) {
        const { intersectedSatellite, intersectedDebris } = handleRaycast(event.clientX, event.clientY);

        if (intersectedSatellite) {
            console.log("Clicked on Satellite:", intersectedSatellite.userData.name);
            // Future: Add actions like focusing camera on satellite
            // focusOnObject(intersectedSatellite);
        } else if (intersectedDebris) {
            console.log("Clicked on Debris (Instance ID: " + intersectedDebris.instanceId + ")");
             // Future: Show more info about this specific debris piece
        }
    }

    // Touch event handlers for mobile
    let touchStartX, touchStartY, touchStartTime;
    let isDragging = false;
    let lastTapTime = 0;
    let touchMoveThreshold = 10 * window.devicePixelRatio; // Adjust threshold based on device pixel ratio

    function onTouchStart(event) {
        // Handle single touch for tap/drag detection
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isDragging = false;
            // Don't prevent default immediately, allow potential scroll/zoom start
        }
        // Allow default multi-touch handling by OrbitControls (pinch-zoom)
    }

    function onTouchMove(event) {
        if (event.touches.length === 1 && !isDragging) {
            const touch = event.touches[0];
            const dx = Math.abs(touch.clientX - touchStartX);
            const dy = Math.abs(touch.clientY - touchStartY);
            // Check if movement exceeds threshold
            if (dx > touchMoveThreshold || dy > touchMoveThreshold) {
                isDragging = true;
                // Hide tooltip immediately when dragging starts
                if (tooltipElement) {
                     tooltipElement.style.opacity = '0';
                     tooltipElement.style.visibility = 'hidden';
                }
                hoveredObject = null;
            }
        }
         // If dragging, prevent default page scroll behavior
         if (isDragging) {
             event.preventDefault();
         }
    }

    function onTouchEnd(event) {
        // Process tap only if it wasn't a drag and only one finger was involved
        if (event.changedTouches.length === 1 && !isDragging) {
            const touch = event.changedTouches[0];
            const currentTime = Date.now();
            const tapDuration = currentTime - touchStartTime;

            // Consider it a tap if duration is short
            if (tapDuration < 250) { // Tap threshold: 250ms
                 // Perform raycast at tap location
                 const { intersectedSatellite, intersectedDebris } = handleRaycast(touch.clientX, touch.clientY);

                 if (intersectedSatellite || intersectedDebris) {
                     // Show tooltip briefly on tap
                     setTimeout(() => {
                         if (tooltipElement && hoveredObject === (intersectedSatellite || `debris-${intersectedDebris.instanceId}`)) {
                             tooltipElement.style.opacity = '0';
                             tooltipElement.style.visibility = 'hidden';
                             hoveredObject = null;
                         }
                     }, 1500); // Hide after 1.5 seconds if still hovering the same object
                 } else {
                      // If tapped on empty space, hide tooltip immediately
                      if (tooltipElement) {
                          tooltipElement.style.opacity = '0';
                          tooltipElement.style.visibility = 'hidden';
                      }
                      hoveredObject = null;
                 }
            }
            lastTapTime = currentTime; // Store tap time for potential double-tap logic
        }
         // Reset dragging flag after touch ends
         isDragging = false;
    }


    // --- UI Control Functions ---

    function toggleDebris() {
        showDebris = !showDebris;
        if (debrisGroup) debrisGroup.visible = showDebris;
        if (toggleDebrisButton) {
            toggleDebrisButton.textContent = showDebris ? 'Hide Debris' : 'Show Debris';
            toggleDebrisButton.style.borderColor = showDebris ? 'white' : 'rgba(255, 255, 255, 0.3)';
        }
    }

    function toggleLabels() {
        showLabels = !showLabels;
        if (toggleLabelsButton) {
            toggleLabelsButton.textContent = showLabels ? 'Hide Labels' : 'Show Labels';
            toggleLabelsButton.style.borderColor = showLabels ? 'white' : 'rgba(255, 255, 255, 0.3)';
        }
        if (satelliteLabelElement) {
            satelliteLabelElement.style.display = showLabels ? 'block' : 'none';
            // Hide all labels immediately if toggling off
            if (!showLabels) satelliteLabelElement.style.display = 'none';
        }
        // Update label immediately if turning on
        if (showLabels) updateSatelliteLabel();
    }

    function updateInfoPanelVisibility() {
        if (!infoPanel || !toggleInfoButton) return;
        if (infoPanelVisible) {
            infoPanel.classList.add('visible'); // Use class for visibility
             infoPanel.style.display = 'block'; // Ensure display is block
            toggleInfoButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>`; // Close icon
        } else {
            infoPanel.classList.remove('visible');
            infoPanel.style.display = 'none';
            toggleInfoButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>`; // Info icon
        }
    }


    function toggleInfoPanel() {
        infoPanelVisible = !infoPanelVisible;
        updateInfoPanelVisibility();
    }

    function changeSatellite() {
        if (!satelliteSelect) return;
        currentSatellite = satelliteSelect.value;
        console.log("Changing satellite to:", currentSatellite);
        createSatellite(); // Recreate the satellite mesh with the new model/colors
        updateObjects(); // Update position and stats immediately
        // Reset velocity calculation helpers
        lastPosition.set(0,0,0);
        lastUpdateTimestamp = 0;
    }

    function resetCameraView() {
        if (!controls || !camera) return;
        controls.reset(); // Resets target and position
        // Set a specific position after reset if needed
        camera.position.set(0, 0, isMobile ? 3.5 : 2.5);
        controls.target.set(0, 0, 0); // Ensure target is center
        controls.update(); // Apply changes immediately
    }

    function updateLoadingProgress(percent, message) {
        if (!loadingScreen) return;
        const bar = document.getElementById('loading-bar');
        const text = document.getElementById('loading-text');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.textContent = message;
    }

    // Simple stars background
    function createStars() {
        const starCount = isMobile ? 4000 : 10000; // Increase star count
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: isMobile ? 0.006 : 0.008, // Slightly smaller stars
            sizeAttenuation: true, // Stars shrink with distance
            transparent: true,
            opacity: 0.8, // Slightly more opaque
            depthWrite: false // Prevent stars interfering with transparency
        });

        const starsVertices = [];
        const radius = 60; // Increase radius of the star sphere
        for (let i = 0; i < starCount; i++) {
            // Distribute stars spherically more evenly using Fibonacci sphere algorithm
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / starCount); // More uniform distribution

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
    }

     // Cleanup function (optional but good practice)
    // function cleanupVisualization() {
    //     console.log("Cleaning up visualization...");
    //     cancelAnimationFrame(animationFrameId); // Stop animation loop
    //     window.removeEventListener('resize', onWindowResize);
    //     // Remove other event listeners...
    //     if (renderer) renderer.dispose();
    //     if (scene) {
    //         scene.traverse(object => {
    //             if (object.geometry) object.geometry.dispose();
    //             if (object.material) {
    //                  if (Array.isArray(object.material)) {
    //                      object.material.forEach(material => material.dispose());
    //                  } else {
    //                      object.material.dispose();
    //                  }
    //             }
    //         });
    //     }
    //     // Clear variables
    //     scene = null; camera = null; renderer = null; controls = null;
    //     // Remove canvas from DOM
    //     if (canvasContainer && renderer) canvasContainer.removeChild(renderer.domElement);
    // }
    // // Example: Call cleanup if navigating away from the page (needs integration with routing/SPA framework)
    // // window.addEventListener('beforeunload', cleanupVisualization);

} // End of initializeOrbitVisualization function
// --- Add inside the DOMContentLoaded listener in SpaceWatch/script.js ---

    // --- Mobile Navigation Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.sticky-nav nav'); // Select the <nav> element

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-mobile-active'); // Toggle the class on the <nav>

            // Toggle ARIA attribute for accessibility
            const isExpanded = mainNav.classList.contains('nav-mobile-active');
            menuToggle.setAttribute('aria-expanded', isExpanded);

            // Optional: Change button text/icon
            if (isExpanded) {
                menuToggle.innerHTML = '&times;'; // Close icon (X)
                menuToggle.setAttribute('aria-label', 'Close Navigation Menu');
            } else {
                menuToggle.innerHTML = '☰'; // Hamburger icon
                 menuToggle.setAttribute('aria-label', 'Open Navigation Menu');
            }
        });

         // Optional: Close menu if clicking outside of it (on mobile)
         document.addEventListener('click', (event) => {
             // Check if the click is outside the nav and the menu is open
            if (!mainNav.contains(event.target) && mainNav.classList.contains('nav-mobile-active')) {
                mainNav.classList.remove('nav-mobile-active');
                menuToggle.setAttribute('aria-expanded', 'false');
                 menuToggle.innerHTML = '☰'; // Reset icon
                 menuToggle.setAttribute('aria-label', 'Open Navigation Menu');
            }
         });

    } else {
        console.warn("Mobile menu toggle button or main navigation not found.");
    }

// --- End of Mobile Navigation Toggle block ---
// start on regiter 
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;


    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }


    const requestData = {
        name: name,
        email: email,
        password: password
    };

    fetch('http://nsst.runasp.net/api/User_Management_System/register', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify(requestData) 
    })
    .then(response => response.json()) 
    .then(data => {
        if (data) {
            alert('Registration successful!');
            console.log(data);
            
            window.location.href = 'sign-in.html';
        } else {
           
            alert('Registration failed: ' + data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});

// log in 
