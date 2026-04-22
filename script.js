const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = 20;

let board;
let piece;
let score;
let game;
let gameRunning = true;

// bentuk tetromino
const SHAPES = [
  [[1,1,1,1]],                // I
  [[1,1],[1,1]],              // O
  [[0,1,0],[1,1,1]],          // T
  [[1,0,0],[1,1,1]],          // J
  [[0,0,1],[1,1,1]],          // L
  [[1,1,0],[0,1,1]],          // S
  [[0,1,1],[1,1,0]]           // Z
];

const COLORS = ["cyan","yellow","purple","blue","orange","green","red"];

function init() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0;
  gameRunning = true;
  document.getElementById("score").textContent = score;
  document.getElementById("restartBtn").style.display = "none";
  spawn();
}

function spawn() {
  let i = Math.floor(Math.random() * SHAPES.length);
  piece = {
    shape: SHAPES[i],
    color: COLORS[i],
    x: 3,
    y: 0
  };

  if (collide()) gameOver();
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) drawCell(x, y, cell);
    });
  });

  piece.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(piece.x + x, piece.y + y, piece.color);
    });
  });
}

function collide() {
  return piece.shape.some((row, y) =>
    row.some((val, x) => {
      let px = piece.x + x;
      let py = piece.y + y;
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
  let lines = 0;
  board = board.filter(row => {
    if (row.every(cell => cell)) {
      lines++;
      return false;
    }
    return true;
  });

  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0));
  }

  score += lines * 10;
  document.getElementById("score").textContent = score;
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

document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowDown") drop();
  if (e.key === "ArrowUp") rotate();
  if (e.code === "Space") hardDrop();
});

function loop() {
  drop();
  drawBoard();
}

function gameOver() {
  gameRunning = false;
  clearInterval(game);
  document.getElementById("restartBtn").style.display = "inline-block";
}

function restartGame() {
  clearInterval(game);
  init();
  game = setInterval(loop, 500);
}

// start
init();
game = setInterval(loop, 500);
