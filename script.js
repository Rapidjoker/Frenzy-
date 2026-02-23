// Pricing & Sizing Data
const cakeData = {
    naked: {
        sizes: [
            { label: "5 Inches", val: "5", price: 300, w: 120, z: 80 },
            { label: "6 Inches", val: "6", price: 400, w: 150, z: 100 },
            { label: "8 Inches", val: "8", price: 500, w: 190, z: 110 },
            { label: "10 Inches", val: "10", price: 600, w: 230, z: 120 },
            { label: "12 Inches", val: "12", price: 700, w: 270, z: 130 }
        ]
    },
    buttercream: {
        sizes: [
            { label: "5 Inches", val: "5", price: 450, w: 120, z: 80 },
            { label: "6 Inches", val: "6", price: 650, w: 150, z: 100 },
            { label: "8 Inches", val: "8", price: 750, w: 190, z: 110 },
            { label: "10 Inches", val: "10", price: 850, w: 230, z: 120 }
        ]
    },
    fondant: {
        sizes: [
            { label: "5 Inches", val: "5", price: 550, w: 120, z: 80 },
            { label: "6 Inches", val: "6", price: 700, w: 150, z: 100 },
            { label: "8 Inches", val: "8", price: 800, w: 190, z: 110 },
            { label: "10 Inches", val: "10", price: 900, w: 230, z: 120 },
            { label: "12 Inches", val: "12", price: 1000, w: 270, z: 130 }
        ]
    },
    twolayer: {
        sizes: [
            { label: "4 inch & 6 inch", val: "4-6", price: 900, tiers: [{w:100, z:60}, {w:150, z:90}] },
            { label: "6 inch & 8 inch", val: "6-8", price: 1300, tiers: [{w:150, z:90}, {w:190, z:100}] },
            { label: "8 inch & 10 inch", val: "8-10", price: 1600, tiers: [{w:190, z:100}, {w:230, z:110}] },
            { label: "10 inch & 12 inch", val: "10-12", price: 2000, tiers: [{w:230, z:110}, {w:270, z:120}] }
        ]
    }
};

let currentColor = '#ffcce0'; 
const spongeColor = '#dcae78';
const fillingColor = '#fff3e0';

// Helper function to darken/lighten hex colors for realistic shadows
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255; R = (R>0)?R:0;
    G = (G<255)?G:255; G = (G>0)?G:0;
    B = (B<255)?B:255; B = (B>0)?B:0;

    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// Event Listeners for UI
document.getElementById('cakeStyle').addEventListener('change', updateBuilder);
document.getElementById('cakeSize').addEventListener('change', updateBuilder);

const colorButtons = document.querySelectorAll('.color-btn');
colorButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentColor = e.target.getAttribute('data-color');
        updateBuilder();
    });
});

function updateBuilder() {
    const style = document.getElementById('cakeStyle').value;
    const sizeSelect = document.getElementById('cakeSize');
    
    if (sizeSelect.dataset.currentStyle !== style) {
        sizeSelect.innerHTML = '';
        cakeData[style].sizes.forEach((s, index) => {
            const opt = document.createElement('option');
            opt.value = index; 
            opt.textContent = s.label;
            sizeSelect.appendChild(opt);
        });
        sizeSelect.dataset.currentStyle = style;
    }

    const selectedIndex = sizeSelect.value || 0;
    const config = cakeData[style].sizes[selectedIndex];
    
    document.getElementById('priceDisplay').innerText = `P ${config.price}`;

    const colorPicker = document.getElementById('colorPickerContainer');
    if(style === 'naked') colorPicker.classList.add('hidden');
    else colorPicker.classList.remove('hidden');

    const assembly = document.getElementById('cakeAssembly');
    Array.from(assembly.children).forEach(child => {
        if(!child.classList.contains('cake-board')) child.remove();
    });
    
    let startingZ = 0;

    if(style === 'twolayer') {
        build3DTier(assembly, config.tiers[1].w, config.tiers[1].z, startingZ, 'smooth');
        startingZ += config.tiers[1].z;
        build3DTier(assembly, config.tiers[0].w, config.tiers[0].z, startingZ, 'smooth');
    } else {
        build3DTier(assembly, config.w, config.z, startingZ, style);
    }
}

function build3DTier(container, width, height, startZ, style) {
    const tierWrapper = document.createElement('div');
    tierWrapper.className = 'cake-tier-3d';
    
    const slicesCount = Math.floor(height / 2); 
    
    // Generate Lighting Colors based on selected color
    const shadowColor = shadeColor(currentColor, -25);
    const highlightColor = shadeColor(currentColor, 10);
    
    for (let i = 0; i <= slicesCount; i++) {
        const slice = document.createElement('div');
        slice.className = 'cake-slice';
        slice.style.width = `${width}px`;
        slice.style.height = `${width}px`;
        
        const currentZ = startZ + (i * 2);
        slice.style.transform = `translate(-50%, -50%) rotateX(90deg) translateZ(${currentZ}px)`;

        if (style === 'naked') {
            if (i % 10 < 2) {
                slice.style.background = `linear-gradient(to right, ${shadeColor(fillingColor, -20)} 0%, ${fillingColor} 20%, ${fillingColor} 80%, ${shadeColor(fillingColor, -30)} 100%)`;
            } else {
                slice.style.background = `linear-gradient(to right, ${shadeColor(spongeColor, -20)} 0%, ${spongeColor} 20%, ${spongeColor} 80%, ${shadeColor(spongeColor, -30)} 100%)`;
            }
        } else {
            // Apply realistic cylindrical lighting to the sides of the cake
            slice.style.background = `linear-gradient(to right, ${shadowColor} 0%, ${highlightColor} 30%, ${currentColor} 60%, ${shadowColor} 100%)`;
        }

        tierWrapper.appendChild(slice);
    }

    const lid = document.createElement('div');
    lid.className = 'cake-top-lid';
    lid.style.width = `${width}px`;
    lid.style.height = `${width}px`;
    const topZ = startZ + (slicesCount * 2);
    lid.style.transform = `translate(-50%, -50%) rotateX(90deg) translateZ(${topZ}px)`;
    lid.style.backgroundColor = (style === 'naked') ? spongeColor : currentColor;
    tierWrapper.appendChild(lid);

    container.appendChild(tierWrapper);
}

// --- DRAG TO ROTATE LOGIC ---
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: -20, y: 0 }; 

const scene = document.getElementById('sceneContainer');
const assembly = document.getElementById('cakeAssembly');

scene.addEventListener('mousedown', startDrag);
scene.addEventListener('mousemove', drag);
window.addEventListener('mouseup', endDrag);

scene.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
scene.addEventListener('touchmove', (e) => drag(e.touches[0]));
window.addEventListener('touchend', endDrag);

function startDrag(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX || e.pageX, y: e.clientY || e.pageY };
}

function drag(e) {
    if (!isDragging) return;
    const currentX = e.clientX || e.pageX;
    const currentY = e.clientY || e.pageY;
    
    rotation.y += (currentX - previousMousePosition.x) * 0.5;
    rotation.x -= (currentY - previousMousePosition.y) * 0.5;
    rotation.x = Math.max(-60, Math.min(10, rotation.x));

    assembly.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    previousMousePosition = { x: currentX, y: currentY };
}

function endDrag() {
    isDragging = false;
}

window.onload = () => {
    document.getElementById('cakeSize').dataset.currentStyle = "";
    updateBuilder();
};
