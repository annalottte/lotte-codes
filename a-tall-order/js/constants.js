// ============================================================
//  constants.js
//  All fixed game data — tweak values here without touching logic
// ============================================================

// Table positions expressed as fractions of canvas (0–1)
// so they scale at any window size.
// Mapped from the 1536x1024 background image.
const TABLE_DEFINITIONS = [
  { id: 0, xPct: 0.295, yPct: 0.610, label: 'Table 1', seats: 4 },
  { id: 1, xPct: 0.445, yPct: 0.525, label: 'Table 2', seats: 4 },
  { id: 2, xPct: 0.685, yPct: 0.470, label: 'Booth 1', seats: 4 },
  { id: 3, xPct: 0.715, yPct: 0.655, label: 'Booth 2', seats: 4 },
];

// 5th table unlocked by extraTable upgrade
const EXTRA_TABLE = { id: 4, xPct: 0.790, yPct: 0.440, label: 'Armchair', seats: 1 };

// Anna's idle position — behind the counter
const ANNA_IDLE_X_PCT = 0.360;
const ANNA_IDLE_Y_PCT = 0.460;

// Where arriving guests walk to — the host stand
const QUEUE_X_PCT = 0.105;
const QUEUE_Y_PCT = 0.740;

const GUEST_TYPES = [
  { emoji: '👩‍💼', color: '#d4869a', tipMult: 1.0, patience: 22 },
  { emoji: '👨‍🎨', color: '#c9935a', tipMult: 1.2, patience: 18 },
  { emoji: '👵',   color: '#6a9e6e', tipMult: 0.8, patience: 28 },
  { emoji: '👦',   color: '#5a8ab4', tipMult: 0.9, patience: 16 },
  { emoji: '👩‍🍳', color: '#a06aaa', tipMult: 1.3, patience: 20 },
  { emoji: '🧙',   color: '#7a8a6a', tipMult: 1.5, patience: 15 },
];

const ORDERS = [
  '☕ Espresso',
  '🍵 Chai Latte',
  '🧋 Iced Coffee',
  '🍰 Blueberry Pancake',
  '📖 Book + Cold Brew',
  '🫖 Honey Cinnamon Latte',
];

const NOVEL_STAGES = [
  { at: 0,  label: 'Just an idea...' },
  { at: 10, label: 'First notes jotted' },
  { at: 20, label: 'Character sketches' },
  { at: 30, label: 'Outline drafted' },
  { at: 40, label: 'Chapter 1 written' },
  { at: 55, label: 'Halfway through...' },
  { at: 70, label: 'First draft done!' },
  { at: 80, label: 'Editing rounds' },
  { at: 90, label: 'Query letters sent' },
  { at: 95, label: 'Publisher interested!' },
  { at: 99, label: 'Final proofs...' },
];

const UPGRADES_ORDER = [
  'betterCoffee', 'fasterLegs', 'extraTable',
  'writingDesk', 'loyaltyCards', 'bookDisplay',
];

const UPGRADES_DATA = {
  betterCoffee: { name: 'Premium Beans',    icon: '☕', desc: 'Guests tip more',           cost: 40  },
  fasterLegs:   { name: 'Comfy Shoes',      icon: '👟', desc: 'Move faster',               cost: 60  },
  extraTable:   { name: 'Extra Table',      icon: '🪑', desc: 'Unlock the armchair nook',  cost: 80  },
  writingDesk:  { name: 'Writing Desk',     icon: '🖊', desc: 'Novel progress x2',         cost: 100 },
  loyaltyCards: { name: 'Loyalty Cards',    icon: '🃏', desc: 'Guests stay 20% longer',    cost: 70  },
  bookDisplay:  { name: 'Book Display',     icon: '📚', desc: '+$2 per order',             cost: 90  },
};

const BOOK_HEIGHTS = Array.from({ length: 22 }, () => Math.random());
