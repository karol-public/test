// SHAPES and Tetromino
const SHAPES = {
    I: {
        color: '#38bdf8', // Cyan
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    J: {
        color: '#818cf8', // Indigo
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    L: {
        color: '#fb923c', // Orange
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    O: {
        color: '#facc15', // Yellow
        matrix: [
            [1, 1],
            [1, 1]
        ]
    },
    S: {
        color: '#4ade80', // Green
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    T: {
        color: '#c084fc', // Purple
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    Z: {
        color: '#f87171', // Red
        matrix: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    }
};

class Tetromino {
    constructor(shapeKey) {
        this.shapeKey = shapeKey;
        this.definition = SHAPES[shapeKey];
        this.matrix = this.definition.matrix.map(row => [...row]);
        this.color = this.definition.color;
        this.x = 0;
        this.y = 0;
    }

    rotate() {
        const N = this.matrix.length;
        const rotated = this.matrix.map((row, i) =>
            row.map((val, j) => this.matrix[N - 1 - j][i])
        );
        this.matrix = rotated;
    }

    // Clone for collision testing
    clone() {
        const clone = new Tetromino(this.shapeKey);
        clone.matrix = this.matrix.map(row => [...row]);
        clone.x = this.x;
        clone.y = this.y;
        return clone;
    }
}

function getRandomTetromino() {
    const keys = Object.keys(SHAPES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return new Tetromino(randomKey);
}

// Grid
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
    }

    isValidPosition(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    const x = tetromino.x + c;
                    const y = tetromino.y + r;

                    // Check bounds
                    if (x < 0 || x >= this.width || y >= this.height) {
                        return false;
                    }

                    // Check collision with locked pieces
                    if (y >= 0 && this.grid[y][x]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockTetromino(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    const x = tetromino.x + c;
                    const y = tetromino.y + r;
                    // Only lock if within bounds (ignore top out for now, handled by game over)
                    if (y >= 0 && y < this.height) {
                        this.grid[y][x] = tetromino.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let r = this.height - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== null)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(this.width).fill(null));
                linesCleared++;
                r++; // Check the same row index again as rows shifted down
            }
        }
        return linesCleared;
    }

    reset() {
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
    }
}

// Renderer
class Renderer {
    constructor(canvas, grid, blockSize = 30) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.blockSize = blockSize;

        // Adjust canvas size based on grid dimensions
        this.canvas.width = this.grid.width * this.blockSize;
        this.canvas.height = this.grid.height * this.blockSize;
    }

    draw(activeTetromino) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        if (activeTetromino) {
            this.drawTetromino(activeTetromino);
            this.drawGhost(activeTetromino);
        }
    }

    drawGrid() {
        for (let r = 0; r < this.grid.height; r++) {
            for (let c = 0; c < this.grid.width; c++) {
                if (this.grid.grid[r][c]) {
                    this.drawBlock(c, r, this.grid.grid[r][c]);
                }
            }
        }
    }

    drawTetromino(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    this.drawBlock(tetromino.x + c, tetromino.y + r, tetromino.color);
                }
            }
        }
    }

    drawGhost(tetromino) {
        const ghost = tetromino.clone();
        while (this.grid.isValidPosition(ghost)) {
            ghost.y++;
        }
        ghost.y--; // Step back to valid position

        this.ctx.globalAlpha = 0.2;
        this.drawTetromino(ghost);
        this.ctx.globalAlpha = 1.0;
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);

        // Add inner shadow/highlight for 3D effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, 2);
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 2, this.blockSize);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect((x + 1) * this.blockSize - 2, y * this.blockSize, 2, this.blockSize);
        this.ctx.fillRect(x * this.blockSize, (y + 1) * this.blockSize - 2, this.blockSize, 2);
    }
}

// Input
class Input {
    constructor(game) {
        this.game = game;
        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.game.isGameOver) return;

            switch (event.code) {
                case 'ArrowLeft':
                    this.game.move(-1);
                    break;
                case 'ArrowRight':
                    this.game.move(1);
                    break;
                case 'ArrowDown':
                    this.game.drop();
                    break;
                case 'ArrowUp':
                    this.game.rotate();
                    break;
                case 'Space':
                    this.game.hardDrop();
                    break;
            }
        });

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.game.start();
                startBtn.blur(); // Remove focus so spacebar doesn't trigger click
            });
        }
    }
}

// Game
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.grid = new Grid(10, 20);
        this.renderer = new Renderer(this.canvas, this.grid);
        this.input = new Input(this);

        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('final-score');

        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.pauseBtn = document.getElementById('pause-btn');

        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.activeTetromino = null;
        this.isGameOver = false;
        this.isRunning = false;
        this.isPaused = false;

        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        this.loop = this.loop.bind(this);
        this.setupUIListeners();
    }

    setupUIListeners() {
        this.restartBtn.addEventListener('click', () => {
            this.gameOverOverlay.classList.add('hidden');
            this.start();
        });

        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.togglePause());

        // Handle visibility change to auto-pause
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) {
                this.togglePause();
            }
        });
    }

    start() {
        if (this.isRunning && !this.isGameOver) return;

        this.grid.reset();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.updateScore();

        this.isGameOver = false;
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.textContent = "PLAYING...";
        this.startBtn.disabled = true;

        this.spawnTetromino();

        this.lastTime = 0;
        this.dropCounter = 0;
        requestAnimationFrame(this.loop);
    }

    togglePause() {
        if (!this.isRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseOverlay.classList.remove('hidden');
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    spawnTetromino() {
        this.activeTetromino = getRandomTetromino();
        this.activeTetromino.x = Math.floor(this.grid.width / 2) - Math.floor(this.activeTetromino.matrix[0].length / 2);
        this.activeTetromino.y = 0;

        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.gameOver();
        }
    }

    move(dir) {
        if (!this.isRunning || this.isPaused) return;

        this.activeTetromino.x += dir;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.x -= dir;
        }
    }

    rotate() {
        if (!this.isRunning || this.isPaused) return;

        const originalMatrix = this.activeTetromino.matrix;
        this.activeTetromino.rotate();

        // Wall kick (basic)
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            // Try moving left
            this.activeTetromino.x -= 1;
            if (!this.grid.isValidPosition(this.activeTetromino)) {
                // Try moving right
                this.activeTetromino.x += 2;
                if (!this.grid.isValidPosition(this.activeTetromino)) {
                    // Revert
                    this.activeTetromino.x -= 1;
                    this.activeTetromino.matrix = originalMatrix;
                }
            }
        }
    }

    drop() {
        if (!this.isRunning || this.isPaused) return;

        this.activeTetromino.y++;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y--;
            this.lock();
            this.dropCounter = 0; // Reset drop counter
        }
    }

    hardDrop() {
        if (!this.isRunning || this.isPaused) return;
        while (this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y++;
        }
        this.activeTetromino.y--;
        this.lock();
        this.dropCounter = 0;
    }

    lock() {
        this.grid.lockTetromino(this.activeTetromino);
        const cleared = this.grid.clearLines();
        if (cleared > 0) {
            this.updateScore(cleared);
        }
        this.spawnTetromino();
    }

    updateScore(linesCleared = 0) {
        if (linesCleared > 0) {
            const points = [0, 40, 100, 300, 1200];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;

            // Speed up
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }

        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        this.startBtn.textContent = "START GAME";
        this.startBtn.disabled = false;

        this.finalScoreElement.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
    }

    loop(time = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }

        this.renderer.draw(this.activeTetromino);
        requestAnimationFrame(this.loop);
    }
}

// Initialize Game
const game = new Game();
// Initial draw
game.renderer.draw(null);
