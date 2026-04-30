// ============================================================
//  game.js
//  Game logic — update loop, input, guest AI, day flow.
//  No drawing here.
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resize() {
  const wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  setupTables();

  // Place Anna behind the counter on first load
  if (G.player.x === 0) {
    G.player.x       = canvas.width  * ANNA_IDLE_X_PCT;
    G.player.y       = canvas.height * ANNA_IDLE_Y_PCT;
    G.player.targetX = G.player.x;
    G.player.targetY = G.player.y;
  }
}

window.addEventListener('resize', resize);

// ── INPUT ─────────────────────────────────────────────────
// Two-click seating flow:
//   Click 1: click a waiting guest  → they become selectedGuest
//             available tables glow green
//   Click 2: click a free table     → guest is seated there
//             click an occupied table → flash red, deselect
//             click empty floor      → deselect

canvas.addEventListener('click', e => {
  if (!G.running) return;

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

  // ── Phase 2: a guest is selected — now click a table ──
  if (G.selectedGuest) {
    const clickedTable = getTableAt(mx, my);

    if (clickedTable) {
      if (clickedTable.guest !== null) {
        // Occupied — flash feedback, deselect
        addLog(`${clickedTable.label} is full!`, 'bad');
        G.selectedGuest = null;
      } else {
        // Free — seat the guest
        seatGuest(G.selectedGuest, clickedTable);
        G.selectedGuest = null;
      }
    } else {
      // Clicked empty floor — cancel selection
      G.selectedGuest = null;
    }
    return;
  }

  // ── Phase 1: no selection yet — check if clicking a guest ──
  const clickedGuest = getGuestAt(mx, my);
  if (clickedGuest) {
    handleGuestClick(clickedGuest);
  }
});

function getGuestAt(mx, my) {
  for (const guest of G.guests) {
    const dx = mx - guest.x;
    const dy = my - guest.y;
    if (Math.sqrt(dx * dx + dy * dy) < 28) return guest;
  }
  return null;
}

function getTableAt(mx, my) {
  for (const table of G.tables) {
    const dx = mx - table.x;
    const dy = (my - table.y) * 2; // tables are ellipses, scale y
    if (Math.sqrt(dx * dx + dy * dy) < 80) return table;
  }
  return null;
}

function handleGuestClick(guest) {
  if (guest.state === 'waiting') {
    // Select this guest — player now picks a table
    G.selectedGuest = guest;
    addLog(`${guest.type.emoji} selected — click a table!`, '');

  } else if (guest.state === 'seated') {
    guest.state   = 'ordering';
    guest.patience = guest.patienceMax;
    addLog(`Taking order: ${guest.order}`, '');

    const table = G.tables.find(t => t.id === guest.table);
    if (table) {
      G.player.targetX = table.x - 30;
      G.player.targetY = table.y + 20;
      G.player.moving  = true;
    }

    setTimeout(() => {
      if (guest.state === 'ordering') {
        guest.state = 'waiting-food';
        addLog(`Order placed: ${guest.order}`, '');
        // Anna goes to counter to prepare
        G.player.targetX    = canvas.width  * ANNA_IDLE_X_PCT;
        G.player.targetY    = canvas.height * ANNA_IDLE_Y_PCT;
        G.player.moving     = true;
        G.player.makingCoffee = true;
        setTimeout(() => { G.player.makingCoffee = false; }, 1500);
      }
    }, 900);

  } else if (guest.state === 'waiting-food') {
    guest.state      = 'served';
    guest.leaveTimer = 5 + Math.random() * 4;

    const tipMult   = G.upgrades.betterCoffee.bought ? 1.5 : 1;
    const bookBonus = G.upgrades.bookDisplay.bought  ? 2   : 0;
    const tip       = Math.round(guest.tipBase * tipMult + bookBonus);
    const earned    = tip + 2;

    G.cash        += earned;
    G.tipsToday   += tip;
    G.earnedToday += earned;
    G.totalEarned += earned;
    G.servedToday++;

    addLog(`${guest.type.emoji} served! +$${earned}`, 'good');
    updateUI();

    // Anna carries order to table
    const table = G.tables.find(t => t.id === guest.table);
    if (table) {
      G.player.targetX  = table.x - 30;
      G.player.targetY  = table.y + 20;
      G.player.moving   = true;
      G.player.carrying = true;
      setTimeout(() => { G.player.carrying = false; }, 1200);
    }
  }
}

// ── GUESTS ────────────────────────────────────────────────

function spawnGuest() {
  const type          = GUEST_TYPES[Math.floor(Math.random() * GUEST_TYPES.length)];
  const patienceMult  = G.upgrades.loyaltyCards.bought ? 1.2 : 1;
  const w = canvas.width, h = canvas.height;

  // Guests walk in from just off-screen left
  G.guests.push({
    id:          G.guestIdCounter++,
    type,
    state:       'arriving',
    x:           -40,
    y:           h * 0.78,
    targetX:     w * QUEUE_X_PCT,
    targetY:     h * QUEUE_Y_PCT,
    table:       null,
    order:       ORDERS[Math.floor(Math.random() * ORDERS.length)],
    patienceMax: type.patience * patienceMult,
    patience:    type.patience * patienceMult,
    tipBase:     3 + Math.floor(Math.random() * 5),
    leaveTimer:  0,
  });

  addLog(`Guest arrived: ${type.emoji}`, '');
}

function seatGuest(guest, table) {
  table.guest    = guest.id;
  guest.table    = table.id;
  guest.state    = 'seated';
  guest.targetX  = table.x + 10;
  guest.targetY  = table.y + 30;
  guest.patience = guest.patienceMax * 1.3;

  // Anna walks to the table to greet them
  G.player.targetX = table.x - 30;
  G.player.targetY = table.y + 20;
  G.player.moving  = true;

  addLog(`${guest.type.emoji} seated at ${table.label}`, 'good');
}

function leaveAngry(guest) {
  // If this guest was selected, clear selection
  if (G.selectedGuest && G.selectedGuest.id === guest.id) {
    G.selectedGuest = null;
  }
  addLog(`${guest.type.emoji} left unhappy`, 'bad');
  startLeaving(guest);
}

function startLeaving(guest) {
  guest.state   = 'leaving';
  guest.targetX = -80;

  if (guest.table !== null) {
    const t = G.tables.find(t => t.id === guest.table);
    if (t) t.guest = null;
    guest.table = null;
  }
}

// ── UPGRADES ──────────────────────────────────────────────

function buyUpgrade(key) {
  const u = G.upgrades[key];
  if (G.cash < u.cost || u.bought) return;

  G.cash   -= u.cost;
  u.bought  = true;

  if (key === 'fasterLegs') G.player.speed = 180;
  if (key === 'extraTable') setupTables();

  addLog(`Bought: ${u.name}!`, 'good');
  updateUI();
}

function investInNovel(amount) {
  if (G.cash < amount) return;

  G.cash -= amount;
  const multiplier = G.upgrades.writingDesk.bought ? 2 : 1;
  const gain       = amount * multiplier * 0.12;
  G.novelProgress  = Math.min(100, G.novelProgress + gain);

  addLog(`Invested $${amount} in writing (+${gain.toFixed(1)}%)`, 'novel');
  if (G.novelProgress >= 100) setTimeout(showWin, 800);
  updateUI();
}

// ── UI ────────────────────────────────────────────────────

function updateUI() {
  document.getElementById('statDay').textContent     = G.day;
  document.getElementById('statCash').textContent    = '$' + Math.round(G.cash);
  document.getElementById('statServed').textContent  = G.servedToday;

  const pct = Math.round(G.novelProgress);
  document.getElementById('novelPct').textContent   = pct + '%';
  document.getElementById('novelBar').style.width   = pct + '%';
  document.getElementById('novelStage').textContent = novelStage();

  document.getElementById('investBtn').disabled    = G.cash < 10;
  document.getElementById('investBtn50').disabled  = G.cash < 50;

  renderUpgradeList();
}

function renderUpgradeList() {
  const el = document.getElementById('upgradeList');
  el.innerHTML = '';

  for (const key of UPGRADES_ORDER) {
    const u         = G.upgrades[key];
    const canAfford = G.cash >= u.cost;
    const btn       = document.createElement('button');

    btn.className = 'upgrade-btn' + (u.bought ? ' bought' : '');
    btn.disabled  = u.bought || !canAfford;
    btn.innerHTML = `
      <span class="upg-icon">${u.icon}</span>
      <span class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
      </span>
      <span class="upg-cost ${u.bought ? 'free' : ''}">${u.bought ? '✓' : '$' + u.cost}</span>`;

    if (!u.bought) btn.onclick = () => buyUpgrade(key);
    el.appendChild(btn);
  }
}

function addLog(msg, type = '') {
  const ul = document.getElementById('logList');
  const li = document.createElement('li');
  li.className   = type;
  li.textContent = msg;
  ul.prepend(li);
  while (ul.children.length > 18) ul.removeChild(ul.lastChild);
}

// ── DAY FLOW ──────────────────────────────────────────────

function endDay() {
  G.running = false;
  G.selectedGuest = null;
  document.getElementById('dayOverlay').style.display  = 'flex';
  document.getElementById('dayBadgeLabel').textContent = `End of Day ${G.day}`;
  document.getElementById('dayTitle').textContent      = G.servedToday > 5 ? 'Great shift!' : 'Tough day...';
  document.getElementById('dayEarned').textContent     = '$' + Math.round(G.earnedToday);
  document.getElementById('dayServed').textContent     = G.servedToday;
  document.getElementById('dayTips').textContent       = '$' + Math.round(G.tipsToday);
  document.getElementById('dayNovel').textContent      = Math.round(G.novelProgress) + '%';
  document.getElementById('dayNovelLine').textContent  = novelStage();
}

function nextDay() {
  document.getElementById('dayOverlay').style.display = 'none';
  G.day++;
  G.timeLeft      = 120 + G.day * 10;
  G.spawnInterval = Math.max(2.5, 4.5 - G.day * 0.2);
  G.servedToday   = G.tipsToday = G.earnedToday = 0;
  G.guests        = [];
  G.waitingQueue  = [];
  G.selectedGuest = null;
  G.tables.forEach(t => (t.guest = null));

  // Anna returns behind counter
  G.player.targetX = canvas.width  * ANNA_IDLE_X_PCT;
  G.player.targetY = canvas.height * ANNA_IDLE_Y_PCT;

  G.running = true;
  addLog(`--- Day ${G.day} begins ---`, '');
}

function showShop() {
  document.getElementById('dayOverlay').style.display = 'none';
  document.querySelector('.side-panel').scrollTop = 200;
  G.running = false;
  setTimeout(() => {
    document.getElementById('dayOverlay').style.display = 'flex';
  }, 100);
}

function showWin() {
  G.running = false;
  document.getElementById('dayOverlay').style.display = 'none';
  document.getElementById('winOverlay').style.display = 'flex';
}

function resetGame() {
  document.getElementById('winOverlay').style.display = 'none';
  initState();
  setupTables();
  G.player.x       = canvas.width  * ANNA_IDLE_X_PCT;
  G.player.y       = canvas.height * ANNA_IDLE_Y_PCT;
  G.player.targetX = G.player.x;
  G.player.targetY = G.player.y;
  updateUI();
  G.running = true;
  addLog('New game started!', 'good');
}

function startGame() {
  document.getElementById('startOverlay').style.display = 'none';
  G.running = true;
  addLog('Pages & Pours is open!', 'good');
}

// ── MAIN LOOP ─────────────────────────────────────────────

let lastTime = 0;

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.1);
  lastTime = ts;
  if (G.running) update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  G.timeLeft -= dt;
  if (G.timeLeft <= 0) { endDay(); return; }

  const m = Math.floor(G.timeLeft / 60);
  const s = Math.floor(G.timeLeft % 60);
  document.getElementById('statTime').textContent = m + ':' + String(s).padStart(2, '0');

  // Spawn guests
  G.spawnTimer += dt;
  if (G.spawnTimer >= G.spawnInterval) {
    G.spawnTimer = 0;
    const active = G.guests.filter(g => g.state !== 'leaving' && g.state !== 'gone').length;
    if (active < 8) spawnGuest();
  }

  // Move Anna
  const pdx   = G.player.targetX - G.player.x;
  const pdy   = G.player.targetY - G.player.y;
  const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
  if (pdist > 2) {
    G.player.x      += (pdx / pdist) * G.player.speed * dt;
    G.player.y      += (pdy / pdist) * G.player.speed * dt;
    G.player.moving  = true;
  } else {
    G.player.moving = false;
  }

  // Update guests
  for (const guest of G.guests) {
    const gdx   = guest.targetX - guest.x;
    const gdy   = guest.targetY - guest.y;
    const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
    if (gdist > 2) {
      guest.x += (gdx / gdist) * 80 * dt;
      guest.y += (gdy / gdist) * 80 * dt;
    }

    if (guest.state === 'arriving' && gdist < 10) {
      guest.state = 'waiting';
      G.waitingQueue.push(guest.id);
    }

    if (guest.state === 'waiting' || guest.state === 'seated') {
      guest.patience -= dt;
      if (guest.patience <= 0) leaveAngry(guest);
    }

    if (guest.state === 'served') {
      guest.leaveTimer -= dt;
      if (guest.leaveTimer <= 0) startLeaving(guest);
    }

    if (guest.state === 'leaving') {
      guest.targetX = -80;
      if (guest.x < -60) guest.state = 'gone';
    }
  }

  // Cleanup gone guests
  G.guests = G.guests.filter(guest => {
    if (guest.state === 'gone') {
      if (guest.table !== null) {
        const t = G.tables.find(t => t.id === guest.table);
        if (t) t.guest = null;
      }
      return false;
    }
    return true;
  });

  updateUI();
}

// ── BOOT ──────────────────────────────────────────────────

initState();
resize();
updateUI();
loadSprites();
requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });
