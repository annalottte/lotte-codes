// ============================================================
//  state.js
//  Game state — one object (G) holds everything that changes
//  during play. Reset it to restart the game cleanly.
// ============================================================

// G is the single source of truth for the entire game.
// Every other module reads from and writes to G.
let G = {};

function initState() {
  G = {
    running: false,
    day: 1,
    cash: 0,
    totalEarned: 0,
    novelProgress: 0,    // 0–100
    timeLeft: 120,       // seconds this shift
    servedToday: 0,
    tipsToday: 0,
    earnedToday: 0,

    guests: [],
    guestIdCounter: 0,
    spawnTimer: 0,
    spawnInterval: 4.5,

    tables: [],
    waitingQueue: [],

    // Upgrades: bought flag lives here so it saves with the game state
    upgrades: Object.fromEntries(
      Object.entries(UPGRADES_DATA).map(([key, data]) => [key, { ...data, bought: false }])
    ),

    player: {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      moving: false,
      speed: 120,
      carrying: false,
      makingCoffee: false,
    },
  };
}

function setupTables() {
  const w = canvas.width;
  const h = canvas.height;
  const count = G.upgrades.extraTable.bought ? 4 : 3;

  G.tables = [];
  for (let i = 0; i < count; i++) {
    G.tables.push({
      id: i,
      x: w * (0.3 + i * (0.55 / count)),
      y: h * (i % 2 === 0 ? 0.33 : 0.62),
      guest: null,
    });
  }
}

function novelStage() {
  let label = NOVEL_STAGES[0].label;
  for (const stage of NOVEL_STAGES) {
    if (G.novelProgress >= stage.at) label = stage.label;
  }
  return label;
}
