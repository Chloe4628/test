document.addEventListener('DOMContentLoaded', () => {
    // ... existing variable declarations ...

    // Win Screen elements
    const winScreen = document.getElementById('win-screen');
    const finalScoreDisplay = document.getElementById('final-score-display');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    // ... existing code ...

    

    // ... existing code ...

    function initializeEventListeners() {
        // ... existing event listeners ...

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                if (winScreen) winScreen.classList.remove('active');
                showGameInterface();
                initializeGame();
            });
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                if (winScreen) winScreen.classList.remove('active');
                showSplashScreen();
            });
        }

        // ... existing event listeners ...
    }

    // Initial setup
    initializeEventListeners();
    showSplashScreen();
});