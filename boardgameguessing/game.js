document.addEventListener('DOMContentLoaded', () => {
    // 游戏状态
    let attempts = 8;
    let gameOver = false;
    let targetGame = null;
    let guessedGames = [];

    // DOM 元素
    const inputField = document.getElementById('game-input');
    const submitBtn = document.getElementById('submit-guess');
    const suggestionsList = document.getElementById('suggestions');
    const resultsBody = document.getElementById('results-body');
    const attemptCountText = document.getElementById('attempt-count');
    const overlay = document.getElementById('overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const targetInfo = document.getElementById('target-game-info');
    const closeModalBtn = document.getElementById('close-modal');
    const giveUpBtn = document.getElementById('give-up-btn');
    const restartBtn = document.getElementById('restart-btn');

    // 初始化游戏：随机选择一款桌游
    function initGame() {
        const index = Math.floor(Math.random() * BOARD_GAMES.length);
        targetGame = BOARD_GAMES[index];
        console.log("目标桌游(调试用):", targetGame.name);
    }

    // 自动补全逻辑
    inputField.addEventListener('input', (e) => {
        const value = e.target.value.trim().toLowerCase();
        if (!value) {
            suggestionsList.style.display = 'none';
            submitBtn.disabled = true;
            return;
        }

        const matches = BOARD_GAMES.filter(g =>
            g.name.toLowerCase().includes(value)
        ).filter(g => !guessedGames.includes(g.id));

        if (matches.length > 0) {
            suggestionsList.innerHTML = '';
            matches.slice(0, 5).forEach(game => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <span class="cn-name">${game.name}</span>
                `;
                div.onclick = () => {
                    inputField.value = game.name;
                    suggestionsList.style.display = 'none';
                    submitBtn.disabled = false;
                    inputField.dataset.selectedId = game.id;
                };
                suggestionsList.appendChild(div);
            });
            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.style.display = 'none';
        }

        // 如果输入框内容完全匹配某款游戏，也启用按钮
        const exactMatch = BOARD_GAMES.find(g => g.name === e.target.value);
        if (exactMatch) {
            submitBtn.disabled = false;
            inputField.dataset.selectedId = exactMatch.id;
        } else {
            submitBtn.disabled = true;
        }
    });

    // 提交猜测
    submitBtn.addEventListener('click', () => {
        if (gameOver) return;

        const selectedId = parseInt(inputField.dataset.selectedId);
        const guessedGame = BOARD_GAMES.find(g => g.id === selectedId);

        if (guessedGame) {
            addGuessResult(guessedGame);
            guessedGames.push(guessedGame.id);
            inputField.value = '';
            inputField.dataset.selectedId = '';
            submitBtn.disabled = true;
            attempts--;
            updateStats();
            checkWinLoss(guessedGame);
        }
    });

    // 放弃逻辑
    giveUpBtn.addEventListener('click', () => {
        if (gameOver) return;
        showEndGame(false);
    });

    // 重新开始逻辑
    restartBtn.addEventListener('click', () => {
        resetGame();
    });

    function resetGame() {
        attempts = 8;
        gameOver = false;
        guessedGames = [];
        resultsBody.innerHTML = '';
        inputField.value = '';
        inputField.dataset.selectedId = '';
        submitBtn.disabled = true;
        updateStats();
        initGame();
        overlay.classList.add('hidden');
    }

    // 更新剩余次数
    function updateStats() {
        attemptCountText.innerText = `剩余机会: ${attempts}`;
    }

    // 检查胜负
    function checkWinLoss(lastGuess) {
        if (lastGuess.id === targetGame.id) {
            showEndGame(true);
        } else if (attempts <= 0) {
            showEndGame(false);
        }
    }

    function showEndGame(isWin) {
        gameOver = true;
        overlay.classList.remove('hidden');
        modalTitle.innerText = isWin ? "🎉 获得胜利!" : "💀 游戏失败";
        modalTitle.style.color = isWin ? "var(--correct-color)" : "#ef4444";
        modalContent.innerText = isWin ? `你在第 ${8 - attempts} 次猜出了答案！` : "遗憾，机会用完了。";
        targetInfo.innerText = `正确答案是：${targetGame.name}`;
    }

    closeModalBtn.onclick = () => overlay.classList.add('hidden');

    // 添加猜测结果到表格
    function addGuessResult(guess) {
        const row = document.createElement('tr');

        // 1. 名称
        row.appendChild(createCell(guess.name, 'wrong', 'name-cell'));

        // 2. 发行年份
        const yearDiff = Math.abs(guess.year - targetGame.year);
        let yearStatus = 'wrong';
        if (guess.year === targetGame.year) yearStatus = 'correct';
        else if (yearDiff <= 5) yearStatus = 'partial';

        let yearArrow = '';
        if (guess.year < targetGame.year) yearArrow = '<span class="arrow">↑ (更晚)</span>';
        else if (guess.year > targetGame.year) yearArrow = '<span class="arrow">↓ (更早)</span>';
        row.appendChild(createCell(`${guess.year}${yearArrow}`, yearStatus));

        // 3. 游戏分类
        const commonCategories = guess.category.filter(c => targetGame.category.includes(c));
        let catStatus = 'wrong';
        if (JSON.stringify(guess.category.sort()) === JSON.stringify(targetGame.category.sort())) catStatus = 'correct';
        else if (commonCategories.length > 0) catStatus = 'partial';
        row.appendChild(createCell(guess.category.join(', '), catStatus));

        // 4. 游戏模式
        let modeStatus = (guess.mode === targetGame.mode) ? 'correct' : 'wrong';
        row.appendChild(createCell(guess.mode, modeStatus));

        // 5. 最低人数
        let minPlayersStatus = (guess.minPlayers === targetGame.minPlayers) ? 'correct' : 'wrong';
        let minArrow = '';
        if (guess.minPlayers < targetGame.minPlayers) minArrow = '<span class="arrow">↑ (更多)</span>';
        else if (guess.minPlayers > targetGame.minPlayers) minArrow = '<span class="arrow">↓ (更少)</span>';
        row.appendChild(createCell(`${guess.minPlayers}人${minArrow}`, minPlayersStatus));

        // 6. 最高人数
        let maxPlayersStatus = (guess.maxPlayers === targetGame.maxPlayers) ? 'correct' : 'wrong';
        let maxArrow = '';
        if (guess.maxPlayers < targetGame.maxPlayers) maxArrow = '<span class="arrow">↑ (更多)</span>';
        else if (guess.maxPlayers > targetGame.maxPlayers) maxArrow = '<span class="arrow">↓ (更少)</span>';
        row.appendChild(createCell(`${guess.maxPlayers}人${maxArrow}`, maxPlayersStatus));

        // 7. 上手难度
        const weightDiff = Math.abs(guess.weight - targetGame.weight);
        let weightStatus = 'wrong';
        if (guess.weight === targetGame.weight) weightStatus = 'correct';
        else if (weightDiff <= 1.0) weightStatus = 'partial';

        let weightArrow = '';
        if (guess.weight < targetGame.weight) weightArrow = '<span class="arrow">↑ (更难)</span>';
        else if (guess.weight > targetGame.weight) weightArrow = '<span class="arrow">↓ (更简单)</span>';
        row.appendChild(createCell(`${guess.weight}${weightArrow}`, weightStatus));

        resultsBody.insertBefore(row, resultsBody.firstChild);
    }

    function createCell(content, status, extraClass = '') {
        const td = document.createElement('td');
        td.innerHTML = content;
        td.className = `${status} ${extraClass}`;
        return td;
    }

    initGame();
});
