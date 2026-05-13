// --- 全域變數 ---
let selectedP1 = "";
let selectedP2 = "";
let currentSelectingPlayer = 1;
let turn = 0, dice = 0, moving = false;
let waitingForClick = false;
let specialEventActive = false;
let attempts = 3;
let pendingSteps = 0;

// 格子定義
const traps = [1, 16, 39, 48, 61, 76, 96];
const boosts = [8, 20, 32, 51, 68, 80, 90];
const dinosaurs = [5, 12, 27, 43, 55, 70, 86, 103];
let words = [];

// 玩家位置
const players = [{ pos: 0 }, { pos: 0 }];

// --- 題庫 ---
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
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "angry.png", options: ["快樂", "生氣", "緊張"], answer: "生氣" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "rainbow.png", options: ["太陽", "月亮", "彩虹"], answer: "彩虹" },
    { type: "match", question: "哪一個詞語最能形容這張圖？", gif: "leaf.png", options: ["樹木", "樹葉", "花朵"], answer: "樹葉" }
];
const radicalTasks = [
    { type: "radical", question: "下列哪一個字有「目」字部件？", options: ["清", "睛", "晴"], answer: "睛" },
    { type: "radical", question: "下列哪一個字有「目」字部件？", options: ["春", "看", "吞"], answer: "看" },
    { type: "radical", question: "下列哪一個字有「木」字部件？", options: ["季", "早", "桌"], answer: "桌" },
    { type: "radical", question: "下列哪一個字有「木」字部件？", options: ["任", "桃", "很"], answer: "桃" },
    { type: "radical", question: "下列哪一個字有「足」字部件（⻊）？", options: ["泡", "跑", "炮"], answer: "跑" },
    { type: "radical", question: "下列哪一個字有「足」字部件（⻊）？", options: ["路", "走", "從"], answer: "路" },
    { type: "radical", question: "下列哪一個字有「虫」字部件？", options: ["媽", "嗎", "螞"], answer: "螞" },
    { type: "radical", question: "下列哪一個字有「虫」字部件？", options: ["湖", "蝴", "糊"], answer: "蝴" }
];
const puncTasks = [
    { type: "punc", question: "小恩，你為甚麼不開心___", options: ["。", "？", "："], answer: "？" },
    { type: "punc", question: "下午三時___哥哥在公園跑步。", options: ["。", "，", "「"], answer: "，" },
    { type: "punc", question: "哥哥對弟弟說___「你的新書包真好看啊！」", options: ["。", "？", "："], answer: "：" },
    { type: "punc", question: "你知道小貓去了哪裡嗎___", options: ["。", "？", "！"], answer: "？" },
    { type: "punc", question: "老師說：___今天沒有功課。」", options: ["「", "」", "，"], answer: "「" },
    { type: "punc", question: "老師說：「今天沒有功課。___", options: ["。」", "」", "。"], answer: "」" },
    { type: "punc", question: "今天，我會到商場買衣服___", options: ["。", "？", "！"], answer: "。" },
    { type: "punc", question: "媽媽，我們一起到理髮店剪髮___", options: ["。", "？", "！"], answer: "。" }
];
const continueTasks = [
    { type: "continue", question: "今天，我和哥哥______________。", options: ["一邊看手機", "一起上學去", "一會兒吃飯"], answer: "一起上學去" },
    { type: "continue", question: "新年，我和家人______________。", options: ["一起倒數", "一會兒聽音樂", "一邊跑步"], answer: "一起倒數" },
    { type: "continue", question: "動物園裏的獅子一會兒走來走去，______________。", options: ["一邊吃飯", "一起游泳", "一會兒睡覺"], answer: "一會兒睡覺" },
    { type: "continue", question: "晚上，哥哥在房間裏一會兒做功課，______________。", options: ["一會兒看手機", "一直吃零食", "一邊看看窗外"], answer: "一會兒看手機" },
    { type: "continue", question: "這個西瓜又香甜______________。", options: ["很好吃", "又多汁", "又是我"], answer: "又多汁" },
    { type: "continue", question: "這把雨傘又便宜______________。", options: ["又買東西", "我喜歡", "又好看"], answer: "又好看" },
    { type: "continue", question: "中文考試開始了，同學們認真地______________。", options: ["寫啊寫", "跑啊跑", "游啊游"], answer: "寫啊寫" },
    { type: "continue", question: "春天到了，美麗的蝴蝶在花朵上______________。", options: ["跳啊跳", "讀啊讀", "飛啊飛"], answer: "飛啊飛" }
];
const strokeTasks = [
    { type: "stroke", question: "請選出「先中央後對稱」的字。", options: ["湖", "思", "小"], answer: "小" },
    { type: "stroke", question: "請選出「先中央後對稱」的字。", options: ["凹", "山", "凸"], answer: "山" },
    { type: "stroke", question: "請選出「中間主橫最後寫」的字。", options: ["日", "木", "子"], answer: "子" },
    { type: "stroke", question: "請選出「中間主橫最後寫」的字。", options: ["月", "母", "田"], answer: "母" },
    { type: "stroke", question: "請選出「中間主直最後寫」的字。", options: ["休", "中", "女"], answer: "中" },
    { type: "stroke", question: "請選出「中間主橫最後寫」的字。", options: ["車", "下", "主"], answer: "車" },
    { type: "stroke", question: "請選出「先進入後關門」的字。", options: ["甲", "口", "內"], answer: "口" },
    { type: "stroke", question: "請選出「先進入後關門」的字。", options: ["趣", "區", "固"], answer: "固" }];
const understandTasks = [
    { type: "understand", sentence: "「暑假，爸爸帶我坐飛機去北京遊玩，我們一起登上了長城。」", question: "我和爸爸去了哪裡？", options: ["香港", "上海", "北京"], answer: "北京" },
    { type: "understand", sentence: "「早上，媽媽去了理髮店。中午，媽媽去了麵包店。晚上，媽媽去了餐廳。」", question: "媽媽在中午的時候去了哪裡？", options: ["理髮店", "麵包店", "餐廳"], answer: "麵包店" },
    { type: "understand", sentence: "「今天是小明七歲的生日。小方送了帽子，小美送了文具。」", question: "今天是誰的生日？", options: ["小明", "小方", "小美"], answer: "小明" },
    { type: "understand", sentence: "「夏天的晚上，池塘裏有兩隻青蛙坐在荷葉上呱呱地叫着。」", question: "池塘裏是誰在叫？", options: ["荷葉", "魚", "青蛙"], answer: "青蛙" },
    { type: "understand", sentence: "「弟弟喜歡吃雪糕。哥哥喜歡吃糖果。我喜歡吃餅乾。」", question: "弟弟喜歡吃甚麼？", options: ["餅乾", "糖果", "雪糕"], answer: "雪糕" },
    { type: "understand", sentence: "「沙灘上有很多人。小朋友在堆沙，大人在游泳，老人家在散步。」", question: "老人家在做甚麼？", options: ["游泳", "堆沙", "散步"], answer: "散步" },
    { type: "understand", sentence: "「下午三時，我和同學一起來到公園玩溜滑梯，我們感到很快樂。」", question: "我和同學在甚麼時候來到公園？", options: ["下午二時", "上午三時", "下午三時"], answer: "下午三時" },
    { type: "understand", sentence: "「七時半，我來到了學校。十一時半，我在上中文課。一時半，我在上數學課。三時半，我回到了家裏。」", question: "我在甚麼時候上數學課？", options: ["十一時半", "一時半", "三時半"], answer: "一時半" }
];
const allTasks = [...fillTasks, ...reorderTasks, ...matchTasks, ...radicalTasks, ...puncTasks, ...continueTasks, ...strokeTasks, ...understandTasks];

// --- 角色選擇 ---
function selectChar(element, imgPath) {
    if (currentSelectingPlayer === 1 && selectedP1 === imgPath) { resetSelection(1); return; }
    if (currentSelectingPlayer === 2 && selectedP2 === imgPath) { resetSelection(2); return; }
    if (imgPath === selectedP1 || imgPath === selectedP2) { alert("這個角色已經被選走囉！"); return; }
    if (currentSelectingPlayer === 1) {
        selectedP1 = imgPath;
        const p1Preview = document.getElementById('p1-big-preview');
        if (p1Preview) {
            p1Preview.style.background = "linear-gradient(135deg, rgba(49,130,206,0.4), rgba(255,255,255,0.3))";
            p1Preview.innerHTML = `<img src="${imgPath}" class="pop-effect" style="width:85%;height:85%;object-fit:contain;">`;
        }
        currentSelectingPlayer = 2;
        updateHint("請 玩家 2 選擇一個角色", "#d53f8c");
    } else {
        selectedP2 = imgPath;
        const p2Preview = document.getElementById('p2-big-preview');
        if (p2Preview) {
            p2Preview.style.background = "linear-gradient(135deg, rgba(213,63,140,0.4), rgba(255,255,255,0.3))";
            p2Preview.innerHTML = `<img src="${imgPath}" class="pop-effect" style="width:85%;height:85%;object-fit:contain;">`;
        }
        updateHint("選擇完成！可以點擊下方按鈕開始遊戲。", "#48bb78");
    }
    updateHighlight();
}
function resetSelection(playerNum) {
    if (playerNum === 1) {
        selectedP1 = ""; currentSelectingPlayer = 1;
        const p1Preview = document.getElementById('p1-big-preview');
        if (p1Preview) {
            p1Preview.style.background = "rgba(255,255,255,0.3)";
            p1Preview.innerHTML = `<span style="color:#fff;font-weight:bold;">P1 棋子</span>`;
        }
        updateHint("請 玩家 1 重新選擇角色", "#3182ce");
    } else {
        selectedP2 = ""; currentSelectingPlayer = 2;
        const p2Preview = document.getElementById('p2-big-preview');
        if (p2Preview) {
            p2Preview.style.background = "rgba(255,255,255,0.3)";
            p2Preview.innerHTML = `<span style="color:#fff;font-weight:bold;">P2 棋子</span>`;
        }
        updateHint("請 玩家 2 重新選擇角色", "#d53f8c");
    }
    updateHighlight();
}
function updateHint(text, color) {
    const hint = document.getElementById('selection-hint');
    if (hint) { hint.innerText = text; hint.style.color = color; }
}
function updateHighlight() {
    const opts = document.querySelectorAll('.char-opt');
    opts.forEach(opt => {
        const path = opt.getAttribute('src');
        opt.classList.remove('selected-p1', 'selected-p2');
        opt.style.opacity = (path === selectedP2 && selectedP2) ? "0.6" : "1";
        if (path === selectedP1) opt.classList.add('selected-p1');
        if (path === selectedP2) opt.classList.add('selected-p2');
    });
}
function startGame() {
    if (!selectedP1 || !selectedP2) { alert("兩位玩家都必須選擇角色喔！"); return; }
    const p1 = document.getElementById('p1'), p2 = document.getElementById('p2');
    p1.style.backgroundImage = `url('${selectedP1}')`;
    p1.style.backgroundSize = "contain"; p1.style.backgroundRepeat = "no-repeat";
    p2.style.backgroundImage = `url('${selectedP2}')`;
    p2.style.backgroundSize = "contain"; p2.style.backgroundRepeat = "no-repeat";
    document.getElementById('start-screen').style.display = 'none';
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) { gameContainer.style.display = 'block'; gameContainer.style.visibility = 'visible'; }
    const ctrl = document.getElementById('controls');
    if (ctrl) ctrl.style.setProperty('display', 'flex', 'important');
    setTimeout(updateDisplay, 100);
}

// 音效
const audio = {
    bgm: new Audio('sounds/bgm.mp3'),
    dice: new Audio('sounds/sounds_dice.mp3'),
    win: new Audio('sounds/win.mp3')
};
audio.bgm.loop = true;
audio.bgm.volume = 0.4;
window.addEventListener('load', () => audio.bgm.play().catch(() => { }));
function toggleBGM() {
    const btn = document.getElementById('music-ctrl');
    if (audio.bgm.paused) { audio.bgm.play(); btn.innerText = "🎵"; }
    else { audio.bgm.pause(); btn.innerText = "🔇"; }
}
function playSound(name) {
    if (audio[name]) { audio[name].currentTime = 0; audio[name].play().catch(() => { }); }
}

// 棋盤
function init() {
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = ""; let displayIndex = 1; words = [];
    for (let i = 0; i < 110; i++) {
        if (i === 0) words.push("起點");
        else if (i === 109) words.push("終點 🏆");
        else if (traps.includes(i) || boosts.includes(i) || dinosaurs.includes(i)) words.push("");
        else words.push("語文挑戰");
    }
    words.forEach((w, i) => {
        const cell = document.createElement('div');
        cell.className = 'cell'; cell.id = 'c' + i;
        if (i === words.length - 1) {
            cell.classList.add('goal-cell');
            cell.innerHTML = `<div class="event-icon">🏆</div><div class="cell-text">終點</div>`;
        } else {
            let iconText = "";
            if (traps.includes(i)) { iconText = "🍌"; cell.classList.add('trap-cell'); }
            else if (boosts.includes(i)) { iconText = "🚀"; cell.classList.add('boost-cell'); }
            else if (dinosaurs.includes(i)) { iconText = "🦖"; cell.classList.add('dino-cell'); }
            let numberHtml = (!i || iconText) ? "" : `<span class="cell-index">${displayIndex++}</span>`;
            cell.innerHTML = `${numberHtml}${w ? "<div class='cell-text'>" + w + "</div>" : ""}<span class="event-icon" style="${w ? 'position:absolute;bottom:5px;right:8px;font-size:24px;' : 'font-size:50px;'}">${iconText}</span>`;
        }
        board.appendChild(cell);
    });
    setTimeout(updateDisplay, 100);
}
function updateDisplay() {
    players.forEach((p, i) => {
        const cell = document.getElementById('c' + p.pos);
        const pEl = document.getElementById('p' + (i + 1));
        if (!cell || !pEl) return;
        const centerX = cell.offsetLeft + cell.offsetWidth / 2 - pEl.offsetWidth / 2;
        pEl.style.left = centerX + 'px';
        if (cell.classList.contains('goal-cell')) {
            pEl.style.top = (cell.offsetTop + cell.offsetHeight / 2 + (i === 0 ? -40 : 20)) + 'px';
        } else {
            const roadAreaTop = cell.offsetTop + cell.offsetHeight + 15;
            pEl.style.top = (i === 0 ? roadAreaTop - 10 : roadAreaTop + 35) + 'px';
        }
    });
}

// 擲骰子
async function roll() {
    if (moving || waitingForClick) return;
    playSound('dice');
    const rollBtn = document.getElementById('btn-roll');
    if (rollBtn) rollBtn.disabled = true;
    const diceBox = document.getElementById('dice-box');
    const num = Math.floor(Math.random() * 6) + 1;
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(0deg) rotateY(180deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)'
    };
    diceBox.style.transform = `rotateX(${Math.random() * 360 + 720}deg) rotateY(${Math.random() * 360 + 720}deg)`;
    await new Promise(r => setTimeout(r, 600));
    diceBox.style.transform = rotations[num];
    await new Promise(r => setTimeout(r, 400));
    dice = num;
    waitingForClick = true;
    document.getElementById('p' + (turn + 1)).classList.add('can-move');
}

// ======================
// 【核心行動邏輯】
// ======================
async function handlePlayerClick(pid) {
    if (!waitingForClick || pid !== turn || moving) return;
    waitingForClick = false;
    document.getElementById('p' + (turn + 1)).classList.remove('can-move');

    if (specialEventActive) {
        let steps = pendingSteps;
        specialEventActive = false;
        pendingSteps = 0;
        await moveSteps(pid, steps);
        checkEndOrModal(pid);
    } else {
        await move(pid);
        if (!specialEventActive) checkEndOrModal(pid);
    }
}

async function move(pid) {
    moving = true;
    for (let i = 0; i < dice; i++) {
        if (players[pid].pos < words.length - 1) {
            players[pid].pos++;
            updateDisplay();
            await new Promise(r => setTimeout(r, 300));
        }
    }
    moving = false;

    const pos = players[pid].pos;
    if (traps.includes(pos)) {
        alert("🍌 踩到香蕉！請再點擊棋子後退 1 格");
        prepareSpecialStep(pid, -1);
    } else if (boosts.includes(pos)) {
        alert("🚀 踩到火箭！請再點擊棋子前進 5 格");
        prepareSpecialStep(pid, 5);
    } else if (dinosaurs.includes(pos)) {
        alert("🦖 踩到恐龍！請再點擊棋子後退 3 格");
        prepareSpecialStep(pid, -3);
    }
}

function prepareSpecialStep(pid, steps) {
    waitingForClick = true;
    specialEventActive = true;
    pendingSteps = steps;
    document.getElementById('p' + (pid + 1)).classList.add('can-move');
}

async function moveSteps(pid, steps) {
    moving = true;
    const isForward = steps > 0;
    for (let i = 0; i < Math.abs(steps); i++) {
        if (isForward) {
            if (players[pid].pos < words.length - 1) players[pid].pos++;
        } else {
            if (players[pid].pos > 0) players[pid].pos--;
        }
        updateDisplay();
        await new Promise(r => setTimeout(r, 300));
    }
    moving = false;
}

function checkEndOrModal(pid) {
    const pos = players[pid].pos;
    if (pos === words.length - 1) {
        playSound('win');
        document.getElementById('win-modal').style.display = 'flex';
        document.getElementById('win-player').textContent = `玩家 ${pid + 1}`;
        return;
    }
    if (traps.includes(pos) || boosts.includes(pos) || dinosaurs.includes(pos) || pos === 0) {
        finishTurn();
        return;
    }
    showModal();
}

// 題目系統
function displaySpecificTask(task) {
    attempts = 3;
    const modal = document.getElementById('modal');
    modal.className = "";
    modal.classList.add('type-' + task.type);

    const content = document.getElementById('modal-content');
    const actions = document.getElementById('modal-actions');
    content.innerHTML = "";
    actions.innerHTML = "";

    let html = `<div class="challenge-container">`;
    if (task.gif) html += `<img src="images/${task.gif}" class="task-image">`;
    if (task.sentence) html += `<div class="task-sentence-box">${task.sentence}</div>`;
    html += `<p class="task-question">${task.question}</p><div id="feedback-msg" style="min-height:30px;"></div></div>`;
    content.innerHTML = html;

    if (task.type === "reorder") {
    const answerZone = document.createElement('div');
    answerZone.id = "reorder-answer-zone";
    answerZone.innerHTML = `<span style="color:#888; font-size:18px;">（點擊下方詞語加入這裡）</span>`;
    content.querySelector('.challenge-container').appendChild(answerZone);

    const optionsPool = document.createElement('div');
    optionsPool.id = "reorder-options-pool";
    task.words.forEach(w => {
        const btn = document.createElement('button');
        btn.className = "opt-btn";
        btn.innerText = w;
        btn.onclick = () => addToReorder(btn);
        optionsPool.appendChild(btn);
    });
    content.querySelector('.challenge-container').appendChild(optionsPool);

    // 橫向的提交 + 重來按鈕
    const submitBtn = document.createElement('button');
    submitBtn.className = "submit-btn";
    submitBtn.innerText = "提交";
    submitBtn.onclick = () => {
        const user = Array.from(document.getElementById('reorder-answer-zone').children)
            .filter(el => el.classList.contains('word-span'))
            .map(n => n.innerText).join("");
        checkUserAnswer(user, task.answer);
    };

    const resetBtn = document.createElement('button');
    resetBtn.className = "submit-btn";
    resetBtn.style.background = "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%) !important";
    resetBtn.innerText = "重新再來";
    resetBtn.onclick = () => {
        // 清空答案區 + 恢復所有選項按鈕
        answerZone.innerHTML = `<span style="color:#888; font-size:18px;">（點擊下方詞語加入這裡）</span>`;
        optionsPool.querySelectorAll('.opt-btn').forEach(btn => {
            btn.classList.remove('used');
        });
    };

    actions.appendChild(submitBtn);
    actions.appendChild(resetBtn);
}

function checkUserAnswer(userSelect, correctAnswer) {
    const feedback = document.getElementById('feedback-msg');
    if (userSelect === correctAnswer) {
        feedback.innerHTML = "🎉 答對了！"; feedback.style.color = "#48bb78";
        document.getElementById('modal-actions').innerHTML = `<button onclick="closeModal()" class="finish-btn">完成 🏆</button>`;
    } else {
        attempts--;
        if (attempts > 0) {
            feedback.innerHTML = `還有 ${attempts} 次機會！`; feedback.style.color = "#f56565";
        } else {
            feedback.innerHTML = "💔 正確答案：" + correctAnswer; feedback.style.color = "#5d4037";
            setTimeout(closeModal, 1500);
        }
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('modal').style.display = 'none';
    finishTurn();
}

// 換回合
function finishTurn() {
    turn = 1 - turn;
    const tn = document.getElementById('player-turn-name');
    if (tn) {
        tn.innerText = "玩家 " + (turn + 1);
        tn.style.color = turn === 0 ? "#3182ce" : "#d53f8c";
    }
    document.getElementById('btn-roll').disabled = false;
}

// 測試面板專用
function testModal(type) {
    let task;
    switch(type) {
        case 'fill': task = fillTasks[0]; break;
        case 'reorder': task = reorderTasks[0]; break;
        case 'match': task = matchTasks[0]; break;
        case 'radical': task = radicalTasks[0]; break;
        case 'punc': task = puncTasks[0]; break;
        case 'continue': task = continueTasks[0]; break;
        case 'stroke': task = strokeTasks[0]; break;
        case 'understand': task = understandTasks[0]; break;
        default: return;
    }
    displaySpecificTask(task);
}

function restartGame() { location.reload(); }
window.onload = init;

// 強制顯示骰子按鈕
window.addEventListener('load', () => {
  const controls = document.getElementById('controls');
  if (controls) controls.style.display = 'flex';
  
  const btn = document.getElementById('btn-roll');
  if (btn) btn.disabled = false;
});
