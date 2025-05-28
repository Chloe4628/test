document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements from shared UIManager context (or queried directly if needed)
    const splashScreen = document.getElementById('splash-screen');
    const mainGameInterface = document.getElementById('main-game-interface');
    // const winScreen = document.getElementById('win-screen'); // Removed
    const pauseOverlay = document.getElementById('pause-overlay');
    
    const startGameBtn = document.getElementById('start-game-btn');
    // const playAgainBtn = document.getElementById('play-again-btn'); // Removed
    const resumeGameBtn = document.getElementById('resume-game-btn');

    // Game-specific DOM Elements
    const gameStatusDisplay = document.getElementById('game-status');
    const ticTacToeBoard = document.getElementById('tic-tac-toe-board');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const exitGameBtn = document.getElementById('exit-game-btn');
    // const winMessageElement = document.querySelector('#win-screen h2'); // Removed
    // const finalScoreDisplay = document.getElementById('final-score-display'); // Removed, score not applicable / handled by alert

    // Game Variables
    const PLAYER_SYMBOL = '❌';
    const AI_SYMBOL = '💖';
    let currentPlayer = PLAYER_SYMBOL; // Player always starts
    let boardState = Array(9).fill(null); // Represents the 3x3 board
    let gameActive = false;
    let isPaused = false; // Game-specific pause state

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function initializeGame() {
        isPaused = false; 
        UIManager.hidePauseOverlay(); 
        UIManager.showGameInterface(); 

        currentPlayer = PLAYER_SYMBOL; // Player always starts
        boardState.fill(null);
        gameActive = true;
        // if(finalScoreDisplay) finalScoreDisplay.textContent = "N/A"; // Score not applicable / handled by alert

        if (gameStatusDisplay) gameStatusDisplay.textContent = `Your Turn (${PLAYER_SYMBOL})`;
        
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

        if (boardState[clickedCellIndex] !== null || currentPlayer !== PLAYER_SYMBOL) { // Cell already taken or not player's turn
            return;
        }

        boardState[clickedCellIndex] = PLAYER_SYMBOL;
        clickedCell.textContent = PLAYER_SYMBOL;
        clickedCell.classList.add('occupied');

        if (checkWin(boardState, PLAYER_SYMBOL)) {
            endGame(false, PLAYER_SYMBOL);
        } else if (boardState.every(cell => cell !== null)) {
            endGame(true);
        } else {
            currentPlayer = AI_SYMBOL;
            if (gameStatusDisplay) gameStatusDisplay.textContent = `Computer's Turn (${AI_SYMBOL})`;
            lockBoard = true; // Lock board during AI's turn deliberation
            setTimeout(() => {
                aiMove();
                lockBoard = false; // Unlock after AI move, unless game ended
            }, 500); // AI "thinking" delay
        }
    }

    // switchPlayer function is removed as turn management is now explicit.

    function checkWin(currentBoard, symbol) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (currentBoard[a] === symbol && currentBoard[b] === symbol && currentBoard[c] === symbol) {
                if (gameActive) { // Only highlight if it's a real win, not a hypothetical check
                     highlightWinningCells([a,b,c]);
                }
                return true; 
            }
        }
        return false; 
    }
    
    function highlightWinningCells(winningIndexes) {
        winningIndexes.forEach(index => {
            const cell = ticTacToeBoard.querySelector(`.tic-tac-toe-cell[data-index='${index}']`);
            if (cell) {
                cell.classList.add('win-cell');
            }
        });
    }

    function aiMove() {
        if (!gameActive || currentPlayer !== AI_SYMBOL) return;

        let move = -1;

        // 1. Check for AI Win
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = AI_SYMBOL;
                if (checkWin(boardState, AI_SYMBOL)) {
                    move = i;
                    boardState[i] = null; // Revert test move
                    break;
                }
                boardState[i] = null; // Revert test move
            }
        }

        // 2. Block Player Win
        if (move === -1) {
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === null) {
                    boardState[i] = PLAYER_SYMBOL;
                    if (checkWin(boardState, PLAYER_SYMBOL)) {
                        move = i;
                        boardState[i] = null; // Revert test move
                        break;
                    }
                    boardState[i] = null; // Revert test move
                }
            }
        }
        
        // 3. Take Center
        if (move === -1 && boardState[4] === null) {
            move = 4;
        }

        // 4. Take Corner (0, 2, 6, 8)
        if (move === -1) {
            const corners = [0, 2, 6, 8].filter(index => boardState[index] === null);
            if (corners.length > 0) {
                move = corners[Math.floor(Math.random() * corners.length)];
            }
        }

        // 5. Take Side (1, 3, 5, 7)
        if (move === -1) {
            const sides = [1, 3, 5, 7].filter(index => boardState[index] === null);
            if (sides.length > 0) {
                move = sides[Math.floor(Math.random() * sides.length)];
            }
        }
        
        // Fallback: if somehow no strategic move, take first available (should not happen with above logic)
        if (move === -1) {
            move = boardState.findIndex(cell => cell === null);
        }


        if (move !== -1) {
            boardState[move] = AI_SYMBOL;
            const cell = ticTacToeBoard.querySelector(`.tic-tac-toe-cell[data-index='${move}']`);
            if (cell) {
                cell.textContent = AI_SYMBOL;
                cell.classList.add('occupied');
            }

            if (checkWin(boardState, AI_SYMBOL)) {
                endGame(false, AI_SYMBOL);
            } else if (boardState.every(cellVal => cellVal !== null)) {
                endGame(true);
            } else {
                currentPlayer = PLAYER_SYMBOL;
                if (gameStatusDisplay) gameStatusDisplay.textContent = `Your Turn (${PLAYER_SYMBOL})`;
            }
        }
         lockBoard = false; // Ensure board is unlocked if AI didn't end game
    }


    function endGame(isDraw, winner = null) {
        gameActive = false;
        let message = "";
        if (isDraw) {
            message = "It's a Draw! 🤝";
            if (gameStatusDisplay) gameStatusDisplay.textContent = "Draw Game!";
        } else if (winner === PLAYER_SYMBOL) {
            message = "You Win! 🥳";
            if (gameStatusDisplay) gameStatusDisplay.textContent = "You Win!";
        } else if (winner === AI_SYMBOL) {
            message = "Computer Wins! 🤖";
            if (gameStatusDisplay) gameStatusDisplay.textContent = "Computer Wins!";
        }
        // if (winMessageElement) winMessageElement.textContent = message; // Removed
        
        // Use UIManager to show the win screen
        // Score isn't really applicable to Tic-Tac-Toe in this context
        setTimeout(() => { // Delay to allow win animation to be seen
            alert("游戏结束！ " + message + "\n点击确定返回主页面。");
    window.location.href = "../index.html";
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
