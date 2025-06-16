// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// The specialized inspector
interface IRiscZeroVerifier {
    function verify(bytes calldata journal, bytes32 imageId, bytes calldata seal) external view returns (bool);
}

contract NexusEmojiRainScore {
    // The inspector's address, set at deployment
    IRiscZeroVerifier public verifier;
    // The recipe's fingerprint, hardcoded for security
    bytes32 public constant IMAGE_ID = 0x0000000000000000000000000000000000000000000000000000000000000000; // Replace with actual image ID

    struct GameResult {
        uint256 avgReaction;  // Average reaction time in milliseconds
        uint256 iqScore;      // Calculated IQ score
        uint256 consistency;  // Consistency score (0-100)
        uint256 rounds;       // Number of rounds played
    }

    mapping(address => GameResult) public bestResults;
    mapping(address => uint256) public bestScores;

    event ScoreSubmitted(
        address player,
        uint256 avgReaction,
        uint256 iqScore,
        uint256 consistency,
        uint256 rounds
    );

    constructor(address _verifierAddress) {
        verifier = IRiscZeroVerifier(_verifierAddress);
    }

    function submitVerifiedScore(bytes calldata seal) external {
        // Step 1: Extract the public output (the "Journal") from the proof data
        (bytes memory journal, ) = abi.decode(seal, (bytes, bytes[]));
        
        // Decode the GameResult from the journal
        GameResult memory result = abi.decode(journal, (GameResult));

        // Step 2: Call the Verifier Contract
        bool success = verifier.verify(
            journal,  // The claimed output (the game result)
            IMAGE_ID, // The required program fingerprint
            seal      // The cryptographic evidence
        );

        // Step 3: Verify the proof
        require(success, "ZK proof verification failed");

        // Step 4: Update the player's best result if better
        GameResult storage currentBest = bestResults[msg.sender];
        if (result.iqScore > currentBest.iqScore) {
            bestResults[msg.sender] = result;
            bestScores[msg.sender] = result.iqScore;
        }
        
        emit ScoreSubmitted(
            msg.sender,
            result.avgReaction,
            result.iqScore,
            result.consistency,
            result.rounds
        );
    }

    function getMyBestResult() external view returns (
        uint256 avgReaction,
        uint256 iqScore,
        uint256 consistency,
        uint256 rounds
    ) {
        GameResult storage result = bestResults[msg.sender];
        return (
            result.avgReaction,
            result.iqScore,
            result.consistency,
            result.rounds
        );
    }
} 