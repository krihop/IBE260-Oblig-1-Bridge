import express, { Request, Response } from 'express';
import { SingleBar } from 'cli-progress';

const app = express();
const port = 3000;

app.use(express.json());

// Create a new progress bar
const progressBar = new SingleBar({
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
      });
  }
}, progressInterval);

// Example: in-memory storage for bridge game state
let game: any = null;
let isFirstBid = true; // Flag to track if it's the first bid in the game

// Declare variables for dealer and current player index
let dealerIndex: number = 0; // Index of the dealer in the players array
let currentPlayerIndex: number = (dealerIndex + 1) % 4; // Index of the player to the left of the dealer

// High-Card Points (HCP)
function calculateHighCardPoints(hand: any[]): number {
  // Assign points to each card rank and sum them up
  let points = 0;
  for (const card of hand) {
    switch (card.rank) {
      case 'Ace':
        points += 4;
        break;
      case 'King':
        points += 3;
        break;
      case 'Queen':
        points += 2;
        break;
      case 'Jack':
        points += 1;
        break;
      default:
        // Other ranks contribute no points
        break;
    }
  }
  return points;
}

// Deal cards to players
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
app.post('/bridge/create', (req: Request, res: Response) => {
  // Initialize game state
  game = {
    players: [],
    hands: [],
    // Add other properties as needed for your game
  };

  // Log the creation of a new bridge game
  console.log('Bridge game created successfully');

  res.status(201).json({ message: 'Bridge game created successfully' });
});

// Route to add players to the bridge game
app.post('/bridge/add-players', (req: Request, res: Response) => {
  const playerNames = req.body.players;

  // Check if the game exists
  if (!game) {
    return res.status(404).json({ error: 'Bridge game not found. Create a game first.' });
  }

  // Check if player names are provided
  if (!playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
    return res.status(400).json({ error: 'Player names must be provided as a non-empty array.' });
  }

  // Check if adding new players will exceed the maximum limit
  const totalPlayers = game.players.length + playerNames.length;
  if (totalPlayers > 4) {
    return res.status(400).json({ error: 'Maximum number of players (4) reached.' });
  }

  // Add players to the game
  for (const playerName of playerNames) {
    game.players.push({ name: playerName });
    
    // Log the added player
    console.log('Player added to the game:', playerName);
  }
  
  // Deal cards if all players have joined
  if (game.players.length === 4) {
    dealCards();
  }

  // Respond with success message
  res.status(200).json({ message: 'Players added successfully' });
});

// Route to list players in the current game
app.get('/bridge/list-players', (req: Request, res: Response) => {
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

// Validate a bid
function isValidBid(bid: number, suit?: string): boolean {
  if (bid < 1 || bid > 7) {
    return false; // Bid level out of range
  }

  if (suit && !['Spades', 'Hearts', 'Diamonds', 'Clubs'].includes(suit)) {
    return false; // Invalid suit
  }

  return true; // Valid bid
}

// Route to allow a player to make a bid
app.post('/bridge/bid', (req: Request, res: Response) => {
  const playerName = req.body.playerName;
  const bid = req.body.bid;
  const suit = req.body.suit;

  // Check if the game exists
  if (!game) {
    return res.status(404).json({ error: 'Bridge game not found. Create a game first.' });
  }

  // Find the player in the game
  const playerIndex = game.players.findIndex((p: any) => p.name === playerName);

  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found in the game' });
  }

  // Log whose turn it is to bid
  const currentTurnPlayer = game.players[currentPlayerIndex].name;
  console.log(`It's ${currentTurnPlayer}'s turn to bid.`);

  // Check if it's the player's turn to bid
  if (playerIndex !== currentPlayerIndex) {
    return res.status(400).json({ error: `It is not your turn to bid. It's ${currentTurnPlayer}'s turn.` });
  }

  // If it's the first bid, log who should start
  if (isFirstBid) {
    const startingPlayer = game.players[currentPlayerIndex].name;
    console.log(`The first bid should be made by: ${startingPlayer}`);
    isFirstBid = false; // Update the flag
  }

  // Check if the current player is player number 2
  if (playerIndex === (dealerIndex + 2) % 4) {
    const hand = game.hands[playerIndex];
    const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades', 'NT'];
    
    for (let i = 0; i < suits.length - 1; i++) {
      const suit = suits[i];
      const nextSuit = suits[i + 1];
      const suitLength = hand.filter((card: any) => card.suit === suit).length;
      const nextSuitLength = hand.filter((card: any) => card.suit === nextSuit).length;
      const hp = calculateHighCardPoints(hand);

      if (suitLength >= 5 && hp >= 8) {
        // Make the bid at one-level
        const bidLevel = i + 1;
        const bidSuit = suit;
        const message = `${game.players[playerIndex].name} made a bid of ${bidLevel} ${bidSuit}`;
        console.log(message);
        break;
      } else if (nextSuitLength >= 5 && hp >= 10) {
        // Make the bid at two-level
        const bidLevel = i + 2;
        const bidSuit = nextSuit;
        const message = `${game.players[playerIndex].name} made a bid of ${bidLevel} ${bidSuit}`;
        console.log(message);
        break;
      }
    }
  }

  // Logic to check if the bid is valid
  if (isValidBid(bid, suit)) {
    // Log the bid in the terminal
    const message = `${playerName} made a bid of ${bid} ${suit ? 'in ' + suit : 'in NT'}`;
    console.log(message);

    // Move to the next player in the rotation
    currentPlayerIndex = (currentPlayerIndex + 1) % 4;

    // Log whose turn it is next
    const nextPlayer = game.players[currentPlayerIndex].name;
    console.log(`Next turn: ${nextPlayer}`);

    // Respond with the bid
    res.status(200).json({ message });
  } else {
    // Log the pass in the terminal
    console.log(`${playerName} passed`);

    // Move to the next player in the rotation
    currentPlayerIndex = (currentPlayerIndex + 1) % 4;

    // Log whose turn it is next
    const nextPlayer = game.players[currentPlayerIndex].name;
    console.log(`Next turn: ${nextPlayer}`);

    // Respond with a pass
    res.status(200).json({ message: `${playerName} passed` });
  }
});

// Route to restart the game
app.post('/bridge/restart', (req: Request, res: Response) => {
  try {
    if (game) {
      // Reset game state
      game = null;
      res.status(200).json({ message: 'Game restarted. Start adding new players to start a new game' });
    } else {
      res.status(400).json({ message: 'Game not running' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to let the players check the teams
app.get('/bridge/teams', (req: Request, res: Response) => {
  try {
    if (game && game.players.length === 4) {
      // Assuming teams are determined based on the order of joining
      const team1 = [game.players[0], game.players[2]]; // Players 1 and 3
      const team2 = [game.players[1], game.players[3]]; // Players 2 and 4
      res.status(200).json({ team1, team2 });
    } else {
      res.status(400).json({ message: 'Game not running or insufficient players' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});