// ===================== 遊戲全域狀態 (重構整理) =====================
const GameState = {
    selectedP1: "",
    selectedP2: "",
    currentSelectingPlayer: 1,
    pendingSteps: 0,
    turn: 0,
    dice: 0,
    moving: false,
    waitingForClick: false,
    specialEventActive: false,
    attempts: 3,
    timerInterval: null,
    usedTaskIndexes: new Set(),
    players: [{ pos: 0, score: 0 }, { pos: 0, score: 0 }]
};

const traps = [1, 16, 39, 48, 61, 76, 96];
const boosts = [8, 20, 32, 51, 68, 80, 90];
const dinosaurs = [5, 12, 27, 43, 55, 70, 86, 103];
let words = [];
const totalCells = 105;

// ===================== 完整題庫 =====================
const fillTasks = [
    { type: "fill", question: "新年快到了，我和爸媽一起______房子。", options: ["換洗", "打掃", "乾淨"], answer: "打掃" },
    { type: "fill", question: "小朋友起得早，在______下做早操。", options: ["花朵", "桌子", "陽光"], answer: "陽光" },
    { type: "fill", question: "雨停了，小晴______看見金色的太陽。", options: ["低頭", "抬頭", "搖頭"], answer: "抬頭" },
    { type: "fill", question: "我______：「媽媽，你喜歡吃甚麼水果？」", options: ["問", "說", "話"], answer: "問" },
    { type: "fill", question: "早上，學生在學校______老師打招呼。", options: ["說", "向", "跑"], answer: "向" },
    { type: "fill", question: "今天，你______沒有去學校？", options: ["甚麼", "怎樣", "為甚麼"], answer: "為甚麼" },
    { type: "fill", question: "星期六，我和家人去海灘______。", options: ["學校", "午餐", "游泳"], answer: "游泳" },
    { type: "fill", question: "我笑______說：「媽媽做的餃子最好吃！」", options: ["看", "着", "著"], answer: "着" }
];

const reorderTasks = [
    { type: "reorder", question: "重組句子：", words: ["操場上", "在", "小明", "今天", "跑步", "，", "。"], answer: "今天，小明在操場上跑步。" },
    { type: "reorder", question: "重組句子：", words: ["在", "禮堂", "哥哥", "星期一", "表演跳舞", "，", "。"], answer: "星期一，哥哥在禮堂表演跳舞。" },
    { type: "reorder", question: "重組句子：", words: ["家裏", "媽媽", "在", "下午", "看電話", "，", "。"], answer: "下午，媽媽在家裏看電話。" },
    { type: "reorder", question: "重組句子：", words: ["吃聖誕大餐", "餐廳", "在", "聖誕節", "我和家人", "，", "。"], answer: "聖誕節，我和家人在餐廳吃聖誕大餐。" },
    { type: "reorder", question: "重組句子：", words: ["圖書館", "我和同學", "小息", "在", "看書", "，", "。"], answer: "小息，我和同學在圖書館看書。" },
    { type: "reorder", question: "重組句子：", words: ["晚上八時", "睡房", "弟弟", "做功課", "在", "，", "。"], answer: "晚上八時，弟弟在睡房做功課。" },
    { type: "reorder", question: "重組句子：", words: ["抹窗戶", "在", "家裏", "星期六", "我和姐姐", "，", "。"], answer: "星期六，我和姐姐在家裏抹窗戶。" },
    { type: "reorder", question: "重組句子：", words: ["早上七時", "在", "做早操", "叔叔", "公園", "，", "。"], answer: "早上七時，叔叔在公園做早操。" }
];

const matchTasks = [
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "swimming.png", options: ["跳繩", "游泳", "打球"], answer: "游泳" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "scared.png", options: ["生氣", "開心", "害怕"], answer: "害怕" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "boat.png", options: ["飛機", "船", "車"], answer: "船" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "sunshine.png", options: ["陽光", "彩虹", "雲朵"], answer: "陽光" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "like.png", options: ["討厭", "擔心", "喜歡"], answer: "喜歡" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "angry.png", options: ["開心", "生氣", "傷心"], answer: "生氣" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "happy.png", options: ["傷心", "開心", "生氣"], answer: "開心" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "rainbow.png", options: ["太陽", "下雨", "彩虹"], answer: "彩虹" }
];

const puncTasks = [
    { type: "punc", question: "請選擇正確標點：今天天氣真好", options: ["。", "？", "！"], answer: "。" },
    { type: "punc", question: "請選擇正確標點：你今天吃了什麼", options: ["。", "？", "！"], answer: "？" },
    { type: "punc", question: "請選擇正確標點：這裡的風景好美", options: ["。", "？", "！"], answer: "！" },
    { type: "punc", question: "請選擇正確標點：上學要準時", options: ["。", "？", "！"], answer: "。" }
];

const radicalTasks = [
    { type: "radical", question: "「打」的部首是？", options: ["扌", "氵", "口"], answer: "扌" },
    { type: "radical", question: "「河」的部首是？", options: ["扌", "氵", "口"], answer: "氵" },
    { type: "radical", question: "「吃」的部首是？", options: ["扌", "氵", "口"], answer: "口" },
    { type: "radical", question: "「跑」的部首是？", options: ["足", "走", "手"], answer: "足" }
];

const strokeTasks = [
    { type: "stroke", question: "「人」先寫哪一筆？", options: ["丿", "㇏"], answer: "丿" },
    { type: "stroke", question: "「入」先寫哪一筆？", options: ["丿", "㇏"], answer: "㇏" },
    { type: "stroke", question: "「八」先寫哪一筆？", options: ["丿", "㇏"], answer: "丿" }
];

const understandTasks = [
    { type: "understand", passage: "小華今天去公園玩，他看到蝴蝶、小鳥，還玩了溜滑梯。", question: "小華在哪裡？", options: ["公園", "家", "學校"], answer: "公園" },
    { type: "understand", passage: "小美喜歡吃蘋果，每天放學都會吃一顆。", question: "小美喜歡吃什麼？", options: ["香蕉", "蘋果", "橙子"], answer: "蘋果" }
];

const continueTasks = [
    { type: "continue", question: "天上有白白的雲，還有__。", options: ["月亮", "太陽", "桌子"], answer: "太陽" },
    { type: "continue", question: "我喜歡在__裡看書。", options: ["廁所", "圖書館", "廚房"], answer: "圖書館" }
];

const allTasks = [
    ...fillTasks, ...reorderTasks, ...matchTasks,
    ...puncTasks, ...radicalTasks, ...strokeTasks,
    ...understandTasks, ...continueTasks
];

// ===================== 工具函數 =====================
function shuffleArray(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function playSound(name) {
    try {
        const snd = new Audio(`sounds/${name}.mp3`);
        snd.volume = 0.7;
        snd.play().catch(() => {});
    } catch(e) {}
}

// ===================== 角色選擇 =====================
function selectChar(img, src) {
    if (GameState.currentSelectingPlayer === 1) {
        GameState.selectedP1 = src;
        document.getElementById("p1-big-preview").innerHTML = `<img src="${src}">`;
        GameState.currentSelectingPlayer = 2;
        document.getElementById("selection-hint").textContent = "請 玩家 2 選擇一個角色";
    } else {
        GameState.selectedP2 = src;
        document.getElementById("p2-big-preview").innerHTML = `<img src="${src}">`;
        document.getElementById("start-game-btn").style.display = "inline-block";
    }
    playSound("select");
}

function startGame() {
    if (!GameState.selectedP1 || !GameState.selectedP2) return;
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    document.getElementById("controls").style.display = "flex";
    initBoard();
    updatePlayerUI(0);
    updatePlayerUI(1);
    updateTurnDisplay();
    playSound("start");
}

// ===================== 棋盤生成 =====================
function initBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerHTML = `<div class="cell-index">${i}</div><div class="cell-text"></div>`;

        if (traps.includes(i)) {
            cell.classList.add("trap-cell");
            cell.innerHTML = `<div class="event-icon">🍌</div>${cell.innerHTML}`;
        } else if (boosts.includes(i)) {
            cell.classList.add("boost-cell");
            cell.innerHTML = `<div class="event-icon">🚀</div>${cell.innerHTML}`;
        } else if (dinosaurs.includes(i)) {
            cell.classList.add("dino-cell");
            cell.innerHTML = `<div class="event-icon">🦖</div>${cell.innerHTML}`;
        }

        if (i === totalCells - 1) {
            cell.classList.add("goal-cell");
            cell.innerHTML = `<div class="event-icon">🏆</div><div class="cell-text">終點</div>`;
        }
        board.appendChild(cell);
    }
}

// ===================== 骰子 & 移動 =====================
function roll() {
    if (GameState.moving) return;
    GameState.dice = Math.floor(Math.random() * 6) + 1;
    GameState.pendingSteps = GameState.dice;
    animateDice(GameState.dice);
    playSound("dice");
    document.getElementById("btn-roll").disabled = true;
    setTimeout(() => {
        GameState.waitingForClick = true;
        highlightCurrentPlayer();
    }, 800);
}

function animateDice(num) {
    const box = document.getElementById("dice-box");
    const map = [1, 2, 3, 4, 5, 6];
    const deg = [0, 180, 90, -90, 90, -90];
    box.style.transform = `rotateX(${deg[num-1]}deg) rotateY(${deg[num-1]}deg)`;
}

function handlePlayerClick(playerIndex) {
    if (playerIndex !== GameState.turn) return;
    if (!GameState.waitingForClick || GameState.moving) return;
    movePlayer(playerIndex, GameState.pendingSteps);
}

function movePlayer(playerIndex, steps) {
    GameState.moving = true;
    GameState.waitingForClick = false;
    unHighlightAllPlayers();
    let pos = GameState.players[playerIndex].pos;

    const moveLoop = setInterval(() => {
        if (steps <= 0) {
            clearInterval(moveLoop);
            GameState.moving = false;
            checkCell(playerIndex, pos);
            return;
        }
        pos++;
        if (pos >= totalCells) pos = totalCells - 1;
        GameState.players[playerIndex].pos = pos;
        updatePlayerUI(playerIndex);
        steps--;
        playSound("step");
    }, 300);
}

function updatePlayerUI(playerIndex) {
    const el = document.getElementById(`p${playerIndex+1}`);
    const pos = GameState.players[playerIndex].pos;
    const cells = document.querySelectorAll(".cell");
    if (!cells[pos]) return;
    const rect = cells[pos].getBoundingClientRect();
    const boardRect = document.getElementById("board").getBoundingClientRect();
    el.style.left = `${rect.left - boardRect.left + 10}px`;
    el.style.top = `${rect.top - boardRect.top + 10}px`;
    el.style.backgroundImage = `url(${playerIndex === 0 ? GameState.selectedP1 : GameState.selectedP2})`;
}

// ===================== 特殊格子 =====================
function checkCell(playerIndex, pos) {
    if (pos >= totalCells - 1) {
        winGame(playerIndex);
        return;
    }
    if (traps.includes(pos)) {
        showModal(() => {
            movePlayer(playerIndex, -3);
            nextTurn();
        }, "🍌 踩到香蕉！倒退 3 步");
    } else if (boosts.includes(pos)) {
        showModal(() => {
            movePlayer(playerIndex, 5);
            nextTurn();
        }, "🚀 火箭加速！前進 5 步");
    } else if (dinosaurs.includes(pos)) {
        showModal(() => {
            nextTurn();
        }, "🦖 遇到恐龍！原地休息");
    } else {
        showQuiz(playerIndex);
    }
}

// ===================== 題目 =====================
function showQuiz(playerIndex) {
    let available = [];
    allTasks.forEach((t, i) => { if (!GameState.usedTaskIndexes.has(i)) available.push(i); });
    if (available.length === 0) { GameState.usedTaskIndexes.clear(); available = Array.from(Array(allTasks.length).keys()); }
    const idx = available[Math.floor(Math.random() * available.length)];
    GameState.usedTaskIndexes.add(idx);
    const task = allTasks[idx];
    openModal(task);
    window.currentTask = task;
    window.currentPlayer = playerIndex;
}

function openModal(task) {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modal-content");
    const actions = document.getElementById("modal-actions");
    modal.style.display = "block";
    modal.className = "";
    modal.classList.add(`type-${task.type}`);
    content.innerHTML = "";
    actions.innerHTML = "";

    const box = document.createElement("div");
    box.className = "challenge-container";

    if (task.gif) {
        const img = document.createElement("img");
        img.src = `images/${task.gif}`;
        img.style.width = "120px";
        img.style.margin = "10px auto";
        box.appendChild(img);
    }

    const q = document.createElement("div");
    q.className = "task-question";
    q.textContent = task.question;
    box.appendChild(q);
    content.appendChild(box);

    if (task.type === "reorder") {
        const zone = document.createElement("div");
        zone.id = "reorder-zone";
        content.appendChild(zone);
        const wordWrap = document.createElement("div");
        wordWrap.style.display = "flex";
        wordWrap.style.justifyContent = "center";
        wordWrap.style.gap = "8px";
        wordWrap.style.marginTop = "10px";
        const shuffled = shuffleArray(task.words);
        shuffled.forEach(w => {
            const b = document.createElement("button");
            b.className = "opt-btn";
            b.textContent = w;
            b.onclick = () => {
                zone.appendChild(b);
                b.disabled = true;
                b.classList.add("used");
            };
            wordWrap.appendChild(b);
        });
        content.appendChild(wordWrap);
        const btn = document.createElement("button");
        btn.className = "submit-btn";
        btn.textContent = "提交答案";
        btn.onclick = checkReorder;
        actions.appendChild(btn);
    } else {
        const opts = shuffleArray(task.options);
        opts.forEach(opt => {
            const b = document.createElement("button");
            b.className = "opt-btn";
            b.textContent = opt;
            b.onclick = () => checkAnswer(opt);
            actions.appendChild(b);
        });
    }
    startTimer();
}

function checkAnswer(choice) {
    clearInterval(GameState.timerInterval);
    const task = window.currentTask;
    const player = window.currentPlayer;
    if (choice === task.answer) {
        GameState.players[player].score += 10;
        updateScore();
        playSound("correct");
        showFeedback(true);
        setTimeout(() => { closeModal(); nextTurn(); }, 1000);
    } else {
        playSound("wrong");
        showFeedback(false);
        document.querySelector(".task-question").classList.add("wrong-answer");
        setTimeout(() => { closeModal(); nextTurn(); }, 1000);
    }
}

function checkReorder() {
    const zone = document.getElementById("reorder-zone");
    const user = Array.from(zone.querySelectorAll("button")).map(b => b.textContent).join("");
    const ans = window.currentTask.answer;
    clearInterval(GameState.timerInterval);
    if (user === ans) {
        GameState.players[window.currentPlayer].score += 10;
        updateScore();
        playSound("correct");
        showFeedback(true);
    } else {
        playSound("wrong");
        showFeedback(false);
    }
    setTimeout(() => { closeModal(); nextTurn(); }, 1000);
}

// ===================== 回合 & 得分 =====================
function updateScore() {
    document.getElementById("score-p1").textContent = GameState.players[0].score;
    document.getElementById("score-p2").textContent = GameState.players[1].score;
}

function nextTurn() {
    GameState.turn = 1 - GameState.turn;
    updateTurnDisplay();
    document.getElementById("btn-roll").disabled = false;
}

function updateTurnDisplay() {
    document.getElementById("player-turn-name").textContent = `玩家 ${GameState.turn + 1}`;
}

function highlightCurrentPlayer() {
    const el = document.getElementById(`p${GameState.turn+1}`);
    el.classList.add("can-move");
}

function unHighlightAllPlayers() {
    document.querySelectorAll(".player").forEach(p => p.classList.remove("can-move"));
}

// ===================== 計時 & 反饋 =====================
function startTimer() {
    let sec = 120;
    document.getElementById("timer").textContent = `⏳ 剩餘時間: ${sec}s`;
    clearInterval(GameState.timerInterval);
    GameState.timerInterval = setInterval(() => {
        sec--;
        document.getElementById("timer").textContent = `⏳ 剩餘時間: ${sec}s`;
        if (sec <= 0) {
            clearInterval(GameState.timerInterval);
            closeModal();
            nextTurn();
        }
    }, 1000);
}

function showFeedback(correct) {
    const f = document.createElement("div");
    f.id = "feedback-msg";
    f.textContent = correct ? "✅ 答對！" : "❌ 答錯了";
    f.className = correct ? "correct-feedback" : "wrong-feedback";
    document.getElementById("modal-content").appendChild(f);
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    clearInterval(GameState.timerInterval);
}

function showModal(callback, text) {
    const modal = document.getElementById("modal");
    modal.className = "";
    const content = document.getElementById("modal-content");
    const actions = document.getElementById("modal-actions");
    content.innerHTML = `<div class="task-question">${text}</div>`;
    actions.innerHTML = `<button class="submit-btn" onclick="closeModal();callback();">確定</button>`;
    modal.style.display = "block";
}

// ===================== 勝利 =====================
function winGame(playerIndex) {
    playSound("win");
    const winModal = document.getElementById("win-modal");
    winModal.style.display = "flex";
    document.getElementById("win-player").textContent = `🎉 玩家 ${playerIndex + 1} 抵達終點！`;
    document.getElementById("win-score").textContent = `得分：${GameState.players[playerIndex].score}`;
    document.getElementById("controls").style.display = "none";
}

function restartGame() {
    location.reload();
}

// 背景音樂
let bgm = null;
function toggleBGM() {
    if (!bgm) {
        bgm = new Audio("sounds/bgm.mp3");
        bgm.loop = true;
        bgm.volume = 0.4;
    }
    if (bgm.paused) bgm.play();
    else bgm.pause();
}

// 測試用
function testModal(type) {
    const t = allTasks.find(t => t.type === type);
    if (t) openModal(t);
}
