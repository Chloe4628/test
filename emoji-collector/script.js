document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameArea = document.getElementById('game-area');
    const scoreValueDisplay = document.getElementById('score-value');
    const timerValueDisplay = document.getElementById('timer-value');
    
    const characterSelector = document.getElementById('character-selector');
    const characterOptions = document.querySelectorAll('.character-option');

    // Buttons (from UIManager context or queried if needed for game-specific logic)
    const startGameBtn = document.getElementById('start-game-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const resumeGameBtn = document.getElementById('resume-game-btn');
    const exitGameBtn = document.getElementById('exit-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Screens (from UIManager context)
    const winMessageHeading = document.getElementById('win-message-heading');
    const winSubMessage = document.getElementById('win-sub-message'); // Assuming this ID exists for sub-message
    const finalScoreDisplay = document.getElementById('final-score-display');


    // --- Game Variables ---
    let selectedCharacter = '🧑‍🚀'; // Default character
    let playerElement;
    let score = 0;
    let timeLeft = 60; // seconds
    let gameInterval;
    let items = []; // Array to hold collectibles and hazards
    let gameActive = false;
    let isPaused = false; // Game-specific pause state
    
    const PLAYER_SPEED = 15; // Pixels per move
    const ITEM_SPEED = 2; // Pixels per gameLoop tick
    const ITEM_SPAWN_INTERVAL = 1000; // ms, roughly how often new items might spawn
    let lastItemSpawnTime = 0;

    const COLLECTIBLES = ['✨', '🌸', '☀️', '💎', '⭐'];
    const HAZARDS = ['💀', '💣', '🔥', '🌵', '👻'];


    // --- Character Selection ---
    characterOptions.forEach(option => {
        option.addEventListener('click', () => {
            characterOptions.forEach(opt => opt.classList.remove('selected-character'));
            option.classList.add('selected-character');
            selectedCharacter = option.dataset.char;
        });
    });

    // --- Game Initialization ---
    function initializeGame() {
        isPaused = false;
        UIManager.hidePauseOverlay();
        UIManager.showGameInterface();

        score = 0;
        timeLeft = 60;
        updateScoreDisplay();
        updateTimerDisplay();

        items.forEach(item => item.element.remove()); // Clear existing items from DOM
        items = []; // Clear items array
        lastItemSpawnTime = 0;

        if (playerElement) playerElement.remove(); // Remove old player if any
        
        playerElement = document.createElement('div');
        playerElement.classList.add('player-character');
        playerElement.textContent = selectedCharacter;
        gameArea.appendChild(playerElement);
        
        // Position player at bottom center
        playerElement.style.left = `${(gameArea.offsetWidth - playerElement.offsetWidth) / 2}px`;
        playerElement.style.bottom = '10px'; // Small offset from bottom

        gameActive = true;
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 50); // Game loop runs every 50ms
    }

    // --- Player Movement ---
    const keysPressed = {};
    document.addEventListener('keydown', (e) => {
        if (!isPaused && gameActive) keysPressed[e.key] = true;
    });
    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    function movePlayer() {
        if (!playerElement || !gameActive || isPaused) return;

        let currentLeft = playerElement.offsetLeft;
        let currentTop = playerElement.offsetTop; // Using offsetTop for consistency if bottom is not always fixed

        if (keysPressed['ArrowLeft'] && currentLeft > 0) {
            currentLeft -= PLAYER_SPEED;
        }
        if (keysPressed['ArrowRight'] && currentLeft < (gameArea.offsetWidth - playerElement.offsetWidth)) {
            currentLeft += PLAYER_SPEED;
        }
        if (keysPressed['ArrowUp'] && currentTop > 0) {
            currentTop -= PLAYER_SPEED;
        }
        if (keysPressed['ArrowDown'] && currentTop < (gameArea.offsetHeight - playerElement.offsetHeight)) {
            currentTop += PLAYER_SPEED;
        }
        
        playerElement.style.left = `${Math.max(0, Math.min(currentLeft, gameArea.offsetWidth - playerElement.offsetWidth))}px`;
        playerElement.style.top = `${Math.max(0, Math.min(currentTop, gameArea.offsetHeight - playerElement.offsetHeight))}px`;
    }


    // --- Game Loop ---
    function gameLoop() {
        if (!gameActive || isPaused) return;

        const currentTime = Date.now();

        // Player movement based on keysPressed
        movePlayer();

        // Spawn new items
        if (currentTime - lastItemSpawnTime > ITEM_SPAWN_INTERVAL) {
            if (Math.random() < 0.7) { // 70% chance to spawn an item each interval after the first
                 spawnItem();
                 lastItemSpawnTime = currentTime;
            }
        }
        
        moveItems();
        checkCollisions();

        // Update timer
        // Timer update should be more consistent, e.g. every second
        // This is a placeholder, will be refined. For now, tied to gameLoop.
        // A more robust timer would use requestAnimationFrame or a separate setInterval.
        // For simplicity in this structure:
        if (gameLoop.timerTick === undefined) gameLoop.timerTick = 0;
        gameLoop.timerTick++;
        if (gameLoop.timerTick >= (1000 / 50)) { // 1000ms / 50ms_per_loop = 20 ticks per second
            timeLeft--;
            updateTimerDisplay();
            gameLoop.timerTick = 0;
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }

    // --- Item Management ---
    function spawnItem() {
        const isCollectible = Math.random() < 0.7; // 70% chance for collectible, 30% for hazard
        const itemElement = document.createElement('div');
        itemElement.classList.add(isCollectible ? 'collectible-item' : 'hazard-item');
        itemElement.textContent = isCollectible 
            ? COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)]
            : HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
        
        itemElement.style.left = `${Math.random() * (gameArea.offsetWidth - 30)}px`; // 30 is approx item width
        itemElement.style.top = `0px`; // Start at the top
        gameArea.appendChild(itemElement);
        items.push({ element: itemElement, type: isCollectible ? 'collectible' : 'hazard' });
    }

    function moveItems() {
        items = items.filter(item => {
            let currentTop = item.element.offsetTop;
            currentTop += ITEM_SPEED;
            if (currentTop > gameArea.offsetHeight) {
                item.element.remove();
                return false; // Remove from array
            }
            item.element.style.top = `${currentTop}px`;
            return true; // Keep in array
        });
    }

    // --- Collision Detection ---
    function checkCollisions() {
        if (!playerElement) return;
        const playerRect = playerElement.getBoundingClientRect();
        items = items.filter(item => {
            const itemRect = item.element.getBoundingClientRect();
            if (
                playerRect.left < itemRect.right &&
                playerRect.right > itemRect.left &&
                playerRect.top < itemRect.bottom &&
                playerRect.bottom > itemRect.top
            ) {
                if (item.type === 'collectible') {
                    score += 10;
                } else { // Hazard
                    score -= 20;
                    if (score < 0) score = 0; // Prevent score from going far below 0
                }
                updateScoreDisplay();
                item.element.remove();
                return false; // Remove from array
            }
            return true; // Keep in array
        });
    }

    // --- UI Updates ---
    function updateScoreDisplay() {
        if (scoreValueDisplay) scoreValueDisplay.textContent = score;
    }
    function updateTimerDisplay() {
        if (timerValueDisplay) timerValueDisplay.textContent = timeLeft;
    }

    // --- Game End ---
    function endGame() {
        gameActive = false;
        isPaused = false; // Ensure not stuck in paused state
        UIManager.hidePauseOverlay();
        if (gameInterval) clearInterval(gameInterval);
        
        if (winMessageHeading) winMessageHeading.textContent = "Time's Up!";
        if (winSubMessage) winSubMessage.textContent = "Here's how you did:";
        UIManager.showWinScreen(score); // UIManager will update finalScoreDisplay
    }

    // --- Pause, Resume, Exit Logic ---
    function handlePauseGame() {
        if (!gameActive || isPaused) return;
        isPaused = true;
        // gameInterval is implicitly paused by gameLoop checking isPaused
        UIManager.showPauseOverlay();
    }

    function handleResumeGame() {
        if (!gameActive || !isPaused) return;
        isPaused = false;
        UIManager.hidePauseOverlay();
        // gameInterval will resume in gameLoop
    }

    function handleExitGame() {
        gameActive = false;
        isPaused = false;
        if (gameInterval) clearInterval(gameInterval);
        items.forEach(item => item.element.remove());
        items = [];
        if (playerElement) playerElement.remove();
        UIManager.showSplashScreen();
    }

    // --- Event Listeners ---
    function initializeEventListeners() {
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                UIManager.showGameInterface();
                initializeGame();
            });
        }
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', initializeGame);
        }
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                UIManager.showSplashScreen();
            });
        }
        if (pauseGameBtn) {
            pauseGameBtn.addEventListener('click', handlePauseGame);
        }
        if (resumeGameBtn) {
            resumeGameBtn.addEventListener('click', handleResumeGame);
        }
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', handleExitGame);
        }
    }

    // Initial Setup
    initializeEventListeners();
    UIManager.showSplashScreen();
});
