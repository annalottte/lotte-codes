// ============================================================
//  draw.js
//  Pure drawing — no game logic.
//  Layers: background → table highlights → guests → Anna → HUD
// ============================================================

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  drawBackground(w, h);       // 1. Background image (or fallback)
  drawTableHighlights(w, h);  // 2. Subtle overlays on background tables
  drawGuests(w, h);           // 3. Guests
  drawPlayer(w, h);           // 4. Anna
  drawHUD(w, h);              // 5. UI chrome
}

// ── BACKGROUND ────────────────────────────────────────────

function drawBackground(w, h) {
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, w, h);
  } else {
    // Fallback while image loads
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = `bold ${Math.round(h * 0.04)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText('Loading Pages & Pours...', w * 0.5, h * 0.5);
  }
}

// ── TABLE HIGHLIGHTS ──────────────────────────────────────
// We draw invisible click targets + status glow over the
// tables that already exist in the background image.

function drawTableHighlights(w, h) {
  for (const table of G.tables) {
    const occupied  = table.guest !== null;
    const isTarget  = G.selectedGuest !== null; // a guest is selected, awaiting table click

    // Glow colour
    let glowColor = null;
    if (isTarget && !occupied)  glowColor = 'rgba(100,220,120,0.30)'; // green = available
    if (isTarget && occupied)   glowColor = 'rgba(220,80,80,0.25)';   // red   = taken
    if (!isTarget && occupied)  glowColor = 'rgba(212,134,154,0.20)'; // rose  = has guest

    if (glowColor) {
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.ellipse(table.x, table.y, 68, 32, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dashed ring on available tables when a guest is selected
    if (isTarget && !occupied) {
      ctx.strokeStyle = 'rgba(80,200,100,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(table.x, table.y, 72, 35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Table label
    const labelColor = occupied ? 'rgba(212,134,154,0.9)' : 'rgba(255,255,255,0.7)';
    ctx.fillStyle = labelColor;
    ctx.font = `bold ${Math.round(h * 0.016)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText(table.label, table.x, table.y - 40);

    // Occupied badge
    if (occupied) {
      const guest = G.guests.find(g => g.id === table.guest);
      if (guest) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(guest.type.emoji, table.x + 30, table.y - 20);
        ctx.textBaseline = 'alphabetic';
      }
    }
  }
}

// ── GUESTS ────────────────────────────────────────────────

function drawGuests(w, h) {
  for (const guest of G.guests) {
    if (guest.state === 'gone') continue;

    const r = 22;
    const isSelected = G.selectedGuest && G.selectedGuest.id === guest.id;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(guest.x, guest.y + r + 2, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = isSelected ? '#fff' : guest.type.color;
    ctx.beginPath();
    ctx.arc(guest.x, guest.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guest.x, guest.y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
      // Arrow hint above
      ctx.fillStyle = '#f5c842';
      ctx.font = `bold ${Math.round(r * 0.9)}px Nunito`;
      ctx.textAlign = 'center';
      ctx.fillText('→ table?', guest.x, guest.y - r - 8);
    }

    // Patience ring (not shown when already selected)
    if (!isSelected && (guest.state === 'waiting' || guest.state === 'seated')) {
      const pRatio = Math.max(0, guest.patience / guest.patienceMax);
      ctx.strokeStyle = pRatio > 0.6 ? '#6aaa6a' : pRatio > 0.3 ? '#c9935a' : '#d4506a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guest.x, guest.y, r + 4, -Math.PI / 2, -Math.PI / 2 + pRatio * Math.PI * 2);
      ctx.stroke();
    }

    // Emoji face
    ctx.font = `${Math.round(r * 1.1)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(guest.type.emoji, guest.x, guest.y);
    ctx.textBaseline = 'alphabetic';

    // Speech bubble
    const bubbleMap = {
      'waiting':      '👋',
      'seated':       '💭',
      'ordering':     '📋',
      'waiting-food': guest.order.split(' ')[0],
      'served':       '😊',
    };
    const bubble = bubbleMap[guest.state] || '';

    if (bubble && !isSelected) {
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.beginPath();
      ctx.roundRect(guest.x + 12, guest.y - r - 26, 30, 22, 6);
      ctx.fill();
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bubble, guest.x + 27, guest.y - r - 15);
      ctx.textBaseline = 'alphabetic';
    }

    // Click hint ring for actionable guests
    if (['waiting', 'seated', 'waiting-food'].includes(guest.state) && !isSelected) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(guest.x, guest.y, r + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ── PLAYER (ANNA) ─────────────────────────────────────────

function drawPlayer(w, h) {
  const p = G.player;
  const spriteH = h * 0.26;
  const spriteW = spriteH * 0.55;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + spriteH * 0.48 + 4, spriteW * 0.38, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprite = currentSprite();

  if (sprite) {
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
    // Canvas fallback
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
  const tagY = sprite ? p.y + spriteH * 0.5 : p.y + 22;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.roundRect(p.x - 24, tagY, 48, 17, 3);
  ctx.fill();
  ctx.fillStyle = '#1e2d45';
  ctx.font = `bold ${Math.round(h * 0.016)}px Nunito`;
  ctx.textAlign = 'center';
  ctx.fillText('Anna', p.x, tagY + 12);
}

// ── HUD ───────────────────────────────────────────────────

function drawHUD(w, h) {
  // Time bar along top
  const dayDuration = 120 + (G.day - 1) * 10;
  const ratio  = G.timeLeft / dayDuration;
  const barW   = w * 0.82;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, barW, 6);

  const barColor = ratio > 0.5 ? '#6aaa6a' : ratio > 0.25 ? '#c9935a' : '#d4506a';
  ctx.fillStyle = barColor;
  ctx.fillRect(0, 0, barW * ratio, 6);

  // Instruction hint when a guest is selected
  if (G.selectedGuest) {
    const msg = 'Click a glowing table to seat them  ·  Click elsewhere to cancel';
    ctx.fillStyle = 'rgba(20,30,46,0.75)';
    ctx.beginPath();
    ctx.roundRect(w * 0.5 - 260, 14, 520, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#f5e8b0';
    ctx.font = `${Math.round(h * 0.018)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText(msg, w * 0.5, 34);
  }

  // Waiting guests badge near the host stand
  const waitingCount = G.guests.filter(g => g.state === 'waiting').length;
  if (waitingCount > 0) {
    ctx.fillStyle = '#d4869a';
    ctx.beginPath();
    ctx.arc(w * QUEUE_X_PCT, h * QUEUE_Y_PCT - 36, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(h * 0.022)}px Nunito`;
    ctx.textAlign = 'center';
    ctx.fillText(waitingCount, w * QUEUE_X_PCT, h * QUEUE_Y_PCT - 30);
  }
}
