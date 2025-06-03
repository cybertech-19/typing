// Game data
const modes = {
    home_row: { chars: "asdfjkl;", name: "HOME ROW", range: [3, 6], difficulty: "BEGINNER" },
    up_row: { chars: "qwertyuiop", name: "UPPER ROW", range: [3, 6], difficulty: "INTERMEDIATE" },
    down_row: { chars: "zxcvbnm,./", name: "BOTTOM ROW", range: [3, 6], difficulty: "INTERMEDIATE" },
    all: { chars: "abcdefghijklmnopqrstuvwxyz", name: "ALL LETTERS", range: [4, 8], difficulty: "ADVANCED" },
    numerical: { chars: "0123456789", name: "NUMERICAL", range: [4, 8], difficulty: "EXPERT" },
    special: { chars: "!@#$%^&*()_+-=[]{};':\",./<>?\\|`~", name: "SPECIAL CHARS", range: [3, 5], difficulty: "HACKER" }
};

// Game state
let gameState = {
    score: 0,
    mistakes: 0,
    streak: 0,
    maxStreak: 0,
    startTime: 0,
    gameActive: false,
    currentMode: "all",
    currentWord: "",
    lastScore: 0,
    highScores: JSON.parse(localStorage.getItem('highScores')) || {}
};

// DOM elements
const app = document.getElementById('app');

// Initialize the game
function init() {
    showStartScreen();
}

// Show start screen with mode selection
function showStartScreen() {
    app.innerHTML = `
        <div class="header">
            <h1 class="title glitch">HACKER TYPING CHALLENGE</h1>
            <p class="subtitle">>> SYSTEM INITIALIZED <<</p>
        </div>
        
        <div class="mode-selection">
            ${Object.entries(modes).map(([key, mode]) => `
                <button class="btn mode-btn" onclick="startGame('${key}')">
                    > ${mode.name} [${mode.difficulty}] <
                    ${gameState.highScores[key] ? `<span style="color: var(--matrix-green); float: right;">HI: ${gameState.highScores[key]}</span>` : ''}
                </button>
            `).join('')}
        </div>
        
        <div class="btn-group">
            <button class="btn btn-warning" onclick="showInstructions()">
                > INSTRUCTIONS <
            </button>
            <button class="btn btn-danger" onclick="exitGame()">
                > TERMINATE (ESC) <
            </button>
        </div>
    `;
}

// Show instructions screen
function showInstructions() {
    app.innerHTML = `
        <div class="header">
            <h1 class="title">SYSTEM INSTRUCTIONS</h1>
            <p class="subtitle">>> OPERATION MANUAL <<</p>
        </div>
        
        <div class="results" style="text-align: left;">
            <h3>> OBJECTIVE <<</h3>
            <p>Type the displayed sequences as quickly and accurately as possible to test your hacking skills.</p>
            
            <h3>> GAMEPLAY <<</h3>
            <p>• You have 5 error points before system failure</p>
            <p>• Each correct input increases your score</p>
            <p>• Consecutive correct answers increase your streak multiplier</p>
            <p>• The faster you type, the higher your WPM (Words Per Minute) score</p>
            
            <h3>> CONTROLS <<</h3>
            <p>• Type the displayed text and press ENTER to submit</p>
            <p>• ESC to return to main menu</p>
        </div>
        
        <button class="btn" onclick="showStartScreen()">
            > BACK TO MAINFRAME <
        </button>
    `;
}

// Start the game with selected mode
function startGame(mode) {
    gameState = {
        ...gameState,
        score: 0,
        mistakes: 0,
        streak: 0,
        startTime: Date.now(),
        gameActive: true,
        currentMode: mode,
        currentWord: generateWord(mode)
    };

    renderGameScreen();
}

// Generate random word based on mode
function generateWord(mode) {
    const modeData = modes[mode];
    const length = randomInt(...modeData.range);
    
    if (mode === "special") {
        // For special chars, create random sequence
        return Array.from({length}, () => 
            modeData.chars[Math.floor(Math.random() * modeData.chars.length)]
        ).join('');
    } else {
        // For other modes, create pronounceable patterns
        let word = [];
        for (let i = 0; i < length; i++) {
            word.push(modeData.chars[Math.floor(Math.random() * modeData.chars.length)]);
        }
        return word.join('');
    }
}

// Render game screen
function renderGameScreen() {
    app.innerHTML = `
        <div class="game-header">
            <h2>> ${modes[gameState.currentMode].name} MODE [${modes[gameState.currentMode].difficulty}] <</h2>
            <div class="score">
                SCORE: <span class="highlight">${gameState.score}</span> | 
                ERRORS: <span style="color: ${gameState.mistakes >= 3 ? 'var(--error-red)' : 'var(--dark-green)'}">${gameState.mistakes}/5</span> | 
                STREAK: <span style="color: var(--matrix-green)">${gameState.streak}x</span>
            </div>
        </div>
        
        <div class="word-display" id="wordDisplay">${gameState.currentWord}</div>
        
        <input type="text" class="input-field" id="userInput" 
            autocomplete="off" autocorrect="off" 
            autocapitalize="off" spellcheck="false"
            placeholder=">> INPUT TEXT <<">
        
        <div class="status" id="status">> TYPE THE TEXT ABOVE AND PRESS ENTER <</div>
        
        <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        
        <div class="btn-group">
            <button class="btn" onclick="showStartScreen()">
                > ABORT MISSION <
            </button>
        </div>
    `;

    // Focus input field
    const inputField = document.getElementById('userInput');
    inputField.focus();
    
    // Add event listeners
    inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // Update progress bar
    updateProgressBar();
}

// Check user's answer
function checkAnswer() {
    if (!gameState.gameActive) return;
    
    const inputField = document.getElementById('userInput');
    const wordDisplay = document.getElementById('wordDisplay');
    const status = document.getElementById('status');
    
    const userInput = inputField.value.trim();
    
    if (userInput === gameState.currentWord) {
        // Correct answer
        gameState.streak++;
        if (gameState.streak > gameState.maxStreak) {
            gameState.maxStreak = gameState.streak;
        }
        
        // Score calculation with streak bonus
        const basePoints = gameState.currentWord.length;
        const streakBonus = Math.min(5, Math.floor(gameState.streak / 3));
        const pointsEarned = basePoints * (1 + streakBonus * 0.2);
        
        gameState.score += Math.round(pointsEarned);
        
        status.innerHTML = `>> ACCESS GRANTED << <br> <small>+${Math.round(pointsEarned)} points (${gameState.streak}x streak)</small>`;
        status.style.color = "var(--matrix-green)";
        wordDisplay.classList.add('correct');
        wordDisplay.classList.remove('incorrect');
    } else {
        // Incorrect answer
        gameState.mistakes++;
        gameState.streak = 0;
        status.innerHTML = `>> ACCESS DENIED! CORRECT: <span class="highlight">${gameState.currentWord}</span> <<`;
        status.style.color = "var(--error-red)";
        wordDisplay.classList.add('incorrect');
        wordDisplay.classList.remove('correct');
    }
    
    // Update score display
    document.querySelector('.score').innerHTML = `
        SCORE: <span class="highlight">${gameState.score}</span> | 
        ERRORS: <span style="color: ${gameState.mistakes >= 3 ? 'var(--error-red)' : 'var(--dark-green)'}">${gameState.mistakes}/5</span> | 
        STREAK: <span style="color: var(--matrix-green)">${gameState.streak}x</span>
    `;
    
    // Clear input
    inputField.value = '';
    
    // Update progress
    updateProgressBar();
    
    // Check for game over
    if (gameState.mistakes >= 5) {
        gameOver();
    } else {
        // Next word after delay
        setTimeout(nextWord, 800);
    }
}

// Move to next word
function nextWord() {
    gameState.currentWord = generateWord(gameState.currentMode);
    
    const wordDisplay = document.getElementById('wordDisplay');
    const status = document.getElementById('status');
    
    wordDisplay.textContent = gameState.currentWord;
    wordDisplay.classList.remove('correct', 'incorrect');
    status.innerHTML = "> TYPE THE TEXT ABOVE AND PRESS ENTER <";
    status.style.color = "var(--dark-green)";
    
    document.getElementById('userInput').focus();
}

// Update progress bar
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    progressBar.style.width = `${(gameState.mistakes / 5) * 100}%`;
    
    if (gameState.mistakes >= 3) {
        progressBar.classList.add('error');
    } else {
        progressBar.classList.remove('error');
    }
}

// Handle game over
function gameOver() {
    gameState.gameActive = false;
    
    const totalTime = (Date.now() - gameState.startTime) / 1000; // in seconds
    const wpm = Math.round((gameState.score / Math.max(totalTime, 1)) * 60);
    const accuracy = Math.round((gameState.score / (gameState.score + gameState.mistakes)) * 100) || 0;
    
    // Save high score
    if (!gameState.highScores[gameState.currentMode] || gameState.score > gameState.highScores[gameState.currentMode]) {
        gameState.highScores[gameState.currentMode] = gameState.score;
        localStorage.setItem('highScores', JSON.stringify(gameState.highScores));
    }
    
    app.innerHTML = `
        <div class="header">
            <h1 class="title">SYSTEM REPORT</h1>
            <p class="subtitle">> ${modes[gameState.currentMode].name} SESSION TERMINATED <</p>
        </div>
        
        <div class="results">
            <h3>> FINAL STATISTICS <<</h3>
            <p>SPEED: <span class="highlight">${wpm} WPM</span></p>
            <p>ACCURACY: <span class="highlight">${accuracy}%</span></p>
            <p>SCORE: <span class="highlight">${gameState.score}</span></p>
            <p>MAX STREAK: <span class="highlight">${gameState.maxStreak}x</span></p>
            <p>HIGH SCORE: <span class="highlight">${gameState.highScores[gameState.currentMode]}</span></p>
        </div>
        
        <div class="btn-group">
            <button class="btn" onclick="startGame('${gameState.currentMode}')">
                > RESTART SESSION <
            </button>
            <button class="btn" onclick="showStartScreen()">
                > MAIN MENU <
            </button>
        </div>
    `;
}

// Helper function for random integer
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Exit game
function exitGame() {
    const dialog = `
        <div class="header">
            <h1 class="title" style="color: var(--error-red)">TERMINATE PROGRAM?</h1>
            <p class="subtitle">>> CONFIRM SYSTEM SHUTDOWN <<</p>
        </div>
        
        <div class="btn-group">
            <button class="btn" onclick="window.close()">
                > CONFIRM <
            </button>
            <button class="btn btn-danger" onclick="showStartScreen()">
                > CANCEL <
            </button>
        </div>
    `;
    
    app.innerHTML = dialog;
}

// Initialize on load
window.onload = init;

// Handle escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (gameState.gameActive) {
            showStartScreen();
        } else {
            exitGame();
        }
    }
});