// Game State
let gameState = {
    currentScreen: 'gameSetup',
    selectedPlayers: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    scores: {},
    gameHistory: [],
    allPlayers: ['Ioana', 'Iancu', 'Dana', 'Mihai'],
    leaderboard: {}
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
    gameState.selectedPlayers.forEach(player => {
        const scoreRow = document.createElement('div');
        scoreRow.className = 'score-row';
        if (player === gameState.selectedPlayers[gameState.currentPlayerIndex]) {
            scoreRow.classList.add('current');
        }
        
        const currentScore = gameState.scores[player] || 0;
        scoreRow.innerHTML = `
            <span>${player}</span>
            <span class="score-value">${currentScore}</span>
        `;
        
        elements.scoreTable.appendChild(scoreRow);
    });
}

function updateGameDisplay() {
    elements.currentRound.textContent = gameState.currentRound;
    elements.currentPlayerName.textContent = gameState.selectedPlayers[gameState.currentPlayerIndex];
    renderScoreTable();
}

function showScoreModal() {
    const currentPlayer = gameState.selectedPlayers[gameState.currentPlayerIndex];
    elements.modalPlayerName.textContent = currentPlayer;
    elements.scoreInput.value = '';
    elements.scoreModal.classList.add('active');
    elements.scoreInput.focus();
}

function hideScoreModal() {
    elements.scoreModal.classList.remove('active');
    elements.scoreInput.value = '';
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
        
        const winner = Object.entries(game.scores).reduce((a, b) => game.scores[a[0]] > game.scores[b[0]] ? a : b)[0];
        
        historyItem.innerHTML = `
            <div class="history-date">${new Date(game.date).toLocaleDateString()} at ${new Date(game.date).toLocaleTimeString()}</div>
            <div class="history-players">Players: ${game.players.join(', ')}</div>
            <div class="history-winner">🏆 Winner: ${winner} (${game.scores[winner]} points)</div>
        `;
        
        elements.historyList.appendChild(historyItem);
    });
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
    gameState.scores = {};
    gameState.currentPlayerIndex = 0;
    gameState.currentRound = 1;
    gameState.selectedPlayers.forEach(player => {
        gameState.scores[player] = 0;
    });
    showScreen('gameScreen');
    updateGameDisplay();
}

function addScore(score) {
    const currentPlayer = gameState.selectedPlayers[gameState.currentPlayerIndex];
    gameState.scores[currentPlayer] += score;
    
    // Move to next player
    gameState.currentPlayerIndex++;
    
    // Check if round is complete
    if (gameState.currentPlayerIndex >= gameState.selectedPlayers.length) {
        gameState.currentPlayerIndex = 0;
        gameState.currentRound++;
    }
    
    updateGameDisplay();
    
    // Add success animation
    const scoreRow = elements.scoreTable.children[gameState.currentPlayerIndex];
    if (scoreRow) {
        scoreRow.classList.add('success');
        setTimeout(() => scoreRow.classList.remove('success'), 600);
    }
}

function endGame() {
    // Save game to history
    const gameRecord = {
        date: new Date().toISOString(),
        players: gameState.selectedPlayers,
        scores: { ...gameState.scores },
        rounds: gameState.currentRound - 1
    };
    
    gameState.gameHistory.push(gameRecord);
    
    // Update leaderboard
    gameState.selectedPlayers.forEach(player => {
        if (!gameState.leaderboard[player]) {
            gameState.leaderboard[player] = { totalScore: 0, gamesPlayed: 0 };
        }
        gameState.leaderboard[player].totalScore += gameState.scores[player];
        gameState.leaderboard[player].gamesPlayed += 1;
    });
    
    saveToStorage();
    
    // Show winner
    const winner = Object.entries(gameState.scores).reduce((a, b) => gameState.scores[a[0]] > gameState.scores[b[0]] ? a : b)[0];
    const winnerScore = gameState.scores[winner];
    
    alert(`🎉 Game Over! 🎉\n\n🏆 Winner: ${winner} with ${winnerScore} points!\n\nThanks for playing! 🎲`);
    
    // Reset and go back to setup
    gameState.selectedPlayers = [];
    gameState.scores = {};
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
    elements.addScoreBtn.addEventListener('click', showScoreModal);
    elements.endGameBtn.addEventListener('click', endGame);
    
    // Score modal
    elements.saveScoreBtn.addEventListener('click', () => {
        const score = parseInt(elements.scoreInput.value);
        if (score >= 0 && score <= 300) {
            addScore(score);
            hideScoreModal();
        } else {
            alert('Please enter a valid score between 0 and 300!');
        }
    });
    
    elements.cancelScoreBtn.addEventListener('click', hideScoreModal);
    
    // Quick score buttons
    document.querySelectorAll('.quick-score').forEach(btn => {
        btn.addEventListener('click', () => {
            const score = parseInt(btn.dataset.score);
            elements.scoreInput.value = score;
        });
    });
    
    // Modal backdrop click
    elements.scoreModal.addEventListener('click', (e) => {
        if (e.target === elements.scoreModal) {
            hideScoreModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (gameState.currentScreen === 'gameScreen') {
            if (e.key === 'Enter' && elements.scoreModal.classList.contains('active')) {
                elements.saveScoreBtn.click();
            } else if (e.key === 'Escape' && elements.scoreModal.classList.contains('active')) {
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
