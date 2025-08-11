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
    chance: { name: "Chance", description: "Sum of all dice", maxScore: 30, section: "lower" }
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
    maxRounds: 13 // 13 categories to fill
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
    }
};

// Initialize App
function initApp() {
    loadFromStorage();
    renderPlayerList();
    setupEventListeners();
    updateNavigation();
}

// Local Storage Functions
function saveToStorage() {
    localStorage.setItem('yamsGameState', JSON.stringify({
        allPlayers: gameState.allPlayers,
        gameHistory: gameState.gameHistory,
        leaderboard: gameState.leaderboard
    }));
}

function loadFromStorage() {
    const saved = localStorage.getItem('yamsGameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.allPlayers = data.allPlayers || gameState.allPlayers;
        gameState.gameHistory = data.gameHistory || [];
        gameState.leaderboard = data.leaderboard || {};
    }
}

// UI Functions
function showScreen(screenName) {
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    elements.screens[screenName].classList.add('active');
    gameState.currentScreen = screenName;
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
        playerItem.innerHTML = `
            <input type="checkbox" id="player_${player}" value="${player}">
            <label for="player_${player}">${player}</label>
        `;
        
        const checkbox = playerItem.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                gameState.selectedPlayers.push(player);
            } else {
                gameState.selectedPlayers = gameState.selectedPlayers.filter(p => p !== player);
            }
            updateStartButton();
        });
        
        elements.playerList.appendChild(playerItem);
    });
}

function updateStartButton() {
    elements.startGameBtn.disabled = gameState.selectedPlayers.length < 2;
}

function renderScoreTable() {
    elements.scoreTable.innerHTML = '';
    
    // Create the score sheet table
    const tableHTML = `
        <div class="score-sheet">
            <div class="score-header">
                <div class="category-column">Category</div>
                ${gameState.selectedPlayers.map(player => `<div class="player-column">${player}</div>`).join('')}
            </div>
            
            <div class="score-sections">
                <!-- Upper Section -->
                <div class="section-header">Upper Section</div>
                ${Object.entries(YAMS_CATEGORIES)
                    .filter(([, cat]) => cat.section === 'upper')
                    .map(([key, category]) => {
                        return `
                            <div class="score-row" data-category="${key}">
                                <div class="category-cell">
                                    <div class="category-name">${category.name}</div>
                                    <div class="category-desc">${category.description}</div>
                                </div>
                                ${gameState.selectedPlayers.map(player => {
                                    const playerScores = gameState.scores[player] || {};
                                    const isUsed = playerScores[key] !== undefined;
                                    const score = playerScores[key] || '';
                                    const isCurrentPlayer = player === gameState.selectedPlayers[gameState.currentPlayerIndex];
                                    
                                    return `
                                        <div class="score-cell ${isCurrentPlayer ? 'current' : ''} ${isUsed ? 'used' : ''}" 
                                             data-player="${player}" data-category="${key}">
                                            ${isUsed ? 
                                                `<span class="score-value">${score}</span>` : 
                                                `<input type="number" class="score-input" min="0" max="${category.maxScore}" 
                                                        placeholder="0-${category.maxScore}" data-player="${player}" data-category="${key}">`
                                            }
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }).join('')}
                
                <!-- Upper Section Total -->
                <div class="score-row total-row">
                    <div class="category-cell">
                        <div class="category-name">Upper Total</div>
                    </div>
                    ${gameState.selectedPlayers.map(player => {
                        const playerScores = gameState.scores[player] || {};
                        const upperTotal = calculateUpperScore(playerScores);
                        return `<div class="score-cell total-cell">${upperTotal}</div>`;
                    }).join('')}
                </div>
                
                <!-- Lower Section -->
                <div class="section-header">Lower Section</div>
                ${Object.entries(YAMS_CATEGORIES)
                    .filter(([, cat]) => cat.section === 'lower')
                    .map(([key, category]) => {
                        return `
                            <div class="score-row" data-category="${key}">
                                <div class="category-cell">
                                    <div class="category-name">${category.name}</div>
                                    <div class="category-desc">${category.description}</div>
                                </div>
                                ${gameState.selectedPlayers.map(player => {
                                    const playerScores = gameState.scores[player] || {};
                                    const isUsed = playerScores[key] !== undefined;
                                    const score = playerScores[key] || '';
                                    const isCurrentPlayer = player === gameState.selectedPlayers[gameState.currentPlayerIndex];
                                    
                                    return `
                                        <div class="score-cell ${isCurrentPlayer ? 'current' : ''} ${isUsed ? 'used' : ''}" 
                                             data-player="${player}" data-category="${key}">
                                            ${isUsed ? 
                                                `<span class="score-value">${score}</span>` : 
                                                `<input type="number" class="score-input" min="0" max="${category.maxScore}" 
                                                        placeholder="0-${category.maxScore}" data-player="${player}" data-category="${key}">`
                                            }
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }).join('')}
                
                <!-- Grand Total -->
                <div class="score-row grand-total-row">
                    <div class="category-cell">
                        <div class="category-name">Grand Total</div>
                    </div>
                    ${gameState.selectedPlayers.map(player => {
                        const playerScores = gameState.scores[player] || {};
                        const grandTotal = calculatePlayerTotal(playerScores);
                        return `<div class="score-cell grand-total-cell">${grandTotal}</div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    elements.scoreTable.innerHTML = tableHTML;
    
    // Add event listeners for score inputs
    setupScoreInputListeners();
}

function setupScoreInputListeners() {
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach(input => {
        input.addEventListener('change', handleScoreInput);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleScoreInput(e);
            }
        });
    });
}

function handleScoreInput(event) {
    const input = event.target;
    const player = input.dataset.player;
    const category = input.dataset.category;
    const score = parseInt(input.value);
    
    if (score >= 0 && score <= YAMS_CATEGORIES[category].maxScore) {
        // Save the score
        if (!gameState.scores[player]) {
            gameState.scores[player] = {};
        }
        gameState.scores[player][category] = score;
        
        // Replace input with score value
        const scoreCell = input.closest('.score-cell');
        scoreCell.innerHTML = `<span class="score-value">${score}</span>`;
        scoreCell.classList.add('used');
        
        // Move to next player
        gameState.currentPlayerIndex++;
        
        // Check if round is complete
        if (gameState.currentPlayerIndex >= gameState.selectedPlayers.length) {
            gameState.currentPlayerIndex = 0;
            gameState.currentRound++;
        }
        
        updateGameDisplay();
        
        // Check if game is complete (all categories filled for all players)
        checkGameCompletion();
    } else {
        alert(`Please enter a valid score between 0 and ${YAMS_CATEGORIES[category].maxScore}`);
        input.focus();
    }
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
    renderScoreTable();
}

// Remove modal-based scoring - now using inline scoring
function hideScoreModal() {
    elements.scoreModal.classList.remove('active');
}

function renderHistory() {
    elements.historyList.innerHTML = '';
    
    if (gameState.gameHistory.length === 0) {
        elements.historyList.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No games played yet! 🎲</p>';
        return;
    }
    
    gameState.gameHistory.slice().reverse().forEach(game => {
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
        
        historyItem.innerHTML = `
            <div class="history-date">${new Date(game.date).toLocaleDateString()} at ${new Date(game.date).toLocaleTimeString()}</div>
            <div class="history-location">📍 ${location}</div>
            <div class="history-duration">⏱️ Duration: ${duration}</div>
            <div class="history-players">Players: ${game.players.join(', ')}</div>
            <div class="history-winner">🏆 Winner: ${winner} (${winnerScore} points)</div>
        `;
        
        elements.historyList.appendChild(historyItem);
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

function renderLeaderboard() {
    elements.leaderboardList.innerHTML = '';
    
    if (Object.keys(gameState.leaderboard).length === 0) {
        elements.leaderboardList.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No games played yet! 🎲</p>';
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

function endGame() {
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
    
    gameState.gameHistory.push(gameRecord);
    
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
    
    // Reset and go back to setup
    gameState.selectedPlayers = [];
    gameState.scores = {};
    gameState.gameStartTime = null;
    gameState.gameLocation = '';
    showScreen('gameSetup');
    renderPlayerList();
    updateStartButton();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navBtns.newGame.addEventListener('click', () => showScreen('gameSetup'));
    elements.navBtns.history.addEventListener('click', () => {
        showScreen('historyScreen');
        renderHistory();
    });
    elements.navBtns.leaderboard.addEventListener('click', () => {
        showScreen('leaderboardScreen');
        renderLeaderboard();
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
    elements.endGameBtn.addEventListener('click', endGame);
    
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
