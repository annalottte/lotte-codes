// ============================================================
//  game.js
//  Game logic — update loop, guest AI, player movement,
//  input handling, day flow, upgrades, novel investment.
//  No drawing happens here.
// ============================================================

// ── CANVAS SETUP ──────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resize() {
  const wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  setupTables();

  // Set initial player position on first load
  if (G.player.x === 0) {
    G.player.x      = canvas.width  * 0.12;
    G.player.y      = canvas.height * 0.85;
    G.player.targetX = G.player.x;
    G.player.targetY = G.player.y;
  }
}

window.addEventListener('resize', resize);

// ── INPUT ─────────────────────────────────────────────────

canvas.addEventListener('click', e => {
  if (!G.running) return;

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

  for (const guest of G.guests) {
    const dx = mx - guest.x;
    const dy = my - guest.y;
    if (Math.sqrt(dx * dx + dy * dy) < 28) {
      handleGuestClick(guest);
      return;
    }
  }
});

function handleGuestClick(guest) {
  if (guest.state === 'waiting') {
    if (findFreeTable()) {
      seatGuest(guest);
      G.waitingQueue = G.waitingQueue.filter(id => id !== guest.id);
    } else {
      addLog('No free tables!', 'bad');
    }

  } else if (guest.state === 'seated') {
    guest.state = 'ordering';
    guest.patience = guest.patienceMax;
    addLog(`Taking order: ${guest.order}`, '');

    const table = G.tables.find(t => t.id === guest.table);
    if (table) {
      G.player.targetX = table.x - 35;
      G.player.targetY = table.y;
      G.player.moving  = true;
    }

    setTimeout(() => {
      if (guest.state === 'ordering') {
        guest.state = 'waiting-food';
        addLog(`Order placed: ${guest.order}`, '');
        // Anna heads to the counter
        G.player.targetX   = canvas.width  * 0.78;
        G.player.targetY   = canvas.height * 0.35;
        G.player.moving    = true;
        G.player.makingCoffee = true;
        setTimeout(() => { G.player.makingCoffee = false; }, 1500);
      }
    }, 900);

  } else if (guest.state === 'waiting-food') {
    guest.state = 'served';
    guest.leaveTimer = 5 + Math.random() * 4;

    const tipMult = G.upgrades.betterCoffee.bought ? 1.5 : 1;
    const bookBonus = G.upgrades.bookDisplay.bought ? 2 : 0;
    const tip = Math.round(guest.tipBase * tipMult + bookBonus);
    const earned = tip + 2;

    G.cash        += earned;
    G.tipsToday   += tip;
    G.earnedToday += earned;
    G.totalEarned += earned;
    G.servedToday++;

    addLog(`${guest.type.emoji} served! +$${earned}`, 'good');
    updateUI();

    // Anna carries the order to the table
    const table = G.tables.find(t => t.id === guest.table);
    if (table) {
      G.player.targetX = table.x - 35;
      G.player.targetY = table.y;
      G.player.moving  = true;
      G.player.carrying = true;
      setTimeout(() => { G.player.carrying = false; }, 1200);
    }
  }
}

// ── GUESTS ────────────────────────────────────────────────

function spawnGuest() {
  const type = GUEST_TYPES[Math.floor(Math.random() * GUEST_TYPES.length)];
  const patienceMult = G.upgrades.loyaltyCards.bought ? 1.2 : 1;

  G.guests.push({
    id: G.guestIdCounter++,
    type,
    state: 'arriving',
    x: -40,
    y: canvas.height * (0.75 + Math.random() * 0.15),
    targetX: canvas.width  * 0.1,
    targetY: canvas.height * 0.82,
    table: null,
    order: ORDERS[Math.floor(Math.random() * ORDERS.length)],
    patienceMax: type.patience * patienceMult,
    patience:    type.patience * patienceMult,
    tipBase: 3 + Math.floor(Math.random() * 5),
    leaveTimer: 0,
  });

  addLog(`Guest arrived: ${type.emoji}`, '');
}

function findFreeTable() {
  return G.tables.find(t => !t.guest) || null;
}

function seatGuest(guest) {
  const table = findFreeTable();
  if (!table) return false;

  table.guest    = guest.id;
  guest.table    = table.id;
  guest.state    = 'seated';
  guest.targetX  = table.x;
  guest.targetY  = table.y + 28;
  guest.patience = guest.patienceMax * 1.2;

  addLog(`${guest.type.emoji} seated at table ${table.id + 1}`, '');
  return true;
}

function leaveAngry(guest) {
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

  G.cash  -= u.cost;
  u.bought = true;

  if (key === 'fasterLegs') G.player.speed = 180;
  if (key === 'extraTable') setupTables();

  addLog(`Bought: ${u.name}!`, 'good');
  updateUI();
}

// ── NOVEL INVESTMENT ──────────────────────────────────────

function investInNovel(amount) {
  if (G.cash < amount) return;

  G.cash -= amount;
  const multiplier = G.upgrades.writingDesk.bought ? 2 : 1;
  const gain = amount * multiplier * 0.12;
  G.novelProgress = Math.min(100, G.novelProgress + gain);

  addLog(`Invested $${amount} in writing (+${gain.toFixed(1)}%)`, 'novel');

  if (G.novelProgress >= 100) {
    setTimeout(showWin, 800);
  }
  updateUI();
}

// ── UI UPDATES ────────────────────────────────────────────

function updateUI() {
  document.getElementById('statDay').textContent    = G.day;
  document.getElementById('statCash').textContent   = '$' + Math.round(G.cash);
  document.getElementById('statServed').textContent = G.servedToday;

  const pct = Math.round(G.novelProgress);
  document.getElementById('novelPct').textContent  = pct + '%';
  document.getElementById('novelBar').style.width  = pct + '%';
  document.getElementById('novelStage').textContent = novelStage();

  document.getElementById('investBtn').disabled   = G.cash < 10;
  document.getElementById('investBtn50').disabled = G.cash < 50;

  renderUpgradeList();
}

function renderUpgradeList() {
  const el = document.getElementById('upgradeList');
  el.innerHTML = '';

  for (const key of UPGRADES_ORDER) {
    const u = G.upgrades[key];
    const canAfford = G.cash >= u.cost;

    const btn = document.createElement('button');
    btn.className = 'upgrade-btn' + (u.bought ? ' bought' : '');
    btn.disabled  = u.bought || !canAfford;
    btn.innerHTML = `
      <span class="upg-icon">${u.icon}</span>
      <span class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
      </span>
      <span class="upg-cost ${u.bought ? 'free' : ''}">${u.bought ? '✓' : '$' + u.cost}</span>
    `;
    if (!u.bought) btn.onclick = () => buyUpgrade(key);
    el.appendChild(btn);
  }
}

function addLog(msg, type = '') {
  const ul = document.getElementById('logList');
  const li = document.createElement('li');
  li.className  = type;
  li.textContent = msg;
  ul.prepend(li);
  while (ul.children.length > 18) ul.removeChild(ul.lastChild);
}

// ── DAY FLOW ──────────────────────────────────────────────

function endDay() {
  G.running = false;
  document.getElementById('dayOverlay').style.display = 'flex';
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
  G.servedToday   = 0;
  G.tipsToday     = 0;
  G.earnedToday   = 0;
  G.guests        = [];
  G.waitingQueue  = [];
  G.tables.forEach(t => (t.guest = null));
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
  G.player.x       = canvas.width  * 0.12;
  G.player.y       = canvas.height * 0.85;
  G.player.targetX = G.player.x;
  G.player.targetY = G.player.y;
  updateUI();
  G.running = true;
  addLog('New game started!', 'good');
}

function startGame() {
  document.getElementById('startOverlay').style.display = 'none';
  G.running = true;
  addLog('Day 1 — the café opens!', 'good');
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
  // Tick the shift timer
  G.timeLeft -= dt;
  if (G.timeLeft <= 0) { endDay(); return; }

  // Update the clock display
  const m = Math.floor(G.timeLeft / 60);
  const s = Math.floor(G.timeLeft % 60);
  document.getElementById('statTime').textContent = m + ':' + String(s).padStart(2, '0');

  // Spawn new guests
  G.spawnTimer += dt;
  if (G.spawnTimer >= G.spawnInterval) {
    G.spawnTimer = 0;
    const active = G.guests.filter(g => g.state !== 'leaving' && g.state !== 'gone').length;
    if (active < 8) spawnGuest();
  }

  // Move Anna toward her target
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

  // Update each guest
  for (const guest of G.guests) {
    // Move guest toward their target
    const gdx   = guest.targetX - guest.x;
    const gdy   = guest.targetY - guest.y;
    const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
    if (gdist > 2) {
      guest.x += (gdx / gdist) * 80 * dt;
      guest.y += (gdy / gdist) * 80 * dt;
    }

    // Arriving → waiting once they reach the queue
    if (guest.state === 'arriving' && gdist < 10) {
      guest.state = 'waiting';
      G.waitingQueue.push(guest.id);
    }

    // Drain patience while waiting or seated
    if (guest.state === 'waiting' || guest.state === 'seated') {
      guest.patience -= dt;
      if (guest.patience <= 0) leaveAngry(guest);
    }

    // Leave after being served
    if (guest.state === 'served') {
      guest.leaveTimer -= dt;
      if (guest.leaveTimer <= 0) startLeaving(guest);
    }

    // Walk off screen when leaving
    if (guest.state === 'leaving') {
      guest.targetX = -80;
      if (guest.x < -60) guest.state = 'gone';
    }
  }

  // Clean up gone guests and free their tables
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
