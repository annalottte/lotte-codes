// ============================================================
//  draw.js
//  Pure drawing — no game logic here.
//  Every function takes (w, h) from the canvas dimensions.
// ============================================================

// Main draw call — order matters for depth layering
function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  drawRoom(w, h);      // 1. Background (furthest back)
  drawTables(w, h);    // 2. Tables & chairs
  drawGuests();        // 3. Guests
  drawPlayer(w, h);    // 4. Anna (on top of guests so she's always visible)
  drawHUD(w, h);       // 5. UI chrome (always on top)
}

// ── ROOM ──────────────────────────────────────────────────

function drawRoom(w, h) {
  // If a background image has been loaded, use it for the café floor area
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, w * 0.75, h);
    drawKitchen(w, h);
    drawEntrance(w, h);
    return;
  }

  // Fallback: draw the café in code
  drawFloor(w, h);
  drawBookshelf(w, h);
  drawKitchen(w, h);
  drawEntrance(w, h);
}

function drawFloor(w, h) {
  ctx.fillStyle = '#e8d8c0';
  ctx.fillRect(0, 0, w, h);

  // Horizontal plank lines
  ctx.strokeStyle = 'rgba(160,130,90,0.18)';
  ctx.lineWidth = 1;
  const plankH = h / 14;
  for (let y = 0; y < h; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w * 0.75, y);
    ctx.stroke();
  }

  // Vertical grain lines
  ctx.strokeStyle = 'rgba(160,130,90,0.08)';
  for (let x = 0; x < w * 0.75; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Back wall
  ctx.fillStyle = '#2a3f5e';
  ctx.fillRect(0, 0, w * 0.75, h * 0.18);
}

function drawBookshelf(w, h) {
  // Shelf unit
  ctx.fillStyle = '#3a2e22';
  ctx.fillRect(w * 0.06, h * 0.02, w * 0.62, h * 0.16);

  // Book spines — use pre-computed heights so they never flicker
  const bookColors = ['#d4869a', '#c9935a', '#6a9e6e', '#5a8ab4', '#a06aaa', '#c9935a', '#d4869a', '#6a9e6e'];
  const bookW = (w * 0.62) / 22;

  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = bookColors[i % bookColors.length];
    const bx = w * 0.06 + i * bookW + 2;
    const bh = h * 0.09 + BOOK_HEIGHTS[i] * h * 0.03;
    ctx.fillRect(bx, h * 0.04, bookW - 3, bh);
    // Spine shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(bx + bookW - 4, h * 0.04, 1, bh);
  }

  // Shelf plank
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(w * 0.06, h * 0.13, w * 0.62, 5);
}

function drawKitchen(w, h) {
  ctx.fillStyle = '#1e2d45';
  ctx.fillRect(w * 0.75, 0, w * 0.25, h);

  // Counter surface
  ctx.fillStyle = '#c4a87a';
  ctx.fillRect(w * 0.76, h * 0.2, w * 0.22, h * 0.08);
  ctx.fillStyle = '#b09060';
  ctx.fillRect(w * 0.76, h * 0.27, w * 0.22, 4);

  // Coffee machine body
  ctx.fillStyle = '#8a6040';
  ctx.fillRect(w * 0.8, h * 0.08, w * 0.08, h * 0.13);
  ctx.fillStyle = '#6a4020';
  ctx.fillRect(w * 0.81, h * 0.09, w * 0.06, h * 0.06);

  // Steam — animated using time
  const t = Date.now() / 400;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const sway = Math.sin(t + i * 1.2) * 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.83 + i * 10, h * 0.07);
    ctx.bezierCurveTo(
      w * 0.83 + i * 10 + sway - 5, h * 0.04,
      w * 0.83 + i * 10 - sway + 5, h * 0.02,
      w * 0.83 + i * 10, h * -0.01
    );
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = `bold ${Math.round(h * 0.02)}px Nunito`;
  ctx.textAlign = 'center';
  ctx.fillText('KITCHEN', w * 0.875, h * 0.5);
}

function drawEntrance(w, h) {
  // Door frame
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(w * 0.04, h * 0.78, w * 0.07, h * 0.22);
  ctx.fillStyle = '#c4a87a';
  ctx.fillRect(w * 0.045, h * 0.79, w * 0.06, h * 0.2);
  // Door handle
  ctx.fillStyle = '#9a7850';
  ctx.beginPath();
  ctx.arc(w * 0.09, h * 0.9, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(30,45,69,0.4)';
  ctx.font = `${Math.round(h * 0.016)}px Nunito`;
  ctx.textAlign = 'center';
  ctx.fillText('ENTRANCE', w * 0.075, h * 0.77);

  // Waiting spot indicators
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = 'rgba(212,134,154,0.2)';
    ctx.beginPath();
    ctx.arc(w * 0.12, h * (0.82 + i * 0.05), 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,134,154,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(212,134,154,0.5)';
  ctx.font = `${Math.round(h * 0.015)}px Nunito`;
  ctx.textAlign = 'center';
  ctx.fillText('Wait here', w * 0.12, h * 0.97);
}

// ── TABLES ────────────────────────────────────────────────

function drawTables(w, h) {
  for (const table of G.tables) {
    const occupied = table.guest !== null;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(table.x, table.y + 8, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chairs (behind table)
    const chairs = [[-40, 0], [40, 0], [0, -28]];
    for (const [cx, cy] of chairs) {
      ctx.fillStyle = '#8a6040';
      ctx.beginPath();
      ctx.ellipse(table.x + cx, table.y + cy, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6a4020';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Table top
    ctx.fillStyle = occupied ? '#d4b88a' : '#c4a87a';
    ctx.beginPath();
    ctx.ellipse(table.x, table.y, 36, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a08050';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Table leg
    ctx.fillStyle = '#8a6040';
    ctx.fillRect(table.x - 4, table.y + 18, 8, 14);

    // Table number
    ctx.fillStyle = '#5a3a10';
    ctx.font = `bold ${Math.round(h * 0.018)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText(table.id + 1, table.x, table.y + 6);
  }
}

// ── GUESTS ────────────────────────────────────────────────

function drawGuests() {
  for (const guest of G.guests) {
    if (guest.state === 'gone') continue;

    const r = 20;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(guest.x, guest.y + r + 2, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = guest.type.color;
    ctx.beginPath();
    ctx.arc(guest.x, guest.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Patience ring — colour shifts green → amber → red as patience drains
    const pRatio = Math.max(0, guest.patience / guest.patienceMax);
    ctx.strokeStyle = pRatio > 0.6 ? '#6aaa6a' : pRatio > 0.3 ? '#c9935a' : '#d4506a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guest.x, guest.y, r + 4, -Math.PI / 2, -Math.PI / 2 + pRatio * Math.PI * 2);
    ctx.stroke();

    // Emoji face
    ctx.font = `${Math.round(r * 1.1)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(guest.type.emoji, guest.x, guest.y);
    ctx.textBaseline = 'alphabetic';

    // Speech bubble showing current state
    const bubbleMap = {
      'waiting':      '?',
      'seated':       '💭',
      'ordering':     '📋',
      'waiting-food': guest.order.split(' ')[0],
      'served':       '😊',
    };
    const bubble = bubbleMap[guest.state] || '';

    if (bubble) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(guest.x + 10, guest.y - r - 22, 28, 22, 6);
      ctx.fill();
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bubble, guest.x + 24, guest.y - r - 11);
      ctx.textBaseline = 'alphabetic';
    }

    // Dashed ring hint — shows which guests can be clicked
    if (['waiting', 'seated', 'waiting-food'].includes(guest.state)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(guest.x, guest.y, r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ── PLAYER (ANNA) ─────────────────────────────────────────

function drawPlayer(w, h) {
  const p = G.player;
  const spriteH = h * 0.28;
  const spriteW = spriteH * 0.6;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + spriteH * 0.5 + 4, spriteW * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprite = currentSprite();

  if (sprite) {
    // Draw PNG sprite — flip when moving left
    const facingLeft = p.targetX < p.x - 5;
    ctx.save();
    if (facingLeft) {
      ctx.translate(p.x, p.y - spriteH * 0.5);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -spriteW * 0.5, 0, spriteW, spriteH);
    } else {
      ctx.drawImage(sprite, p.x - spriteW * 0.5, p.y - spriteH * 0.5, spriteW, spriteH);
    }
    ctx.restore();
  } else {
    // Canvas fallback while sprites aren't added yet
    const r = 18;
    ctx.fillStyle = '#1e2d45';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4869a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r - 4, Math.PI * 0.1, Math.PI * 0.9);
    ctx.fill();
    ctx.font = `${Math.round(r * 1.2)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👩', p.x, p.y);
    ctx.textBaseline = 'alphabetic';
  }

  // Name tag
  const tagY = sprite ? p.y + spriteH * 0.52 : p.y + 22;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(p.x - 22, tagY, 44, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#1e2d45';
  ctx.font = `bold ${Math.round(h * 0.016)}px Nunito`;
  ctx.textAlign = 'center';
  ctx.fillText('Anna', p.x, tagY + 11);
}

// ── HUD ───────────────────────────────────────────────────

function drawHUD(w, h) {
  // Time bar along the top of the game area
  const dayDuration = 120 + (G.day - 1) * 10;
  const ratio = G.timeLeft / dayDuration;
  const barW = w * 0.73;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, barW, 5);

  const barColor = ratio > 0.5 ? '#6aaa6a' : ratio > 0.25 ? '#c9935a' : '#d4506a';
  ctx.fillStyle = barColor;
  ctx.fillRect(0, 0, barW * ratio, 5);

  // Badge showing how many guests are waiting to be seated
  const waitingCount = G.guests.filter(g => g.state === 'waiting').length;
  if (waitingCount > 0) {
    ctx.fillStyle = '#d4869a';
    ctx.beginPath();
    ctx.arc(w * 0.12, h * 0.75, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(h * 0.022)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText(waitingCount, w * 0.12, h * 0.755);
  }
}
