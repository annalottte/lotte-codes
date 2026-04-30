// ============================================================
//  state.js
//  Game state — G is the single source of truth.
// ============================================================

let G = {};

function initState() {
  G = {
    running: false,
    day: 1,
    cash: 0,
    totalEarned: 0,
    novelProgress: 0,
    timeLeft: 120,
    servedToday: 0,
    tipsToday: 0,
    earnedToday: 0,

    guests: [],
    guestIdCounter: 0,
    spawnTimer: 0,
    spawnInterval: 4.5,

    // selectedGuest: the guest the player has clicked and is holding
    // They then click a table to seat that guest
    selectedGuest: null,

    tables: [],
    waitingQueue: [],

    upgrades: Object.fromEntries(
      Object.entries(UPGRADES_DATA).map(([key, data]) => [key, { ...data, bought: false }])
    ),

    player: {
      x: 0, y: 0,
      targetX: 0, targetY: 0,
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
  const defs = [...TABLE_DEFINITIONS];
  if (G.upgrades.extraTable.bought) defs.push(EXTRA_TABLE);

  G.tables = defs.map(def => ({
    ...def,
    x: w * def.xPct,
    y: h * def.yPct,
    guest: null,
  }));
}

function novelStage() {
  let label = NOVEL_STAGES[0].label;
  for (const stage of NOVEL_STAGES) {
    if (G.novelProgress >= stage.at) label = stage.label;
  }
  return label;
}
