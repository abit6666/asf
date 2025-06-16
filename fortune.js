// Replace with your deployed contract address and ABI from Remix
const contractAddress = '0x65fd84ae49F576C6490Cf2dcFfaEE84C9c4198F0';
const contractABI = [
  { "inputs": [], "name": "openCookie", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "getMyFortunes", "outputs": [ { "internalType": "string[3]", "name": "", "type": "string[3]" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getAllFortunes", "outputs": [ { "internalType": "string[]", "name": "", "type": "string[]" } ], "stateMutability": "view", "type": "function" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "string", "name": "fortune", "type": "string" } ], "name": "FortuneOpened", "type": "event" }
];

let web3, contract, account;
const connectBtn = document.getElementById('connectWallet');
const cookieBtn = document.getElementById('cookieBtn');
const walletDiv = document.getElementById('wallet');
const fortuneDiv = document.getElementById('fortune');
const cookieImg = document.getElementById('cookieImg');
const lastFortunesDiv = document.getElementById('lastFortunes');
const fortuneListDiv = document.getElementById('fortuneList');

connectBtn.onclick = async function() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      account = accounts[0];
      contract = new web3.eth.Contract(contractABI, contractAddress);
      walletDiv.innerText = `Wallet: ${account.slice(0,6)}...${account.slice(-4)}`;
      cookieBtn.disabled = false;
      showLastFortunes();
    } catch (e) {
      walletDiv.innerText = 'Wallet: Connection failed';
    }
  } else {
    walletDiv.innerText = 'Wallet: MetaMask not found';
  }
};

cookieBtn.onclick = async function() {
  if (!contract || !account) return;
  cookieBtn.disabled = true;
  fortuneDiv.innerText = '';
  cookieImg.classList.add('open');
  setTimeout(() => cookieImg.classList.remove('open'), 1200);
  try {
    const tx = await contract.methods.openCookie().send({ from: account });
    // Find the FortuneOpened event in the receipt
    let fortune = '';
    if (tx.events && tx.events.FortuneOpened) {
      fortune = tx.events.FortuneOpened.returnValues.fortune;
    }
    setTimeout(() => {
      fortuneDiv.innerText = fortune ? `"${fortune}"` : 'No fortune found.';
      cookieBtn.disabled = false;
      showLastFortunes();
    }, 1200);
  } catch (e) {
    fortuneDiv.innerText = 'Failed or cancelled.';
    cookieBtn.disabled = false;
  }
};

async function showLastFortunes() {
  if (!contract || !account) return;
  try {
    const fortunes = await contract.methods.getMyFortunes().call({ from: account });
    let html = '';
    let count = 0;
    for (let i = 0; i < fortunes.length; ++i) {
      if (fortunes[i] && fortunes[i].trim() !== '') {
        html += `<div class='fortuneItem'>${fortunes[i]}</div>`;
        count++;
      }
    }
    if (count > 0) {
      lastFortunesDiv.style.display = 'block';
      fortuneListDiv.innerHTML = html;
    } else {
      lastFortunesDiv.style.display = 'none';
    }
  } catch (e) {
    lastFortunesDiv.style.display = 'none';
  }
} 