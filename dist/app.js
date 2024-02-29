"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cli_progress_1 = require("cli-progress");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
// Create a new progress bar
const progressBar = new cli_progress_1.SingleBar({
    format: '\x1b[32m 💕 Bridge 🌉 game 🎮 server 💻 is loading🧍 \x1b[0m{bar} \x1b[32m{percentage}%\x1b[0m | ETA: {eta}s | Port: \x1b[32m' + port + '\x1b[0m',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});
// Simulate some loading time
const loadingTime = 2000;
const progressInterval = 50;
let progress = 0;
// Start the progress bar
progressBar.start(100, 0);
// Update progress bar every progressInterval milliseconds
const interval = setInterval(() => {
    progress += (progressInterval / loadingTime) * 100;
    progressBar.update(progress);
    if (progress >= 100) {
        clearInterval(interval);
        progressBar.stop();
        // Start the express server
        app.listen(port, () => {
            console.log(`\x1b[32m💕 Bridge 🌉 game 🎮 server 💻 is running 🏃 at http://localhost:${port}\x1b[0m`);
            console.log('\x1b[31mI Norge anses private gamblingaktiviteter utført uten riktig autorisasjon fra Lotteritilsynet som ulovlige i henhold til Lov om pengespill (pengespilloven).\nDette inkluderer organisering eller deltakelse i uautoriserte gamblingarrangementer eller tjenester utenfor lisensierte arenaer eller plattformer.\nÅ delta i slike aktiviteter kan føre til juridiske konsekvenser og straffer.\x1b[0m');
        });
    }
}, progressInterval);
// Example: in-memory storage for bridge game state
let game = null;
// Function to deal cards to players
function dealCards() {
    // Create a standard deck of 52 cards
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // Distribute cards to players
    const numPlayers = game.players.length;
    for (let i = 0; i < numPlayers; i++) {
        game.hands.push(deck.splice(0, 13));
    }
}
// Route to create a new bridge game
app.post('/bridge/create', (req, res) => {
    // Initialize game state
    game = {
        players: [],
        hands: [],
        // Add other properties as needed for your game
    };
    res.status(201).json({ message: 'Bridge game created successfully' });
});
// Route to add a player to the bridge game
app.post('/bridge/add-player', (req, res) => {
    const playerName = req.body.playerName;
    if (!playerName) {
        return res.status(400).json({ error: 'Player name is required' });
    }
    // Check if the game exists
    if (!game) {
        return res.status(404).json({ error: 'Bridge game not found. Create a game first.' });
    }
    // Add the player to the game
    game.players.push({ name: playerName });
    // Deal cards if all players have joined
    if (game.players.length === 4) {
        dealCards();
    }
    res.status(200).json({ message: `${playerName} added to the game` });
});
// Route to list players in the current game
app.get('/bridge/list-players', (req, res) => {
    // Check if the game exists
    if (!game) {
        return res.status(404).json({ error: 'Bridge game not found. Create a game first.' });
    }
    // Check if players have been added to the game
    if (game.players.length === 0) {
        return res.status(404).json({ error: 'No players have been added to the game yet.' });
    }
    // Respond with the list of players
    res.status(200).json({ players: game.players });
});
// Route to allow a player to make a bid
app.post('/bridge/bid', (req, res) => {
    const playerName = req.body.playerName;
    const bid = req.body.bid;
    // Check if the game exists
    if (!game) {
        return res.status(404).json({ error: 'Bridge game not found. Create a game first.' });
    }
    // Find the player in the game
    const playerIndex = game.players.findIndex((p) => p.name === playerName);
    if (playerIndex === -1) {
        return res.status(404).json({ error: 'Player not found in the game' });
    }
    // Get the player's index in the rotation (0-based)
    const playerRotationIndex = playerIndex % 4;
    // Check if the player is the second one after the opener
    if (playerRotationIndex === 1) {
        // Logic to check if the player's hand meets the criteria for bidding
        // Implement the logic based on the specified rule
        // For now, let's assume the player always meets the criteria
        const meetsCriteria = true;
        if (meetsCriteria) {
            // Respond with a bid
            res.status(200).json({ message: `${playerName} made a bid of ${bid}` });
        }
        else {
            // Respond with a pass
            res.status(200).json({ message: `${playerName} passed` });
        }
    }
    else {
        // Player is not the second one after the opener, so respond with a pass
        res.status(200).json({ message: `${playerName} passed` });
    }
});
// Route to restart the game
app.post('/bridge/restart', (req, res) => {
    try {
        if (game) {
            // Reset game state
            game = null;
            res.status(200).json({ message: 'Game restarted. Start adding new players to start a new game' });
        }
        else {
            res.status(400).json({ message: 'Game not running' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Route to let the players check the teams
app.get('/bridge/teams', (req, res) => {
    try {
        if (game && game.players.length === 4) {
            // Assuming teams are determined based on the order of joining
            const team1 = [game.players[0], game.players[2]]; // Players 1 and 3
            const team2 = [game.players[1], game.players[3]]; // Players 2 and 4
            res.status(200).json({ team1, team2 });
        }
        else {
            res.status(400).json({ message: 'Game not running or insufficient players' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=app.js.map