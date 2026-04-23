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
let game, gameRunning, canHold;

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

function newPiece() {
  let i = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[i],
    color: COLORS[i],
    x: 3,
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
  document.getElementById("restartBtn").style.display = "none";
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}

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
      if (val) drawCell(ctx, x+1, y+1, p.color, 20);
    });
  });
}

function collide(p = piece) {
  return p.shape.some((row, y) =>
    row.some((val, x) => {
      let px = p.x + x;
      let py = p.y + y;
      return (
        val &&
        (px < 0 || px >= COLS || py >= ROWS || (board[py] && board[py][px]))
      );
    })
  );
}

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
    updateSpeed();
    updateUI();
  }
}

function updateSpeed() {
  clearInterval(game);
  let speed = Math.max(100, 500 - (level - 1) * 50);
  game = setInterval(loop, speed);
}

function spawn() {
  piece = nextPiece;
  nextPiece = newPiece();
  canHold = true;

  if (collide()) gameOver();
}

function rotate() {
  let rotated = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );

  let old = piece.shape;
  piece.shape = rotated;
  if (collide()) piece.shape = old;
}

function move(dx) {
  piece.x += dx;
  if (collide()) piece.x -= dx;
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
    piece.x = 3;
    piece.y = 0;
  }

  canHold = false;
}

document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowDown") drop();
  if (e.key === "ArrowUp") rotate();
  if (e.code === "Space") hardDrop();
  if (e.key.toLowerCase() === "c") hold();
});

function loop() {
  drop();
  drawBoard();
  drawMini(nextCtx, nextPiece);
  drawMini(holdCtx, holdPiece);
}

function gameOver() {
  gameRunning = false;
  clearInterval(game);
  document.getElementById("restartBtn").style.display = "inline-block";
}

function restartGame() {
  clearInterval(game);
  init();
  updateSpeed();
}

// start
init();
updateSpeed();
