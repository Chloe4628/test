// SNAKE ADVENTURE - GAME-SPECIFIC SCRIPT

document.addEventListener('DOMContentLoaded', () => {
    // UIManager check removed as defer should handle load order.
    // If UIManager is still undefined, errors will naturally occur and be console visible.

    const UIManager = window.UIManager;

    // --- DOM Elements ---
    const splashScreen = document.getElementById('splash-screen');
    const mainGameInterface = document.getElementById('main-game-interface');
    const pauseOverlay = document.getElementById('pause-overlay');
    const gameOverScreen = document.getElementById('game-over-screen-snake');

    const startGameBtn = document.getElementById('start-game-btn');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const resumeGameBtn = document.getElementById('resume-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn-snake');
    const backToMenuBtnGameOver = document.getElementById('back-to-menu-btn-snake');

    const scoreValueDisplay = document.getElementById('score-value');
    const timerValueDisplay = document.getElementById('timer-value');
    const finalScoreDisplay = document.getElementById('final-score-display');

    const canvas = document.getElementById('game-area-snake'); // Renamed from gameArea for clarity
    const ctx = canvas.getContext('2d');

    // --- Game Constants & Variables ---
    const GRID_SIZE = 20; // Size of each cell in pixels
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    const TILE_COUNT_X = CANVAS_WIDTH / GRID_SIZE;
    const TILE_COUNT_Y = CANVAS_HEIGHT / GRID_SIZE;

    const INITIAL_SNAKE_LENGTH = 3;
    const TIME_LIMIT_SECONDS = 60;
    const INITIAL_SPEED_MS = 200; // Milliseconds per game tick
    const MIN_SPEED_MS = 70; // Fastest speed
    const SPEED_INCREMENT_MS = 10; // Speed increase per food item

    let snake;
    let food;
    let dx, dy; // Direction of snake movement (change in x, change in y per tick)
    let currentDx, currentDy; // To prevent immediate reversal
    let score;
    let timeLeft;
    let gameIntervalId;
    let timerIntervalId;
    let gameRunning;
    let isPaused;
    let currentSpeedMs;

    const SNAKE_BODY_EMOJIS = ["🟢", "🟡", "🔵", "🟣", "🟠"]; // Array of emojis for snake segments
    const FOOD_EMOJI = "⭐";

    // --- Screen Management (using UIManager) ---
    // UIManager.showScreen('splash', mainGameInterface, splashScreen, pauseOverlay, gameOverScreen); // Initial state
    // UIManager.showOverlay('pause-overlay');
    // UIManager.hideOverlay('pause-overlay');

    // --- Game Initialization ---
    function initializeGame() {
        snake = [];
        const startX = Math.floor(TILE_COUNT_X / 2);
        const startY = Math.floor(TILE_COUNT_Y / 2);
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            snake.push({ x: startX - i, y: startY, color: SNAKE_BODY_EMOJIS[i % SNAKE_BODY_EMOJIS.length] });
        }

        dx = 1; // Move right initially
        dy = 0;
        currentDx = 1; // Store current direction to prevent immediate reversal
        currentDy = 0;

        score = 0;
        timeLeft = TIME_LIMIT_SECONDS;
        gameRunning = true;
        isPaused = false;
        currentSpeedMs = INITIAL_SPEED_MS;

        updateScoreDisplay();
        updateTimerDisplay();
        placeFood();

        clearInterval(gameIntervalId);
        clearInterval(timerIntervalId);
        startGameLoop();
        startTimer();

        UIManager.hidePauseOverlay(); // Hide pause overlay if it was somehow active
        if (gameOverScreen) gameOverScreen.style.display = 'none'; // Ensure game over is hidden
        if (splashScreen) splashScreen.style.display = 'none'; // Ensure splash is hidden
        UIManager.showGameInterface(); // Shows mainGameInterface
        drawGame(); // Initial draw
    }

    // --- Drawing Functions ---
    function drawRect(x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            ctx.font = `${GRID_SIZE * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Use segment.color or a default if not set
            const emojiToDraw = segment.color || SNAKE_BODY_EMOJIS[index % SNAKE_BODY_EMOJIS.length];
            // Adding a +2 y-offset for potentially better vertical centering of emojis, similar to food.
            ctx.fillText(emojiToDraw, (segment.x * GRID_SIZE) + GRID_SIZE / 2, (segment.y * GRID_SIZE) + GRID_SIZE / 2 + 2);
        });
    }

    function drawFood() {
        ctx.font = `${GRID_SIZE * 0.9}px Arial`; // Slightly larger for food
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(FOOD_EMOJI, (food.x * GRID_SIZE) + GRID_SIZE / 2, (food.y * GRID_SIZE) + GRID_SIZE / 2);
    }
    
    function drawGame() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Clear canvas
        // Optional: Draw grid background
        // for (let i = 0; i < TILE_COUNT_X; i++) {
        //     for (let j = 0; j < TILE_COUNT_Y; j++) {
        //         drawRect(i * GRID_SIZE, j * GRID_SIZE, GRID_SIZE, GRID_SIZE, (i+j) % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)');
        //     }
        // }
        drawSnake();
        drawFood();
    }

    // --- Food Logic ---
    function placeFood() {
        let foodX, foodY, collision;
        do {
            collision = false;
            foodX = Math.floor(Math.random() * TILE_COUNT_X);
            foodY = Math.floor(Math.random() * TILE_COUNT_Y);
            for (const segment of snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    collision = true;
                    break;
                }
            }
        } while (collision);
        food = { x: foodX, y: foodY };
    }

    // --- Movement and Collision ---
    function updateSnakePosition() {
        const head = { 
            x: snake[0].x + dx, 
            y: snake[0].y + dy, 
            color: snake[0].color // New head takes color of old head, or assign new one
        };
        snake.unshift(head); // Add new head

        currentDx = dx; // Update current direction after move is decided
        currentDy = dy;

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            updateScoreDisplay();
            placeFood();
            // Increase speed
            if (currentSpeedMs > MIN_SPEED_MS) {
                currentSpeedMs -= SPEED_INCREMENT_MS;
                clearInterval(gameIntervalId); // Clear old interval
                startGameLoop(); // Restart with new speed
            }
            // Assign a new color to the new head to vary snake appearance
            head.color = SNAKE_BODY_EMOJIS[Math.floor(Math.random() * SNAKE_BODY_EMOJIS.length)];

        } else {
            snake.pop(); // Remove tail segment if no food eaten
        }
    }

    function checkCollision() {
        const head = snake[0];
        // Wall collision
        if (head.x < 0 || head.x >= TILE_COUNT_X || head.y < 0 || head.y >= TILE_COUNT_Y) {
            return true;
        }
        // Self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        return false;
    }

    // --- Game Loop ---
    function gameLoop() {
        if (!gameRunning || isPaused) return;

        updateSnakePosition();
        if (checkCollision()) {
            gameOver();
            return;
        }
        drawGame();
    }

    function startGameLoop() {
        gameIntervalId = setInterval(gameLoop, currentSpeedMs);
    }

    // --- Timer Logic ---
    function startTimer() {
        timerIntervalId = setInterval(() => {
            if (isPaused || !gameRunning) return;
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                gameOver();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerIntervalId);
    }

    // --- Game Over Logic ---
    function gameOver() {
        gameRunning = false;
        stopTimer(); 
        clearInterval(gameIntervalId); 
        
        finalScoreDisplay.textContent = score;
        
        // Manual DOM manipulation for game over screen
        if (mainGameInterface) mainGameInterface.style.display = 'none';
        if (splashScreen) splashScreen.style.display = 'none'; // Should already be hidden
        if (pauseOverlay) pauseOverlay.style.display = 'none'; // Hide pause overlay if it was somehow active
        if (gameOverScreen) gameOverScreen.style.display = 'flex'; // Show the game over screen
    }

    // --- Input Handling ---
    document.addEventListener('keydown', e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault(); // Prevent scrolling
        }
        if (!gameRunning) return; // Ignore input if game not running (e.g. on splash or game over)
        
        // Allow pause from keyboard even if game is not "active" but main interface is visible
        if (mainGameInterface.style.display !== 'none' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
            togglePause();
            return;
        }

        if (isPaused) return; // Ignore game input if paused

        const key = e.key;
        if ((key === 'ArrowUp' || key.toLowerCase() === 'w') && currentDy === 0) { // Cant go up if moving down
            dx = 0; dy = -1;
        } else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && currentDy === 0) { // Cant go down if moving up
            dx = 0; dy = 1;
        } else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a') && currentDx === 0) { // Cant go left if moving right
            dx = -1; dy = 0;
        } else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && currentDx === 0) { // Cant go right if moving left
            dx = 1; dy = 0;
        }
    });

    // --- UI Updates & Event Listeners ---
    function updateScoreDisplay() {
        scoreValueDisplay.textContent = score;
    }

    function updateTimerDisplay() {
        timerValueDisplay.textContent = timeLeft;
    }

    function togglePause() {
        if (!gameRunning && mainGameInterface.style.display === 'none') return; // Don't allow pause if game hasn't started or is over

        isPaused = !isPaused;
        if (isPaused) {
            UIManager.showPauseOverlay();
            // Timer is stopped by its own logic checking isPaused flag
        } else {
            UIManager.hidePauseOverlay();
            // Timer resumes by its own logic
        }
    }
    
    startGameBtn.addEventListener('click', initializeGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);

    playAgainBtn.addEventListener('click', () => {
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        initializeGame();
    });
    backToMenuBtnGameOver.addEventListener('click', () => {
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        UIManager.showSplashScreen();
    });
    
    document.querySelectorAll('a.home-button, #pause-overlay a[href="../index.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (gameRunning || isPaused) { // If game was active or paused
                gameRunning = false;
                isPaused = false;
                clearInterval(gameIntervalId);
                clearInterval(timerIntervalId);
                // UIManager will handle showing splash if that's the target
            }
        });
    });

    // --- Initial Setup ---
    // HTML already sets splash screen to display: flex, others to display: none.
    // UIManager.showScreen('splash', mainGameInterface, splashScreen, pauseOverlay, gameOverScreen);
    console.log("Snake Adventure game script loaded and initialized.");
});
