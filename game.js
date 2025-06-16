// Nexus Node Dash - Endless Runner
let scene, camera, renderer, player, nodes = [], obstacles = [];
let lane = 0, lanes = [-2, 0, 2];
let speed = 0.15, zPos = 0, score = 0, bestScore = 0, gameOver = false;
let keys = {};

// Replace with your actual ABI and contract address
const contractABI = [ /* ... ABI from Remix ... */ ];
const contractAddress = "0xYourDeployedContractAddress";
let web3, contract, account;

function createUI() {
    let ui = document.getElementById('ui');
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'ui';
        ui.style.position = 'absolute';
        ui.style.top = '20px';
        ui.style.left = '50%';
        ui.style.transform = 'translateX(-50%)';
        ui.style.color = 'white';
        ui.style.fontFamily = 'Arial';
        ui.style.fontSize = '24px';
        ui.style.textAlign = 'center';
        ui.style.zIndex = 1000;
        document.body.appendChild(ui);
    }
    ui.innerHTML = `<div id="score">Score: 0</div><div id="best">Best: 0</div><div id="gameOver" style="display:none;margin-top:20px;">
        <b>Game Over!</b><br><button id="restartBtn">Restart</button></div>`;
    document.getElementById('restartBtn').onclick = restartGame;
}

function updateUI() {
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('best').innerText = `Best: ${bestScore}`;
    document.getElementById('gameOver').style.display = gameOver ? 'block' : 'none';
}

function init() {
    // Remove old canvas/UI
    let oldCanvas = document.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    let oldUI = document.getElementById('ui');
    if (oldUI) oldUI.remove();
    createUI();
    // Three.js setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0a0a1a);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // Lighting
    scene.add(new THREE.AmbientLight(0x4040ff, 1.5));
    let light = new THREE.PointLight(0x00ffff, 2, 30);
    light.position.set(0, 10, 10);
    scene.add(light);
    // Floor
    let floorGeo = new THREE.PlaneGeometry(10, 200);
    let floorMat = new THREE.MeshPhongMaterial({ color: 0x111144, shininess: 80 });
    let floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);
    // Player
    let playerGeo = new THREE.SphereGeometry(0.5, 32, 32);
    let playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x003366, shininess: 100 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 0.5, 0);
    scene.add(player);
    // Reset state
    nodes = [];
    obstacles = [];
    lane = 1;
    zPos = 0;
    score = 0;
    gameOver = false;
    // Camera
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0.5, 0);
    // Input
    keys = {};
    window.onkeydown = e => keys[e.code] = true;
    window.onkeyup = e => keys[e.code] = false;
    // Spawn initial nodes/obstacles
    for (let i = 10; i < 60; i += 5) {
        spawnNodeOrObstacle(i);
    }
    animate();
}

function spawnNodeOrObstacle(z) {
    // 70% chance node, 30% obstacle
    if (Math.random() < 0.7) {
        let laneIdx = Math.floor(Math.random() * 3);
        let nodeGeo = new THREE.IcosahedronGeometry(0.4, 1);
        let nodeMat = new THREE.MeshPhongMaterial({ color: 0x00aaff, emissive: 0x003366, shininess: 100 });
        let node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(lanes[laneIdx], 0.5, -z);
        node.userData.type = 'node';
        scene.add(node);
        nodes.push(node);
    } else {
        let laneIdx = Math.floor(Math.random() * 3);
        let obsGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        let obsMat = new THREE.MeshPhongMaterial({ color: 0xff0033, emissive: 0x330000 });
        let obs = new THREE.Mesh(obsGeo, obsMat);
        obs.position.set(lanes[laneIdx], 0.4, -z);
        obs.userData.type = 'obstacle';
        scene.add(obs);
        obstacles.push(obs);
    }
}

function animate() {
    if (gameOver) return updateUI();
    requestAnimationFrame(animate);
    // Move player left/right
    if ((keys['ArrowLeft'] || keys['KeyA']) && lane > 0) { lane--; keys['ArrowLeft'] = keys['KeyA'] = false; }
    if ((keys['ArrowRight'] || keys['KeyD']) && lane < 2) { lane++; keys['ArrowRight'] = keys['KeyD'] = false; }
    // Smooth lane movement
    player.position.x += (lanes[lane] - player.position.x) * 0.2;
    // Move everything towards player
    zPos += speed;
    nodes.forEach(n => n.position.z += speed);
    obstacles.forEach(o => o.position.z += speed);
    // Remove passed objects, spawn new
    if (nodes.length && nodes[0].position.z > 5) {
        scene.remove(nodes[0]); nodes.shift();
        spawnNodeOrObstacle(zPos + 50);
    }
    if (obstacles.length && obstacles[0].position.z > 5) {
        scene.remove(obstacles[0]); obstacles.shift();
        spawnNodeOrObstacle(zPos + 50);
    }
    // Collision detection
    nodes.forEach((n, i) => {
        if (Math.abs(n.position.z - player.position.z) < 0.7 && Math.abs(n.position.x - player.position.x) < 0.7) {
            score++;
            scene.remove(n);
            nodes.splice(i, 1);
            updateUI();
        }
    });
    obstacles.forEach(o => {
        if (Math.abs(o.position.z - player.position.z) < 0.7 && Math.abs(o.position.x - player.position.x) < 0.7) {
            gameOver = true;
            if (score > bestScore) bestScore = score;
            updateUI();
        }
    });
    // Camera follows player
    camera.position.x += (player.position.x - camera.position.x) * 0.1;
    camera.lookAt(player.position.x, 0.5, player.position.z - 5);
    renderer.render(scene, camera);
    updateUI();
}

function restartGame() {
    init();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            account = accounts[0];
            contract = new web3.eth.Contract(contractABI, contractAddress);
            document.getElementById('score').innerText = `Wallet: ${account}`;
        } catch (e) {
            alert('Wallet connection failed');
        }
    } else {
        alert('MetaMask not found. Please install MetaMask.');
    }
}

document.getElementById('connectWallet').onclick = connectWallet;

async function recordScoreOnChain(score) {
    if (contract && account) {
        try {
            await contract.methods.recordScore(score).send({ from: account });
            alert('Score recorded on Nexus!');
        } catch (e) {
            alert('Failed to record score on chain.');
        }
    }
}

init(); 