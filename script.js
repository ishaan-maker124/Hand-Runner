// --- AUDIO SYNTHESIZER (No External Assets) ---
class SoundEffects {
    constructor() {
    this.ctx = null;
    }

    init() {
    if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
    }

    playCoin() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
    }

    playJump() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
    }

    playSlide() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
    }

    playCrash() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
    }
}

const sfx = new SoundEffects();

// --- GAME PARAMETERS & STATE ---
const LANES = [-2.8, 0, 2.8]; // Left, Center, Right X coordinates
const STATE = {
    isStarted: false,
    isGameOver: false,
    isPaused: false,
    currentLane: 1, // 0: Left, 1: Center, 2: Right
    score: 0,
    coins: 0,
    baseSpeed: 0.35,
    currentSpeed: 0.35,
    highScore: parseInt(localStorage.getItem('runner_highscore') || '0'),
    totalCoins: parseInt(localStorage.getItem('runner_totalcoins') || '0'),
    
    // Jump & Slide Physics
    playerY: 0,
    velocityY: 0,
    gravity: -0.018,
    jumpForce: 0.36,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    slideDuration: 35 // Frames
};

// Update Start Screen UI values
document.getElementById('start-highscore').innerText = STATE.highScore;
document.getElementById('start-totalcoins').innerText = STATE.totalCoins;

// --- THREE.JS GRAPHICS SETUP ---
const canvas3d = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);
scene.fog = new THREE.FogExp2(0x0b0f19, 0.018);

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
const cameraOffset = new THREE.Vector3(0, 3.8, 7.5);
camera.position.copy(cameraOffset);
camera.lookAt(0, 1.5, -5);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// Track ground segments setup
const SEGMENT_LENGTH = 40;
const TOTAL_SEGMENTS = 6;
const trackSegments = [];

function createTrackSegment(zPos) {
    const group = new THREE.Group();
    group.position.z = zPos;

    // Track platform
    const groundGeo = new THREE.PlaneGeometry(12, SEGMENT_LENGTH);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // Rails and Lane Markers
    const railGeo = new THREE.BoxGeometry(0.15, 0.1, SEGMENT_LENGTH);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f });
    
    const dividerGeo = new THREE.BoxGeometry(0.1, 0.02, SEGMENT_LENGTH);
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0x334155 });

    LANES.forEach((xPos) => {
    // Rails for each lane
    const r1 = new THREE.Mesh(railGeo, railMat);
    r1.position.set(xPos - 0.6, 0.05, 0);
    const r2 = new THREE.Mesh(railGeo, railMat);
    r2.position.set(xPos + 0.6, 0.05, 0);
    group.add(r1, r2);
    });

    // Track dividers
    [-1.4, 1.4].forEach(x => {
    const div = new THREE.Mesh(dividerGeo, dividerMat);
    div.position.set(x, 0.01, 0);
    group.add(div);
    });

    // Side Glowing Walls / Arch pillars
    const wallPillarGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
    const wallPillarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1 });
    for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 10) {
    const pLeft = new THREE.Mesh(wallPillarGeo, wallPillarMat);
    pLeft.position.set(-6, 2, z);
    const pRight = new THREE.Mesh(wallPillarGeo, wallPillarMat);
    pRight.position.set(6, 2, z);
    group.add(pLeft, pRight);
    }

    scene.add(group);
    return group;
}

// Initialize track
for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    trackSegments.push(createTrackSegment(-i * SEGMENT_LENGTH));
}

// --- PLAYER CHARACTER CREATION ---
const playerGroup = new THREE.Group();
scene.add(playerGroup);

// Player Mesh (Subway Surfer Stylized Runner Avatar)
const bodyGeo = new THREE.BoxGeometry(0.7, 1.0, 0.5);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 }); // Cyan Hoodie
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 1.1;
body.castShadow = true;
playerGroup.add(body);

const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 }); // Head/Cap
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 1.8;
head.castShadow = true;
playerGroup.add(head);

// Limbs for animation
const limbGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
const limbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

const leftLeg = new THREE.Mesh(limbGeo, limbMat);
leftLeg.position.set(-0.2, 0.3, 0);
leftLeg.castShadow = true;
playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(limbGeo, limbMat);
rightLeg.position.set(0.2, 0.3, 0);
rightLeg.castShadow = true;
playerGroup.add(rightLeg);

let runAnimFrame = 0;

// --- OBSTACLES & COINS SYSTEM ---
const obstacles = [];
const coins = [];
const particles = [];

// Obstacle Mesh Generators
function createTrainMesh() {
    const group = new THREE.Group();
    // Train body
    const bodyG = new THREE.BoxGeometry(2.2, 2.6, 10);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.4 }); // Red Subway Train
    const mesh = new THREE.Mesh(bodyG, bodyM);
    mesh.position.y = 1.3;
    mesh.castShadow = true;
    group.add(mesh);

    // Front Window
    const winG = new THREE.BoxGeometry(1.8, 0.9, 0.1);
    const winM = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const win = new THREE.Mesh(winG, winM);
    win.position.set(0, 1.8, 5.01);
    group.add(win);

    // Headlights
    const lightG = new THREE.SphereGeometry(0.2, 8, 8);
    const lightM = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const l1 = new THREE.Mesh(lightG, lightM);
    l1.position.set(-0.7, 0.6, 5.02);
    const l2 = new THREE.Mesh(lightG, lightM);
    l2.position.set(0.7, 0.6, 5.02);
    group.add(l1, l2);

    group.userData = { type: 'train', width: 2.2, height: 2.6, depth: 10 };
    return group;
}

function createBarrierLowMesh() {
    const group = new THREE.Group();
    // Jump Over Hurdle
    const barG = new THREE.BoxGeometry(2.4, 0.8, 0.3);
    const barM = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const bar = new THREE.Mesh(barG, barM);
    bar.position.y = 0.4;
    bar.castShadow = true;
    group.add(bar);

    group.userData = { type: 'barrier_low', width: 2.4, height: 0.8, depth: 0.3 };
    return group;
}

function createBarrierHighMesh() {
    const group = new THREE.Group();
    // Duck Under Archway
    const topG = new THREE.BoxGeometry(2.5, 1.0, 0.4);
    const topM = new THREE.MeshStandardMaterial({ color: 0xe11d48 });
    const top = new THREE.Mesh(topG, topM);
    top.position.y = 2.1;
    top.castShadow = true;

    const pG = new THREE.BoxGeometry(0.3, 2.6, 0.3);
    const pM = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const p1 = new THREE.Mesh(pG, pM);
    p1.position.set(-1.1, 1.3, 0);
    const p2 = new THREE.Mesh(pG, pM);
    p2.position.set(1.1, 1.3, 0);

    group.add(top, p1, p2);
    group.userData = { type: 'barrier_high', width: 2.5, height: 2.6, depth: 0.4 };
    return group;
}

function createCoinMesh() {
    const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0x854d0e });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    return coin;
}

// Spawn Obstacle Logic
let spawnTimer = 0;
function spawnPattern() {
    const zOffset = -120;
    const laneChoice = [0, 1, 2].sort(() => Math.random() - 0.5);

    // Choose 1 or 2 lanes to place obstacles
    const numObstacles = Math.random() > 0.6 ? 2 : 1;
    for (let i = 0; i < numObstacles; i++) {
    const laneIdx = laneChoice[i];
    const randType = Math.random();
    let obs;

    if (randType < 0.45) {
        obs = createTrainMesh();
    } else if (randType < 0.75) {
        obs = createBarrierLowMesh();
    } else {
        obs = createBarrierHighMesh();
    }

    obs.position.set(LANES[laneIdx], 0, zOffset);
    scene.add(obs);
    obstacles.push(obs);
    }

    // Spawn coins on remaining lane
    const coinLane = laneChoice[numObstacles];
    const coinCount = 4 + Math.floor(Math.random() * 4);
    for (let c = 0; c < coinCount; c++) {
    const coin = createCoinMesh();
    coin.position.set(LANES[coinLane], 0.8, zOffset + (c * 2.2));
    scene.add(coin);
    coins.push(coin);
    }
}

// Particle Burst for Coins/Collision
function triggerParticleBurst(pos, colorHex, count = 12) {
    const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.copy(pos);
    p.userData = {
        vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        Math.random() * 0.25,
        (Math.random() - 0.5) * 0.25
        ),
        life: 25 // frames
    };
    scene.add(p);
    particles.push(p);
    }
}

// --- GESTURE RECOGNITION (MEDIAPIPE) ---
const videoElement = document.getElementById('webcam-video');
const canvasElement = document.getElementById('webcam-canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureBadge = document.getElementById('gesture-badge');
const camStatus = document.getElementById('cam-status');
const camLoadingText = document.getElementById('cam-loading-text');

let lastHandY = null;

function onResults(results) {
    if (camLoadingText) camLoadingText.style.display = 'none';

    // Clear webcam PIP canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    camStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Hand Tracked`;
    
    const landmarks = results.multiHandLandmarks[0];

    // Draw Landmarks
    drawLandmarksOnCanvas(landmarks);

    // Process Gestures
    processGesture(landmarks);
    } else {
    camStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span> Searching Hand...`;
    updateGestureHUD("CENTER / NONE");
    }
    canvasCtx.restore();
}

function drawLandmarksOnCanvas(landmarks) {
    canvasCtx.fillStyle = '#06b6d4';
    canvasCtx.strokeStyle = '#f59e0b';
    canvasCtx.lineWidth = 2;

    landmarks.forEach((point) => {
    const x = point.x * canvasElement.width;
    const y = point.y * canvasElement.height;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
    canvasCtx.fill();
    });
}

function processGesture(landmarks) {
    if (!STATE.isStarted || STATE.isGameOver || STATE.isPaused) return;

    // Wrist position (landmark 0) & Index tip (landmark 8)
    const wrist = landmarks[0];
    const indexTip = landmarks[8];

    // Note: Landmarks X is 0 (left) to 1 (right). Video is horizontally mirrored visually.
    // Corrected X calculation for mirrored user perspective:
    const userX = 1.0 - wrist.x; 

    // 1. Horizontal Movement (Lanes)
    if (userX < 0.38) {
    changeLane(-1); // Move Left
    updateGestureHUD("LEFT");
    } else if (userX > 0.62) {
    changeLane(1); // Move Right
    updateGestureHUD("RIGHT");
    } else {
    updateGestureHUD("CENTER");
    }

    // 2. Vertical Jump & Slide Movements
    const currentY = wrist.y;

    if (lastHandY !== null) {
    const dy = lastHandY - currentY; // Positive = moving UP

    // Jump condition: Open hand/Wrist high up OR fast upward swipe
    if (currentY < 0.32 || indexTip.y < 0.20 || dy > 0.08) {
        triggerJump();
        updateGestureHUD("JUMP ⬆️");
    }
    // Slide condition: Wrist low down OR fast downward swipe
    else if (currentY > 0.72 || dy < -0.08) {
        triggerSlide();
        updateGestureHUD("DUCK ⬇️");
    }
    }

    lastHandY = currentY;
}

function updateGestureHUD(text) {
    gestureBadge.innerText = text;
}

// MediaPipe Hands Initialization
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 for fast mobile performance
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Initialize Camera Feed
const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
    await hands.send({ image: videoElement });
    },
    width: 320,
    height: 240
});

cameraUtils.start().catch((err) => {
    console.warn("Webcam access rejected or failed:", err);
    camLoadingText.innerHTML = `<span class="text-amber-400">Cam Disabled</span><br/><span class="text-[9px]">Use Arrow Keys</span>`;
});

// --- USER CONTROLS & ACTIONS ---
function changeLane(direction) {
    if (direction === -1 && STATE.currentLane > 0) {
    STATE.currentLane--;
    } else if (direction === 1 && STATE.currentLane < 2) {
    STATE.currentLane++;
    }
}

function triggerJump() {
    if (!STATE.isJumping && !STATE.isSliding) {
    STATE.isJumping = true;
    STATE.velocityY = STATE.jumpForce;
    sfx.playJump();
    }
}

function triggerSlide() {
    if (!STATE.isSliding) {
    STATE.isSliding = true;
    STATE.slideTimer = STATE.slideDuration;
    // Fast drop if jumping
    if (STATE.isJumping) {
        STATE.velocityY = -STATE.jumpForce;
    }
    sfx.playSlide();
    }
}

// Keyboard Fallback
window.addEventListener('keydown', (e) => {
    sfx.init();
    if (!STATE.isStarted || STATE.isGameOver || STATE.isPaused) return;

    switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
        changeLane(-1);
        updateGestureHUD("KEY LEFT");
        break;
    case 'ArrowRight':
    case 'd':
    case 'D':
        changeLane(1);
        updateGestureHUD("KEY RIGHT");
        break;
    case 'ArrowUp':
    case 'w':
    case 'W':
        triggerJump();
        updateGestureHUD("KEY JUMP");
        break;
    case 'ArrowDown':
    case 's':
    case 'S':
        triggerSlide();
        updateGestureHUD("KEY DUCK");
        break;
    }
});

// --- GAME LOOP & UPDATES ---
function updateGame() {
    if (!STATE.isStarted || STATE.isGameOver || STATE.isPaused) return;

    // 1. Acceleration over time
    STATE.currentSpeed = STATE.baseSpeed + Math.min(0.35, STATE.score * 0.00003);
    document.getElementById('speed-display').innerText = `${(STATE.currentSpeed / STATE.baseSpeed).toFixed(1)}x SPEED`;

    // 2. Score counter
    STATE.score += Math.round(STATE.currentSpeed * 10);
    document.getElementById('score-display').innerText = String(STATE.score).padStart(5, '0');

    // 3. Move Track Segments
    trackSegments.forEach((seg) => {
    seg.position.z += STATE.currentSpeed;
    if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= TOTAL_SEGMENTS * SEGMENT_LENGTH;
    }
    });

    // 4. Smooth Lane Transition for Player
    const targetX = LANES[STATE.currentLane];
    playerGroup.position.x += (targetX - playerGroup.position.x) * 0.22;

    // 5. Jump & Slide Physics
    if (STATE.isJumping) {
    STATE.playerY += STATE.velocityY;
    STATE.velocityY += STATE.gravity;

    if (STATE.playerY <= 0) {
        STATE.playerY = 0;
        STATE.isJumping = false;
    }
    }

    if (STATE.isSliding) {
    STATE.slideTimer--;
    playerGroup.scale.y = 0.5; // Crouch scaling
    if (STATE.slideTimer <= 0) {
        STATE.isSliding = false;
        playerGroup.scale.y = 1.0;
    }
    } else {
    playerGroup.scale.y = 1.0;
    }

    playerGroup.position.y = STATE.playerY;

    // Running Limb Animation
    if (!STATE.isJumping) {
    runAnimFrame += STATE.currentSpeed * 0.8;
    leftLeg.rotation.x = Math.sin(runAnimFrame) * 0.7;
    rightLeg.rotation.x = -Math.sin(runAnimFrame) * 0.7;
    }

    // Camera Lag Effect
    camera.position.x = playerGroup.position.x * 0.3;

    // 6. Spawn Logic
    spawnTimer += STATE.currentSpeed;
    if (spawnTimer > 18) {
    spawnPattern();
    spawnTimer = 0;
    }

    // 7. Obstacle & Collision Loop
    for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += STATE.currentSpeed;

    // Collision Check
    const dz = Math.abs(obs.position.z - playerGroup.position.z);
    const dx = Math.abs(obs.position.x - playerGroup.position.x);

    if (dz < (obs.userData.depth / 2 + 0.3) && dx < 0.9) {
        const type = obs.userData.type;
        let hit = false;

        if (type === 'train') {
        hit = true;
        } else if (type === 'barrier_low' && playerGroup.position.y < 0.6) {
        hit = true; // Didn't jump over
        } else if (type === 'barrier_high' && !STATE.isSliding) {
        hit = true; // Didn't duck under
        }

        if (hit) {
        handleGameOver();
        return;
        }
    }

    // Cleanup past obstacles
    if (obs.position.z > 10) {
        scene.remove(obs);
        obstacles.splice(i, 1);
    }
    }

    // 8. Coins Loop
    for (let c = coins.length - 1; c >= 0; c--) {
    const coin = coins[c];
    coin.position.z += STATE.currentSpeed;
    coin.rotation.z += 0.05;

    // Coin Pickup Check
    const dz = Math.abs(coin.position.z - playerGroup.position.z);
    const dx = Math.abs(coin.position.x - playerGroup.position.x);
    const dy = Math.abs(coin.position.y - (playerGroup.position.y + 0.8));

    if (dz < 0.8 && dx < 0.8 && dy < 1.2) {
        STATE.coins++;
        document.getElementById('coins-display').innerText = STATE.coins;
        sfx.playCoin();
        triggerParticleBurst(coin.position, 0xfacc15, 10);

        scene.remove(coin);
        coins.splice(c, 1);
        continue;
    }

    if (coin.position.z > 10) {
        scene.remove(coin);
        coins.splice(c, 1);
    }
    }

    // 9. Particles animation
    for (let p = particles.length - 1; p >= 0; p--) {
    const pt = particles[p];
    pt.position.add(pt.userData.vel);
    pt.userData.life--;
    pt.scale.multiplyScalar(0.92);

    if (pt.userData.life <= 0) {
        scene.remove(pt);
        particles.splice(p, 1);
    }
    }
}

function handleGameOver() {
    STATE.isGameOver = true;
    sfx.playCrash();
    triggerParticleBurst(playerGroup.position, 0xef4444, 30);

    // Save Scores
    const newHigh = STATE.score > STATE.highScore;
    if (newHigh) {
    STATE.highScore = STATE.score;
    localStorage.setItem('runner_highscore', STATE.highScore);
    }
    STATE.totalCoins += STATE.coins;
    localStorage.setItem('runner_totalcoins', STATE.totalCoins);

    // UI Updates
    document.getElementById('final-score').innerText = STATE.score;
    document.getElementById('final-coins').innerText = STATE.coins;
    const newTag = document.getElementById('new-high-score-tag');
    if (newHigh) newTag.classList.remove('hidden');
    else newTag.classList.add('hidden');

    document.getElementById('hud-overlay').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function resetGame() {
    // Clear 3D Objects
    obstacles.forEach(o => scene.remove(o));
    coins.forEach(c => scene.remove(c));
    particles.forEach(p => scene.remove(p));
    obstacles.length = 0;
    coins.length = 0;
    particles.length = 0;

    // Reset State
    STATE.currentLane = 1;
    STATE.score = 0;
    STATE.coins = 0;
    STATE.currentSpeed = STATE.baseSpeed;
    STATE.isJumping = false;
    STATE.isSliding = false;
    STATE.isGameOver = false;
    STATE.playerY = 0;
    playerGroup.position.set(0, 0, 0);

    document.getElementById('score-display').innerText = '00000';
    document.getElementById('coins-display').innerText = '0';
}

function startGame() {
    sfx.init();
    resetGame();
    STATE.isStarted = true;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud-overlay').classList.remove('hidden');
}

// --- ANIMATION RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

window.onload = () => {
    animate();
};

// Screen Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- UI EVENT LISTENERS ---
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

document.getElementById('pause-btn').addEventListener('click', () => {
    STATE.isPaused = !STATE.isPaused;
    document.getElementById('pause-btn').innerHTML = STATE.isPaused ? 
    `<i class="fa-solid fa-play text-xl"></i>` : `<i class="fa-solid fa-pause text-xl"></i>`;
});

const pipBox = document.getElementById('webcam-pip');
document.getElementById('toggle-webcam-btn').addEventListener('click', () => {
    pipBox.classList.toggle('opacity-20');
});

// Instructions Modal
const modal = document.getElementById('instructions-modal');
document.getElementById('how-to-play-btn').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('modal-got-it-btn').addEventListener('click', () => modal.classList.add('hidden'));