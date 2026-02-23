// --- 1. UI LOGIC (Prices & Checkbox Limits) ---
const priceData = {
    "5": 450,
    "6": 650,
    "8": 750,
    "10": 850
};

const sizeSelect = document.getElementById('cakeSize');
const priceDisplay = document.getElementById('priceDisplay');

sizeSelect.addEventListener('change', () => {
    priceDisplay.innerText = `P ${priceData[sizeSelect.value]}`;
    updateCakeSize();
});

// Enforce Max 3 Toppings Rule
const checkboxes = document.querySelectorAll('.topping-check');
const warning = document.getElementById('toppingWarning');

checkboxes.forEach(box => {
    box.addEventListener('change', () => {
        let checkedCount = document.querySelectorAll('.topping-check:checked').length;
        
        if (checkedCount >= 3) {
            warning.classList.remove('hidden');
            checkboxes.forEach(cb => {
                if (!cb.checked) cb.disabled = true; // Lock the rest
            });
        } else {
            warning.classList.add('hidden');
            checkboxes.forEach(cb => cb.disabled = false); // Unlock
        }
    });
});


// --- 2. TRUE 3D ENGINE (Three.js) ---
const container = document.getElementById('three-container');

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 15, 25);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true; // Enable realistic shadows
container.appendChild(renderer.domElement);

// Camera Controls (Drag to spin, scroll to zoom)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't let them go too far under the cake

// Realistic Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// The Cake Materials
let baseColor = '#ffcce0';
const sideMaterial = new THREE.MeshStandardMaterial({ 
    color: baseColor, 
    roughness: 0.7, // Makes it look like frosting, not shiny plastic
});
let topMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 });

// The 3D Cake Object
let cakeGeometry = new THREE.CylinderGeometry(5, 5, 6, 64); // Smooth 64-segment cylinder
let cakeMesh = new THREE.Mesh(cakeGeometry, [sideMaterial, topMaterial, sideMaterial]);
cakeMesh.castShadow = true;
cakeMesh.position.y = 3;
scene.add(cakeMesh);

// The Cake Board (Underneath)
const boardGeo = new THREE.CylinderGeometry(7, 7, 0.3, 64);
const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
const boardMesh = new THREE.Mesh(boardGeo, boardMat);
boardMesh.receiveShadow = true;
boardMesh.position.y = -0.15;
scene.add(boardMesh);


// --- 3. DYNAMIC UPDATES ---

// Update Color
const colorPicker = document.getElementById('cakeColorPicker');
colorPicker.addEventListener('input', (e) => {
    baseColor = e.target.value;
    sideMaterial.color.set(baseColor);
    if (!uploadedImageTexture) {
        topMaterial.color.set(baseColor);
    }
    updateCakeTop(); // Re-render text over new color
});

// Update Size
function updateCakeSize() {
    const size = parseInt(sizeSelect.value);
    const radius = size * 0.7; // Scale down for 3D view
    const height = 6; 
    
    // Create new geometry with new radius
    const newGeo = new THREE.CylinderGeometry(radius, radius, height, 64);
    cakeMesh.geometry.dispose(); // clear old memory
    cakeMesh.geometry = newGeo;
    
    // Scale board to match
    boardMesh.scale.set((radius+2)/7, 1, (radius+2)/7);
}

// Upload Edible Image & Text Logic
let uploadedImageTexture = null;
const imageUpload = document.getElementById('imageUpload');
const removeImgBtn = document.getElementById('removeImageBtn');
const cakeTextInput = document.getElementById('cakeText');

// Handle Image Upload
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                uploadedImageTexture = texture;
                updateCakeTop();
                removeImgBtn.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
});

// Handle Image Removal
removeImgBtn.addEventListener('click', () => {
    uploadedImageTexture = null;
    imageUpload.value = '';
    removeImgBtn.classList.add('hidden');
    updateCakeTop();
});

// Handle Text input
cakeTextInput.addEventListener('input', updateCakeTop);

// The engine that blends the Color, the Uploaded Photo, and the Text onto the 3D surface
function updateCakeTop() {
    const text = cakeTextInput.value;
    
    // We use a hidden HTML5 Canvas to draw the text and image, then wrap it onto the 3D shape
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Draw Base Color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Draw Uploaded Image (if exists) centered and circular
    if (uploadedImageTexture) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(256, 256, 240, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(uploadedImageTexture.image, 0, 0, 512, 512);
        ctx.restore();
    }

    // 3. Draw Text
    if (text) {
        ctx.fillStyle = '#ffffff'; // White text outline
        ctx.font = 'bold 50px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        
        ctx.fillText(text, 256, 256);
    }

    // Convert Canvas to 3D Texture
    const finalTexture = new THREE.CanvasTexture(canvas);
    
    // Apply to the top face of the cylinder
    topMaterial.map = finalTexture;
    topMaterial.color.set(0xffffff); // Reset base tint so image shows correctly
    topMaterial.needsUpdate = true;
}

// Handle Window Resizing smoothly
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required for damping/smooth dragging
    renderer.render(scene, camera);
}
animate();
