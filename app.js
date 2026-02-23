import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PRICING = {
    naked:       { '5"':300, '6"':400, '8"':500, '10"':600, '12"':700 },
    buttercream: { '5"':450, '6"':650, '8"':750, '10"':850 },
    fondant:     { '5"':550, '6"':700, '8"':800, '10"':900, '12"':1000 },
    twolayer:    { '4"+6"':900, '4"+8"':1100, '6"+8"':1300, '6"+10"':1450, '8"+10"':1600, '8"+12"':1800, '10"+12"':2000, '12"+14"':2400, '14"+16"':2800 },
    wedding:     { '6"+8"+10"':2500, '8"+10"+12"':3200 },
    bento:       { '4" Standard':150, '5" Large': 200 }
};

const state = {
    style: 'naked', size: '5"', color: '#ffcce0',
    foil: 'none', foilPrice: 0, sprinkles: 'none', glitter: 'none', flowerType: 'none'
};

const wrap = document.getElementById('builder-canvas-wrap');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
camera.position.set(0, 15, 35);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
wrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI; 
controls.minDistance = 10;
controls.maxDistance = 60;

// Lighting & Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const plateGeo = new THREE.CylinderGeometry(10, 10.2, 0.2, 64);
const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 });
const plate = new THREE.Mesh(plateGeo, plateMat);
plate.position.y = -0.1;
scene.add(plate);

let currentCakeGroup = new THREE.Group();
scene.add(currentCakeGroup);

// LOAD THE USER'S ACTUAL GOLD FOIL IMAGE
const textureLoader = new THREE.TextureLoader();
const realGoldTex = textureLoader.load('1001244972.jpg');
realGoldTex.wrapS = THREE.RepeatWrapping;
realGoldTex.wrapT = THREE.RepeatWrapping;

function createNakedTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d2a679'; ctx.fillRect(0, 0, 512, 512); 
    ctx.fillStyle = '#eee0cb'; 
    for(let i=1; i<4; i++) ctx.fillRect(0, (512/4)*i - 10, 512, 20);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

function createSprinkles(colors) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    for(let i=0; i<1500; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.save(); ctx.translate(Math.random() * 1024, Math.random() * 1024); ctx.rotate(Math.random() * Math.PI);
        ctx.beginPath(); ctx.arc(-10, 0, 4, Math.PI/2, Math.PI*1.5); ctx.arc(10, 0, 4, -Math.PI/2, Math.PI/2);
        ctx.fill(); ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

function createGlitter(colorHex) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colorHex;
    for(let i=0; i<15000; i++) {
        ctx.globalAlpha = 0.4 + Math.random()*0.6;
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

const nakedTexBase = createNakedTexture();

function buildCake() {
    while(currentCakeGroup.children.length > 0){ currentCakeGroup.remove(currentCakeGroup.children[0]); }

    let tiers = [];
    if (state.style === 'bento') tiers = [{ r: parseInt(state.size)*0.5, h: 3 }];
    else if (state.style === 'twolayer') {
        const sizes = state.size.split('+').map(s => parseInt(s));
        tiers = [{ r: sizes[1]*0.5, h: 5 }, { r: sizes[0]*0.5, h: 4 }];
    } else if (state.style === 'wedding') {
        const sizes = state.size.split('+').map(s => parseInt(s));
        tiers = [{ r: sizes[2]*0.5, h: 5 }, { r: sizes[1]*0.5, h: 5 }, { r: sizes[0]*0.5, h: 4.5 }];
    } else tiers = [{ r: parseInt(state.size)*0.5, h: 5 }];

    let sprinkleColors = [];
    if(state.sprinkles === 'rainbow') sprinkleColors = ['#fb6f92', '#a2d2ff', '#f4c542', '#ffffff', '#a7c957'];
    if(state.sprinkles === 'choc') sprinkleColors = ['#3e2723', '#4e342e'];
    
    const currentSprinkleTex = sprinkleColors.length > 0 ? createSprinkles(sprinkleColors) : null;
    const currentGlitterTex = state.glitter !== 'none' ? createGlitter(state.glitter) : null;

    let currentY = 0;
    tiers.forEach((tier, index) => {
        const isTopTier = (index === tiers.length - 1);
        
        let sideMat, topMat;
        if (state.style === 'naked') {
            sideMat = new THREE.MeshStandardMaterial({ map: nakedTexBase, roughness: 0.9 });
            topMat = sideMat;
        } else {
            let roughness = state.style === 'buttercream' ? 1.0 : 0.3; 
            sideMat = new THREE.MeshStandardMaterial({ color: state.color, roughness: roughness });
            topMat = sideMat;
        }

        const geo = new THREE.CylinderGeometry(tier.r, tier.r, tier.h, 64);
        let materials = [sideMat, topMat, sideMat];

        if (state.foil === 'cover') {
            materials = new THREE.MeshPhysicalMaterial({ map: realGoldTex, metalness: 0.8, roughness: 0.2, clearcoat: 0.5 });
        }

        const mesh = new THREE.Mesh(geo, materials);
        mesh.position.y = currentY + (tier.h / 2);
        currentCakeGroup.add(mesh);

        // Add-ons Wrapper
        if (state.foil !== 'none' && state.foil !== 'cover' || sprinkleColors.length > 0 || state.glitter !== 'none') {
            const wrapGeo = new THREE.CylinderGeometry(tier.r + 0.05, tier.r + 0.05, tier.h + 0.05, 64);
            
            const goldMatSide = new THREE.MeshPhysicalMaterial({ map: realGoldTex, transparent: true, metalness: 0.9, roughness: 0.1 });
            const goldMatTop = new THREE.MeshPhysicalMaterial({ map: realGoldTex, transparent: true, metalness: 0.9, roughness: 0.1 });

            let foilSides = (state.foil === 'sides' || state.foil === 'both') ? goldMatSide : new THREE.MeshBasicMaterial({transparent:true, opacity:0});
            let foilTop = (state.foil === 'top' || state.foil === 'both') ? goldMatTop : new THREE.MeshBasicMaterial({transparent:true, opacity:0});
            
            if(sprinkleColors.length > 0) {
                foilSides = new THREE.MeshStandardMaterial({ map: currentSprinkleTex, transparent: true });
                foilTop = new THREE.MeshStandardMaterial({ map: currentSprinkleTex, transparent: true }); 
            }
            if(state.glitter !== 'none') {
                const glitterMat = new THREE.MeshPhysicalMaterial({ map: currentGlitterTex, transparent: true, metalness: 0.9, roughness: 0.1 });
                foilSides = glitterMat; foilTop = glitterMat;
            }

            const wrapMesh = new THREE.Mesh(wrapGeo, [foilSides, foilTop, new THREE.MeshBasicMaterial({transparent:true, opacity:0})]);
            wrapMesh.position.y = currentY + (tier.h / 2);
            currentCakeGroup.add(wrapMesh);
        }

        currentY += tier.h;
    });

    updatePrice();
}

function updatePrice() {
    let base = PRICING[state.style][state.size] || 0;
    let total = base + parseInt(state.foilPrice);
    document.getElementById('price-display').innerText = `P ${total}`;
}

function populateSizes() {
    const wrap = document.getElementById('size-btns');
    wrap.innerHTML = '';
    const sizes = Object.keys(PRICING[state.style]);
    state.size = sizes[0]; 
    sizes.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = `btn-option px-3 py-1 text-sm ${i===0 ? 'active' : ''}`;
        btn.innerText = s;
        btn.onclick = () => {
            document.querySelectorAll('#size-btns button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); state.size = s; buildCake();
        };
        wrap.appendChild(btn);
    });
}

// Event Listeners
document.getElementById('style-btns').addEventListener('click', (e) => {
    if(e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#style-btns button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active'); state.style = e.target.dataset.style;
        populateSizes(); buildCake();
    }
});

document.getElementById('cake-color-picker').addEventListener('input', (e) => { state.color = e.target.value; buildCake(); });
document.getElementById('foil-select').addEventListener('change', (e) => {
    state.foil = e.target.value; state.foilPrice = e.target.options[e.target.selectedIndex].dataset.price; buildCake();
});
document.getElementById('sprinkles-select').addEventListener('change', (e) => { state.sprinkles = e.target.value; buildCake(); });
document.getElementById('glitter-select').addEventListener('change', (e) => { state.glitter = e.target.value; buildCake(); });

window.addEventListener('resize', () => {
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
});

populateSizes(); buildCake();

function animate() {
    requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera);
}
animate();
