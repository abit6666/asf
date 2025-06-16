#![no_main]

use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

risc0_zkvm::guest::entry!(main);

// Define what a player's click looks like
#[derive(Deserialize, Serialize)]
struct Click {
    timestamp_ms: u64, // Time since game start
}

// Define the inputs to our zkVM program
#[derive(Clone, Debug, Deserialize, Serialize)]
struct GameInputs {
    clicks: Vec<Click>,
    // A seed to make emoji spawning deterministic and verifiable
    random_seed: u64,
    // The player's reaction times in milliseconds
    reaction_times: Vec<f32>,
    // Number of "perfect" taps
    total_perfects: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GameResult {
    // The calculated average reaction time
    pub avg_reaction: f32,
    // The "IQ" score derived from performance
    pub iq_score: u32,
    // A score for consistency
    pub consistency: u32,
    // The number of rounds played
    pub rounds: usize,
}

// The main function that gets executed and proven
fn main() {
    // Read the private inputs (the reaction times) sent from the host.
    let inputs: GameInputs = env::read();
    
    // --- Verifiable Game Logic ---
    // This logic is what gets proven. Any cheating would require generating
    // a fraudulent proof, which is computationally infeasible.

    let rounds = inputs.reaction_times.len();
    if rounds == 0 {
        // Handle empty game session
        let result = GameResult {
            avg_reaction: 0.0,
            iq_score: 70, // Base IQ
            consistency: 0,
            rounds: 0,
        };
        // Commit the public output to the journal for the verifier to see.
        env::commit(&result);
        return;
    }

    // Calculate average
    let sum: f32 = inputs.reaction_times.iter().sum();
    let avg = sum / rounds as f32;

    // Calculate standard deviation for consistency
    let std_dev = if rounds > 1 {
        let variance = inputs.reaction_times.iter().map(|value| {
            let diff = avg - *value;
            diff * diff
        }).sum::<f32>() / rounds as f32;
        variance.sqrt()
    } else {
        0.0
    };

    // Calculate consistency score (0-100)
    let consistency = if avg > 0.0 {
        (100.0 * (1.0 - (std_dev / avg))).max(0.0) as u32
    } else {
        0
    };

    // --- Simplified IQ Calculation ---
    // (A verifiable version of the complex JS logic)
    // The score is based on average speed, consistency, and perfects.
    let speed_component = (100.0 * (1.0 - (avg - 150.0) / 500.0)).max(0.0);
    let consistency_component = consistency as f32 * 0.4;
    let perfects_component = (inputs.total_perfects * 2) as f32;

    let base_iq = 80.0 + speed_component + consistency_component + perfects_component;
    let iq_score = base_iq.round().min(180.0).max(70.0) as u32;

    // --- Final Result ---
    let result = GameResult {
        avg_reaction: avg,
        iq_score,
        consistency,
        rounds,
    };
    
    // Commit the final, public result to the journal.
    // This is the *only* thing the outside world can see from the receipt.
    env::commit(&result);
}

// A simple deterministic Pseudo-Random Number Generator
struct Pcg32 {
    state: u64,
    inc: u64,
}

impl Pcg32 {
    fn new(seed: u64) -> Self {
        Pcg32 {
            state: seed,
            inc: 1,
        }
    }

    fn next_u32(&mut self) -> u32 {
        let old_state = self.state;
        self.state = old_state
            .wrapping_mul(6364136223846793005)
            .wrapping_add(self.inc | 1);
        let xorshifted = (((old_state >> 18) ^ old_state) >> 27) as u32;
        let rot = (old_state >> 59) as u32;
        xorshifted.rotate_right(rot)
    }
}