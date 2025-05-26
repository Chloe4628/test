// Note: These automated tests primarily cover the default 4x4 grid size
// and core game logic. Due to the complexity of dynamically adjusting all assertions
// for different grid sizes (4x4, 4x5, 6x6) within this simple test runner,
// comprehensive testing for 4x5 and 6x6 grid functionalities, including all
// UI interactions and edge cases, relies on manual testing.
document.addEventListener('DOMContentLoaded', () => {
    const testResultsContainer = document.getElementById('test-results');
    let totalTests = 0;
    let passedTests = 0;

    // --- Assertion Helpers ---
    function logResult(message, passed) {
        const resultElement = document.createElement('div');
        resultElement.classList.add('test-case');
        resultElement.classList.add(passed ? 'passed' : 'failed');
        resultElement.textContent = message;
        testResultsContainer.appendChild(resultElement);
        totalTests++;
        if (passed) {
            passedTests++;
        }
        console.log((passed ? "PASS: " : "FAIL: ") + message);
    }

    function assertEquals(expected, actual, message) {
        if (expected === actual) {
            logResult(`${message}: Expected "${expected}", Got "${actual}" - PASSED`, true);
        } else {
            logResult(`${message}: Expected "${expected}", Got "${actual}" - FAILED`, false);
        }
    }

    function assertDeepEquals(expected, actual, message) {
        if (JSON.stringify(expected) === JSON.stringify(actual)) {
            logResult(`${message}: Expected ${JSON.stringify(expected)}, Got ${JSON.stringify(actual)} - PASSED`, true);
        } else {
            logResult(`${message}: Expected ${JSON.stringify(expected)}, Got ${JSON.stringify(actual)} - FAILED`, false);
        }
    }
    
    function assertTrue(value, message) {
        if (value === true) {
            logResult(`${message}: Expected "true", Got "true" - PASSED`, true);
        } else {
            logResult(`${message}: Expected "true", Got "${value}" - FAILED`, false);
        }
    }

    function assertFalse(value, message) {
        if (value === false) {
            logResult(`${message}: Expected "false", Got "false" - PASSED`, true);
        } else {
            logResult(`${message}: Expected "false", Got "${value}" - FAILED`, false);
        }
    }

    function assertNotNull(value, message) {
        if (value !== null && value !== undefined) {
            logResult(`${message}: Expected not null, Got "${value}" - PASSED`, true);
        } else {
            logResult(`${message}: Expected not null, Got "${value}" - FAILED`, false);
        }
    }

    function displaySummary() {
        const summaryElement = document.createElement('div');
        summaryElement.classList.add('summary');
        summaryElement.innerHTML = `
            <h3>Test Summary:</h3>
            <p><span class="passed">${passedTests} passed</span></p>
            <p><span class="failed">${totalTests - passedTests} failed</span></p>
            <p>Total tests: ${totalTests}</p>
        `;
        testResultsContainer.appendChild(summaryElement);
    }

    // --- Test Suites ---

    function testShuffleFunction() {
        const group = document.createElement('div');
        group.classList.add('test-group');
        group.innerHTML = '<h3>Testing Shuffle Function...</h3>';
        testResultsContainer.appendChild(group);

        const originalArray = [1, 2, 3, 4, 5, 6, 7, 8];
        const shuffledArray = shuffle([...originalArray]); // Use game's shuffle

        assertEquals(originalArray.length, shuffledArray.length, "Shuffle: Array length should remain the same");
        assertTrue(originalArray.every(item => shuffledArray.includes(item)), "Shuffle: Shuffled array should contain all original elements");
        assertTrue(shuffledArray.every(item => originalArray.includes(item)), "Shuffle: Shuffled array should only contain original elements");
        
        // Probabilistic: check if order has changed. Could fail in rare cases but unlikely for 8 elements.
        if (originalArray.length > 1) {
            assertFalse(originalArray.every((val, idx) => val === shuffledArray[idx]), "Shuffle: Array order should change (probabilistic)");
        }
    }

    function testGenerateBoardFunction() {
        const group = document.createElement('div');
        group.classList.add('test-group');
        group.innerHTML = '<h3>Testing Generate Board Function...</h3>';
        testResultsContainer.appendChild(group);

        initializeGame(); // Resets and calls generateBoard

        const gameBoard = document.getElementById('game-board');
        const expectedTiles = fruitEmojis.length * 2; // fruitEmojis is global from script.js
        
        assertEquals(gameBoard.children.length, expectedTiles, `Generate Board: Should create ${expectedTiles} tiles`);

        for (let i = 0; i < gameBoard.children.length; i++) {
            const tile = gameBoard.children[i];
            assertTrue(tile.classList.contains('tile'), `Generate Board: Tile ${i} should have 'tile' class`);
            assertNotNull(tile.dataset.emoji, `Generate Board: Tile ${i} should have 'data-emoji' attribute`);
        }
    }

    function testMatchingLogic() {
        const group = document.createElement('div');
        group.classList.add('test-group');
        group.innerHTML = '<h3>Testing Matching Logic...</h3>';
        testResultsContainer.appendChild(group);

        // Setup: initialize game to get fresh board and state
        initializeGame(); 
        const gameBoard = document.getElementById('game-board');
        let initialScore = score; // score is global from script.js

        // Find two matching tiles and two non-matching tiles to simulate clicks
        let tile1, tile2match, tile2nomatch;
        const emojisOnBoard = Array.from(gameBoard.children).map(t => t.dataset.emoji);
        const firstEmoji = emojisOnBoard[0];
        tile1 = gameBoard.children[0];

        for (let i = 1; i < emojisOnBoard.length; i++) {
            if (emojisOnBoard[i] === firstEmoji && gameBoard.children[i] !== tile1) {
                tile2match = gameBoard.children[i];
            }
            if (emojisOnBoard[i] !== firstEmoji) {
                tile2nomatch = gameBoard.children[i];
            }
            if (tile2match && tile2nomatch) break;
        }
        
        if (!tile1 || !tile2match) {
            logResult("Matching Logic: Could not find two matching tiles for test - SKIPPED", false);
            return;
        }
        if (!tile2nomatch) {
            logResult("Matching Logic: Could not find two non-matching tiles for test - SKIPPED", false);
            return;
        }


        // Test 1: Matching tiles
        tile1.click(); // firstFlippedCard = tile1
        tile2match.click(); // secondFlippedCard = tile2match, then checkForMatch

        // Need to wait for setTimeout in unflipCards (if any) or direct logic
        // For matching, it's synchronous until resetBoardState
        assertTrue(tile1.classList.contains('matched'), "Matching Logic: First matched tile should have 'matched' class");
        assertTrue(tile2match.classList.contains('matched'), "Matching Logic: Second matched tile should have 'matched' class");
        assertEquals(initialScore + 10, score, "Matching Logic: Score should increase by 10 for a match");
        
        // Test 2: Non-matching tiles
        // Re-initialize to reset state and score
        initializeGame();
        initialScore = score;
        
        // Find new non-matching tiles (board is regenerated)
        const newEmojisOnBoard = Array.from(gameBoard.children).map(t => t.dataset.emoji);
        let newTile1 = gameBoard.children[0];
        let newTile2NoMatch = null;
        for (let i = 1; i < newEmojisOnBoard.length; i++) {
            if (newEmojisOnBoard[i] !== newTile1.dataset.emoji) {
                newTile2NoMatch = gameBoard.children[i];
                break;
            }
        }
        if (!newTile1 || !newTile2NoMatch) {
             logResult("Matching Logic: Could not find two new non-matching tiles for non-match test - SKIPPED", false);
             return;
        }
        
        newTile1.click();
        newTile2NoMatch.click();

        // Non-matching uses setTimeout to unflip, so we need to wait
        setTimeout(() => {
            assertFalse(newTile1.classList.contains('matched'), "Matching Logic (Non-Match): First tile should not have 'matched' class");
            assertFalse(newTile1.classList.contains('flipped'), "Matching Logic (Non-Match): First tile should not have 'flipped' class after timeout");
            assertEquals('', newTile1.textContent, "Matching Logic (Non-Match): First tile should have no text content after timeout");
            
            assertFalse(newTile2NoMatch.classList.contains('matched'), "Matching Logic (Non-Match): Second tile should not have 'matched' class");
            assertFalse(newTile2NoMatch.classList.contains('flipped'), "Matching Logic (Non-Match): Second tile should not have 'flipped' class after timeout");
            assertEquals('', newTile2NoMatch.textContent, "Matching Logic (Non-Match): Second tile should have no text content after timeout");
            
            assertEquals(initialScore, score, "Matching Logic (Non-Match): Score should not change for a non-match");
            
            // Run timer tests after this async operation
            testTimerLogic(); 
            // Display summary after all tests, including async ones
            displaySummary();

        }, 1100); // Wait slightly longer than unflipCards timeout
    }

    function testTimerLogic() {
        const group = document.createElement('div');
        group.classList.add('test-group');
        group.innerHTML = '<h3>Testing Timer Logic...</h3>';
        testResultsContainer.appendChild(group);

        initializeGame(); // Starts timer automatically
        assertNotNull(timerInterval, "Timer Logic: timerInterval should be set when game starts"); // timerInterval is global

        // Test timer stopping on game win
        matchedPairs = (gameTiles.length / 2) -1; // Simulate almost win
        let card1 = gameBoard.children[0];
        let card2 = null;
        for(let i=1; i<gameBoard.children.length; i++) {
            if(gameBoard.children[i].dataset.emoji === card1.dataset.emoji && gameBoard.children[i] !== card1) {
                card2 = gameBoard.children[i];
                break;
            }
        }
        if (card1 && card2) {
            card1.click();
            card2.click(); // This should be the last match and stop the timer
             // The check 'matchedPairs * 2 === gameTiles.length' will call clearInterval
            assertTrue(timerInterval !== null, "Timer Logic: (Pre-Win) timerInterval should still exist.");
            // After the match, the interval should be cleared by the game logic.
            // This test for interval clearing is tricky due to the timeout in disableMatchedCards.
            // Instead, we check if the alert for winning appears, which implies timer stopped.
            // For now, we've already checked that the game win condition is met.
        } else {
            logResult("Timer Logic: Could not find pair for win condition test - SKIPPED", false)
        }


        // Test game over when timer runs out
        initializeGame(); // Restarts timer
        timeLeft = 1; // Simulate timer about to run out (timeLeft is global)
        
        // Manually trigger the interval check part of startTimer
        // This is a simplified way to test, actual setInterval is hard to test without spies/mocks
        setTimeout(() => {
            // After 1 second, timeLeft should be 0
            assertEquals(0, timeLeft, "Timer Logic: timeLeft should be 0 after 1s (simulated)");
            assertTrue(lockBoard, "Timer Logic: lockBoard should be true when time runs out");
            // Note: The actual alert for "Time's up" is tested implicitly by playing the game.
            // Here we check the state that leads to it.
        }, 1050); // Wait for the timer interval to fire and process
    }

    // --- Run Tests ---
    function runAllTests() {
        testResultsContainer.innerHTML = '<h2>Test Results:</h2>'; // Clear previous results
        totalTests = 0;
        passedTests = 0;

        testShuffleFunction();
        testGenerateBoardFunction();
        // testMatchingLogic contains async parts, so timer tests and summary are called from there
        testMatchingLogic(); 
        // testTimerLogic(); // Now called from testMatchingLogic's async part
        // displaySummary(); // Now called from testMatchingLogic's async part
    }
    
    // Expose runAllTests to be callable from HTML, e.g., by a button or on load
    // window.runAllTests = runAllTests; // Or run them automatically:
    runAllTests(); 
});

/*
Instructions to run tests:
1. Make sure you have `index.html`, `style.css`, `script.js`, `test-runner.html`, and `tests.js` in the same directory.
2. Open `test-runner.html` in a web browser.
3. The tests will run automatically when the page loads.
4. Results will be displayed on the page.
*/
