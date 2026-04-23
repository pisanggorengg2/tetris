const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = 20;

let board, piece, nextPiece, holdPiece;
let score, level, lines;
let gameRunning, canHold;

// smooth system
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 700;

let moveLeft = false;
let moveRight = false;

let das = 0;
let dasDelay = 120;
let arr = 40;

let lockDelay = 400;
let lockTimer = 0;

// shapes
const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]]
];

const COLORS = ["cyan","yellow","purple","blue","orange","green","red"];

// ===== FIX SPAWN CENTER =====
function newPiece() {
  let i = Math.floor(Math.random() * SHAPES.length);
  let shape = SHAPES[i];

  return {
    shape: shape,
    color: COLORS[i],
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

function init() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0;
  level = 1;
  lines = 0;
  gameRunning = true;
  canHold = true;

  piece = newPiece();
  nextPiece = newPiece();
  holdPiece = null;

  updateUI();
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}

// ===== DRAW =====
function drawCell(ctx, x, y, color, size) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * size, y * size, size, size);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) drawCell(ctx, x, y, cell, SIZE);
    });
  });

  piece.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(ctx, piece.x + x, piece.y + y, piece.color, SIZE);
    });
  });
}

function drawMini(ctx, p) {
  ctx.clearRect(0, 0, 100, 100);
  if (!p) return;

  p.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(ctx, x + 1, y + 1, p.color, 20);
    });
  });
}

// ===== COLLISION FIX =====
function collide(p = piece) {
  for (let y = 0; y < p.shape.length; y++) {
    for (let x = 0; x < p.shape[y].length; x++) {
      if (p.shape[y][x]) {
        let px = p.x + x;
        let py = p.y + y;

        if (
          px < 0 ||
          px >= COLS ||
          py >= ROWS ||
          (py >= 0 && board[py][px])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// ===== LOGIC =====
function merge() {
  piece.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) board[piece.y + y][piece.x + x] = piece.color;
    });
  });
}

function clearLines() {
  let cleared = 0;

  board = board.filter(row => {
    if (row.every(cell => cell)) {
      cleared++;
      return false;
    }
    return true;
  });

  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0));
  }

  if (cleared > 0) {
    lines += cleared;
    score += cleared * 10;
    level = 1 + Math.floor(lines / 5);
    dropInterval = Math.max(100, 700 - (level - 1) * 50);
    updateUI();
  }
}

function spawn() {
  piece = nextPiece;
  nextPiece = newPiece();
  canHold = true;

  if (collide()) gameRunning = false;
}

// ===== MOVEMENT =====
function move(dx) {
  piece.x += dx;
  if (collide()) piece.x -= dx;
}

function rotate() {
  let rotated = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );

  let old = piece.shape;
  piece.shape = rotated;
  if (collide()) piece.shape = old;
}

function drop() {
  piece.y++;
  if (collide()) {
    piece.y--;
    merge();
    clearLines();
    spawn();
  }
}

function hardDrop() {
  while (!collide()) piece.y++;
  piece.y--;
  drop();
}

function hold() {
  if (!canHold) return;

  if (!holdPiece) {
    holdPiece = {...piece};
    spawn();
  } else {
    [piece, holdPiece] = [holdPiece, piece];
    piece.x = Math.floor((COLS - piece.shape[0].length) / 2);
    piece.y = 0;
  }

  canHold = false;
}

// ===== INPUT =====
document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;

  if (e.key === "ArrowDown") drop();
  if (e.key === "ArrowUp") rotate();
  if (e.code === "Space") hardDrop();
  if (e.key.toLowerCase() === "c") hold();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") {
    moveLeft = false;
    das = 0;
  }
  if (e.key === "ArrowRight") {
    moveRight = false;
    das = 0;
  }
});

// ===== SMOOTH =====
function handleMovement(delta) {
  if (moveLeft || moveRight) {
    das += delta;

    if (das > dasDelay) {
      if (moveLeft) move(-1);
      if (moveRight) move(1);
      das = dasDelay - arr;
    }
  }
}

// ===== GRAVITY =====
function update(delta) {
  dropCounter += delta;

  if (dropCounter > dropInterval) {
    piece.y++;

    if (collide()) {
      piece.y--;
      lockTimer += delta;

      if (lockTimer > lockDelay) {
        merge();
        clearLines();
        spawn();
        lockTimer = 0;
      }
    } else {
      lockTimer = 0;
    }

    dropCounter = 0;
  }
}

// ===== LOOP =====
function gameLoop(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!gameRunning) return;

  handleMovement(delta);
  update(delta);

  drawBoard();
  drawMini(nextCtx, nextPiece);
  drawMini(holdCtx, holdPiece);

  requestAnimationFrame(gameLoop);
}

// start
init();
requestAnimationFrame(gameLoop);
