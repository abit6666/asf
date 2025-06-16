const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.static('.'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected players
const players = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    players[socket.id] = { x: 0, y: 1, z: 0 };

    // Handle player position updates
    socket.on('updatePosition', (data) => {
        players[socket.id] = data;
        io.emit('updatePlayers', players);
    });

    // Handle node placement
    socket.on('placeNode', (data) => {
        io.emit('newNode', data);
    });

    // Handle puzzle completion
    socket.on('puzzleComplete', (data) => {
        io.emit('puzzleUpdate', { playerId: socket.id, ...data });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
        console.log('Player disconnected:', socket.id);
    });
});

// This endpoint receives the player's game data, generates a proof, and returns it.
app.post('/prove-score', (req, res) => {
    const { reaction_times, total_perfects } = req.body;

    // Create a temporary directory for this proof generation
    const tempDir = path.join(__dirname, 'temp_proofs');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, `inputs_${Date.now()}.json`);
    fs.writeFileSync(inputPath, JSON.stringify({
        reaction_times,
        total_perfects
    }));

    // For now, we'll use a mocked proof generation
    // In production, this would call the actual RISC Zero prover
    const mockProof = {
        proof: "mock_proof_" + Date.now(),
        result: {
            avgReaction: reaction_times.reduce((a, b) => a + b, 0) / reaction_times.length,
            iqScore: Math.floor(100 + (total_perfects * 10)),
            consistency: 85,
            rounds: reaction_times.length
        }
    };

    // Clean up the temporary file
    fs.unlinkSync(inputPath);

    res.json(mockProof);
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Game server with zk-verification running on http://localhost:${PORT}`);
    console.log('NOTE: This server uses MOCKED proof generation and verification.');
    console.log('To enable real verification, install the RISC Zero SDK and update the code.');
}); 