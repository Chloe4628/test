document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements from shared UIManager context (or queried directly if needed)
    const splashScreen = document.getElementById('splash-screen');
    const mainGameInterface = document.getElementById('main-game-interface');
    const winScreen = document.getElementById('win-screen');
    const pauseOverlay = document.getElementById('pause-overlay');
    
    const startGameBtn = document.getElementById('start-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const resumeGameBtn = document.getElementById('resume-game-btn');

    // Game-specific DOM Elements
    const gameStatusDisplay = document.getElementById('game-status');
    const ticTacToeBoard = document.getElementById('tic-tac-toe-board');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const exitGameBtn = document.getElementById('exit-game-btn');
    const winMessageElement = document.querySelector('#win-screen h2'); // For "Player X Wins!" or "It's a Draw!"
    const finalScoreDisplay = document.getElementById('final-score-display'); // For TTT, score is N/A

    // Game Variables
    const playerX = '❌'; // Player 1 Emoji
    const playerO = '💖'; // Player 2 Emoji (Cute heart alternative)
    let currentPlayer = playerX;
    let boardState = Array(9).fill(null); // Represents the 3x3 board
    let gameActive = false;
    let isPaused = false; // Game-specific pause state

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function initializeGame() {
        isPaused = false; // Reset pause state
        UIManager.hidePauseOverlay(); // Ensure pause overlay is hidden
        UIManager.showGameInterface(); // Show main game, hide others

        currentPlayer = playerX;
        boardState.fill(null);
        gameActive = true;
        if(finalScoreDisplay) finalScoreDisplay.textContent = "N/A";


        if (gameStatusDisplay) gameStatusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
        
        if (ticTacToeBoard) {
            ticTacToeBoard.innerHTML = ''; // Clear previous cells
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.classList.add('tic-tac-toe-cell');
                cell.dataset.index = i;
                cell.addEventListener('click', handleCellClick);
                ticTacToeBoard.appendChild(cell);
            }
        }
    }

    function handleCellClick(event) {
        if (isPaused || !gameActive) return;

        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.index);

        if (boardState[clickedCellIndex] !== null) { // Cell already taken
            return;
        }

        boardState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add('occupied');

        if (checkWinCondition()) {
            endGame(false, currentPlayer);
        } else if (boardState.every(cell => cell !== null)) { // All cells filled, it's a draw
            endGame(true);
        } else {
            switchPlayer();
        }
    }

    function switchPlayer() {
        currentPlayer = (currentPlayer === playerX) ? playerO : playerX;
        if (gameStatusDisplay) gameStatusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    }

    function checkWinCondition() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                highlightWinningCells([a,b,c]);
                return true; // Win detected
            }
        }
        return false; // No win
    }
    
    function highlightWinningCells(winningIndexes) {
        winningIndexes.forEach(index => {
            const cell = ticTacToeBoard.querySelector(`.tic-tac-toe-cell[data-index='${index}']`);
            if (cell) {
                cell.classList.add('win-cell');
            }
        });
    }


    function endGame(isDraw, winner = null) {
        gameActive = false;
        let message = "";
        if (isDraw) {
            message = "It's a Draw! 🤝";
            if (gameStatusDisplay) gameStatusDisplay.textContent = "Draw Game!";
        } else {
            message = `Player ${winner} Wins! 🎉`;
            if (gameStatusDisplay) gameStatusDisplay.textContent = `Player ${winner} Wins!`;
        }
        if (winMessageElement) winMessageElement.textContent = message;
        
        // Use UIManager to show the win screen
        // Score isn't really applicable to Tic-Tac-Toe in this context
        setTimeout(() => { // Delay to allow win animation to be seen
            UIManager.showWinScreen("N/A"); // Explicitly pass "N/A" for score
        }, 500); // Short delay for win highlight
    }

    // --- Pause, Resume, Exit Game Specific Logic ---
    function handlePauseGame() {
        if (!gameActive || isPaused) return; // Don't pause if game isn't active or already paused
        isPaused = true;
        // Timer pause not needed for Tic-Tac-Toe as it's turn-based
        UIManager.showPauseOverlay();
    }

    function handleResumeGame() {
        if (!gameActive || !isPaused) return;
        isPaused = false;
        UIManager.hidePauseOverlay();
        // Timer resume not needed
    }

    function handleExitGame() {
        gameActive = false;
        isPaused = false; // Reset pause state
        // Reset any game-specific state if necessary before showing splash
        // boardState.fill(null); // Optional: clear board state immediately
        // ticTacToeBoard.innerHTML = ''; // Optional: clear board UI immediately
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
                // Game will re-initialize when "Start Game" is clicked from splash
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
    UIManager.showSplashScreen(); // Show splash screen first
});
