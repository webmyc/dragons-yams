// Yams Game Categories and Rules
const YAMS_CATEGORIES = {
    // Upper Section (1-6)
    ones: { name: "Ones", description: "Sum of all 1s", maxScore: 5, section: "upper" },
    twos: { name: "Twos", description: "Sum of all 2s", maxScore: 10, section: "upper" },
    threes: { name: "Threes", description: "Sum of all 3s", maxScore: 15, section: "upper" },
    fours: { name: "Fours", description: "Sum of all 4s", maxScore: 20, section: "upper" },
    fives: { name: "Fives", description: "Sum of all 5s", maxScore: 25, section: "upper" },
    sixes: { name: "Sixes", description: "Sum of all 6s", maxScore: 30, section: "upper" },
    
    // Lower Section
    threeOfAKind: { name: "Three of a Kind", description: "Sum of all dice if 3+ same", maxScore: 30, section: "lower" },
    fourOfAKind: { name: "Four of a Kind", description: "Sum of all dice if 4+ same", maxScore: 30, section: "lower" },
    fullHouse: { name: "Full House", description: "25 points (3+2 of same)", maxScore: 25, section: "lower" },
    smallStraight: { name: "Small Straight", description: "30 points (4 consecutive)", maxScore: 30, section: "lower" },
    largeStraight: { name: "Large Straight", description: "40 points (5 consecutive)", maxScore: 40, section: "lower" },
    yams: { name: "Yams", description: "50 points (5 of same)", maxScore: 50, section: "lower" },
    chanceMin: { name: "Chance (min)", description: "Sum of all dice", maxScore: 30, section: "lower" },
    chanceMax: { name: "Chance (max)", description: "Sum of all dice", maxScore: 30, section: "lower" }
};

// Game State
let gameState = {
    currentScreen: 'gameSetup',
    selectedPlayers: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    scores: {},
    gameHistory: [],
    allPlayers: ['Ioana', 'Iancu', 'Dana', 'Mihai'],
    leaderboard: {},
    gameStartTime: null,
    gameLocation: '',
    maxRounds: 14 // 14 categories to fill
};

// DOM Elements
const elements = {
    screens: {
        gameSetup: document.getElementById('gameSetup'),
        gameScreen: document.getElementById('gameScreen'),
        historyScreen: document.getElementById('historyScreen'),
        leaderboardScreen: document.getElementById('leaderboardScreen')
    },
    playerList: document.getElementById('playerList'),
    newPlayerName: document.getElementById('newPlayerName'),
    addPlayerBtn: document.getElementById('addPlayerBtn'),
    startGameBtn: document.getElementById('startGameBtn'),
    currentRound: document.getElementById('currentRound'),
    currentPlayerName: document.getElementById('currentPlayerName'),
    scoreTable: document.getElementById('scoreTable'),
    addScoreBtn: document.getElementById('addScoreBtn'),
    endGameBtn: document.getElementById('endGameBtn'),
    scoreModal: document.getElementById('scoreModal'),
    modalPlayerName: document.getElementById('modalPlayerName'),
    scoreInput: document.getElementById('scoreInput'),
    saveScoreBtn: document.getElementById('saveScoreBtn'),
    cancelScoreBtn: document.getElementById('cancelScoreBtn'),
    historyList: document.getElementById('historyList'),
    leaderboardList: document.getElementById('leaderboardList'),
    navBtns: {
        newGame: document.getElementById('newGameBtn'),
        history: document.getElementById('historyBtn'),
        leaderboard: document.getElementById('leaderboardBtn')
    },
    backBtns: {
        main: document.getElementById('backToMainBtn'),
        leaderboard: document.getElementById('backToMainFromLeaderboardBtn')
    },
    themeToggle: document.getElementById('themeToggle'),
    categorySelect: document.getElementById('categorySelect'),
    pointsInput: document.getElementById('pointsInput'),
    submitScoreBtn: document.getElementById('submitScoreBtn'),
    scoreSummary: document.getElementById('scoreSummary')
};

// Initialize App
function initApp() {
    loadFromStorage();
    loadTheme();
    renderPlayerList();
    setupEventListeners();
    updateNavigation();
}

// Local Storage Functions - Now with Firebase backup
function saveToStorage() {
    // Save to local storage for offline access
    localStorage.setItem('yamsGameState', JSON.stringify({
        allPlayers: gameState.allPlayers,
        leaderboard: gameState.leaderboard
    }));
}

function loadFromStorage() {
    const saved = localStorage.getItem('yamsGameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.allPlayers = data.allPlayers || gameState.allPlayers;
        gameState.leaderboard = data.leaderboard || {};
    }
}

// Firebase Functions for server-side storage
async function saveGameToFirebase(gameRecord) {
    try {
        if (window.db) {
            await window.addDoc(window.collection(window.db, "games"), {
                ...gameRecord,
                timestamp: new Date().toISOString()
            });
            console.log("Game saved to Firebase");
        }
    } catch (error) {
        console.error("Error saving to Firebase:", error);
        // Fallback to local storage if Firebase fails
        saveGameToLocalStorage(gameRecord);
    }
}

function saveGameToLocalStorage(gameRecord) {
    const localGames = JSON.parse(localStorage.getItem('yamsGameHistory') || '[]');
    localGames.push(gameRecord);
    localStorage.setItem('yamsGameHistory', JSON.stringify(localGames));
}

async function loadGamesFromFirebase() {
    try {
        if (window.db) {
            const q = window.query(
                window.collection(window.db, "games"), 
                window.orderBy("timestamp", "desc"), 
                window.limit(50)
            );
            const querySnapshot = await window.getDocs(q);
            const games = [];
            querySnapshot.forEach((doc) => {
                games.push({ id: doc.id, ...doc.data() });
            });
            return games;
        }
    } catch (error) {
        console.error("Error loading from Firebase:", error);
        // Fallback to local storage
        return loadGamesFromLocalStorage();
    }
    return [];
}

function loadGamesFromLocalStorage() {
    const localGames = JSON.parse(localStorage.getItem('yamsGameHistory') || '[]');
    return localGames.map(game => ({ id: game.date, ...game }));
}

async function renderHistory() {
    elements.historyList.innerHTML = '';
    
    // Show loading state
    elements.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading history... 📚</p>';
    
    try {
        // Try to load from Firebase first, fallback to local storage
        const games = await loadGamesFromFirebase();
        
        if (games.length === 0) {
            elements.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No games played yet! 🎲</p>';
            return;
        }
        
        elements.historyList.innerHTML = '';
        
        games.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const winner = Object.entries(game.scores).reduce((a, b) => {
                const aTotal = calculatePlayerTotal(game.scores[a[0]]);
                const bTotal = calculatePlayerTotal(game.scores[b[0]]);
                return aTotal > bTotal ? a : b;
            })[0];
            
            const winnerScore = calculatePlayerTotal(game.scores[winner]);
            const duration = game.duration ? formatDuration(game.duration) : 'Unknown';
            const location = game.location || 'Unknown location';
            const date = game.timestamp || game.date;
            
            historyItem.innerHTML = `
                <div class="history-date">${new Date(date).toLocaleDateString()} at ${new Date(date).toLocaleTimeString()}</div>
                <div class="history-location">📍 ${location}</div>
                <div class="history-duration">⏱️ Duration: ${duration}</div>
                <div class="history-players">Players: ${game.players.join(', ')}</div>
                <div class="history-winner">🏆 Winner: ${winner} (${winnerScore} points)</div>
            `;
            
            elements.historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error("Error rendering history:", error);
        elements.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Error loading history. Please try again. 🔄</p>';
    }
}

// UI Functions
function showScreen(screenName) {
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    elements.screens[screenName].classList.add('active');
    gameState.currentScreen = screenName;
    
    // Hide bottom navigation during gameplay
    const bottomNav = document.querySelector('.bottom-nav');
    if (screenName === 'gameScreen') {
        bottomNav.classList.add('hidden');
    } else {
        bottomNav.classList.remove('hidden');
    }
    
    updateNavigation();
}

function updateNavigation() {
    Object.values(elements.navBtns).forEach(btn => {
        btn.classList.remove('active');
    });
    
    switch (gameState.currentScreen) {
        case 'gameSetup':
            elements.navBtns.newGame.classList.add('active');
            break;
        case 'historyScreen':
            elements.navBtns.history.classList.add('active');
            break;
        case 'leaderboardScreen':
            elements.navBtns.leaderboard.classList.add('active');
            break;
    }
}

function renderPlayerList() {
    elements.playerList.innerHTML = '';
    gameState.allPlayers.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.textContent = player;
        
        // Check if player is already selected
        if (gameState.selectedPlayers.includes(player)) {
            playerItem.classList.add('selected');
        }
        
        playerItem.addEventListener('click', () => {
            if (gameState.selectedPlayers.includes(player)) {
                // Deselect player
                gameState.selectedPlayers = gameState.selectedPlayers.filter(p => p !== player);
                playerItem.classList.remove('selected');
            } else {
                // Select player
                gameState.selectedPlayers.push(player);
                playerItem.classList.add('selected');
            }
            updateStartButton();
            addHapticFeedback();
        });
        
        elements.playerList.appendChild(playerItem);
    });
}

function updateStartButton() {
    elements.startGameBtn.disabled = gameState.selectedPlayers.length < 2;
}

function renderScoreInterface() {
    // Populate category selector
    elements.categorySelect.innerHTML = '<option value="">Choose a category...</option>';
    
    Object.entries(YAMS_CATEGORIES).forEach(([key, category]) => {
        const currentPlayer = gameState.selectedPlayers[gameState.currentPlayerIndex];
        const playerScores = gameState.scores[currentPlayer] || {};
        
        // Only show categories that haven't been used by current player
        if (playerScores[key] === undefined) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${category.name} (${category.description})`;
            elements.categorySelect.appendChild(option);
        }
    });
    
    // Clear points input
    elements.pointsInput.value = '';
    
    // Update submit button state
    updateSubmitButton();
    
    // Render score summary
    renderScoreSummary();
}

function renderScoreSummary() {
    elements.scoreSummary.innerHTML = '';
    
    gameState.selectedPlayers.forEach(player => {
        const playerScores = gameState.scores[player] || {};
        const total = calculatePlayerTotal(playerScores);
        const usedCategories = Object.keys(playerScores);
        
        const playerRow = document.createElement('div');
        playerRow.className = 'player-score-row';
        
        const isCurrentPlayer = player === gameState.selectedPlayers[gameState.currentPlayerIndex];
        const currentIndicator = isCurrentPlayer ? ' 🎯' : '';
        
        playerRow.innerHTML = `
            <div>
                <div class="player-name">${player}${currentIndicator}</div>
                <div class="player-categories">
                    ${usedCategories.map(cat => 
                        `<span class="category-badge">${YAMS_CATEGORIES[cat].name}: ${playerScores[cat]}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="player-total">${total} pts</div>
        `;
        
        elements.scoreSummary.appendChild(playerRow);
    });
}

function updateSubmitButton() {
    const categorySelected = elements.categorySelect.value !== '';
    const pointsEntered = elements.pointsInput.value !== '';
    elements.submitScoreBtn.disabled = !(categorySelected && pointsEntered);
}

function submitScore() {
    const category = elements.categorySelect.value;
    const points = parseInt(elements.pointsInput.value);
    const currentPlayer = gameState.selectedPlayers[gameState.currentPlayerIndex];
    
    if (!category || isNaN(points) || points < 0) {
        return;
    }
    
    // Validate points against category max
    const categoryData = YAMS_CATEGORIES[category];
    if (points > categoryData.maxScore) {
        alert(`Points cannot exceed ${categoryData.maxScore} for ${categoryData.name}`);
        return;
    }
    
    // Save the score
    if (!gameState.scores[currentPlayer]) {
        gameState.scores[currentPlayer] = {};
    }
    gameState.scores[currentPlayer][category] = points;
    
    // Add haptic feedback
    addHapticFeedback();
    
    // Move to next player
    gameState.currentPlayerIndex++;
    
    // Check if round is complete
    if (gameState.currentPlayerIndex >= gameState.selectedPlayers.length) {
        gameState.currentPlayerIndex = 0;
        gameState.currentRound++;
        
        // Check if game is complete
        if (checkGameCompletion()) {
            return;
        }
    }
    
    // Update display
    updateGameDisplay();
}

function setupScoreInputListeners() {
    // Add click listeners to all score cells
    const scoreCells = document.querySelectorAll('.score-cell');
    scoreCells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    
    // Add global click listener to handle clicking outside
    document.addEventListener('click', handleOutsideClick);
}

function handleCellClick(event) {
    const cell = event.currentTarget;
    const player = cell.dataset.player;
    const category = cell.dataset.category;
    
    // Don't allow editing if already used
    if (cell.classList.contains('used')) {
        return;
    }
    
    // Don't allow editing if not current player's turn
    const currentPlayer = gameState.selectedPlayers[gameState.currentPlayerIndex];
    if (player !== currentPlayer) {
        return;
    }
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'score-input';
    input.min = '0';
    input.max = YAMS_CATEGORIES[category].maxScore;
    input.placeholder = `0-${YAMS_CATEGORIES[category].maxScore}`;
    input.dataset.player = player;
    input.dataset.category = category;
    
    // Clear cell and add input
    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add('editing');
    
    // Focus and select input
    input.focus();
    input.select();
    
    // Add event listeners to input
    input.addEventListener('blur', handleInputBlur);
    input.addEventListener('keypress', handleInputKeypress);
    input.addEventListener('input', handleInputChange);
}

function handleOutsideClick(event) {
    const editingCell = document.querySelector('.score-cell.editing');
    if (editingCell && !editingCell.contains(event.target)) {
        const input = editingCell.querySelector('.score-input');
        if (input) {
            handleInputSubmit(input);
        }
    }
}

function handleInputBlur(event) {
    const input = event.target;
    setTimeout(() => {
        if (document.activeElement !== input) {
            handleInputSubmit(input);
        }
    }, 100);
}

function handleInputKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleInputSubmit(event.target);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelInput(event.target);
    }
}

function handleInputChange(event) {
    const input = event.target;
    const value = parseInt(input.value);
    const max = parseInt(input.max);
    
    // Validate input
    if (value > max) {
        input.value = max;
    } else if (value < 0) {
        input.value = 0;
    }
}

function handleInputSubmit(input) {
    const player = input.dataset.player;
    const category = input.dataset.category;
    const score = parseInt(input.value) || 0;
    const maxScore = YAMS_CATEGORIES[category].maxScore;
    
    if (score >= 0 && score <= maxScore) {
        // Save the score
        if (!gameState.scores[player]) {
            gameState.scores[player] = {};
        }
        gameState.scores[player][category] = score;
        
        // Update cell display
        const cell = input.closest('.score-cell');
        cell.innerHTML = `<span class="score-value">${score}</span>`;
        cell.classList.remove('editing');
        cell.classList.add('used');
        
        // Move to next player
        gameState.currentPlayerIndex++;
        
        // Check if round is complete
        if (gameState.currentPlayerIndex >= gameState.selectedPlayers.length) {
            gameState.currentPlayerIndex = 0;
            gameState.currentRound++;
        }
        
        updateGameDisplay();
        
        // Check if game is complete
        checkGameCompletion();
        
        // Add haptic feedback
        addHapticFeedback();
    } else {
        // Invalid score - revert to empty cell
        cancelInput(input);
        alert(`Please enter a valid score between 0 and ${maxScore}`);
    }
}

function cancelInput(input) {
    const cell = input.closest('.score-cell');
    cell.innerHTML = '';
    cell.classList.remove('editing');
}

function checkGameCompletion() {
    const allPlayersComplete = gameState.selectedPlayers.every(player => {
        const playerScores = gameState.scores[player] || {};
        return Object.keys(YAMS_CATEGORIES).every(category => 
            playerScores[category] !== undefined
        );
    });
    
    if (allPlayersComplete) {
        endGame();
    }
}

function calculateUpperScore(playerScores) {
    let score = 0;
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    upperCategories.forEach(cat => {
        if (playerScores[cat] !== undefined) {
            score += playerScores[cat];
        }
    });
    return score;
}

function calculateLowerScore(playerScores) {
    let score = 0;
    const lowerCategories = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yams', 'chance'];
    lowerCategories.forEach(cat => {
        if (playerScores[cat] !== undefined) {
            score += playerScores[cat];
        }
    });
    return score;
}

function updateGameDisplay() {
    elements.currentRound.textContent = gameState.currentRound;
    elements.currentPlayerName.textContent = gameState.selectedPlayers[gameState.currentPlayerIndex];
    renderScoreInterface();
}

// Remove modal-based scoring - now using inline scoring
function hideScoreModal() {
    elements.scoreModal.classList.remove('active');
}

function renderLeaderboard() {
    elements.leaderboardList.innerHTML = '';
    
    if (Object.keys(gameState.leaderboard).length === 0) {
        elements.leaderboardList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No games played yet! 🎲</p>';
        return;
    }
    
    const sortedPlayers = Object.entries(gameState.leaderboard)
        .sort(([,a], [,b]) => b.totalScore - a.totalScore);
    
    sortedPlayers.forEach(([player, stats], index) => {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        leaderboardItem.innerHTML = `
            <span class="leaderboard-rank">${medal}</span>
            <span class="leaderboard-name">${player}</span>
            <span class="leaderboard-score">${stats.totalScore} pts (${stats.gamesPlayed} games)</span>
        `;
        
        elements.leaderboardList.appendChild(leaderboardItem);
    });
}

function calculatePlayerTotal(playerScores) {
    return calculateUpperScore(playerScores) + calculateLowerScore(playerScores);
}

function formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
}

// Game Logic Functions
function startGame() {
    // Get device location
    getDeviceLocation().then(location => {
        gameState.gameLocation = location;
        gameState.gameStartTime = Date.now();
        
        gameState.scores = {};
        gameState.currentPlayerIndex = 0;
        gameState.currentRound = 1;
        gameState.selectedPlayers.forEach(player => {
            gameState.scores[player] = {};
        });
        showScreen('gameScreen');
        updateGameDisplay();
    }).catch(error => {
        console.log('Location not available:', error);
        gameState.gameLocation = 'Unknown location';
        gameState.gameStartTime = Date.now();
        
        gameState.scores = {};
        gameState.currentPlayerIndex = 0;
        gameState.currentRound = 1;
        gameState.selectedPlayers.forEach(player => {
            gameState.scores[player] = {};
        });
        showScreen('gameScreen');
        updateGameDisplay();
    });
}

// Get device location
function getDeviceLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                // Use reverse geocoding to get location name
                getLocationName(latitude, longitude)
                    .then(locationName => resolve(locationName))
                    .catch(() => resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`));
            },
            error => {
                console.log('Location error:', error);
                reject(error);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

// Get location name from coordinates
function getLocationName(latitude, longitude) {
    return new Promise((resolve, reject) => {
        // Use a free reverse geocoding service
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data.display_name) {
                    // Extract city and country
                    const parts = data.display_name.split(', ');
                    const city = parts[0];
                    const country = parts[parts.length - 1];
                    resolve(`${city}, ${country}`);
                } else {
                    reject(new Error('No location name found'));
                }
            })
            .catch(error => {
                console.log('Geocoding error:', error);
                reject(error);
            });
    });
}

async function endGame() {
    const gameEndTime = Date.now();
    const duration = gameEndTime - gameState.gameStartTime;
    
    // Save game to history
    const gameRecord = {
        date: new Date().toISOString(),
        players: gameState.selectedPlayers,
        scores: { ...gameState.scores },
        rounds: gameState.currentRound - 1,
        duration: duration,
        location: gameState.gameLocation
    };
    
    // Save to Firebase (server-side)
    await saveGameToFirebase(gameRecord);
    
    // Update leaderboard
    gameState.selectedPlayers.forEach(player => {
        if (!gameState.leaderboard[player]) {
            gameState.leaderboard[player] = { totalScore: 0, gamesPlayed: 0 };
        }
        const playerTotal = calculatePlayerTotal(gameState.scores[player]);
        gameState.leaderboard[player].totalScore += playerTotal;
        gameState.leaderboard[player].gamesPlayed += 1;
    });
    
    saveToStorage();
    
    // Show winner
    const winner = Object.entries(gameState.scores).reduce((a, b) => {
        const aTotal = calculatePlayerTotal(gameState.scores[a[0]]);
        const bTotal = calculatePlayerTotal(gameState.scores[b[0]]);
        return aTotal > bTotal ? a : b;
    })[0];
    
    const winnerScore = calculatePlayerTotal(gameState.scores[winner]);
    const durationFormatted = formatDuration(duration);
    
    alert(`🎉 Game Over! 🎉\n\n🏆 Winner: ${winner} with ${winnerScore} points!\n⏱️ Duration: ${durationFormatted}\n📍 Location: ${gameState.gameLocation}\n\nThanks for playing! 🎲`);
    
    // Reset game state
    resetGameState();
}

function resetGameState() {
    gameState.selectedPlayers = [];
    gameState.scores = {};
    gameState.currentPlayerIndex = 0;
    gameState.currentRound = 1;
    gameState.gameStartTime = null;
    gameState.gameLocation = '';
    gameState.currentScreen = 'gameSetup';
    
    showScreen('gameSetup');
    renderPlayerList();
    updateStartButton();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navBtns.newGame.addEventListener('click', () => {
        if (gameState.currentScreen === 'gameScreen' && gameState.selectedPlayers.length > 0) {
            if (confirm('⚠️ You have a game in progress! Are you sure you want to start a new game? This will end the current game.')) {
                endGame();
                showScreen('gameSetup');
            }
        } else {
            showScreen('gameSetup');
        }
    });
    
    elements.navBtns.history.addEventListener('click', () => {
        if (gameState.currentScreen === 'gameScreen' && gameState.selectedPlayers.length > 0) {
            if (confirm('⚠️ You have a game in progress! Are you sure you want to view history? This will end the current game.')) {
                endGame();
                showScreen('historyScreen');
                renderHistory();
            }
        } else {
            showScreen('historyScreen');
            renderHistory();
        }
    });
    
    elements.navBtns.leaderboard.addEventListener('click', () => {
        if (gameState.currentScreen === 'gameScreen' && gameState.selectedPlayers.length > 0) {
            if (confirm('⚠️ You have a game in progress! Are you sure you want to view leaderboard? This will end the current game.')) {
                endGame();
                showScreen('leaderboardScreen');
                renderLeaderboard();
            }
        } else {
            showScreen('leaderboardScreen');
            renderLeaderboard();
        }
    });
    
    // Back buttons
    elements.backBtns.main.addEventListener('click', () => showScreen('gameSetup'));
    elements.backBtns.leaderboard.addEventListener('click', () => showScreen('gameSetup'));
    
    // Game setup
    elements.addPlayerBtn.addEventListener('click', () => {
        const name = elements.newPlayerName.value.trim();
        if (name && !gameState.allPlayers.includes(name)) {
            gameState.allPlayers.push(name);
            elements.newPlayerName.value = '';
            renderPlayerList();
            saveToStorage();
        }
    });
    
    elements.newPlayerName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.addPlayerBtn.click();
        }
    });
    
    elements.startGameBtn.addEventListener('click', startGame);
    
    // Game actions
    elements.endGameBtn.addEventListener('click', () => {
        if (confirm('⚠️ Are you sure you want to end this game? This action cannot be undone.')) {
            endGame();
        }
    });
    
    // Score input interface
    elements.categorySelect.addEventListener('change', updateSubmitButton);
    elements.pointsInput.addEventListener('input', updateSubmitButton);
    elements.submitScoreBtn.addEventListener('click', submitScore);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Modal backdrop click
    elements.scoreModal.addEventListener('click', (e) => {
        if (e.target === elements.scoreModal) {
            hideScoreModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (gameState.currentScreen === 'gameScreen') {
            if (e.key === 'Escape' && elements.scoreModal.classList.contains('active')) {
                hideScoreModal();
            }
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add some fun easter eggs
let clickCount = 0;
document.querySelector('.header h1').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 5) {
        alert('🎲 You found the secret! You\'re a true Yams master! 🎲');
        clickCount = 0;
    }
});

// Add haptic feedback for mobile (if supported)
// Theme Functions
function loadTheme() {
    const savedTheme = localStorage.getItem('yamsTheme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yamsTheme', theme);
    
    // Update theme toggle icon
    const themeIcon = elements.themeToggle.querySelector('.theme-icon');
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    addHapticFeedback();
}

function addHapticFeedback() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Add haptic feedback to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn') || e.target.classList.contains('nav-btn')) {
        addHapticFeedback();
    }
});
