
// Global variables
let scene, camera, renderer, controls;
let satelliteDatabase = {};
let allSatellitesGroup;
let currentFrameIndex = 0.0;
const scaleFactor = 1;
const minDistanceScaled = 1;
let earthMesh;
let atmosphere;
let systemStartTime = Date.now();
let dataStartTime = null;
let satelliteLabel = null;

function getCurrentDataTime() {
    const elapsed = Date.now() - systemStartTime;
    return new Date(dataStartTime + elapsed);
}

function getInterpolatedPosition(positions, currentTime) {
    if (!positions || positions.length < 2) return null;

    for (let i = 0; i < positions.length - 1; i++) {
        const curr = positions[i];
        const next = positions[i + 1];

        const currTime = new Date(curr.timestamp.$date).getTime();
        const nextTime = new Date(next.timestamp.$date).getTime();
        const nowTime = currentTime.getTime();

        if (nowTime >= currTime && nowTime <= nextTime) {
            const t = (nowTime - currTime) / (nextTime - currTime);
            const x = THREE.MathUtils.lerp(curr.position.x, next.position.x, t);
            const y = THREE.MathUtils.lerp(curr.position.y, next.position.y, t);
            const z = THREE.MathUtils.lerp(curr.position.z, next.position.z, t);
            return new THREE.Vector3(x, z, -y); // Adjust orientation
        }
    }

    return null; // Out of range
}

function initializeOrbitVisualization() {
    initVisualization();
    animate();
}

async function initVisualization() {
    scene = new THREE.Scene();

    allSatellitesGroup = new THREE.Group();
    scene.add(allSatellitesGroup);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 0, 10000);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    await createEarth();

fetch('http://nsst.runasp.net/api/TEST_3/TEST_3')
        .then(res => res.json())
        .then(data => {
            console.log("data ",data);
            
            if (data.length === 0 || !data[0].positions || data[0].positions.length === 0) {
                console.warn("No satellite position data found.");
                return;
            }

            // Set the base time reference to first timestamp in dataset
            dataStartTime = new Date(data[0].positions[0].timestamp.$date).getTime();

            data.forEach((sat, index) => {
                const noradId = sat.NoradId;

                const satData = {
                    name: noradId,
                    index: index,
                    color: getRandomColor(),
                    panelColor: getRandomPanelColor(),
                    size: getSizeByName(`Satellite ${noradId}`),
                    frames: sat.positions
                };

                const mesh = createSatelliteMesh(satData);
                satData.mesh = mesh;
                allSatellitesGroup.add(mesh);

                satelliteDatabase[noradId] = satData;
            });
            populateSatelliteList();
            // console.log("✅ Satellites loaded:", Object.keys(satelliteDatabase));
        });
}

function createSatelliteMesh(satData) {
    const group = new THREE.Group();
    const baseSize = satData.size;

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: satData.color,
        metalness: 0.8,
        roughness: 0.4
    });

    const panelMaterial = new THREE.MeshStandardMaterial({
        color: satData.panelColor,
        metalness: 0.2,
        roughness: 0.8
    });

    const bodyGeometry = new THREE.BoxGeometry(baseSize, baseSize * 0.8, baseSize * 0.8);
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(bodyMesh);

    const panelGeometry = new THREE.BoxGeometry(baseSize * 3, baseSize * 1.5, baseSize * 0.05);
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-baseSize * 2, 0, 0);
    group.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(baseSize * 2, 0, 0);
    group.add(rightPanel);

    group.userData = {
        name: satData.name,
        type: 'satellite'
    };

    return group;
}

function updateObjects() {
    const now = getCurrentDataTime();

    Object.values(satelliteDatabase).forEach(satData => {
        if (!satData.frames || !satData.mesh) return;
        const interpolatedPos = getInterpolatedPosition(satData.frames, now);
        if (!interpolatedPos) return;

        if (interpolatedPos.length() < minDistanceScaled) {
            interpolatedPos.setLength(minDistanceScaled);
        }

        satData.mesh.position.copy(interpolatedPos);
        if (String(satData.name) === satelliteSelect.value) {
            // console.log("✅ Updating UI for:", satData.name);
            updateSatelliteInfoUI(satData);
        }
    });

    if (earthMesh) {
        const realEarthRotationSpeed = (2 * Math.PI) / 86400; // rad/sec
        const deltaTime = 1 / 60; // Assuming ~60fps
        earthMesh.rotation.y += realEarthRotationSpeed * deltaTime;
    }


}

function animate() {
    requestAnimationFrame(animate);
    updateObjects();
    controls.update();
    renderer.render(scene, camera);
}

function getRandomColor() {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
}

function getRandomPanelColor() {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
}

function getSizeByName(name) {
    return 10;
}
async function createEarth() {
    const textureLoader = new THREE.TextureLoader();
    const textureUrl = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
    let texture;

    try {
        texture = await textureLoader.loadAsync(textureUrl);
    } catch (e) {
        console.warn('Failed to load earth texture. Using fallback.');
        texture = null;
    }

    const geometry = new THREE.SphereGeometry(6371, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: texture || null,
        color: texture ? 0xffffff : 0x2255ff,
        metalness: 0.1,
        roughness: 0.8
    });

    earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);

    const atmosphereGeometry = new THREE.SphereGeometry(6371 * 1.03, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 0.5 * intensity);
      }
    `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });

    atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
}

// Start visualization
initializeOrbitVisualization();

const satelliteSelect = document.getElementById('satellite-select');
const satelliteSearch = document.getElementById('satellite-search');

function populateSatelliteList() {
    satelliteSelect.innerHTML = '';
    Object.values(satelliteDatabase).forEach(sat => {
        const option = document.createElement('option');
        option.value = sat.name;
        option.textContent = `Satellite ${sat.name}`;
        satelliteSelect.appendChild(option);
    });
}

satelliteSearch.addEventListener('input', () => {
    const searchValue = satelliteSearch.value.toLowerCase();
    Array.from(satelliteSelect.options).forEach(option => {
        const visible = option.textContent.toLowerCase().includes(searchValue);
        option.style.display = visible ? 'block' : 'none';
    });
});

// satelliteSelect.addEventListener('change', () => {
//     const selectedId = satelliteSelect.value;
//     const satData = satelliteDatabase[selectedId];
//     if (satData && satData.mesh) {
//         controls.target.copy(satData.mesh.position);
//         camera.position.copy(satData.mesh.position.clone().add(new THREE.Vector3(500, 300, 500)));
//         showLabelForSatellite(satData);
//     }
// });
satelliteSelect.addEventListener('change', () => {
    const selectedId = satelliteSelect.value;
    const satData = satelliteDatabase[selectedId];

    if (satData && satData.mesh) {
        // 1. Focus camera and controls
        controls.target.copy(satData.mesh.position);
        camera.position.copy(satData.mesh.position.clone().add(new THREE.Vector3(500, 300, 500)));

        // 2. Show satellite label
        showLabelForSatellite(satData);

        // 3. Show live info for that satellite
        updateSatelliteInfoUI(satData);
    }
});
function getClosestFrame(frames, now) {
    let closest = null;
    let minDiff = Infinity;

    for (const f of frames) {
        const fTime = new Date(f.timestamp.$date).getTime();
        const diff = Math.abs(fTime - now.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closest = f;
        }
    }

    return closest;
}

function updateSatelliteInfoUI(satData) {
    if (!satData || !satData.frames || satData.frames.length === 0) return;

    const now = getCurrentDataTime();

    // أقرب نقطة بالزمن الحالي
    const frame = getClosestFrame(satData.frames, now);
    // console.log(frame);
    // console.log(satData);


if (frame) {
  document.getElementById("info-name").textContent = satData.name;
  document.getElementById("info-alt").textContent = frame.geo?.altitude?.toFixed(2) || "--";
  document.getElementById("info-lat").textContent = frame.geo?.latitude?.toFixed(4) || "--";
  document.getElementById("info-long").textContent = frame.geo?.longitude?.toFixed(4) || "--";
  document.getElementById("info-time").textContent = new Date(frame.timestamp.$date).toLocaleString();

  const altitudes = satData.frames.map(f => f.geo?.altitude || 0);
  document.getElementById("info-apogee").textContent = Math.max(...altitudes).toFixed(2);
  document.getElementById("info-perigee").textContent = Math.min(...altitudes).toFixed(2);
}

}


function showLabelForSatellite(satData) {
    if (!satData || !satData.mesh) return;

    if (satelliteLabel) {
        scene.remove(satelliteLabel);
        satelliteLabel = null;
    }

    const spriteMaterial = new THREE.SpriteMaterial({
        map: createTextTexture(`Satellite ${satData.name}`),
        transparent: true
    });

    satelliteLabel = new THREE.Sprite(spriteMaterial);
    satelliteLabel.scale.set(500, 250, 1); // حجم النص

    satData.mesh.add(satelliteLabel);
    satelliteLabel.position.set(0, 50, 0); // فوق القمر شوية
}

function createTextTexture(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '40px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

document.getElementById("reset-to-earth").addEventListener("click", () => {
    if (!earthMesh) return;

    const earthPosition = earthMesh.position.clone();
    controls.target.copy(earthPosition); // خلي المركز على الأرض

    const camOffset = new THREE.Vector3(0, 0, 12000);
    camera.position.copy(earthPosition.clone().add(camOffset)); // زووم للخلف

    controls.update();
});