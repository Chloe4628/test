document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const restartBtn = document.getElementById('restart-btn');
    const gridSizeButtons = document.querySelectorAll('.grid-size-btn');
    
    // Splash screen and main game interface elements
    const splashScreen = document.getElementById('splash-screen');
    const mainGameInterface = document.getElementById('main-game-interface');
    const startGameBtn = document.getElementById('start-game-btn');
    
    // Pause, Resume, Exit elements
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const resumeGameBtn = document.getElementById('resume-game-btn');
    const exitGameBtn = document.getElementById('exit-game-btn');

    // Win Screen elements
    const winScreen = document.getElementById('win-screen');
    const finalScoreDisplay = document.getElementById('final-score-display');
    const playAgainBtn = document.getElementById('play-again-btn');


    // --- Game State Variables ---
    let isPaused = false;
    let selectedGridSize = "4x4"; // Default grid size
    let currentRows = 4;
    let currentCols = 4;
    const TILE_SIZE_PX = 70; // Define tile size as a constant
    const GAP_PX = 8;        // Define gap size as a constant
    const BOARD_PADDING_PX = 8; // Define board padding as a constant


    // 1. Define emoji themes
    const fruitEmojis_default = ["🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝"]; // Default/fallback
    const animalEmojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];
    const foodEmojis = ["🍔", "🍕", "🍩", "🍪", "🍦", "🍟", "🌭", "🌮"];
    const weatherEmojis = ["☀️", "☁️", "🌧️", "❄️", "⚡️", "💨", "🌈", "🌊"];
    const sportsEmojis = ["⚽️", "🏀", "🏈", "⚾️", "🎾", "🏐", "🎱", "🏓"];
    const plantEmojis = ["🌵", "🌲", "🌳", "🌴", "🌱", "🌿", "🍄", "🌷"];

    const allThemes = [
        fruitEmojis_default, 
        animalEmojis, 
        foodEmojis, 
        weatherEmojis, 
        sportsEmojis,
        plantEmojis
    ];

    let fruitEmojis = fruitEmojis_default; // This will be reassigned in initializeGame
    let gameTiles = [];
    let firstFlippedCard = null;
    let secondFlippedCard = null;
    let lockBoard = false; // Prevents flipping more than two cards at once
    let score = 0;
    let matchedPairs = 0; // To track game completion
    let timerInterval;
    let timeLeft = 60; // Example: 60 seconds for the timer

    // 2. Create a function to shuffle these emojis (Fisher-Yates Shuffle)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
        }
        return array;
    }

    // 3. Create a function to generate the HTML for the game board
    function generateBoard() {
        // Parse selectedGridSize to update currentRows and currentCols
        // This is now done in initializeGame before generateBoard is called.

        const numPairsNeeded = (currentRows * currentCols) / 2;
        let emojisForBoard = [];
        const activeThemeEmojis = fruitEmojis; // fruitEmojis is already set to the chosen theme

        if (activeThemeEmojis.length === 0) {
            console.error("Error: No emojis in the active theme!");
            // Potentially use a fallback default emoji if activeThemeEmojis is empty
            // For now, this would lead to an empty board if not handled.
            // Fallback to a single default emoji if all else fails
            const fallbackEmoji = ["❓"]; 
            for (let i = 0; i < numPairsNeeded; i++) {
                emojisForBoard.push(fallbackEmoji[0]);
            }
        } else {
            for (let i = 0; i < numPairsNeeded; i++) {
                emojisForBoard.push(activeThemeEmojis[i % activeThemeEmojis.length]);
            }
        }
        
        let pairedEmojis = [...emojisForBoard, ...emojisForBoard];
        gameTiles = shuffle(pairedEmojis);

        gameBoard.innerHTML = ''; // Clear any existing placeholder content or old game
        gameBoard.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${currentRows}, 1fr)`;

        // Calculate and set game board dimensions
        const boardWidth = (currentCols * TILE_SIZE_PX) + ((currentCols - 1) * GAP_PX) + (2 * BOARD_PADDING_PX);
        const boardHeight = (currentRows * TILE_SIZE_PX) + ((currentRows - 1) * GAP_PX) + (2 * BOARD_PADDING_PX);
        gameBoard.style.width = `${boardWidth}px`;
        gameBoard.style.height = `${boardHeight}px`;
        
        // Adjust tile size if necessary for larger grids, e.g. 6x6, to fit UI.
        // For now, tile size is fixed at 70x70 via CSS.
        // If we wanted dynamic tile sizes:
        // const tileWidth = ... calculation ...;
        // const tileHeight = ... calculation ...;
        // tile.style.width = `${tileWidth}px`;
        // tile.style.height = `${tileHeight}px`;

        gameTiles.forEach((emoji, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.emoji = emoji;
            // tile.textContent = emoji; // Initially hide the emoji; reveal on flip
            tile.dataset.index = index; // Useful for tracking specific tiles

            // Add click event listener for flipping logic (to be implemented later)
            tile.addEventListener('click', handleTileClick);
            gameBoard.appendChild(tile);
        });
    }

    function handleTileClick() {
        if (isPaused) return; // Prevent interaction if game is paused
        if (lockBoard) return;
        if (this.classList.contains('matched')) return; // Ignore already matched cards
        if (this === firstFlippedCard) return; // Prevent double clicking the same card

        this.classList.add('flipped');
        this.textContent = this.dataset.emoji; // Show emoji

        if (!firstFlippedCard) {
            firstFlippedCard = this;
            return;
        }

        secondFlippedCard = this;
        lockBoard = true; // Lock board while checking for a match

        checkForMatch();
    }

    function checkForMatch() {
        const isMatch = firstFlippedCard.dataset.emoji === secondFlippedCard.dataset.emoji;

        if (isMatch) {
            disableMatchedCards();
        } else {
            unflipCards();
        }
    }

    function disableMatchedCards() {
        // Add visual effect class for match
        firstFlippedCard.classList.add('tile-matched-visual-effect');
        secondFlippedCard.classList.add('tile-matched-visual-effect');

        // The 'popAndGlow' animation is designed to end in the '.matched' state.
        // So, we add '.matched' almost immediately.
        // The animation 'forwards' will hold the end state.
        firstFlippedCard.classList.add('matched');
        secondFlippedCard.classList.add('matched');
        
        firstFlippedCard.removeEventListener('click', handleTileClick);
        secondFlippedCard.removeEventListener('click', handleTileClick);

        updateScore(10);
        matchedPairs++;

        // Remove the animation class after it finishes to ensure clean state
        setTimeout(() => {
            if (firstFlippedCard) firstFlippedCard.classList.remove('tile-matched-visual-effect');
            if (secondFlippedCard) secondFlippedCard.classList.remove('tile-matched-visual-effect');
        }, 700); // Duration of popAndGlow animation is 0.7s

        if (matchedPairs * 2 === gameTiles.length) {
            clearInterval(timerInterval);
            lockBoard = true; // Ensure board is locked
            
            // If game was paused when won, reset pause state and hide overlay
            if (isPaused) {
                isPaused = false;
                if (pauseOverlay) pauseOverlay.style.display = 'none';
            }
            
            // Delay showing win screen slightly to allow final match animation to be perceived
            setTimeout(() => {
                showWinScreen(score);
            }, 700); // Matches the alert delay previously used
        } else {
             // Only reset board state if game is not won yet
            resetBoardState();
        }
    }

    function unflipCards() {
        // Add visual effect class for mismatch
        if (firstFlippedCard) firstFlippedCard.classList.add('tile-mismatched-visual-effect');
        if (secondFlippedCard) secondFlippedCard.classList.add('tile-mismatched-visual-effect');

        // Current shake animation is 0.35s. Wait for it to mostly finish before starting flip back.
        // Total delay before cards are hidden is 1000ms.
        setTimeout(() => {
            if (firstFlippedCard) {
                firstFlippedCard.classList.remove('tile-mismatched-visual-effect'); // Clean up animation class
                firstFlippedCard.classList.remove('flipped');
                firstFlippedCard.textContent = '';
            }
            if (secondFlippedCard) {
                secondFlippedCard.classList.remove('tile-mismatched-visual-effect'); // Clean up animation class
                secondFlippedCard.classList.remove('flipped');
                secondFlippedCard.textContent = '';
            }
            resetBoardState();
        }, 1000); // Original timeout to see the cards
    }

    function resetBoardState() {
        firstFlippedCard = null;
        secondFlippedCard = null;
        lockBoard = false;
    }
    
    function updateScore(points) {
        score += points;
        scoreElement.textContent = score;
    }

    // Timer logic
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval); // Clear any existing timer
        }
        // timeLeft is reset in initializeGame
        timerElement.textContent = formatTime(timeLeft);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                lockBoard = true; // Lock board when time is up
                // Delay alert slightly to allow UI update
                setTimeout(() => {
                    alert(`Time's up! Game Over. Final Score: ${score}`);
                }, 100);
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Initialize the game
    function initializeGame() {
        // Parse selectedGridSize to update currentRows and currentCols
        const parts = selectedGridSize.split('x');
        currentRows = parseInt(parts[0], 10);
        currentCols = parseInt(parts[1], 10);

        // Check for invalid parsing, default to 4x4
        if (isNaN(currentRows) || isNaN(currentCols) || currentRows * currentCols % 2 !== 0) {
            console.warn(`Invalid grid size: ${selectedGridSize}. Defaulting to 4x4.`);
            currentRows = 4;
            currentCols = 4;
            selectedGridSize = "4x4"; // Correct the state
            // Update active button visuals if this correction happens
            gridSizeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.grid === "4x4");
            });
        }
        
        // Randomly select a theme
        const randomThemeIndex = Math.floor(Math.random() * allThemes.length);
        fruitEmojis = allThemes[randomThemeIndex]; // Update the active emoji set

        score = 0;
        scoreElement.textContent = score;
        matchedPairs = 0; 
        timeLeft = 60; // Reset timer duration here
        firstFlippedCard = null;
        secondFlippedCard = null;
        lockBoard = false;
        
        // Clear existing timer before starting a new one or generating board
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        timerElement.textContent = formatTime(timeLeft); // Update display immediately

        generateBoard(); // This will use the newly selected fruitEmojis
        startTimer(); // Start the timer automatically when game initializes/restarts
    }

    // --- UI View Functions (now primarily calling UIManager) ---
    // showSplashScreen, showGameInterface, showWinScreen are now primarily handled by UIManager
    // Game-specific logic within these flows (like resetting isPaused) remains here or in callers.

    // --- Pause, Resume, Exit Functions ---
    function pauseGame() {
        if (!isPaused) {
            isPaused = true;
            clearInterval(timerInterval); // Stop the timer
            UIManager.showPauseOverlay(); // Call UIManager
            lockBoard = true; // Effectively locks board by overlay and state
        }
    }

    function resumeGame() {
        if (isPaused) {
            isPaused = false;
            UIManager.hidePauseOverlay(); // Call UIManager
            // lockBoard will be false unless two cards are already flipped
            lockBoard = (firstFlippedCard && secondFlippedCard) ? true : false; 
            if (timeLeft > 0) { // Only restart timer if there's time left
                startTimer(); // Restart the timer
            } else {
                // If time was already up when paused, ensure game remains over
                lockBoard = true; 
            }
        }
    }

    // showWinScreen is called from disableMatchedCards, that's where game-specific logic needs to be
    // before calling UIManager.showWinScreen

    function exitGame() {
        isPaused = false;
        clearInterval(timerInterval);
        UIManager.hidePauseOverlay(); // Call UIManager

        // Reset game state variables
        score = 0;
        scoreElement.textContent = score;
        timeLeft = 60; // Or get from a config
        timerElement.textContent = formatTime(timeLeft);
        matchedPairs = 0;
        firstFlippedCard = null;
        secondFlippedCard = null;
        lockBoard = false;
        if(gameBoard) gameBoard.innerHTML = ''; // Clear the game board

        UIManager.showSplashScreen(); // Call UIManager
    }


    // --- Initialize Event Listeners (Consolidated) ---
    function initializeEventListeners() {
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                UIManager.showGameInterface(); // Call UIManager
                initializeGame();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', initializeGame);
        }

        gridSizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                gridSizeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedGridSize = button.dataset.grid;
                // NOTE: initializeGame() is NOT called here.
                // Grid size selection takes effect on next "Start Game" or "Restart Game".
            });
        });

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                // UIManager.showWinScreen would have hidden other screens.
                // UIManager.showSplashScreen will hide winScreen.
                UIManager.showSplashScreen(); // Call UIManager
            });
        }

        if (pauseGameBtn) {
            pauseGameBtn.addEventListener('click', pauseGame);
        }
        if (resumeGameBtn) {
            resumeGameBtn.addEventListener('click', resumeGame);
        }
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', exitGame);
        }
    }

    // Initial setup
    initializeEventListeners();
    UIManager.showSplashScreen(); // Call UIManager
    // initializeGame(); // Game starts via "Start Game" button
});
