// Add CSS styles for the game
const style = document.createElement('style');
style.textContent = `
    .logo, .emoji {
        position: absolute;
        cursor: pointer;
        transition: transform 0.1s ease-out;
        pointer-events: auto;
        touch-action: none;
        font-size: 40px;
        line-height: 40px;
        text-align: center;
    }
    .logo svg {
        width: 40px;
        height: 40px;
        filter: drop-shadow(0 0 5px rgba(0,0,0,0.3));
    }
    .emoji {
        filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
    }
    .logo:hover, .emoji:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

const contractAddress = '0x5FfD7c5A6E4e47CB2FD75B438eA95732eDAC5166'; // Replace with your deployed contract address
const contractABI = [
  {
    "inputs": [{"internalType": "uint256","name": "score","type": "uint256"}],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyBestScore",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3, contract, account;
const connectBtn = document.getElementById('connectWallet');
const walletDiv = document.getElementById('wallet');

connectBtn.onclick = async function() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      account = accounts[0];
      contract = new web3.eth.Contract(contractABI, contractAddress);
      walletDiv.innerText = `Wallet: ${account.slice(0,6)}...${account.slice(-4)}`;
    } catch (e) {
      walletDiv.innerText = 'Wallet: Connection failed';
    }
  } else {
    walletDiv.innerText = 'Wallet: MetaMask not found';
  }
};

const gameArea = document.getElementById('gameArea');
const timerDiv = document.getElementById('timer');
const scoreDiv = document.getElementById('score');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');
const popSound = document.getElementById('popSound');

// Load the Nexus logo SVG
let nexusLogo = '';
fetch('nexus-logo.svg')
    .then(response => response.text())
    .then(svg => {
        nexusLogo = svg;
    });

// Thematic emojis that complement the Nexus theme
const EMOJIS = ['🚀', '💫', '🌌', '⚡', '🔮', '🌠', '💎', '🔷', '✨', '🌟'];
const EMOJI_WEIGHTS = [3, 2, 2, 2, 2, 2, 1, 1, 1, 1]; // Higher weight for more common emojis

let time = 30.0;
let score = 0;
let timer = null;
let running = false;
let spawnInterval = null;
let itemId = 0;
let recordedClicks = [];
let reactionTimes = [];
let totalPerfects = 0;
let gameStartTime = 0;
let randomSeed = 0;

function getRandomItem() {
    // 30% chance for Nexus logo, 70% chance for emoji
    if (Math.random() < 0.3) {
        return { type: 'logo', content: nexusLogo };
    } else {
        // Weighted random selection for emojis
        const totalWeight = EMOJI_WEIGHTS.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < EMOJIS.length; i++) {
            random -= EMOJI_WEIGHTS[i];
            if (random <= 0) {
                return { type: 'emoji', content: EMOJIS[i] };
            }
        }
        return { type: 'emoji', content: EMOJIS[0] };
    }
}

function startGame() {
    time = 30.0;
    score = 0;
    running = true;
    scoreDiv.innerText = '0';
    timerDiv.innerText = time.toFixed(1);
    messageDiv.innerText = '';
    restartBtn.style.display = 'none';
    gameArea.innerHTML = '';
    recordedClicks = [];
    reactionTimes = [];
    totalPerfects = 0;
    gameStartTime = Date.now();
    randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    
    // Start timer
    timer = setInterval(() => {
        time -= 0.1;
        if (time <= 0) {
            endGame();
        } else {
            timerDiv.innerText = time.toFixed(1);
        }
    }, 100);
    // Spawn items
    spawnInterval = setInterval(spawnItem, 400);
}

async function endGame() {
    running = false;
    clearInterval(timer);
    clearInterval(spawnInterval);
    timerDiv.innerText = '0.0';
    // Remove all items
    setTimeout(() => gameArea.innerHTML = '', 800);
    let msg = '';
    if (score === 0) msg = "Try clicking the Nexus logos and emojis!";
    else if (score < 10) msg = "Keep practicing!";
    else if (score < 25) msg = "Nice! You're quick!";
    else if (score < 40) msg = "Great job! Nexus fan!";
    else msg = "Incredible! Nexus Master!";
    messageDiv.innerText = `Time's up!\n${msg}`;
    // Always show replay button at end
    restartBtn.style.display = 'inline-block';

    if (!contract || !account) {
        messageDiv.innerText += "\nConnect wallet to submit score.";
        restartBtn.style.display = 'inline-block';
        return;
    }

    try {
        // 1. Send recorded inputs to our proving service
        const proveResponse = await fetch('http://localhost:3000/prove-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reaction_times: reactionTimes,
                total_perfects: totalPerfects
            }),
        });

        if (!proveResponse.ok) {
            throw new Error('Failed to communicate with proving service.');
        }

        const { proof, result } = await proveResponse.json();
        messageDiv.innerText = `Proof generated!\nIQ Score: ${result.iqScore}\nConsistency: ${result.consistency}%\nSubmitting to the blockchain...`;
        
        // 2. Submit the verified score and proof to the smart contract
        await contract.methods.submitVerifiedScore(proof).send({ from: account });
        
        messageDiv.innerText += '\nScore successfully verified and submitted to Nexus!';

    } catch (err) {
        messageDiv.innerText += '\nFailed to submit score. See console for details.';
        console.error('Submission error:', err);
    } finally {
        restartBtn.style.display = 'inline-block';
    }
}

function spawnItem() {
    if (!running) return;
    const item = getRandomItem();
    const itemContainer = document.createElement('div');
    itemContainer.className = item.type === 'logo' ? 'logo' : 'emoji';
    
    if (item.type === 'logo') {
        itemContainer.innerHTML = item.content;
        const svg = itemContainer.querySelector('svg');
        svg.style.width = '40px';
        svg.style.height = '40px';
    } else {
        itemContainer.innerText = item.content;
    }
    
    const left = Math.random() * (gameArea.offsetWidth - 40);
    itemContainer.style.left = `${left}px`;
    itemContainer.style.top = '-40px';
    itemContainer.dataset.id = itemId++;
    
    // Set target time for perfect click calculation
    const targetTime = Date.now() - gameStartTime + 2000; // 2 seconds to reach bottom
    itemContainer.dataset.targetTime = targetTime;
    
    gameArea.appendChild(itemContainer);
    
    // Animate falling
    let pos = -40;
    const speed = 2 + Math.random() * 2;
    const fall = setInterval(() => {
        if (!running) { clearInterval(fall); return; }
        pos += speed;
        itemContainer.style.top = `${pos}px`;
        if (pos > gameArea.offsetHeight) {
            clearInterval(fall);
            if (itemContainer.parentNode) itemContainer.parentNode.removeChild(itemContainer);
        }
    }, 20);
    
    // Click to score
    itemContainer.onclick = recordClick;
    itemContainer.ontouchstart = (e) => {
        e.preventDefault();
        recordClick(e);
    };
}

// Modify the click handlers to record reaction time
function recordClick(e) {
    if (!running) return;

    const reactionTime = Date.now() - gameStartTime;
    reactionTimes.push(reactionTime);
    
    // Check if it was a "perfect" click (within 100ms of target)
    const itemContainer = e.currentTarget;
    const targetTime = parseInt(itemContainer.dataset.targetTime);
    if (Math.abs(reactionTime - targetTime) < 100) {
        totalPerfects++;
    }
    
    // Play sound and visual effect locally
    itemContainer.style.transform = 'scale(1.3)';
    setTimeout(() => {
        if (itemContainer.parentNode) itemContainer.parentNode.removeChild(itemContainer);
    }, 80);
    popSound.currentTime = 0;
    popSound.play();
}

restartBtn.onclick = function() {
    // Clean up any remaining items
    gameArea.innerHTML = '';
    startGame();
};

// Start on load
startGame(); 
