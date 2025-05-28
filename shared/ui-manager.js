// SHARED UI MANAGER
const UIManager = {
    // Assumes elements are passed, as IDs might be game-specific or UIManager might not have direct DOM access here
    // Or, it could assume standard IDs and query them itself if this script is loaded in the game's HTML.
    // For now, let's assume standard IDs for simplicity of refactoring.

    _getElem: (id) => document.getElementById(id),

    showSplashScreen: function() {
        const splashScreen = this._getElem('splash-screen');
        const mainGameInterface = this._getElem('main-game-interface');
        // const winScreen = this._getElem('win-screen'); // Make sure to hide win screen too
        const pauseOverlay = this._getElem('pause-overlay'); // And pause overlay

        if (splashScreen) splashScreen.style.display = 'flex';
        if (mainGameInterface) mainGameInterface.style.display = 'none';
        // if (winScreen) winScreen.style.display = 'none'; // winScreen has been removed
        if (pauseOverlay) pauseOverlay.style.display = 'none';
    },

    showGameInterface: function() {
        const splashScreen = this._getElem('splash-screen');
        const mainGameInterface = this._getElem('main-game-interface');
        // const winScreen = this._getElem('win-screen');
        const pauseOverlay = this._getElem('pause-overlay');

        if (splashScreen) splashScreen.style.display = 'none';
        // if (winScreen) winScreen.style.display = 'none'; // winScreen has been removed
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        
        if (mainGameInterface) {
            mainGameInterface.style.display = 'flex'; 
            mainGameInterface.style.flexDirection = 'column';
            mainGameInterface.style.alignItems = 'center';
        }
    },

    // showWinScreen 已移除
    //    const mainGameInterface = this._getElem('main-game-interface');
    //    // const winScreen = this._getElem('win-screen');
    //    const finalScoreDisplay = this._getElem('final-score-display');
    //    const pauseOverlay = this._getElem('pause-overlay');
    //
    //    if (mainGameInterface) mainGameInterface.style.display = 'none';
    //    if (pauseOverlay) pauseOverlay.style.display = 'none';
    //    // Game-specific logic like 'isPaused = false' should remain in game script or be passed via callback
    //
    //    if (finalScoreDisplay) finalScoreDisplay.textContent = finalScore;
    //    if (winScreen) winScreen.style.display = 'flex';
    // },

    showPauseOverlay: function() {
        const pauseOverlay = this._getElem('pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'flex';
    },

    hidePauseOverlay: function() {
        const pauseOverlay = this._getElem('pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'none';
    }
};

// If this file is loaded by a game, UIManager will be globally available.
// Games will need to ensure their HTML has elements with these standard IDs:
// - splash-screen
// - main-game-interface
// - win-screen
// - final-score-display
// - pause-overlay
//
// The game-specific script will still handle:
// - Initializing these elements (e.g. const splashScreen = document.getElementById('splash-screen');)
// - Calling UIManager functions (e.g., UIManager.showSplashScreen();)
// - Game-specific logic within functions like pauseGame, resumeGame, exitGame, disableMatchedCards (win condition)
//   that then call these UIManager functions for the UI part.
// - Event listeners for buttons specific to these overlays (start, resume, play again, exit).
//
// This refactor primarily moves the direct DOM manipulation for display toggling.
// Further refactoring could involve passing element references if IDs are not standard.
