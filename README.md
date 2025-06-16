# Emoji Rain Game with zkVM Verification

A fun emoji-catching game with zero-knowledge proof verification to ensure fair play and prevent cheating.

## 🎮 Game Features

- **Interactive Gameplay**: Catch falling Nexus logos and thematic emojis
- **Blockchain Integration**: Submit your high scores to the Nexus blockchain
- **Mobile Support**: Fully playable on both desktop and mobile devices
- **Visual Effects**: Smooth animations and visual feedback
- **Sound Effects**: Audio feedback when catching items
- **Responsive Design**: Works on various screen sizes

## 🎯 How to Play

1. Connect your MetaMask wallet (optional, but required for score submission)
2. Click or tap the falling items to score points
3. Try to catch as many items as possible within 30 seconds
4. Your score will be automatically submitted to the blockchain if you're connected

## 🎨 Game Elements

### Nexus Logo
- The official Nexus logo appears 30% of the time
- Represents the core branding of the game

### Thematic Emojis
- Space and tech-themed emojis appear 70% of the time
- Includes: 🚀 💫 🌌 ⚡ 🔮 🌠 💎 🔷 ✨ 🌟
- Each emoji has a different spawn rate for varied gameplay

## 🔧 Technical Requirements

- Modern web browser with JavaScript enabled
- MetaMask wallet (optional, for blockchain features)
- Internet connection (for blockchain interaction)

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## 📱 Mobile Support

The game is fully optimized for mobile devices:
- Touch-friendly interface
- Responsive design
- Optimized performance
- No additional setup required

## ⛓️ Blockchain Integration & Verifiable Gameplay

To prevent cheating, this game uses a **Zero-Knowledge Virtual Machine (zkVM)** to ensure all scores are earned legitimately. This provides mathematical certainty that the game's rules were followed.

### How it Works:
1. **Input Recording**: As you play, the game in your browser records your actions (clicks/taps) but does **not** calculate the score.
2. **Proof Generation**: At the end of the game, your recorded actions are sent to a backend **Proving Service**. This service re-runs the entire game session inside a **RISC Zero zkVM**, a verifiable Rust environment. This process generates a cryptographic ZK-proof.
3. **On-Chain Verification**: The ZK-proof and the resulting score are sent to our Nexus smart contract.
4. **Proof Matching**: The smart contract does not trust the score. Instead, it uses a **Verifier Contract** to mathematically check that the submitted proof is valid. Only if the proof is valid is the score accepted and recorded on the blockchain.

This system makes it impossible to submit a fake score, ensuring the leaderboard is fair and secure.

### Technical Components:
- **Client (Browser)**: Visuals and input recording.
- **Guest Program (Rust/RISC Zero)**: The deterministic game logic that runs inside the zkVM.
- **Proving Service (Backend)**: A host service that runs the guest program to generate proofs.
- **Smart Contract (Solidity)**: An on-chain contract that verifies the ZK-proofs using a `RiscZeroVerifier`.

## 🎵 Sound Effects

- Pop sound when catching items
- Audio feedback enhances the gaming experience

## 🏆 Scoring System

- Each caught item = 1 point
- 30-second time limit
- Different messages based on score:
  - 0 points: "Try clicking the Nexus logos and emojis!"
  - < 10 points: "Keep practicing!"
  - < 25 points: "Nice! You're quick!"
  - < 40 points: "Great job! Nexus fan!"
  - ≥ 40 points: "Incredible! Nexus Master!"

## 🔄 Game Loop

1. 30-second countdown
2. Items fall at random speeds
3. Click/tap to catch items
4. Score submission to blockchain
5. Restart option

## 🛠️ Development

### Prerequisites
- Node.js v14+
- Rust (for zkVM development)
- RISC Zero SDK (for real verification)

### Project Structure
```
.
├── server.js              # Express server with proving service
├── emoji-rain.js         # Game client code
├── risc0_guest/          # RISC Zero guest program
│   ├── src/
│   │   └── main.rs       # Game logic for zkVM
│   └── Cargo.toml
└── ScoreContract.sol     # Smart contract for score verification
```

### Enabling Real Verification
The current implementation uses mocked proofs. To enable real verification:

1. Install the RISC Zero SDK
2. Build the guest program
3. Deploy the verifier contract
4. Update the `IMAGE_ID` in `ScoreContract.sol`
5. Update the proving service in `server.js` to use the real prover

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue in the repository or contact the development team.
