// --- 全域變數 ---
let selectedP1 = "";
let selectedP2 = "";
let currentSelectingPlayer = 1;
let turn = 0, dice = 0, moving = false;
let waitingForClick = false;
let specialEventActive = false;
let attempts = 3;
let pendingSteps = 0;
let isDebugPreview = false;
let isTeacherMode = false;
let teacherPlacementPlayer = null;
let timerInterval = null;
const MODAL_TIME_SECONDS = 120;
let currentActiveTask = null;
let modalReturnPos = null;
let modalTimeoutHandling = false;

const CELEBRATION_PRAISES = [
    '🌟 太厲害了！繼續進步！🏆',
    '🔥 語文大師就是你！ 🧠',
    '👏 答得太漂亮了！繼續衝刺！',
    '💫 妙筆生花！你真是天才！',
    '🎉 全場最亮！語文小達人！',
    '✨ 無懈可擊！老師都要鼓掌！'
];

// 棋盤：8 行 × 10 格，64 題 + 15 特殊格 + 起點，終點為第 81 格（index 80）
const BOARD_COLS = 10;
const BOARD_ROWS = 8;
const QUESTIONS_PER_ROW = 8;
const PATH_CELL_COUNT = 80;
const FINISH_POS = 80;
const ROW_SPECIAL_COUNTS = [1, 2, 2, 2, 2, 2, 2, 2];

const traps = [];
const boosts = [];
const dinosaurs = [];
let cellTypes = {};
let availableQuestions = [];
let usedQuestions = [];

// 玩家位置
const players = [{ pos: 0 }, { pos: 0 }];

// --- 題庫（由 questions.json 載入）---
let allTasks = [];
let TEST_TASK_MAP = {};

const ACTIVE_PULSE_CLASSES = ['active-red', 'active-green', 'active-yellow'];

function normalizeQuestionFromJson(q) {
    if (!q || !q.type) return null;
    const task = { type: q.type };
    if (q.question) task.question = q.question;
    if (q.sentence) task.sentence = q.sentence;
    if (Array.isArray(q.words)) task.words = q.words.slice();
    if (q.gif) task.gif = q.gif;
    if (Array.isArray(q.options)) task.options = q.options.slice();
    if (q.type === 'reorder') {
        if (q.answer) task.answer = q.answer;
    } else if (Array.isArray(q.options) && typeof q.answerIndex === 'number') {
        const idx = Math.max(0, Math.min(q.answerIndex, q.options.length - 1));
        task.answer = q.options[idx];
    } else if (q.answer) {
        task.answer = q.answer;
    }
    return task;
}

function buildTestTaskMap() {
    const map = {};
    allTasks.forEach((task) => {
        if (!map[task.type]) map[task.type] = [];
        map[task.type].push(task);
    });
    return map;
}

async function loadQuestionsFromJson() {
    try {
        const res = await fetch('questions.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!data || !Array.isArray(data.questions)) throw new Error('題庫格式不正確');
        const parsed = data.questions.map(normalizeQuestionFromJson).filter(Boolean);
        if (parsed.length === 0) throw new Error('題庫為空');
        allTasks = parsed;
        TEST_TASK_MAP = buildTestTaskMap();
        return true;
    } catch (err) {
        console.error('載入 questions.json 失敗:', err);
        allTasks = [];
        TEST_TASK_MAP = {};
        return false;
    }
}

function clearActivePlayerPulse() {
    document.querySelectorAll('.player').forEach((el) => {
        el.classList.remove(...ACTIVE_PULSE_CLASSES);
    });
}

function updateActivePlayerPulse() {
    if (!document.body.classList.contains('game-active')) return;
    clearActivePlayerPulse();
    const token = document.getElementById('p' + (turn + 1));
    if (!token) return;
    const pulseClass = turn === 0 ? 'active-red' : 'active-green';
    token.classList.add(pulseClass);
}

// ===============================
// ========== 動態題目池 ==========
// ===============================
function cloneTask(task) {
    const copy = { ...task };
    if (Array.isArray(task.words)) copy.words = task.words.slice();
    if (Array.isArray(task.options)) copy.options = task.options.slice();
    return copy;
}

function initQuestionPool() {
    availableQuestions = allTasks.map(cloneTask);
    usedQuestions = [];
}

function recycleQuestionPoolIfEmpty() {
    if (availableQuestions.length > 0) return;
    availableQuestions = usedQuestions.map(cloneTask);
    usedQuestions = [];
}

function drawQuestionFromPool() {
    recycleQuestionPoolIfEmpty();
    if (availableQuestions.length === 0) return null;

    const index = Math.floor(Math.random() * availableQuestions.length);
    const task = availableQuestions.splice(index, 1)[0];
    usedQuestions.push(task);
    return task;
}

// ===============================
// ========= 角色選擇系統 =========
// ===============================
function selectChar(element, imgPath) {
    if (currentSelectingPlayer === 1 && selectedP1 === imgPath) {
        resetSelection(1);
        return;
    }
    if (currentSelectingPlayer === 2 && selectedP2 === imgPath) {
        resetSelection(2);
        return;
    }
    if (imgPath === selectedP1 || imgPath === selectedP2) {
        alert("這個角色已經被選走囉！");
        return;
    }

    if (currentSelectingPlayer === 1) {
        selectedP1 = imgPath;
        const preview = document.getElementById('p1-big-preview');
        if (preview) {
            preview.style.background = "linear-gradient(135deg, rgba(49, 130, 206, 0.4), rgba(255, 255, 255, 0.3))";
            preview.innerHTML = `<img src="${imgPath}" class="pop-effect" alt="玩家1角色">`;
        }
        currentSelectingPlayer = 2;
        updateHint("請 玩家 2 選擇一個角色", "var(--p2-color)");
    } else {
        selectedP2 = imgPath;
        const preview = document.getElementById('p2-big-preview');
        if (preview) {
            preview.style.background = "linear-gradient(135deg, rgba(213, 63, 140, 0.4), rgba(255, 255, 255, 0.3))";
            preview.innerHTML = `<img src="${imgPath}" class="pop-effect" alt="玩家2角色">`;
            preview.style.cursor = "pointer";
        }
        updateHint("選擇完成！可以點擊下方按鈕開始遊戲。", "#48bb78");
    }
    updateHighlight();
}

function resetSelection(playerNum) {
    if (playerNum === 1) {
        selectedP1 = "";
        currentSelectingPlayer = 1;
        const preview = document.getElementById('p1-big-preview');
        if (preview) {
            preview.style.background = "rgba(255, 255, 255, 0.2)";
            preview.innerHTML = `<span class="placeholder-text">P1 棋子</span>`;
        }
        updateHint("請 玩家 1 重新選擇角色", "var(--p1-color)");
    } else {
        selectedP2 = "";
        currentSelectingPlayer = 2;
        const preview = document.getElementById('p2-big-preview');
        if (preview) {
            preview.style.background = "rgba(255, 255, 255, 0.2)";
            preview.innerHTML = `<span class="placeholder-text">P2 棋子</span>`;
        }
        updateHint("請 玩家 2 重新選擇角色", "var(--p2-color)");
    }
    updateHighlight();
}

function updateHint(text, color) {
    const el = document.getElementById('selection-hint');
    if (el) {
        el.innerText = text;
        el.style.color = color;
    }
}

function updateHighlight() {
    document.querySelectorAll('.char-opt').forEach(opt => {
        const path = opt.getAttribute('src');
        opt.classList.remove('selected-p1', 'selected-p2');
        opt.style.opacity = "1";
        if (path === selectedP1) opt.classList.add('selected-p1');
        if (path === selectedP2) {
            opt.classList.add('selected-p2');
            opt.style.opacity = "0.85";
        }
    });
}

function startGame() {
    if (!selectedP1 || !selectedP2) {
        alert("兩位玩家都必須選擇角色喔！");
        return;
    }

    document.getElementById('p1').style.backgroundImage = `url('${selectedP1}')`;
    document.getElementById('p2').style.backgroundImage = `url('${selectedP2}')`;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.body.classList.add('game-active');

    const ctrl = document.getElementById('controls');
    if (ctrl) ctrl.style.setProperty('display', 'flex', 'important');

    const rollBtn = document.getElementById('btn-roll');
    if (rollBtn) rollBtn.style.setProperty('display', 'inline-block', 'important');

    const diceBox = document.getElementById('dice-box');
    if (diceBox) diceBox.style.transform = 'rotateX(0deg) rotateY(0deg)';

    syncBgmUiFromAudio();
    preloadFreesoundEffects();
    updateDisplay();
    updateActivePlayerPulse();
}

// ===============================
// ========== 音效與遊戲 ==========
// ===============================
const audio = {
    bgm: new Audio('sounds/bgm.mp3'),
    dice: new Audio('sounds/sounds_dice.mp3'),
    win: new Audio('sounds/win.mp3')
};
audio.bgm.loop = true;
audio.bgm.volume = 0.4;
audio.bgm.preload = 'none';
audio.bgm.autoplay = false;
audio.bgm.pause();

function setBgmMutedUi() {
    const btn = document.getElementById('music-ctrl');
    const icon = btn ? btn.querySelector('.music-ctrl-icon') : null;
    if (icon) icon.textContent = '🔇';
    if (btn) {
        btn.classList.add('is-muted');
        btn.title = '開啟背景音樂';
        btn.setAttribute('aria-label', '開啟背景音樂');
    }
}

function setBgmPlayingUi() {
    const btn = document.getElementById('music-ctrl');
    const icon = btn ? btn.querySelector('.music-ctrl-icon') : null;
    if (icon) icon.textContent = '🔊';
    if (btn) {
        btn.classList.remove('is-muted');
        btn.title = '關閉背景音樂';
        btn.setAttribute('aria-label', '關閉背景音樂');
    }
}

function syncBgmUiFromAudio() {
    if (audio.bgm.paused) setBgmMutedUi();
    else setBgmPlayingUi();
}

function toggleBGM() {
    if (audio.bgm.paused) {
        audio.bgm.play().catch(() => {});
        setBgmPlayingUi();
    } else {
        audio.bgm.pause();
        setBgmMutedUi();
    }
}

function initMusicCtrl() {
    audio.bgm.pause();
    syncBgmUiFromAudio();
    const musicBtn = document.getElementById('music-ctrl');
    if (!musicBtn || musicBtn.dataset.bgmBound === '1') return;
    musicBtn.dataset.bgmBound = '1';
    musicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBGM();
    });
}

function playSound(name) {
    if (audio[name]) {
        audio[name].currentTime = 0;
        audio[name].play().catch(() => {});
    }
}

// ===============================
// ====== Freesound 聯網音效 ======
// ===============================
const FREESOUND_API_BASE = 'https://freesound.org/apiv2/search/';
const FREESOUND_TOKEN = (typeof window !== 'undefined' && window.FREESOUND_API_KEY) || '';

const FREESOUND_EFFECTS = {
    banana: {
        query: 'slip fall cartoon',
        filter: 'tag:cartoon tag:slip tag:fall duration:[0 TO 6]',
        sort: 'rating_desc',
        volume: 0.85
    },
    dino: {
        query: 'dinosaur roar',
        filter: 'tag:dinosaur tag:roar duration:[0 TO 8]',
        sort: 'rating_desc',
        volume: 0.9
    },
    rocket: {
        query: 'level up powerup win',
        filter: 'duration:[0 TO 8]',
        fallbackFilters: [
            'tag:arcade duration:[0 TO 8]',
            'tag:retro duration:[0 TO 8]'
        ],
        sort: 'rating_desc',
        volume: 0.48
    },
    cheer: {
        query: 'applause cheer short',
        filter: 'tag:(applause OR cheer) duration:[0 TO 5]',
        fallbackFilters: ['tag:applause duration:[0 TO 5]', 'duration:[0 TO 4]'],
        sort: 'duration_asc',
        volume: 0.8
    },
    wrong: {
        query: 'oops error wrong',
        filter: 'tag:(oops OR wrong OR error) duration:[0 TO 4]',
        fallbackFilters: [
            'tag:oops duration:[0 TO 4]',
            'tag:wrong duration:[0 TO 4]',
            'tag:cartoon duration:[0 TO 3]'
        ],
        sort: 'duration_asc',
        volume: 0.52
    }
};

const freesoundUrlCache = {};
const freesoundFetchPromises = {};
const freesoundPreloadedAudio = {};
let activeFreesoundPlayer = null;
/** 答對歡呼：頁面載入時預載，答對時直接 play */
let cheerAudioPlayer = null;

function pickPreviewUrlFromResults(results) {
    if (!Array.isArray(results)) return null;
    for (const sound of results) {
        const previews = sound && sound.previews;
        const url = previews && (previews['preview-hq-mp3'] || previews['preview-lq-mp3']);
        if (url) return url;
    }
    return null;
}

async function searchFreesoundOnce(query, filter, sort) {
    const params = new URLSearchParams({
        query,
        token: FREESOUND_TOKEN,
        fields: 'id,name,previews',
        page_size: '8',
        sort: sort || 'rating_desc'
    });
    if (filter) params.set('filter', filter);

    const res = await fetch(`${FREESOUND_API_BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`Freesound HTTP ${res.status}`);
    const data = await res.json();
    return pickPreviewUrlFromResults(data.results);
}

async function fetchFreesoundPreviewUrl(effectKey) {
    if (!FREESOUND_TOKEN) return null;
    if (freesoundUrlCache[effectKey]) return freesoundUrlCache[effectKey];
    if (freesoundFetchPromises[effectKey]) return freesoundFetchPromises[effectKey];

    const spec = FREESOUND_EFFECTS[effectKey];
    if (!spec) return null;

    const filtersToTry = [spec.filter, ...(spec.fallbackFilters || [])].filter(Boolean);

    freesoundFetchPromises[effectKey] = (async () => {
        try {
            for (const filter of filtersToTry) {
                const url = await searchFreesoundOnce(spec.query, filter, spec.sort);
                if (url) {
                    freesoundUrlCache[effectKey] = url;
                    return url;
                }
            }
            const queryOnlyUrl = await searchFreesoundOnce(spec.query, '', spec.sort);
            if (queryOnlyUrl) {
                freesoundUrlCache[effectKey] = queryOnlyUrl;
                return queryOnlyUrl;
            }
            throw new Error('No preview URL in search results');
        } catch (err) {
            console.warn('[Freesound] 搜尋失敗:', effectKey, err);
            return null;
        } finally {
            delete freesoundFetchPromises[effectKey];
        }
    })();

    return freesoundFetchPromises[effectKey];
}

async function ensureFreesoundPreloaded(effectKey) {
    if (!FREESOUND_TOKEN) return null;

    try {
        const spec = FREESOUND_EFFECTS[effectKey];
        if (!spec) return null;

        const existing = freesoundPreloadedAudio[effectKey];
        if (existing && existing.dataset.ready === '1') return existing;

        const url = await fetchFreesoundPreviewUrl(effectKey);
        if (!url) return null;

        const player = existing || new Audio();
        player.preload = 'auto';
        player.volume = spec.volume ?? 0.8;
        freesoundPreloadedAudio[effectKey] = player;

        if (player.src !== url) {
            player.dataset.ready = '0';
            player.src = url;
            player.load();
        }

        await new Promise((resolve) => {
            if (player.readyState >= 3) {
                player.dataset.ready = '1';
                resolve();
                return;
            }
            const done = () => {
                player.dataset.ready = '1';
                resolve();
            };
            player.addEventListener('canplaythrough', done, { once: true });
            player.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 2500);
        });

        return player;
    } catch (err) {
        console.warn('[Freesound] 預載失敗:', effectKey, err);
        return null;
    }
}

async function preloadCheerSound() {
    if (!FREESOUND_TOKEN) return;
    try {
        const player = await ensureFreesoundPreloaded('cheer');
        if (player) cheerAudioPlayer = player;
    } catch (err) {
        console.warn('[Freesound] 答對歡呼預載失敗:', err);
    }
}

function playCorrectAnswerCheer() {
    try {
        const spec = FREESOUND_EFFECTS.cheer;
        if (!spec || !FREESOUND_TOKEN) return;

        const player = cheerAudioPlayer || freesoundPreloadedAudio.cheer;
        if (player && player.src) {
            player.volume = spec.volume ?? 0.8;
            player.currentTime = 0;
            player.play().catch((err) => console.warn('[Freesound] 答對歡呼播放失敗:', err));
            return;
        }

        void ensureFreesoundPreloaded('cheer').then((loaded) => {
            if (!loaded) return;
            cheerAudioPlayer = loaded;
            loaded.currentTime = 0;
            loaded.play().catch(() => {});
        });
    } catch (err) {
        console.warn('[Freesound] 答對歡呼觸發失敗:', err);
    }
}

async function playFreesoundEffect(effectKey) {
    try {
        const spec = FREESOUND_EFFECTS[effectKey];
        if (!spec || !FREESOUND_TOKEN) return;

        let url = freesoundUrlCache[effectKey] || null;
        const preloaded = freesoundPreloadedAudio[effectKey];
        if (preloaded && preloaded.src) {
            url = preloaded.src;
        }
        if (!url) {
            url = await fetchFreesoundPreviewUrl(effectKey);
        }
        if (!url) return;

        if (activeFreesoundPlayer) {
            try { activeFreesoundPlayer.pause(); } catch (_) { /* ignore */ }
        }

        const player = preloaded && preloaded.src === url
            ? preloaded
            : new Audio(url);
        player.volume = spec.volume ?? 0.8;
        player.currentTime = 0;
        activeFreesoundPlayer = player;
        await player.play();
    } catch (err) {
        console.warn('[Freesound] 播放失敗:', effectKey, err);
    }
}

function preloadFreesoundEffects() {
    if (!FREESOUND_TOKEN) return;
    void preloadCheerSound();
    Object.keys(FREESOUND_EFFECTS).forEach((key) => {
        if (key === 'cheer') return;
        ensureFreesoundPreloaded(key).catch(() => {});
    });
}

// ===============================
// ========== 棋盤題型主題 ==========
// ===============================
const CHALLENGE_TYPES = ['stroke', 'radical', 'match', 'understand', 'fill', 'reorder', 'continue', 'punc'];

const CELL_TYPE_THEMES = {
    stroke: { cssClass: 'cell-theme-green', bg: 'rgba(230, 255, 250, 0.82)', border: '#276749', emojis: ['✍️', '✏️'] },
    radical: { cssClass: 'cell-theme-green', bg: 'rgba(206, 245, 214, 0.82)', border: '#276749', emojis: ['✍️', '✏️'] },
    match: { cssClass: 'cell-theme-blue', bg: 'rgba(235, 248, 255, 0.82)', border: '#2b6cb0', emojis: ['🖼️', '🎨'] },
    understand: { cssClass: 'cell-theme-yellow', bg: 'rgba(254, 252, 191, 0.82)', border: '#c05621', emojis: ['📖', '🧐'] },
    fill: { cssClass: 'cell-theme-purple', bg: 'rgba(250, 245, 255, 0.82)', border: '#553c9a', emojis: ['🧩', '🔗'] },
    reorder: { cssClass: 'cell-theme-purple', bg: 'rgba(226, 213, 245, 0.82)', border: '#553c9a', emojis: ['🧩', '🔗'] },
    continue: { cssClass: 'cell-theme-purple', bg: 'rgba(250, 245, 255, 0.82)', border: '#553c9a', emojis: ['🧩', '🔗'] },
    punc: { cssClass: 'cell-theme-purple', bg: 'rgba(226, 213, 245, 0.82)', border: '#553c9a', emojis: ['🧩', '🔗'] }
};

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildEvenThemeBag() {
    const bag = [];
    CHALLENGE_TYPES.forEach((t) => {
        for (let i = 0; i < 8; i++) bag.push(t);
    });
    return shuffleArray(bag);
}

function isQuestionCellKind(kind) {
    return kind === 'question';
}

function validateBoardLayout(layout) {
    for (let pos = 0; pos < PATH_CELL_COUNT; pos++) {
        const kind = layout[pos].kind;
        if (kind === 'banana') {
            const land = pos - 1;
            if (land < 1 || !isQuestionCellKind(layout[land].kind)) return false;
        } else if (kind === 'dino') {
            const land = pos - 3;
            if (land < 1 || !isQuestionCellKind(layout[land].kind)) return false;
        } else if (kind === 'rocket') {
            const land = pos + 5;
            if (land >= FINISH_POS || !isQuestionCellKind(layout[land].kind)) return false;
        }
    }
    return true;
}

function buildGameBoard() {
    const specialKinds = shuffleArray([
        ...Array(5).fill('banana'),
        ...Array(5).fill('rocket'),
        ...Array(5).fill('dino')
    ]);

    for (let attempt = 0; attempt < 600; attempt++) {
        const layout = new Array(PATH_CELL_COUNT);
        layout[0] = { kind: 'start' };

        let specialSlotIndex = 0;
        for (let row = 0; row < BOARD_ROWS; row++) {
            const rowStart = row * BOARD_COLS;
            const specialCount = ROW_SPECIAL_COUNTS[row];
            const slotRange = row === 0
                ? Array.from({ length: 9 }, (_, i) => rowStart + 1 + i)
                : Array.from({ length: BOARD_COLS }, (_, i) => rowStart + i);

            const specialSlots = shuffleArray(slotRange).slice(0, specialCount);
            const specialSet = new Set(specialSlots);

            for (const pos of slotRange) {
                if (specialSet.has(pos)) {
                    layout[pos] = { kind: specialKinds[specialSlotIndex++] };
                } else {
                    layout[pos] = { kind: 'question' };
                }
            }
        }

        if (!validateBoardLayout(layout)) continue;

        const themeBag = buildEvenThemeBag();
        const types = {};
        let themeIdx = 0;

        traps.length = 0;
        boosts.length = 0;
        dinosaurs.length = 0;

        for (let pos = 0; pos < PATH_CELL_COUNT; pos++) {
            const cell = layout[pos];
            if (cell.kind === 'banana') traps.push(pos);
            else if (cell.kind === 'rocket') boosts.push(pos);
            else if (cell.kind === 'dino') dinosaurs.push(pos);
            else if (cell.kind === 'question') {
                types[pos] = themeBag[themeIdx++];
            }
        }

        return { layout, cellTypes: types };
    }

    throw new Error('無法生成符合規則的棋盤，請重新整理頁面');
}

function pickThemeEmoji(type) {
    const theme = CELL_TYPE_THEMES[type];
    if (!theme) return '🧩';
    return theme.emojis[Math.floor(Math.random() * theme.emojis.length)];
}

function getBoardCell(pos) {
    return document.getElementById(pos === FINISH_POS ? 'cell-finish' : 'c' + pos);
}

function buildStartCellHtml() {
    return `
        <div class="start-stage" aria-hidden="false">
            <div class="start-flag-wrap" aria-hidden="true">
                <span class="start-flag-pole"></span>
                <span class="start-flag">🚩</span>
            </div>
            <div class="start-label">出發</div>
        </div>`;
}

function buildFinishCellHtml() {
    return `
        <div class="finish-stage" aria-hidden="false">
            <div class="finish-aurora" aria-hidden="true"></div>
            <div class="finish-rays" aria-hidden="true"></div>
            <div class="finish-sparkles" aria-hidden="true">
                <span class="finish-spark s1">✦</span>
                <span class="finish-spark s2">★</span>
                <span class="finish-spark s3">✦</span>
                <span class="finish-spark s4">★</span>
                <span class="finish-spark s5">✦</span>
                <span class="finish-spark s6">★</span>
            </div>
            <div class="finish-trophy-float">
                <div class="finish-trophy-orbit-stars" aria-hidden="true">
                    <span class="orbit-star o1">★</span>
                    <span class="orbit-star o2">✦</span>
                    <span class="orbit-star o3">★</span>
                    <span class="orbit-star o4">✦</span>
                    <span class="orbit-star o5">★</span>
                    <span class="orbit-star o6">✦</span>
                    <span class="orbit-star o7">★</span>
                    <span class="orbit-star o8">✦</span>
                    <span class="orbit-star o9">★</span>
                    <span class="orbit-star o10">✦</span>
                </div>
                <div class="finish-trophy" role="img" aria-label="冠軍獎杯">
                    <div class="trophy-star">★</div>
                    <div class="trophy-cup">
                        <div class="trophy-rim"></div>
                        <div class="trophy-bowl"></div>
                        <div class="trophy-handle trophy-handle-left"></div>
                        <div class="trophy-handle trophy-handle-right"></div>
                    </div>
                    <div class="trophy-stem"></div>
                    <div class="trophy-base">
                        <div class="trophy-plaque">1</div>
                    </div>
                </div>
            </div>
            <div class="finish-label">終點</div>
        </div>`;
}

function showSpecialGridNotice(type) {
    const configs = {
        banana: {
            className: 'special-notice notice-banana',
            title: '🍌 香蕉皮！',
            message: '哎喲！腳底一滑，後退 <strong>1</strong> 格！',
            btnText: '好痛！',
            btnClass: 'notice-btn notice-btn-banana',
            anim: 'popup-shake 0.5s ease-in-out'
        },
        dino: {
            className: 'special-notice notice-dino',
            title: '嗷嗚！恐龍來襲！',
            message: '🦖 大地震動！後退 <strong>3</strong> 格！',
            btnText: '快跑！',
            btnClass: 'notice-btn notice-btn-dino',
            anim: 'popup-earthquake 0.6s ease-out'
        },
        rocket: {
            className: 'special-notice notice-rocket',
            title: '🚀 火箭推進！',
            message: '點擊棋子，向前衝刺 <strong>5</strong> 格！',
            btnText: '出發！',
            btnClass: 'notice-btn notice-btn-rocket',
            iconAnim: 'rocket-fly 1.5s ease-in-out infinite alternate'
        },
        finish: {
            className: 'special-notice notice-banana',
            title: '🏆 終點格',
            message: '教師預覽：僅供外觀展示，<strong>不會</strong>改變棋子位置或回合。',
            btnText: '知道了',
            btnClass: 'notice-btn notice-btn-banana',
            anim: 'popup-shake 0.35s ease-in-out'
        }
    };

    const cfg = configs[type];
    if (!cfg) return Promise.resolve();

    return new Promise(resolve => {
        const notice = document.createElement('div');
        notice.className = cfg.className;
        const iconStyle = cfg.iconAnim ? ` style="animation:${cfg.iconAnim}"` : '';
        const iconChar = type === 'banana' ? '🍌' : type === 'dino' ? '🦖' : type === 'rocket' ? '🚀' : '🏆';
        notice.innerHTML = `
            <div class="notice-icon-wrap"${iconStyle}>
                <span class="notice-icon">${iconChar}</span>
            </div>
            <h3 class="notice-title">${cfg.title}</h3>
            <p class="notice-message">${cfg.message}</p>
            <button type="button" class="${cfg.btnClass}">${cfg.btnText}</button>
            <p class="notice-hint">（ 點擊關閉 ）</p>`;

        if (cfg.anim) notice.style.animation = cfg.anim;

        document.body.appendChild(notice);

        if (type === 'banana' || type === 'dino' || type === 'rocket') {
            void playFreesoundEffect(type);
        }

        requestAnimationFrame(() => notice.classList.add('show'));

        const close = () => {
            notice.classList.remove('show');
            setTimeout(() => {
                notice.remove();
                resolve();
            }, 400);
        };

        notice.addEventListener('click', close);
        const btn = notice.querySelector('button');
        if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    });
}

function bindTeacherSpecialCellPreviews() {
    const board = document.getElementById('board');
    if (!board) return;
    const onPreview = (type) => (e) => {
        if (!isTeacherMode) return;
        e.preventDefault();
        e.stopPropagation();
        void showSpecialGridNotice(type);
    };
    board.querySelectorAll('.trap-cell').forEach(el => {
        el.addEventListener('dblclick', onPreview('banana'));
    });
    board.querySelectorAll('.boost-cell').forEach(el => {
        el.addEventListener('dblclick', onPreview('rocket'));
    });
    board.querySelectorAll('.dino-cell').forEach(el => {
        el.addEventListener('dblclick', onPreview('dino'));
    });
    const finish = document.getElementById('cell-finish');
    if (finish) {
        finish.addEventListener('dblclick', onPreview('finish'));
    }
}

function getCellPositionFromElement(cell) {
    if (!cell || !cell.id) return null;
    if (cell.id === 'cell-finish') return FINISH_POS;
    if (cell.id.startsWith('c')) {
        const pos = parseInt(cell.id.slice(1), 10);
        return Number.isNaN(pos) ? null : pos;
    }
    return null;
}

function clearTeacherPlacementSelection() {
    [1, 2].forEach((n) => {
        const el = document.getElementById('p' + n);
        if (el) el.classList.remove('teacher-piece-selected');
    });
}

function setTeacherPlacementPlayer(pid) {
    teacherPlacementPlayer = pid;
    [0, 1].forEach((i) => {
        const el = document.getElementById('p' + (i + 1));
        if (el) el.classList.toggle('teacher-piece-selected', i === pid);
    });
}

function setTeacherModeActive(active) {
    isTeacherMode = active;
    document.body.classList.toggle('teacher-mode', active);
    if (active) {
        setTeacherPlacementPlayer(teacherPlacementPlayer ?? turn);
    } else {
        teacherPlacementPlayer = null;
        clearTeacherPlacementSelection();
    }
}

function isTeacherPlacementAllowed() {
    return isTeacherMode && document.body.classList.contains('game-active');
}

function placeTeacherPieceAt(pos, pid) {
    const playerId = pid ?? teacherPlacementPlayer ?? turn;
    players[playerId].pos = Math.max(0, Math.min(FINISH_POS, pos));

    waitingForClick = false;
    specialEventActive = false;
    moving = false;
    [1, 2].forEach((n) => {
        const el = document.getElementById('p' + n);
        if (el) el.classList.remove('can-move');
    });

    updateDisplay();
}

function initTeacherBoardPlacement() {
    const container = document.getElementById('game-container');
    if (!container || container.dataset.teacherPlacementBound === '1') return;
    container.dataset.teacherPlacementBound = '1';

    container.addEventListener('click', (e) => {
        if (!isTeacherPlacementAllowed()) return;
        if (e.target.closest('#test-panel')) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const pos = getCellPositionFromElement(cell);
        if (pos === null) return;

        e.preventDefault();
        e.stopPropagation();

        placeTeacherPieceAt(pos);
    });
}

function initSecretFlower() {
    const flower = document.getElementById('secret-flower');
    if (!flower) return;
    let taps = [];
    const windowMs = 500;
    flower.addEventListener('click', (ev) => {
        ev.preventDefault();
        const now = Date.now();
        taps = taps.filter((t) => now - t <= windowMs);
        taps.push(now);
        if (taps.length >= 2) {
            taps.length = 0;
            setTeacherModeActive(!isTeacherMode);
        }
    });
}

// ===============================
// ========== 棋盤初始化 ==========
// ===============================
function init() {
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = "";
    let displayIndex = 1;
    const built = buildGameBoard();
    cellTypes = built.cellTypes;

    for (let i = 0; i < PATH_CELL_COUNT; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = 'c' + i;

        if (i === 0) {
            cell.classList.add('cell-start');
            cell.innerHTML = buildStartCellHtml();
        } else if (traps.includes(i)) {
            cell.classList.add('trap-cell');
            cell.innerHTML = '<span class="event-icon">🍌</span>';
        } else if (boosts.includes(i)) {
            cell.classList.add('boost-cell');
            cell.innerHTML = '<span class="event-icon">🚀</span>';
        } else if (dinosaurs.includes(i)) {
            cell.classList.add('dino-cell');
            cell.innerHTML = '<span class="event-icon">🦖</span>';
        } else {
            const qType = cellTypes[i];
            const theme = CELL_TYPE_THEMES[qType];
            const emoji = pickThemeEmoji(qType);
            cell.classList.add('cell-challenge', theme.cssClass);
            cell.dataset.cellType = qType;
            cell.style.setProperty('--cell-theme-bg', theme.bg);
            cell.style.setProperty('--cell-theme-border', theme.border);
            cell.innerHTML = `<span class="cell-index">${displayIndex++}</span><span class="cell-challenge-emoji" aria-hidden="true">${emoji}</span>`;
        }
        board.appendChild(cell);
    }

    const finishCell = document.createElement('div');
    finishCell.className = 'cell goal-cell cell-finish';
    finishCell.id = 'cell-finish';
    finishCell.innerHTML = buildFinishCellHtml();
    board.appendChild(finishCell);
    bindTeacherSpecialCellPreviews();
    const diceBox = document.getElementById('dice-box');
    if (diceBox) diceBox.style.transform = 'rotateX(0deg) rotateY(0deg)';

    updateDisplay();
}

function updateDisplay() {
    players.forEach((p, i) => {
        const cell = getBoardCell(p.pos);
        const pEl = document.getElementById('p' + (i + 1));
        if (!cell || !pEl) return;

        const x = cell.offsetLeft + cell.offsetWidth / 2 - pEl.offsetWidth / 2;
        pEl.style.left = x + "px";

        if (cell.classList.contains('goal-cell')) {
            pEl.style.top = cell.offsetTop + cell.offsetHeight / 2 - 20 + (i * 40) + "px";
        } else {
            const base = cell.offsetTop + cell.offsetHeight + 10;
            pEl.style.top = base + (i === 0 ? 0 : 40) + "px";
        }
    });
}

// ===============================
// ========== 擲骰子與移動 =========
// ===============================
async function roll() {
    if (moving || waitingForClick) return;

    clearActivePlayerPulse();
    playSound('dice');
    const rollBtn = document.getElementById('btn-roll');
    if (rollBtn) rollBtn.disabled = true;

    const diceBox = document.getElementById('dice-box');
    if (!diceBox) return;

    const num = Math.floor(Math.random() * 6) + 1;
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(0deg) rotateY(180deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)'
    };

    const randomRotate = `rotateX(${Math.random() * 360 + 720}deg) rotateY(${Math.random() * 360 + 720}deg)`;
    diceBox.style.transform = randomRotate;

    await new Promise(r => setTimeout(r, 600));
    diceBox.style.transform = rotations[num];

    await new Promise(r => setTimeout(r, 400));

    dice = num;
    waitingForClick = true;
    const pEl = document.getElementById('p' + (turn + 1));
    if (pEl) pEl.classList.add('can-move');
}

async function handlePlayerClick(pid) {
    if (isTeacherPlacementAllowed()) {
        setTeacherPlacementPlayer(pid);
        return;
    }
    if (!waitingForClick || pid !== turn || moving) return;
    waitingForClick = false;
    document.getElementById('p' + (turn + 1)).classList.remove('can-move');
    modalReturnPos = players[pid].pos;

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
        if (players[pid].pos < FINISH_POS) {
            players[pid].pos++;
            updateDisplay();
            await new Promise(r => setTimeout(r, 300));
        }
    }
    moving = false;

    const pos = players[pid].pos;
    if (traps.includes(pos)) {
        await showSpecialGridNotice('banana');
        prepareSpecialStep(pid, -1);
    } else if (boosts.includes(pos)) {
        await showSpecialGridNotice('rocket');
        prepareSpecialStep(pid, 5);
    } else if (dinosaurs.includes(pos)) {
        await showSpecialGridNotice('dino');
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
    const dir = steps > 0;
    for (let i = 0; i < Math.abs(steps); i++) {
        if (dir) players[pid].pos = Math.min(FINISH_POS, players[pid].pos + 1);
        else players[pid].pos = Math.max(0, players[pid].pos - 1);
        updateDisplay();
        await new Promise(r => setTimeout(r, 300));
    }
    moving = false;
}

let winConfettiAnimId = null;
let winConfettiPieces = [];

function stopWinConfetti() {
    if (winConfettiAnimId) {
        cancelAnimationFrame(winConfettiAnimId);
        winConfettiAnimId = null;
    }
    winConfettiPieces = [];
    const canvas = document.getElementById('win-confetti-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function startWinConfetti() {
    const canvas = document.getElementById('win-confetti-canvas');
    const modal = document.getElementById('win-modal');
    if (!canvas || !modal) return;

    stopWinConfetti();

    const colors = ['#ffd54f', '#ff8a65', '#4fc3f7', '#81c784', '#f06292', '#ba68c8', '#fff176', '#ff7043'];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = Math.min(140, Math.floor((canvas.width * canvas.height) / 10000));
    winConfettiPieces = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.18,
        vy: 1.2 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 1.4,
        sway: Math.random() * Math.PI * 2
    }));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        winConfettiPieces.forEach((p) => {
            p.y += p.vy;
            p.x += p.vx + Math.sin(p.sway) * 0.6;
            p.sway += 0.04;
            p.rotation += p.spin;

            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        winConfettiAnimId = requestAnimationFrame(draw);
    };

    draw();
}

function showWinModal(pid) {
    playSound('win');
    const modal = document.getElementById('win-modal');
    const playerNumEl = document.getElementById('win-player-num');
    if (playerNumEl) playerNumEl.textContent = String(pid + 1);
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        startWinConfetti();
    }
}

function hideWinModal() {
    stopWinConfetti();
    const modal = document.getElementById('win-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

function checkEndOrModal(pid) {
    if (players[pid].pos === FINISH_POS) {
        showWinModal(pid);
        return;
    }

    const pos = players[pid].pos;
    if (traps.includes(pos) || boosts.includes(pos) || dinosaurs.includes(pos) || pos === 0) {
        finishTurn();
        return;
    }
    showModalAtCell(pos);
}

// ===============================
// ========== 題目視窗 ============
// ===============================
const MODAL_TYPE_LABELS = {
    fill: '【 供詞填充 】',
    reorder: '【 重組句子 】',
    match: '【 看圖配詞 】',
    radical: '【 部件辨識 】',
    punc: '【 標點符號 】',
    continue: '【 續寫句子 】',
    stroke: '【 筆順辨認 】',
    understand: '【 閱讀理解 】'
};

const HORIZONTAL_OPTION_TYPES = new Set(['fill', 'punc', 'radical', 'stroke', 'understand', 'match']);

function createModalTypeBadge(type) {
    const badge = document.createElement('span');
    badge.className = 'modal-type-badge';
    badge.textContent = MODAL_TYPE_LABELS[type] || '';
    return badge;
}

function createTaskPassageBox(sentence, question, options) {
    const opts = options || {};
    const box = document.createElement('div');
    box.className = 'task-passage-box';
    if (sentence) {
        const passage = document.createElement('p');
        passage.className = 'passage-text';
        passage.textContent = sentence;
        box.appendChild(passage);
    }
    const qEl = document.createElement('p');
    qEl.className = sentence ? 'passage-question' : 'passage-question passage-question-only';
    const prefix = opts.questionPrefix || '';
    qEl.textContent = prefix + question;
    box.appendChild(qEl);
    return box;
}

function stopModalTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function startModalTimer() {
    stopModalTimer();
    let timeLeft = MODAL_TIME_SECONDS;
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) timerDisplay.textContent = '⏳ 剩餘時間: ' + timeLeft + 's';

    timerInterval = setInterval(function () {
        timeLeft--;
        if (timerDisplay) timerDisplay.textContent = '⏳ 剩餘時間: ' + timeLeft + 's';
        if (timeLeft <= 0) {
            stopModalTimer();
            void handleModalTimeout();
        }
    }, 1000);
}

function hideModalUI() {
    stopModalTimer();
    resetCelebrationUI();
    currentActiveTask = null;
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) timerDisplay.textContent = '⏳ 剩餘時間: ' + MODAL_TIME_SECONDS + 's';
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (overlay) overlay.style.display = 'none';
    if (modal) {
        modal.style.display = 'none';
        modal.className = '';
    }
    const reorderMeta = document.getElementById('reorder-meta-header');
    const reorderHint = document.getElementById('reorder-structure-hint');
    if (reorderMeta) reorderMeta.setAttribute('aria-hidden', 'true');
    if (reorderHint) reorderHint.setAttribute('aria-hidden', 'true');
}

async function retreatPlayerTo(pid, targetPos) {
    moving = true;
    while (players[pid].pos > targetPos) {
        players[pid].pos--;
        updateDisplay();
        await new Promise(r => setTimeout(r, 300));
    }
    moving = false;
}

async function handleModalTimeout() {
    if (modalTimeoutHandling) return;
    modalTimeoutHandling = true;
    stopModalTimer();

    alert('對不起，時間到了。請返回原來的位置。');
    hideModalUI();

    if (isDebugPreview) {
        isDebugPreview = false;
        modalReturnPos = null;
        modalTimeoutHandling = false;
        return;
    }

    const pid = turn;
    const target = modalReturnPos != null ? modalReturnPos : players[pid].pos;
    if (players[pid].pos > target) {
        await retreatPlayerTo(pid, target);
    }
    modalReturnPos = null;
    modalTimeoutHandling = false;
    finishTurn();
}

function updateReorderSubmitHighlight() {
    const pool = document.getElementById('reorder-options-pool');
    const submitBtn = document.querySelector('#modal-actions .submit-btn:not(.reset-btn)');
    if (!pool || !submitBtn) return;
    const remaining = pool.querySelectorAll('.opt-btn:not(.used)').length;
    if (remaining === 0) submitBtn.classList.add('pulse-highlight');
    else submitBtn.classList.remove('pulse-highlight');
}

function createFeedbackEl() {
    const fb = document.createElement('div');
    fb.id = 'feedback-msg';
    return fb;
}

function buildOptionsPool(task, horizontal) {
    const pool = document.createElement('div');
    const isMatch = task.type === 'match';
    pool.id = isMatch ? 'match-options-pool' : 'choice-options-pool';
    pool.className = 'choice-options-pool' + (horizontal ? ' choice-options-row' : ' choice-options-col');
    task.options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'opt-btn';
        b.innerText = opt;
        b.onclick = () => checkUserAnswer(opt, task.answer);
        pool.appendChild(b);
    });
    return pool;
}

function showModalAtCell(pos) {
    if (!cellTypes[pos]) {
        finishTurn();
        return;
    }

    const task = drawQuestionFromPool();
    if (!task) {
        finishTurn();
        return;
    }

    displaySpecificTask(task);
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal').style.display = 'flex';
    startModalTimer();
}

function formatCorrectAnswer(answer) {
    const clean = String(answer == null ? '' : answer).trim();
    return '正確答案：' + clean;
}

function resetCelebrationUI() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    const celebration = document.getElementById('answer-celebration');
    if (modal) modal.classList.remove('modal-celebrating');
    if (content) content.style.display = '';
    if (celebration) {
        celebration.hidden = true;
        celebration.setAttribute('aria-hidden', 'true');
        celebration.classList.remove('celebration-active');
    }
}

function showAnswerCelebration(fullText) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    const celebration = document.getElementById('answer-celebration');
    const answerEl = document.getElementById('celebration-answer-text');
    const praiseEl = document.getElementById('celebration-praise-text');
    const actions = document.getElementById('modal-actions');
    const fb = document.getElementById('feedback-msg');

    if (fb) {
        fb.textContent = '';
        fb.className = '';
    }
    if (content) content.style.display = 'none';
    if (celebration && answerEl && praiseEl) {
        answerEl.textContent = formatCorrectAnswer(fullText);
        praiseEl.textContent = CELEBRATION_PRAISES[Math.floor(Math.random() * CELEBRATION_PRAISES.length)];
        celebration.hidden = false;
        celebration.setAttribute('aria-hidden', 'false');
        celebration.classList.add('celebration-active');
    }
    if (modal) modal.classList.add('modal-celebrating');
    if (actions) {
        actions.innerHTML = '<button type="button" onclick="closeModal()" class="finish-btn celebration-finish-btn">完成</button>';
    }
}

function displaySpecificTask(task) {
    currentActiveTask = task;
    resetCelebrationUI();
    attempts = 3;
    document.getElementById('modal').className = 'type-' + task.type;
    const reorderMeta = document.getElementById('reorder-meta-header');
    const reorderHint = document.getElementById('reorder-structure-hint');
    if (reorderMeta && reorderHint) {
        const ro = task.type === 'reorder';
        reorderMeta.setAttribute('aria-hidden', ro ? 'false' : 'true');
        reorderHint.setAttribute('aria-hidden', ro ? 'false' : 'true');
    }
    const content = document.getElementById('modal-content');
    const actions = document.getElementById('modal-actions');
    content.innerHTML = "";
    actions.innerHTML = "";


    content.appendChild(createModalTypeBadge(task.type));

    const body = document.createElement('div');
    body.className = 'challenge-container task-layout';

    if (task.type === 'match') {
        body.classList.add('match-layout');
        body.appendChild(createTaskPassageBox(null, task.question));
        if (task.gif) {
            const img = document.createElement('img');
            img.src = 'images/' + task.gif;
            img.alt = '題目圖片';
            img.className = 'task-img match-question-image';
            body.appendChild(img);
        }
        body.appendChild(createFeedbackEl());
        content.appendChild(body);
        content.appendChild(buildOptionsPool(task, true));
        return;
    }

    if (task.type === 'reorder') {
        body.classList.add('reorder-layout');
        body.appendChild(createFeedbackEl());

        const ansZone = document.createElement('div');
        ansZone.id = 'reorder-zone';
        body.appendChild(ansZone);

        const pool = document.createElement('div');
        pool.id = 'reorder-options-pool';
        task.words.forEach(w => {
            const b = document.createElement('button');
            b.className = 'opt-btn';
            b.innerText = w;
            b.onclick = () => {
                if (b.classList.contains('used')) return;
                b.classList.add('used');
                const s = document.createElement('span');
                s.className = 'word-span';
                s.innerText = w;
                ansZone.appendChild(s);
                updateReorderSubmitHighlight();
            };
            pool.appendChild(b);
        });
        body.appendChild(pool);
        content.appendChild(body);

        const sub = document.createElement('button');
        sub.type = 'button';
        sub.className = 'submit-btn';
        sub.innerText = '提交';
        sub.onclick = () => {
            const user = Array.from(document.querySelectorAll('.word-span')).map(n => n.innerText).join('');
            checkUserAnswer(user, task.answer);
        };
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'submit-btn reset-btn';
        reset.innerText = '重新再來';
        reset.style.background = '#ed8936';
        reset.onclick = () => {
            pool.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('used'));
            ansZone.querySelectorAll('.word-span').forEach(s => s.remove());
            updateReorderSubmitHighlight();
        };
        actions.appendChild(reset);
        actions.appendChild(sub);
        return;
    }

    const sentence = task.type === 'understand' ? (task.sentence || '') : '';
    const passageOpts = task.type === 'understand' ? { questionPrefix: '問：' } : {};
    body.appendChild(createTaskPassageBox(sentence || null, task.question, passageOpts));
    body.appendChild(createFeedbackEl());
    content.appendChild(body);

    const useHorizontal = HORIZONTAL_OPTION_TYPES.has(task.type);
    content.appendChild(buildOptionsPool(task, useHorizontal));
}

function handleCorrectAnswer(correctAnswer) {
    playCorrectAnswerCheer();
    stopModalTimer();
    showAnswerCelebration(correctAnswer);
}

function removeTaskFromUsedPool(task) {
    if (!task) return;
    const idx = usedQuestions.indexOf(task);
    if (idx !== -1) usedQuestions.splice(idx, 1);
}

function returnWrongQuestionToPool() {
    if (!currentActiveTask) return;
    removeTaskFromUsedPool(currentActiveTask);
    availableQuestions.push(cloneTask(currentActiveTask));
}

function triggerWrongAnswerFeedback() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('modal-shake');
        void modal.offsetWidth;
        modal.classList.add('modal-shake');
        setTimeout(() => modal.classList.remove('modal-shake'), 480);
    }
    playFreesoundEffect('wrong');
    returnWrongQuestionToPool();
}

function checkUserAnswer(sel, ans) {
    const fb = document.getElementById('feedback-msg');
    if (sel === ans) {
        handleCorrectAnswer(ans);
    } else {
        triggerWrongAnswerFeedback();
        attempts--;
        if (attempts > 0) {
            fb.innerText = `還有 ${attempts} 次機會，再試試看～`;
            fb.style.color = "#e53e3e";
        } else {
            fb.innerText = "💔 正確答案：" + ans;
            fb.style.color = "#744210";
            setTimeout(closeModal, 1600);
        }
    }
}

function closeModal() {
    hideModalUI();
    if (isDebugPreview) {
        isDebugPreview = false;
        modalReturnPos = null;
        return;
    }
    modalReturnPos = null;
    finishTurn();
}

function finishTurn() {
    turn = 1 - turn;
    const name = document.getElementById('player-turn-name');
    if (name) {
        name.innerText = `玩家 ${turn + 1}`;
        name.style.color = turn === 0 ? "var(--p1-color)" : "var(--p2-color)";
    }
    const rollBtn = document.getElementById('btn-roll');
    if (rollBtn) rollBtn.disabled = false;
    updateActivePlayerPulse();
}

// ========== 測試與重置 ==========

function testModal(type) {
    if (!isTeacherMode) return;
    const tasks = TEST_TASK_MAP[type];
    if (!tasks || !tasks.length) return;

    isDebugPreview = true;
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (!overlay || !modal) return;

    overlay.style.display = 'block';
    modal.style.display = 'flex';
    displaySpecificTask(tasks[0]);
    startModalTimer();
}

function initTestPanelDrag() {
    const panel = document.getElementById('test-panel');
    const handle = panel?.querySelector('.test-panel-drag-handle');
    if (!panel || !handle || panel.dataset.dragBound === '1') return;
    panel.dataset.dragBound = '1';

    let drag = null;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const onPointerDown = (e) => {
        if (e.button !== 0) return;
        const rect = panel.getBoundingClientRect();
        drag = {
            pointerId: e.pointerId,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            width: rect.width,
            height: rect.height
        };
        panel.style.position = 'fixed';
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.right = 'auto';
        panel.style.margin = '0';
        handle.setPointerCapture(e.pointerId);
        handle.classList.add('is-dragging');
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!drag || e.pointerId !== drag.pointerId) return;
        const maxLeft = Math.max(8, window.innerWidth - drag.width - 8);
        const maxTop = Math.max(8, window.innerHeight - drag.height - 8);
        panel.style.left = `${clamp(e.clientX - drag.offsetX, 8, maxLeft)}px`;
        panel.style.top = `${clamp(e.clientY - drag.offsetY, 8, maxTop)}px`;
    };

    const endDrag = (e) => {
        if (!drag || e.pointerId !== drag.pointerId) return;
        drag = null;
        handle.classList.remove('is-dragging');
        try {
            handle.releasePointerCapture(e.pointerId);
        } catch (_) { /* ignore */ }
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
}

function initTestPanel() {
    const panel = document.getElementById('test-panel');
    if (!panel) return;

    initTestPanelDrag();

    panel.querySelectorAll('[data-test-type]').forEach(btn => {
        btn.addEventListener('click', () => testModal(btn.getAttribute('data-test-type')));
    });

    const closeBtn = document.getElementById('test-panel-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            setTeacherModeActive(false);
        });
    }

}

function restartGame() {
    hideWinModal();
    document.body.classList.remove('game-active');
    location.reload();
}

window.testModal = testModal;

async function boot() {
    const loaded = await loadQuestionsFromJson();
    if (!loaded) {
        console.warn('題庫未載入，語文挑戰格將暫時無法出題。');
    }
    initQuestionPool();
    try {
        init();
    } catch (err) {
        console.error('init failed:', err);
    }
    initMusicCtrl();
    initTestPanel();
    initSecretFlower();
    initTeacherBoardPlacement();
    preloadFreesoundEffects();
}

window.onload = boot;
