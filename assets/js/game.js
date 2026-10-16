
    function goToDashboard() {
    window.location.href = 'dashboard.html'; 
}

// Tambahkan fungsi baru ini
function goToDashboard2() {
    window.location.href = 'dashboard2.html'; 
}

    const mainMenu = document.getElementById('mainMenu');
    const settingsMenu = document.getElementById('settingsMenu');
    const pauseMenu = document.getElementById('pauseMenu');
    const scoreboardMenu = document.getElementById('scoreboardMenu');
    const gameOverMenu = document.getElementById('gameOverMenu');
    const pauseBtn = document.getElementById('pauseBtn');
    const hiddenInput = document.getElementById('hiddenInput');
    const SHIP_ROSTER = [
        {id:"aurora",name:"AURORA",roleId:"PESAWAT SERBAGUNA",roleEn:"BALANCED FIGHTER",descId:"Fighter serbaguna dengan pelindung putih, detail cyan, dan mesin bercahaya.",descEn:"A versatile fighter with white armor, cyan detailing, and luminous engines.",accent:"#58d9ff"},
        {id:"valkyrie",name:"VALKYRIE",roleId:"PENYERANG CEPAT",roleEn:"SPEED FIGHTER",descId:"Desain tajam merah-perak dengan sayap menyapu dan siluet agresif.",descEn:"A sharp red-and-silver craft with swept wings and an aggressive silhouette.",accent:"#fb5267"},

        {id:"shadow",name:"SHADOW",roleId:"PESAWAT SILUMAN",roleEn:"STEALTH FIGHTER",descId:"Siluet gelap, bilah sayap ramping, dan inti energi ungu.",descEn:"A dark, razor-thin silhouette with violet energy accents.",accent:"#bd6cff"},
        {id:"orion",name:"ORION",roleId:"KAPAL BERAT",roleEn:"HEAVY FIGHTER",descId:"Bodi lebar dan berlapis dengan tampilan kapal tempur berat.",descEn:"A broad, layered hull with the presence of a heavy fighter.",accent:"#fbbf55"},
        {id:"phoenix",name:"PHOENIX",roleId:"FIGHTER PREMIUM",roleEn:"PREMIUM FIGHTER",descId:"Pelindung putih-emas dengan garis elegan dan mesin emas terang.",descEn:"Elegant white-and-gold armor with bright golden engine cores.",accent:"#ffd36a"},

        {id:"nebula",name:"NEBULA",roleId:"FIGHTER ENERGI",roleEn:"ENERGY FIGHTER",descId:"Kapal futuristik dengan pod energi ganda dan cahaya biru elektrik.",descEn:"A futuristic craft with twin energy pods and electric-blue glow.",accent:"#39e6ff"}
    ];
    let selectedShipId = localStorage.getItem("typeShooterShip") || "aurora";
    if (!SHIP_ROSTER.some(ship=>ship.id===selectedShipId)) selectedShipId="aurora";
    const shipImageCache=Object.create(null);
    SHIP_ROSTER.forEach(ship=>{
        const image=new Image(); image.decoding="async";
        image.src="assets/ships/"+ship.id+".png";
        shipImageCache[ship.id]=image;
    });


    const shipSelectMenu = document.getElementById('shipSelectMenu');
    const shipGrid = document.getElementById('shipGrid');

    const canvas = document.getElementById('gameCanvas');
    const gameBackgroundImage = new Image();
    gameBackgroundImage.decoding = "async";
    gameBackgroundImage.src = "assets/backgrounds/space-nebula.png";
    // Cache the expensive filtered backdrop so every frame only blits one bitmap.
    let spaceBackgroundCache = null;
    let spaceBackgroundCacheKey = "";
    
    let langSetting = localStorage.getItem('langSetting') || 'id';
    let bgmVolume = parseFloat(localStorage.getItem('bgmVolume') ?? 0.5);
    let sfxVolume = parseFloat(localStorage.getItem('sfxVolume') ?? 0.5);

    const DIFFICULTY_PROFILES = {
        easy: { minEnemies: 4, maxEnemies: 5, spawnIntervalScale: 1.16, scoreMultiplier: 0.60, waveSpeedMultipliers: [0.7, 0.8, 0.9, 1.0] },
        medium: { minEnemies: 6, maxEnemies: 7, spawnIntervalScale: 1.00, scoreMultiplier: 1.00, waveSpeedMultipliers: [1.0, 1.2, 1.4, 1.5] },
        hard: { minEnemies: 8, maxEnemies: 10, spawnIntervalScale: 1.00, scoreMultiplier: 1.50, waveSpeedMultipliers: [1.5, 1.7, 1.9, 2.1] }
    };
    let selectedDifficulty = localStorage.getItem("typeShooterDifficulty") || "medium";
    if (!Object.prototype.hasOwnProperty.call(DIFFICULTY_PROFILES, selectedDifficulty)) selectedDifficulty = "medium";

    function getWaveSpeedMultiplier(waveNum) {
        const profile = DIFFICULTY_PROFILES[selectedDifficulty] || DIFFICULTY_PROFILES.medium;
        const speedBand = waveNum <= 3 ? 0 : waveNum <= 6 ? 1 : waveNum <= 9 ? 2 : 3;
        return profile.waveSpeedMultipliers[speedBand];
    }

    function getScoreMultiplier() {
        const profile = DIFFICULTY_PROFILES[selectedDifficulty] || DIFFICULTY_PROFILES.medium;
        return profile.scoreMultiplier;
    }

    function awardScore(rawPoints) {
        const safePoints = Math.max(0, Number(rawPoints) || 0);
        const finalAward = Math.round(safePoints * getScoreMultiplier());
        score += finalAward;
        return finalAward;
    }

    function setDifficulty(mode) {
        if (!Object.prototype.hasOwnProperty.call(DIFFICULTY_PROFILES, mode)) return;
        selectedDifficulty = mode;
        try { localStorage.setItem("typeShooterDifficulty", mode); } catch (error) {}
        updateDifficultySelectorUI();
    }

    function updateDifficultySelectorUI() {
        const t = translations[langSetting] || translations.id;
        const labels = {
            easy: {name:t.difficultyEasy, meta:t.difficultyEasyMeta},
            medium: {name:t.difficultyMedium, meta:t.difficultyMediumMeta},
            hard: {name:t.difficultyHard, meta:t.difficultyHardMeta}
        };
        const label = document.getElementById("difficultyLabel");
        const note = document.getElementById("difficultyBandNote");
        if (label) label.textContent = t.difficultyTitle;
        if (note) note.textContent = t.difficultyBandNote;
        document.querySelectorAll(".difficulty-option").forEach(button => {
            const copy = labels[button.dataset.difficulty];
            if (!copy) return;
            const name = button.querySelector("strong");
            const meta = button.querySelector("small");
            if (name) name.textContent = copy.name;
            if (meta) meta.textContent = copy.meta;
            const isSelected = button.dataset.difficulty === selectedDifficulty;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
        });
    }

    // Kumpulan Data Bahasa (Localization)
    const translations = {
        id: {
            title: "DJ-SHOOTING", subtitle: "FAR AND BEYOND", madeWithLove: "Dibuat Dengan Cinta",
            playGame: "PLAY GAME", settings: "SETTINGS", scoreboard: "SCOREBOARD",
            mobileHint: "Sentuh layar saat bermain untuk memunculkan keyboard virtual.",
            volumeBgm: "Volume Musik (BGM)", volumeSfx: "Volume Efek (SFX)", language: "Bahasa",
            back: "KEMBALI", paused: "GAME PAUSED", resume: "RESUME", mainMenu: "MENU UTAMA",
            topScores: "TOP 5 HIGH SCORES", noScores: "Belum ada rekor skor.",
            rank: "Rank", score: "Skor", wave: "Wave", date: "Tanggal",
            gameOver: "GAME OVER", tryAgain: "TRY AGAIN", reachedWave: "Mencapai: Wave ",
            gameOverStats: "STATISTIK MISI", statAccuracy: "AKURASI", statDestroyed: "MUSUH DIHANCURKAN", statBestCombo: "COMBO TERBAIK", statDuration: "DURASI AKTIF",
            incomingWave: "WAVE DATANG ", miss: "LUPUT!", bad: "SALAH!",
            shipSelectTitle: "PILIH PESAWAT", shipSelectSubtitle: "Pilih kapal tempur sebelum memulai misi.",
            shipSelected: "KAPAL TERPILIH", shipCosmeticNote: "Pilihan visual saja — aturan dan kemampuan game tetap sama.",
            shipBack: "KEMBALI", shipStart: "MULAI GAME",
            difficultyTitle: "TINGKAT KESULITAN",
            difficultyEasy: "MUDAH", difficultyMedium: "SEDANG", difficultyHard: "SULIT",
            difficultyEasyMeta: "4–5 MUSUH · SKOR ×0,6", difficultyMediumMeta: "6–7 MUSUH · SKOR ×1,0", difficultyHardMeta: "8–10 MUSUH · SKOR ×1,5",
            difficultyBandNote: "KECEPATAN: WAVE 1–3 · 4–6 · 7–9 · MAKS. 10",
            scoreMode: "MODE", scoreModeLegacy: "LAMA", pauseButton: "Jeda permainan"
        },
        en: {
            title: "DJ-SHOOTING", subtitle: "FAR AND BEYOND", madeWithLove: "Made With Love",
            playGame: "PLAY GAME", settings: "SETTINGS", scoreboard: "SCOREBOARD",
            mobileHint: "Tap the screen while playing to show the virtual keyboard.",
            volumeBgm: "Music Volume (BGM)", volumeSfx: "Effects Volume (SFX)", language: "Language",
            back: "BACK", paused: "GAME PAUSED", resume: "RESUME", mainMenu: "MAIN MENU",
            topScores: "TOP 5 HIGH SCORES", noScores: "No high scores recorded yet.",
            rank: "Rank", score: "Score", wave: "Wave", date: "Date",
            gameOver: "GAME OVER", tryAgain: "TRY AGAIN", reachedWave: "Reached: Wave ",
            gameOverStats: "RUN STATISTICS", statAccuracy: "ACCURACY", statDestroyed: "ENEMIES DESTROYED", statBestCombo: "BEST COMBO", statDuration: "ACTIVE TIME",
            incomingWave: "INCOMING WAVE ", miss: "MISS!", bad: "BAD!",
            shipSelectTitle: "SELECT YOUR SHIP", shipSelectSubtitle: "Choose your fighter before starting the mission.",
            shipSelected: "SELECTED SHIP", shipCosmeticNote: "Visual choice only — game rules and abilities remain unchanged.",
            shipBack: "BACK", shipStart: "START GAME",
            difficultyTitle: "DIFFICULTY",
            difficultyEasy: "EASY", difficultyMedium: "MEDIUM", difficultyHard: "HARD",
            difficultyEasyMeta: "4–5 ENEMIES · SCORE ×0.6", difficultyMediumMeta: "6–7 ENEMIES · SCORE ×1.0", difficultyHardMeta: "8–10 ENEMIES · SCORE ×1.5",
            difficultyBandNote: "SPEED: WAVES 1–3 · 4–6 · 7–9 · MAX 10",
            scoreMode: "MODE", scoreModeLegacy: "LEGACY", pauseButton: "Pause game"
        }
    };
    function updateShipSelectionUI(){
        if(!shipGrid)return;
        const t=translations[langSetting];shipGrid.innerHTML="";
        updateDifficultySelectorUI();
        SHIP_ROSTER.forEach((ship,index)=>{
            const card=document.createElement("button");card.type="button";
            card.className="ship-card"+(ship.id===selectedShipId?" is-selected":"");
            card.style.setProperty("--ship-accent",ship.accent);
            card.setAttribute("aria-pressed",ship.id===selectedShipId?"true":"false");
            card.setAttribute("aria-label",ship.name+" — "+(langSetting==="id"?ship.roleId:ship.roleEn));
            const top=document.createElement("span");top.className="ship-card-topline";
            top.innerHTML='<span class="ship-card-number">'+String(index+1).padStart(2,"0")+' / 06</span><span class="ship-card-check" aria-hidden="true">✓</span>';
            const art=document.createElement("span");art.className="ship-card-art";
            const img=document.createElement("img");img.src="assets/ships/"+ship.id+".png";img.alt="";img.loading="eager";img.decoding="async";art.appendChild(img);
            const name=document.createElement("span");name.className="ship-card-name";name.textContent=ship.name;
            const role=document.createElement("span");role.className="ship-card-role";role.textContent=langSetting==="id"?ship.roleId:ship.roleEn;
            card.append(top,art,name,role);card.addEventListener("click",()=>selectShip(ship.id));shipGrid.appendChild(card);
        });
        const selected=SHIP_ROSTER.find(ship=>ship.id===selectedShipId)||SHIP_ROSTER[0];
        const preview=document.getElementById("shipPreviewImage");preview.src="assets/ships/"+selected.id+".png";preview.alt=selected.name+" ship preview";
        preview.parentElement.style.setProperty("--ship-accent",selected.accent);
        document.getElementById("shipDetailName").textContent=selected.name;
        document.getElementById("shipDetailDescription").textContent=langSetting==="id"?selected.descId:selected.descEn;
        document.getElementById("ship-select-title").textContent=t.shipSelectTitle;
        document.getElementById("ship-select-subtitle").textContent=t.shipSelectSubtitle;
        document.getElementById("ship-detail-kicker").textContent=t.shipSelected;
        document.getElementById("ship-cosmetic-note").textContent=t.shipCosmeticNote;
        document.getElementById("btn-ship-back").textContent=t.shipBack;
        document.getElementById("btn-ship-start").textContent=t.shipStart;
    }
    function openShipSelection(){
        mainMenu.classList.add("hidden");gameOverMenu.classList.add("hidden");settingsMenu.classList.add("hidden");
        shipSelectMenu.classList.remove("hidden");updateShipSelectionUI();
    }
    function closeShipSelection(){shipSelectMenu.classList.add("hidden");mainMenu.classList.remove("hidden");}
    function selectShip(shipId){
        if(!SHIP_ROSTER.some(ship=>ship.id===shipId))return;
        selectedShipId=shipId;
        try{localStorage.setItem("typeShooterShip",selectedShipId);}catch(error){}
        updateShipSelectionUI();
    }
    function confirmShipSelection(){
        if(!SHIP_ROSTER.some(ship=>ship.id===selectedShipId))selectedShipId="aurora";
        try{localStorage.setItem("typeShooterShip",selectedShipId);}catch(error){}
        shipSelectMenu.classList.add("hidden");startGame();
    }

    function applyTranslations() {
        const t = translations[langSetting];
        
        // Main Menu
        document.getElementById('ui-title').innerText = t.title;
        document.getElementById('ui-subtitle').innerText = t.subtitle;
        document.getElementById('ui-credits').innerText = t.madeWithLove;
        document.getElementById('btn-play').innerText = t.playGame;
        document.getElementById('btn-settings').innerText = t.settings;
        document.getElementById('btn-scoreboard').innerText = t.scoreboard;
        document.getElementById('ui-mobile-hint').innerText = t.mobileHint;
        updateDifficultySelectorUI();
        if (pauseBtn) {
            pauseBtn.setAttribute("aria-label", t.pauseButton);
            pauseBtn.setAttribute("title", t.pauseButton);
        }
        
        // Settings Menu
        document.getElementById('ui-settings-title').innerText = t.settings;
        document.getElementById('lbl-bgm').innerText = t.volumeBgm;
        document.getElementById('lbl-sfx').innerText = t.volumeSfx;
        document.getElementById('lbl-lang').innerText = t.language;
        document.getElementById('btn-settings-back').innerText = t.back;
        
        // Pause Menu
        document.getElementById('ui-pause-title').innerText = t.paused;
        document.getElementById('lbl-pause-bgm').innerText = t.volumeBgm;
        document.getElementById('lbl-pause-sfx').innerText = t.volumeSfx;
        document.getElementById('lbl-pause-lang').innerText = t.language;
        document.getElementById('btn-resume').innerText = t.resume;
        document.getElementById('btn-pause-menu').innerText = t.mainMenu;
        
        // Scoreboard & Game Over
        document.getElementById('ui-score-title').innerText = t.topScores;
        document.getElementById('btn-score-back').innerText = t.back;
        document.getElementById('ui-gameover-title').innerText = t.gameOver;
        document.getElementById('btn-retry').innerText = t.tryAgain;
        document.getElementById('btn-go-scoreboard').innerText = t.scoreboard;
        document.getElementById('btn-go-menu').innerText = t.mainMenu;
        document.getElementById('ship-select-title').innerText = t.shipSelectTitle;
        document.getElementById('ship-select-subtitle').innerText = t.shipSelectSubtitle;
        document.getElementById('ship-detail-kicker').innerText = t.shipSelected;
        document.getElementById('ship-cosmetic-note').innerText = t.shipCosmeticNote;
        document.getElementById('btn-ship-back').innerText = t.shipBack;
        document.getElementById('btn-ship-start').innerText = t.shipStart;
        updateShipSelectionUI();
    }

    document.getElementById('langSelect').value = langSetting;
    document.getElementById('pauseLangSelect').value = langSetting;
    
    document.getElementById('bgmSlider').value = bgmVolume;
    document.getElementById('sfxSlider').value = sfxVolume;
    document.getElementById('pauseBgmSlider').value = bgmVolume;
    document.getElementById('pauseSfxSlider').value = sfxVolume;
    
    applyTranslations();

    let audioCtx = null;
    let bgmGainNode = null;
    let sfxGainNode = null;
    let bgmInterval = null;
    let bgmIndex = 0;
    const musicalScale = [110, 130, 146, 165, 196, 220, 261, 293, 330];

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            bgmGainNode = audioCtx.createGain();
            sfxGainNode = audioCtx.createGain();
            
            bgmGainNode.connect(audioCtx.destination);
            sfxGainNode.connect(audioCtx.destination);
            
            bgmGainNode.gain.value = bgmVolume;
            sfxGainNode.gain.value = sfxVolume;
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function updateVolume() {
        if (!settingsMenu.classList.contains('hidden')) {
            bgmVolume = parseFloat(document.getElementById('bgmSlider').value);
            sfxVolume = parseFloat(document.getElementById('sfxSlider').value);
        } else {
            bgmVolume = parseFloat(document.getElementById('pauseBgmSlider').value);
            sfxVolume = parseFloat(document.getElementById('pauseSfxSlider').value);
        }

        document.getElementById('bgmSlider').value = bgmVolume;
        document.getElementById('sfxSlider').value = sfxVolume;
        document.getElementById('pauseBgmSlider').value = bgmVolume;
        document.getElementById('pauseSfxSlider').value = sfxVolume;

        localStorage.setItem('bgmVolume', bgmVolume);
        localStorage.setItem('sfxVolume', sfxVolume);

        if (bgmGainNode) bgmGainNode.gain.value = bgmVolume;
        if (sfxGainNode) sfxGainNode.gain.value = sfxVolume;
    }

    function startBGM() {
        if (bgmInterval) return;
        initAudio();
        bgmIndex = 0;

        function tickBGM() {
            if (!gameActive) {
                bgmInterval = setTimeout(tickBGM, 220);
                return;
            }

            let randomIdx = Math.floor(Math.random() * musicalScale.length);
            let targetFrequency = musicalScale[randomIdx];
            let wavePitchShift = (currentWave - 1) * 12; 
            
            playBGMNote(targetFrequency + wavePitchShift);
            bgmIndex++;

            let currentTempo = Math.max(110, 230 - (currentWave * 10));
            bgmInterval = setTimeout(tickBGM, currentTempo);
        }

        bgmInterval = setTimeout(tickBGM, 220);
    }

    function stopBGM() {
        if (bgmInterval) {
            clearTimeout(bgmInterval);
            bgmInterval = null;
        }
    }

    function playBGMNote(freq) {
        if (!audioCtx || bgmVolume <= 0) return;
        try {
            let osc = audioCtx.createOscillator();
            let noteGain = audioCtx.createGain();
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            noteGain.gain.setValueAtTime(0.4, audioCtx.currentTime); 
            noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.connect(noteGain); 
            noteGain.connect(bgmGainNode);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        } catch(e) {}
    }

    function playLaserSound() {
        if (!audioCtx || sfxVolume <= 0) return;
        try {
            let osc = audioCtx.createOscillator();
            let noteGain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
            noteGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            noteGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.connect(noteGain); 
            noteGain.connect(sfxGainNode);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } catch(e){}
    }

    function playExplosionSound(isTank = false) {
        if (!audioCtx || sfxVolume <= 0) return;
        try {
            let osc = audioCtx.createOscillator();
            let noteGain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(isTank ? 120 : 180, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.25);
            noteGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.connect(noteGain); 
            noteGain.connect(sfxGainNode);
            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        } catch(e){}
    }

    function playErrorSound() {
        if (!audioCtx || sfxVolume <= 0) return;
        try {
            let osc = audioCtx.createOscillator();
            let noteGain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, audioCtx.currentTime);
            noteGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            noteGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
            osc.connect(noteGain); 
            noteGain.connect(sfxGainNode);
            osc.start(); osc.stop(audioCtx.currentTime + 0.12);
        } catch(e){}
    }

    function saveOptions() {
        langSetting = document.getElementById('langSelect').value;
        localStorage.setItem('langSetting', langSetting);
        document.getElementById('pauseLangSelect').value = langSetting;
        applyTranslations();
    }

    function syncOptions(source) {
        if(source === 'pause') {
            langSetting = document.getElementById('pauseLangSelect').value;
        }
        localStorage.setItem('langSetting', langSetting);
        document.getElementById('langSelect').value = langSetting;
        applyTranslations();
    }

    function openSettings() {
        mainMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        settingsMenu.classList.remove('hidden');
    }
    
    function closeSettings() {
        settingsMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    }

    function openMenuUtama() {
        gameOverMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    }

    function pauseGame() {
        if(!gameActive)return;
        runPausedAt = Date.now();
        gameActive=false;pauseBtn.classList.add('hidden');pauseMenu.classList.remove('hidden');hiddenInput.blur();
        resizeGameCanvas();stopBGM();
    }

    function resumeGame() {
        if (runPausedAt > 0) {
            accumulatedPauseMs += Date.now() - runPausedAt;
            runPausedAt = 0;
        }
        pauseMenu.classList.add('hidden');pauseBtn.classList.remove('hidden');gameActive=true;resizeGameCanvas();
        if(!isMobilePortraitGame())hiddenInput.focus();else hiddenInput.blur();
        startBGM();cancelAnimationFrame(loopId);gameLoop();
    }

    function exitToMenu() {
        pauseMenu.classList.add('hidden');
        pauseBtn.classList.add('hidden');
        gameActive = false;
        resizeGameCanvas();
        mainMenu.classList.remove('hidden');
        stopBGM();
        enemies = []; lasers = []; particles = []; floatingTexts = []; activeEnemy = null;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    let gameWidth = window.innerWidth;
    let gameHeight = window.innerHeight;
    let canvasScale = 1;
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
    const gameKeyboard = document.getElementById("gameKeyboard");
    const floatingBombButton = document.getElementById("floatingBombBtn");
    let nativeNumberEntryActive = false;
    let numberEntryBaselineViewportHeight = 0;
    let numberEntryViewportShrunk = false;
    const gameKeyboardStatus = document.getElementById("gameKeyboardStatus");
    function isMobilePortraitGame(){
        return !!(window.matchMedia && window.matchMedia("(max-width: 720px) and (orientation: portrait)").matches);
    }
    function resizeGameCanvas(){
        gameWidth=Math.max(240,window.innerWidth);
        // Safari iOS shrinks visualViewport for its native keyboard, then may restore it late.
        // Use the layout viewport for canvas geometry so the playfield cannot remain compressed.
        const layoutHeight=Math.round(window.innerHeight||document.documentElement.clientHeight||0);
        const keyboardActive=gameActive&&isMobilePortraitGame()&&(!nativeNumberEntryActive||!numberEntryViewportShrunk);
        if(gameKeyboard)gameKeyboard.classList.toggle("hidden",!keyboardActive);
        if(floatingBombButton)floatingBombButton.classList.toggle("hidden",!keyboardActive);
        // Measure the keyboard after visibility changes. Its top edge is the actual
        // lower boundary of the playfield, independent of Safari/PWA viewport quirks.
        const keyboardRect=keyboardActive&&gameKeyboard?gameKeyboard.getBoundingClientRect():null;
        if(floatingBombButton&&keyboardRect){
            const controlHeight=floatingBombButton.offsetHeight||36;
            floatingBombButton.style.top=Math.max(8,keyboardRect.top-controlHeight-8)+"px";
        }
        const canvasRect=canvas.getBoundingClientRect();
        if(keyboardRect){
            gameHeight=Math.max(220,Math.round(keyboardRect.top-canvasRect.top));
        }else{
            const viewportHeight=Math.round((window.visualViewport&&window.visualViewport.height)||layoutHeight);
            const viewportTop=Math.round((window.visualViewport&&window.visualViewport.offsetTop)||0);
            gameHeight=Math.max(220,Math.round(viewportHeight+viewportTop-canvasRect.top));
        }
        // Mobile DPR 3 can multiply per-frame canvas work by 9. 2x remains
        // crisp on phones while giving the main thread more time for touch input.
        const touchOrMobileViewport = isMobilePortraitGame() || (navigator.maxTouchPoints||0)>0;
        canvasScale=Math.min(window.devicePixelRatio||1,touchOrMobileViewport?2:3);
        canvas.width=Math.round(gameWidth*canvasScale);
        canvas.height=Math.round(gameHeight*canvasScale);
        canvas.style.width=gameWidth+"px";canvas.style.height=gameHeight+"px";
        ctx.setTransform(canvasScale,0,0,canvasScale,0,0);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
        updatePlayerPosition();initStars();
    }

    const wordsList = {
    id: [
        "AMAS", "DESA", "KOTA", "GAIA", "MAIN", "SAYA", "ANAK", "MAMA", "PAPA", "BUKU", "MALL", "IPAD",
        "RUMAH", "SAPI", "BABI", "PULSA", "ROKET", "ASTRO", "CYBER", "LASER", "PIXEL", "SPACE", "CLOUD",
        "SIANTAN", "SEKOLAH", "SUKSES", "LANDAK", "DESKAP", "AYANI", "KWECAP", "BUBUR", "CHOIPAN", "KOSMOS", 
        "NEBULA", "METEOR", "GALAXY", "ORBITAL", "PLASMA", "MATRIX", "SATELIT", "KAPSUL", "GRAVITY", "ANDROID", 
        "STELLAR", "QUANTUM", "SHUTTLE", "HORIZON", "ECLIPSE", "DATABASE", "INTERNET", "PROTOCOL", "FIREWALL", 
        "TERMINAL", "CEHUNTIAU", "ASTEROID", "TELEPORT", "STARSHIP", "AKU", "DIA", "AIR", "API", "BISA", 
        "MAJU", "BARU", "LAMA", "HARI", "SORE", "PAGI", "MEJA", "KACA", "JALAN", "MAKAN", "MINUM", "TIDUR", 
        "DUDUK", "BACA", "TULIS", "MOBIL", "MOTOR", "CEPAT", "KUNING", "MERAH", "HITAM", "PUTIH", "HIJAU", 
        "TERBANG", "LARI", "JAUH", "DEKAT", "TINGGI", "RENDAH", "BESAR", "KECIL", "POHON", "BUNGA", "HEWAN", 
        "KUCING", "ANJING", "BURUNG", "IKAN", "AYAM", "BEBEK", "KUDA", "BELAJAR", "BEKERJA", "BERMAIN", 
        "KANTOR", "PASAR", "TOKO", "SEPATU", "BAJU", "CELANA", "TOPI", "PINTU", "LAMPU", "GELAP", "TERANG", 
        "HUJAN", "PANAS", "DINGIN", "ANGIN", "AWAN", "BINTANG", "BULAN", "SURYA", "BUMI", "LAUT", "GUNUNG", 
        "HUTAN", "SUNGAI", "DANAU", "PANTAI", "PASIR", "BATU", "KAYU", "BESI", "EMAS", "PERAK", "TOLONG", 
        "MAAF", "SILAKAN", "PERMISI", "KEMBALI", "PULANG", "KOSONG"
    ],
    en: [
        "TOWN", "CITY", "GAIA", "PLAY", "MINE", "CHILD", "MAMA", "PAPA", "BOOK", "MALL", "IPAD",
        "HOME", "COW", "PIG", "PULSE", "ROCKET", "ASTRO", "CYBER", "LASER", "PIXEL", "SPACE", "CLOUD",
        "SCHOOL", "SUCCESS", "PORCUPINE", "DESKTOP", "PORRIDGE", "COSMOS", 
        "NEBULA", "METEOR", "GALAXY", "ORBITAL", "PLASMA", "MATRIX", "SATELLITE", "CAPSULE", "GRAVITY", "ANDROID", 
        "STELLAR", "QUANTUM", "SHUTTLE", "HORIZON", "ECLIPSE", "DATABASE", "INTERNET", "PROTOCOL", "FIREWALL", 
        "TERMINAL", "ASTEROID", "TELEPORT", "STARSHIP", "YOU", "THEY", "WATER", "FIRE", "CAN", 
        "NEW", "OLD", "DAY", "EVENING", "MORNING", "TABLE", "GLASS", "ROAD", "EAT", "DRINK", "SLEEP", 
        "SIT", "READ", "WRITE", "CAR", "BIKE", "FAST", "YELLOW", "RED", "BLACK", "WHITE", "GREEN", 
        "FLY", "RUN", "FAR", "NEAR", "HIGH", "LOW", "BIG", "SMALL", "TREE", "FLOWER", "ANIMAL", 
        "CAT", "DOG", "BIRD", "FISH", "CHICKEN", "DUCK", "HORSE", "LEARN", "WORK", "PLAYING", 
        "OFFICE", "MARKET", "SHOP", "SHOES", "SHIRT", "PANTS", "HAT", "DOOR", "LAMP", "DARK", "BRIGHT", 
        "RAIN", "HOT", "COLD", "WIND", "CLOUD", "STAR", "MOON", "SUN", "EARTH", "SEA", "MOUNTAIN", 
        "FOREST", "RIVER", "LAKE", "BEACH", "SAND", "ROCK", "WOOD", "IRON", "GOLD", "SILVER", "HELP", 
        "SORRY", "PLEASE", "EXCUSE", "RETURN", "BACK", "EMPTY"
    ]
};
    let enemies = [];
    let lasers = [];
    let particles = [];
    let stars = [];
    let floatingTexts = [];
    let score = 0;
    let gameActive = false;
    let gameOverTriggered = false;
    let activeEnemy = null;
    let frameCount = 0;
    let loopId = null;

    const maxHP = 3;
    let playerHP = maxHP;
    let flashRedFrames = 0;

    let comboCount = 0;
    let maxCombo = 0;
    let comboPulse = 0; 
    let runStats = { correctCharacters: 0, incorrectCharacters: 0, enemiesDestroyed: 0, bestCombo: 0 };
    let runStartedAt = 0;
    let runPausedAt = 0;
    let accumulatedPauseMs = 0;
    let lastRunDurationMs = 0;
    let muzzleFlashAlpha = 0; 

    let currentWave = 1;
    let enemiesLeftToSpawn = 0;
    let waveSpawnTimer = 0;
    let waveClearMessageTimer = 0;
    const skillInventory={bomb:0,shield:0,clear:0};
    const maxStoredSkills=3;
    let shieldActive=false;

    let shakeTimer = 0;
    let shakeIntensity = 0;

    function triggerScreenShake(intensity, duration) {
        shakeIntensity = intensity;
        shakeTimer = duration;
    }

    const player = { x: gameWidth / 2, y: gameHeight - 100, size: 12.5 };
    let kodeAngka = ""; 
const PIN_RAHASIA = "0189"; 
const PIN_RAHASIA_2 = "0199"; 

    function updatePlayerPosition() {
        player.x = gameWidth / 2;
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isPortrait = gameHeight > gameWidth;

        if (isTouchDevice && isPortrait) {
            player.y = gameHeight - Math.max(76, Math.min(112, gameHeight * 0.14));
        } else if (isTouchDevice && !isPortrait) {
            player.y = gameHeight - 100;
        } else {
            player.y = gameHeight - 50;
        }
    }

    function initStars() {
        stars = [];
        const starColors = ["#ffffff", "#e2e8f0", "#bfdbfe", "#fed7aa"]; 
        for (let i = 0; i < 90; i++) {
            let layer = Math.random();
            let size, speed, alpha;
            if (layer < 0.5) { size = 0.8; speed = 0.2; alpha = 0.3; } 
            else if (layer < 0.8) { size = 1.5; speed = 0.7; alpha = 0.6; } 
            else { size = 2.5; speed = 1.8; alpha = 1.0; } 
            
            stars.push({ 
                x: Math.random() * gameWidth, 
                y: Math.random() * gameHeight, 
                size: size, 
                baseSpeed: speed, 
                alpha: alpha,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }
    }

    class FloatingText {
        constructor(x, y, text, color, isBig = false) {
            this.x = x; this.y = y; this.text = text; this.color = color;
            this.alpha = 1; this.speedY = -1.5;
            this.fontSize = isBig ? "bold 18px 'Courier New'" : "bold 14px 'Courier New'";
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.font = this.fontSize;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
        update() {
            this.y += this.speedY;
            this.alpha -= 0.02;
        }
    }

    class Enemy {
        constructor(waveNum, forcedType = null) {
            ctx.font = "bold 16px 'Courier New'";
            this.shakeFrames = 0; 
            
            if(forcedType) {
                this.type = forcedType;
            } else {
                let rand = Math.random();
                if (waveNum >= 3 && rand < 0.08) this.type = "emp"; 
                else if (waveNum >= 4 && rand >= 0.08 && rand < 0.20) this.type = "tank";
                else if (waveNum >= 2 && rand >= 0.20 && rand < 0.35) this.type = "splitter";
                else this.type = "normal";
            }

            let minLen, maxLen;
            if (this.type === 'tank') { minLen = 6; maxLen = 8; }
            else if (this.type === 'mini') { minLen = 2; maxLen = 4; }
            else { minLen = 2; maxLen = 5; }

            // AMBIL KOSAKATA BERDASARKAN BAHASA SAAT INI
            let activeDictionary = wordsList[langSetting] || wordsList.id; 

            // FILTER KATA DARI KAMUS YANG AKTIF
            let possibleWords = activeDictionary.filter(w => w.length >= minLen && w.length <= maxLen);
            if (possibleWords.length === 0) possibleWords = activeDictionary;

            let currentFirstLetters = enemies.map(e => e.word[0]);
            let filteredList = possibleWords.filter(w => !currentFirstLetters.includes(w[0]));
            if (filteredList.length === 0) filteredList = possibleWords;

            this.word = filteredList[Math.floor(Math.random() * filteredList.length)];
            this.typed = "";
            this.wordWidth = ctx.measureText(this.word).width;
            
            let maxSpawnX = gameWidth - this.wordWidth - 40;
            this.x = Math.random() * (maxSpawnX - 30) + 30;
            if (this.x < 30) this.x = 30;
            
            this.y = -60;
            
            // Difficulty-specific speed grows in four gentle bands and caps at wave 10.
            const waveSpeedMultiplier = getWaveSpeedMultiplier(waveNum);
            const baseSpeed = 0.4 + (Math.random() * 0.3);

            if (this.type === 'tank') {
                this.speed = (baseSpeed * 0.5) * waveSpeedMultiplier; 
                this.colorGlow = "#ef4444";
                this.colorText = "#ff7b88";
            } else if (this.type === 'splitter') {
                this.speed = (baseSpeed * 0.75) * waveSpeedMultiplier; 
                this.colorGlow = "#c084fc";
                this.colorText = "#e2b5ff";
            } else if (this.type === 'emp') {
                this.speed = (baseSpeed * 1.2) * waveSpeedMultiplier; 
                this.colorGlow = "#06b6d4";
                this.colorText = "#76efff";
            } else if (this.type === 'mini') {
                this.speed = (baseSpeed * 1.1) * waveSpeedMultiplier; 
                this.colorGlow = "#eab308";
                this.colorText = "#ffe36d";
            } else {
                this.speed = (baseSpeed * 1.0) * waveSpeedMultiplier;
                this.colorGlow = "#c8f4ff";
                this.colorText = "#f5fcff";
            }
        }

        draw() {
            ctx.save();
            let renderX = this.x;
            let renderY = this.y;

            if (this.shakeFrames > 0) {
                renderX += (Math.random() - 0.5) * 5;
                renderY += (Math.random() - 0.5) * 5;
                this.shakeFrames--;
            }

            ctx.font = this.type === 'tank' ? "bold 18px 'Courier New'" : "bold 16px 'Courier New'"; 
            let typedWidth = ctx.measureText(this.typed).width;

            if (activeEnemy === this) {
                const targetBoxHeight=this.type === 'tank' ? 24 : 22;
                ctx.fillStyle="rgba(255,48,72,.085)";
                ctx.fillRect(renderX-8,renderY-18,this.wordWidth+16,targetBoxHeight);
                ctx.strokeStyle="rgba(255,58,79,.98)";
                ctx.lineWidth=1.8;
                ctx.shadowColor="#ff263f";
                ctx.shadowBlur=15;
                ctx.strokeRect(renderX-8,renderY-18,this.wordWidth+16,targetBoxHeight);
                ctx.shadowBlur=0;
            }

            // A dark text keyline keeps both typed and remaining letters readable over nebula highlights.
            ctx.lineJoin = "round";
            ctx.lineWidth = 3.2;
            ctx.strokeStyle = "rgba(1,8,20,.96)";
            ctx.shadowBlur = 0;
            ctx.strokeText(this.typed, renderX, renderY);
            ctx.fillStyle = "#78e8ff";
            ctx.fillText(this.typed, renderX, renderY);

            const remainingWord = this.word.substring(this.typed.length);
            const isShaking = this.shakeFrames > 2;
            ctx.lineWidth = 3.2;
            ctx.strokeStyle = "rgba(1,8,20,.96)";
            ctx.shadowBlur = 0;
            ctx.strokeText(remainingWord, renderX + typedWidth, renderY);
            ctx.fillStyle = isShaking ? "#ffffff" : (this.colorText || "#f5fcff");
            ctx.shadowBlur = isShaking ? 12 : (activeEnemy === this ? 7 : 3.5);
            ctx.shadowColor = isShaking ? "#ffffff" : this.colorGlow;
            ctx.fillText(remainingWord, renderX + typedWidth, renderY);
            ctx.restore();
        }
        update() { this.y += this.speed; }
    }

    class Laser {
        constructor(targetX, targetY, isMiss = false) {
            this.x = player.x; 
            this.y = player.y - (player.size * 1.2); 
            this.speed = 35; 
            this.targetY = targetY; 
            this.isMiss = !!isMiss;
            this.hit = false;

            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        }
        draw() {
            const selected=SHIP_ROSTER.find(ship=>ship.id===selectedShipId);
            const accent=this.isMiss?"#ff536f":(selected?selected.accent:"#58d9ff");
            const magnitude=Math.max(1,Math.hypot(this.vx,this.vy));
            const ux=this.vx/magnitude,uy=this.vy/magnitude,px=-uy,py=ux;
            ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
            for(const lane of [-2.7,2.7]){
                const x=this.x+px*lane,y=this.y+py*lane;
                const tipX=x+ux*6,tipY=y+uy*6;
                const rearX=x-ux*12,rearY=y-uy*12;
                const wx=x+px*2.1,wy=y+py*2.1,nx=x-px*2.1,ny=y-py*2.1;
                ctx.shadowColor=accent;ctx.shadowBlur=16;ctx.fillStyle=accent;ctx.globalAlpha=.92;
                ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.lineTo(wx+ux*2,wy+uy*2);ctx.lineTo(rearX+px*1.1,rearY+py*1.1);ctx.lineTo(x-ux*17,y-uy*17);ctx.lineTo(rearX-px*1.1,rearY-py*1.1);ctx.lineTo(nx+ux*2,ny+uy*2);ctx.closePath();ctx.fill();
                ctx.globalAlpha=1;ctx.shadowBlur=2;ctx.fillStyle="#f8fdff";
                ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.lineTo(x+ux*1.5+px*.7,y+uy*1.5+py*.7);ctx.lineTo(x-ux*10+px*.65,y-uy*10+py*.65);ctx.lineTo(x-ux*14,y-uy*14);ctx.lineTo(x-ux*10-px*.65,y-uy*10-py*.65);ctx.lineTo(x+ux*1.5-px*.7,y+uy*1.5-py*.7);ctx.closePath();ctx.fill();
                const trail=ctx.createLinearGradient(x-ux*11,y-uy*11,x-ux*28,y-uy*28);trail.addColorStop(0,accent);trail.addColorStop(1,"rgba(20,90,170,0)");
                ctx.strokeStyle=trail;ctx.lineWidth=1.6;ctx.shadowBlur=4;ctx.beginPath();ctx.moveTo(x-ux*9,y-uy*9);ctx.lineTo(x-ux*27,y-uy*27);ctx.stroke();
            }
            ctx.restore();
        }
        update() { 
            this.x += this.vx; 
            this.y += this.vy; 
            
            if (!this.isMiss && this.vy < 0 && this.y <= this.targetY) {
                this.hit = true;
                createImpactSpark(this.x, this.y, (SHIP_ROSTER.find(ship=>ship.id===selectedShipId)||SHIP_ROSTER[0]).accent); 
            }
        }
    }

    class Particle {
        constructor(x, y, themeColor) {
            this.x = x; this.y = y;
            this.size = Math.random() * 3.5 + 1.5;
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 5 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.decay = Math.random() * 0.035 + 0.015;
            const colors = [themeColor, "#38bdf8", "#ffffff"];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        draw() {
            ctx.save();
            ctx.globalAlpha=this.alpha;
            const speed=Math.hypot(this.vx,this.vy);
            if(speed>2.5){
                ctx.beginPath();
                ctx.moveTo(this.x,this.y);
                ctx.lineTo(this.x-(this.vx/speed)*this.size*2.4,this.y-(this.vy/speed)*this.size*2.4);
                ctx.strokeStyle=this.color;ctx.lineWidth=Math.max(.6,this.size*.34);ctx.globalAlpha=this.alpha*.42;
                ctx.stroke();ctx.globalAlpha=this.alpha;
            }
            ctx.beginPath();ctx.arc(this.x,this.y,Math.max(.7,this.size*.48),0,Math.PI*2);
            ctx.fillStyle=this.color;
            ctx.shadowColor=this.color;
            // Fade out the expensive canvas blur early; the bright core and trail remain.
            ctx.shadowBlur=this.alpha>.72?1.1:0;
            ctx.fill();
            ctx.shadowBlur=0;
            ctx.restore();
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.alpha -= this.decay;
        }
    }

    function createImpactSpark(x,y,themeColor){
        // Light contact feedback for each typed character: 4 short-lived sparks
        // instead of triggering a full explosion on every successful letter.
        for(let i=0;i<4;i++){
            const p=new Particle(x,y,themeColor);
            p.size*=.62;
            p.vx*=.62;
            p.vy*=.62;
            p.alpha=.86;
            p.decay=Math.max(p.decay,.06);
            particles.push(p);
        }
    }

    function createExplosion(x, y, wordLength, themeColor) {
        let count = 12 + wordLength * 3;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x + (Math.random() * wordLength * 9), y - 4, themeColor));
        }
    }

    function startWave(waveNum) {
        currentWave = waveNum;
        const profile = DIFFICULTY_PROFILES[selectedDifficulty] || DIFFICULTY_PROFILES.medium;
        enemiesLeftToSpawn = profile.minEnemies + Math.floor(Math.random() * (profile.maxEnemies - profile.minEnemies + 1));
        waveSpawnTimer = 0;
        waveClearMessageTimer = 90;
    }


    const skillLabels={bomb:"BOMB",shield:"SHIELD",clear:"CLEAR"};
    const skillColors={bomb:"#ffbd59",shield:"#58d9ff",clear:"#dbeafe"};
    function updateSkillInventoryUI(){
        const bombCount=document.getElementById("skillCountBombFloating");
        const shieldCount=document.getElementById("skillCountShieldSpace");
        const shieldButton=gameKeyboard&&gameKeyboard.querySelector('[data-keyboard-action="shield"]');
        const clearButton=gameKeyboard&&gameKeyboard.querySelector('[data-keyboard-action="clear"]');
        if(bombCount)bombCount.textContent=String(skillInventory.bomb);
        if(shieldCount)shieldCount.textContent=String(skillInventory.shield);
        if(shieldButton){
            shieldButton.disabled=skillInventory.shield<1||shieldActive;
            shieldButton.setAttribute("aria-label","Gunakan Shield; tersimpan "+skillInventory.shield);
        }
        if(floatingBombButton){
            floatingBombButton.disabled=skillInventory.bomb<1;
            floatingBombButton.setAttribute("aria-label","Gunakan Bomb; tersimpan "+skillInventory.bomb);
            floatingBombButton.title="Ledakkan musuh yang terlihat";
        }
        if(clearButton){
            clearButton.disabled=skillInventory.clear<1||!activeEnemy;
            clearButton.setAttribute("aria-label","Gunakan Clear; tersimpan "+skillInventory.clear);
        }
        if(gameKeyboardStatus&&document.activeElement!==hiddenInput)gameKeyboardStatus.textContent=shieldActive?"SHIELD AKTIF — MENAHAN 1 TABRAKAN":"KETIK HURUF PADA KATA MUSUH";
    }
    function grantRandomSkill(enemy){
        if(Math.random()>=.14)return;
        const types=Object.keys(skillInventory).filter(type=>skillInventory[type]<maxStoredSkills);
        if(!types.length)return;
        const type=types[Math.floor(Math.random()*types.length)];
        skillInventory[type]++;
        floatingTexts.push(new FloatingText(enemy.x,enemy.y-20,skillLabels[type]+" STORED",skillColors[type],true));
        updateSkillInventoryUI();
    }
    function useStoredSkill(type){
        if(!gameActive||!Object.prototype.hasOwnProperty.call(skillInventory,type)||skillInventory[type]<1)return;
        if(type==="shield"&&shieldActive)return;
        if(type==="clear"&&!activeEnemy)return;
        skillInventory[type]--;
        if(type==="shield"){
            shieldActive=true;
            floatingTexts.push(new FloatingText(player.x,player.y-45,"SHIELD READY","#58d9ff",true));
        }else if(type==="bomb"){
            const targets=enemies.slice();
            runStats.enemiesDestroyed += targets.length;
            targets.forEach(enemy=>{
                awardScore(Math.max(10,enemy.word.length*10));
                createExplosion(enemy.x,enemy.y,enemy.word.length,enemy.colorGlow||"#ffbd59");
                floatingTexts.push(new FloatingText(enemy.x,enemy.y,"BOMB","#ffbd59"));
            });
            enemies=[];activeEnemy=null;comboCount=0;hiddenInput.value="";
            triggerScreenShake(8,12);playExplosionSound(true);
            floatingTexts.push(new FloatingText(gameWidth/2,gameHeight*.38,"AREA BOMB","#ffbd59",true));
        }else if(type==="clear"){
            activeEnemy.typed="";activeEnemy=null;hiddenInput.value="";comboCount=0;
            floatingTexts.push(new FloatingText(player.x,player.y-45,"TARGET CLEARED","#dbeafe",true));
        }
        updateSkillInventoryUI();
    }
    // Temporary low-overhead diagnostics to pinpoint losses in the touch -> click ->
    // dispatch -> input -> game pipeline. UI refresh and frame sampling run only while open.
    const inputDiagnostics={
        pointerDowns:0,touchDowns:0,mouseDowns:0,clicks:0,clickWithoutPointer:0,pointerWithoutClick:0,nonPrimaryTouchDowns:0,nonPrimaryTouchProcessed:0,clickFallbackActivations:0,duplicateClicksSuppressed:0,
        dispatchedChars:0,inputEvents:0,inputLettersReceived:0,processedLetters:0,matches:0,misses:0,hitProjectiles:0,missProjectiles:0,
        pendingPointers:[],clickDelayTotal:0,clickDelaySamples:0,clickDelayMax:0,
        eventQueueDelayTotal:0,eventQueueDelaySamples:0,eventQueueDelayMax:0,
        inputToFrameTotal:0,inputToFrameSamples:0,inputToFrameMax:0,pendingRenderInputs:[],
        keyIntervalTotal:0,keyIntervalSamples:0,keyIntervalMin:Infinity,lastDispatchAt:0,
        lastFrameAt:0,frameWindowStart:0,frameWindowCount:0,fps:0,lateFrames33:0,lateFrames50:0,maxFrameGap:0
    };
    const inputDiagnosticsPanel=document.getElementById("inputDiagnosticsPanel");
    const inputDiagnosticsOutput=document.getElementById("inputDiagnosticsOutput");
    const buildVersionLabel=document.getElementById("buildVersion");
    let inputDiagnosticsRefreshTimer=null;
    let inputDiagnosticsActive=false;

    function getMissProjectileTarget(){
        const startX=player.x;
        const startY=player.y-(player.size*1.2);
        const endY=-90;
        const blockers=enemies.filter(enemy=>enemy.y+5> endY&&enemy.y-24<startY);
        const sampleCount=Math.max(36,Math.min(84,Math.ceil(gameWidth/7)));
        let bestX=Math.max(0,Math.min(gameWidth,startX));
        let bestScore=Infinity;

        function scorePath(targetX){
            let score=0;
            const denominator=startY-endY;
            for(const enemy of blockers){
                const topY=Math.max(endY,enemy.y-24);
                const bottomY=Math.min(startY,enemy.y+5);
                const xAt=(y)=>startX+(targetX-startX)*((startY-y)/denominator);
                const x1=xAt(topY),x2=xAt(bottomY);
                const pathLeft=Math.min(x1,x2),pathRight=Math.max(x1,x2);
                const enemyLeft=enemy.x-18;
                const enemyRight=enemy.x+enemy.wordWidth+18;
                if(pathRight>=enemyLeft&&pathLeft<=enemyRight)score+=100+Math.max(0,enemy.wordWidth);
            }
            return score;
        }

        // Prefer an entirely clear trajectory inside the playfield.
        for(let i=0;i<=sampleCount;i++){
            const targetX=gameWidth*i/sampleCount;
            const score=scorePath(targetX);
            if(score<bestScore){bestScore=score;bestX=targetX;}
            if(score===0)return {x:targetX,y:endY};
        }

        // If enemies occupy every on-screen lane, continue past the playfield edge.
        const extendedSamples=sampleCount;
        for(let i=0;i<=extendedSamples;i++){
            const targetX=-gameWidth*.55+(gameWidth*2.1*i/extendedSamples);
            const score=scorePath(targetX);
            if(score<bestScore){bestScore=score;bestX=targetX;}
            if(score===0)return {x:targetX,y:endY};
        }
        return {x:bestX,y:endY};
    }

    function fireHitProjectile(targetX,targetY){
        lasers.push(new Laser(targetX,targetY));
        inputDiagnostics.hitProjectiles++;
    }

    function fireMissProjectile(){
        const target=getMissProjectileTarget();
        lasers.push(new Laser(target.x,target.y,true));
        inputDiagnostics.missProjectiles++;
    }

    function resetInputDiagnostics(){
        Object.assign(inputDiagnostics,{
            pointerDowns:0,touchDowns:0,mouseDowns:0,clicks:0,clickWithoutPointer:0,pointerWithoutClick:0,nonPrimaryTouchDowns:0,nonPrimaryTouchProcessed:0,clickFallbackActivations:0,duplicateClicksSuppressed:0,
            dispatchedChars:0,inputEvents:0,inputLettersReceived:0,processedLetters:0,matches:0,misses:0,hitProjectiles:0,missProjectiles:0,
            pendingPointers:[],clickDelayTotal:0,clickDelaySamples:0,clickDelayMax:0,
            eventQueueDelayTotal:0,eventQueueDelaySamples:0,eventQueueDelayMax:0,
            inputToFrameTotal:0,inputToFrameSamples:0,inputToFrameMax:0,pendingRenderInputs:[],
            keyIntervalTotal:0,keyIntervalSamples:0,keyIntervalMin:Infinity,lastDispatchAt:0,
            lastFrameAt:0,frameWindowStart:0,frameWindowCount:0,fps:0,lateFrames33:0,lateFrames50:0,maxFrameGap:0
        });
        updateInputDiagnosticsUI();
    }

    function updateInputDiagnosticsUI(){
        if(!inputDiagnosticsPanel||inputDiagnosticsPanel.classList.contains("hidden"))return;
        const now=performance.now();
        while(inputDiagnostics.pendingPointers.length&&now-inputDiagnostics.pendingPointers[0].at>1200){
            inputDiagnostics.pendingPointers.shift();
            inputDiagnostics.pointerWithoutClick++;
        }
        const d=inputDiagnostics;
        const keyAvg=d.keyIntervalSamples?(d.keyIntervalTotal/d.keyIntervalSamples).toFixed(1):"—";
        const keyMin=Number.isFinite(d.keyIntervalMin)?d.keyIntervalMin.toFixed(1):"—";
        const clickAvg=d.clickDelaySamples?(d.clickDelayTotal/d.clickDelaySamples).toFixed(1):"—";
        const clickMax=d.clickDelaySamples?d.clickDelayMax.toFixed(1):"—";
        const queueAvg=d.eventQueueDelaySamples?(d.eventQueueDelayTotal/d.eventQueueDelaySamples).toFixed(2):"—";
        const queueMax=d.eventQueueDelaySamples?d.eventQueueDelayMax.toFixed(2):"—";
        const inputFrameAvg=d.inputToFrameSamples?(d.inputToFrameTotal/d.inputToFrameSamples).toFixed(2):"—";
        const inputFrameMax=d.inputToFrameSamples?d.inputToFrameMax.toFixed(2):"—";
        inputDiagnosticsOutput.textContent=[
            "INPUT DIAGNOSTICS (sementara)",
            "PointerDown huruf: "+d.pointerDowns+"  (touch "+d.touchDowns+" / mouse "+d.mouseDowns+")",
            "Sentuhan sekunder: terdeteksi / diproses "+d.nonPrimaryTouchDowns+" / "+d.nonPrimaryTouchProcessed,
            "Click fallback / duplikat dicegah: "+d.clickFallbackActivations+" / "+d.duplicateClicksSuppressed,
            "Click huruf: "+d.clicks,
            "PointerDown tanpa Click >1.2s: "+d.pointerWithoutClick,
            "Click tanpa PointerDown: "+d.clickWithoutPointer,
            "Karakter dikirim handler: "+d.dispatchedChars,
            "Event input diterima: "+d.inputEvents,
            "Huruf diterima / diproses: "+d.inputLettersReceived+" / "+d.processedLetters,
            "Cocok / MISS: "+d.matches+" / "+d.misses,
            "Projectile HIT / MISS / TOTAL: "+d.hitProjectiles+" / "+d.missProjectiles+" / "+(d.hitProjectiles+d.missProjectiles),
            "Jeda ketikan rata-rata / tercepat: "+keyAvg+" / "+keyMin+" ms",
            "Jeda sentuhan -> handler rata-rata / maks: "+queueAvg+" / "+queueMax+" ms",
            "Jeda input -> frame game rata-rata / maks: "+inputFrameAvg+" / "+inputFrameMax+" ms",
            "Jeda PointerDown -> Click browser (bukan jalur input): "+clickAvg+" / "+clickMax+" ms",
            "FPS perkiraan: "+(d.fps||"—")+" | frame >33ms: "+d.lateFrames33+" | >50ms: "+d.lateFrames50,
            "Jeda frame maksimum: "+(d.maxFrameGap?d.maxFrameGap.toFixed(1):"—")+" ms"
        ].join("\n");
    }

    function toggleInputDiagnostics(){
        if(!inputDiagnosticsPanel)return;
        const opening=inputDiagnosticsPanel.classList.contains("hidden");
        inputDiagnosticsPanel.classList.toggle("hidden",!opening);
        if(buildVersionLabel)buildVersionLabel.setAttribute("aria-expanded",opening?"true":"false");
        if(opening){
            inputDiagnosticsActive=true;
            updateInputDiagnosticsUI();
            if(!inputDiagnosticsRefreshTimer){
                inputDiagnosticsRefreshTimer=window.setInterval(updateInputDiagnosticsUI,250);
            }
        }else if(inputDiagnosticsRefreshTimer){
            // Hide the overlay so it cannot cover enemies during the typing test.
            // Counters and frame sampling keep running until STOP TEST is tapped.
            clearInterval(inputDiagnosticsRefreshTimer);
            inputDiagnosticsRefreshTimer=null;
        }
    }

    if(buildVersionLabel){
        buildVersionLabel.setAttribute("role","button");
        buildVersionLabel.setAttribute("tabindex","0");
        buildVersionLabel.setAttribute("aria-label","Buka diagnostik input");
        buildVersionLabel.setAttribute("aria-expanded","false");
        buildVersionLabel.addEventListener("click",toggleInputDiagnostics);
        buildVersionLabel.addEventListener("keydown",event=>{
            if(event.key==="Enter"||event.key===" "){
                event.preventDefault();
                toggleInputDiagnostics();
            }
        });
    }
    const inputDiagnosticsReset=document.getElementById("inputDiagnosticsReset");
    const inputDiagnosticsClose=document.getElementById("inputDiagnosticsClose");
    if(inputDiagnosticsReset)inputDiagnosticsReset.addEventListener("click",resetInputDiagnostics);
    if(inputDiagnosticsClose)inputDiagnosticsClose.addEventListener("click",toggleInputDiagnostics);
    const inputDiagnosticsStop=document.getElementById("inputDiagnosticsStop");
    if(inputDiagnosticsStop)inputDiagnosticsStop.addEventListener("click",()=>{
        inputDiagnosticsActive=false;
        if(inputDiagnosticsPanel&&!inputDiagnosticsPanel.classList.contains("hidden")){
            inputDiagnosticsPanel.classList.add("hidden");
            if(buildVersionLabel)buildVersionLabel.setAttribute("aria-expanded","false");
        }
        if(inputDiagnosticsRefreshTimer){
            clearInterval(inputDiagnosticsRefreshTimer);
            inputDiagnosticsRefreshTimer=null;
        }
    });

    const activeGameKeyPointers=new Map();
    const recentReleasedPointerById=new Map();
    const recentReleasedPointersByButton=new WeakMap();

    function rememberReleasedKeyPointer(button,event){
        const now=performance.now();
        const entry={button,pointerId:event.pointerId,at:now};
        if(Number.isFinite(event.pointerId))recentReleasedPointerById.set(event.pointerId,entry);
        const recent=(recentReleasedPointersByButton.get(button)||[]).filter(item=>now-item.at<=120);
        recent.push(entry);
        if(recent.length>8)recent.splice(0,recent.length-8);
        recentReleasedPointersByButton.set(button,recent);
    }

    function consumeMatchingKeyClick(button,event){
        const now=performance.now();
        // Modern PointerEvent-based clicks carry their originating pointerId.
        // This is the safest way to avoid pairing a click with an older tap on the same key.
        if(Number.isFinite(event.pointerId)){
            const entry=recentReleasedPointerById.get(event.pointerId);
            if(entry&&entry.button===button&&now-entry.at<=1000){
                recentReleasedPointerById.delete(event.pointerId);
                const recent=(recentReleasedPointersByButton.get(button)||[]).filter(item=>item!==entry&&now-item.at<=120);
                if(recent.length)recentReleasedPointersByButton.set(button,recent);
                else recentReleasedPointersByButton.delete(button);
                return true;
            }
            return false;
        }
        // Legacy MouseEvent clicks have no pointerId. Pair only with a very recent
        // pointerup from the same key; never use a stale pointerdown from seconds ago.
        const recent=(recentReleasedPointersByButton.get(button)||[]).filter(item=>now-item.at<=120);
        if(!recent.length){
            recentReleasedPointersByButton.delete(button);
            return false;
        }
        const entry=recent.shift();
        if(recent.length)recentReleasedPointersByButton.set(button,recent);
        else recentReleasedPointersByButton.delete(button);
        if(Number.isFinite(entry.pointerId))recentReleasedPointerById.delete(entry.pointerId);
        return true;
    }

    if(gameKeyboard){
        gameKeyboard.addEventListener("pointerdown",event=>{
            const target=event.target;
            const button=target instanceof Element?target.closest("button"):null;
            if(!button||button.disabled)return;
            if(event.pointerType==="mouse"&&event.button!==0)return;

            // Keep the 123 pad on click: iOS requires its trusted click activation
            // to focus the numeric input reliably. Letter/skill keys act immediately
            // on pointerdown, so they never wait for delayed compatibility clicks.
            if(button.dataset.keyboardMode!=="number"){
                if(button.matches(".game-key[data-key]")){
                    const now=performance.now();
                    const type=event.pointerType||"unknown";
                    activeGameKeyPointers.set(event.pointerId,{button,at:now,pointerType:type});
                    inputDiagnostics.pointerDowns++;
                    if(type==="touch"){
                        inputDiagnostics.touchDowns++;
                        if(!event.isPrimary)inputDiagnostics.nonPrimaryTouchDowns++;
                    }else if(type==="mouse")inputDiagnostics.mouseDowns++;
                    const eventDelay=Math.max(0,now-event.timeStamp);
                    inputDiagnostics.eventQueueDelayTotal+=eventDelay;
                    inputDiagnostics.eventQueueDelaySamples++;
                    inputDiagnostics.eventQueueDelayMax=Math.max(inputDiagnostics.eventQueueDelayMax,eventDelay);
                    inputDiagnostics.pendingPointers.push({at:now,type,button});
                    if(inputDiagnostics.pendingPointers.length>100){
                        inputDiagnostics.pendingPointers.shift();
                        inputDiagnostics.pointerWithoutClick++;
                    }
                }
                handleGameKeyboardButton(button);
                if(event.pointerType==="touch"&&!event.isPrimary&&button.matches(".game-key[data-key]")&&gameActive){
                    inputDiagnostics.nonPrimaryTouchProcessed++;
                }
            }
        },{passive:true});

        gameKeyboard.addEventListener("pointerup",event=>{
            const active=activeGameKeyPointers.get(event.pointerId);
            if(!active)return;
            activeGameKeyPointers.delete(event.pointerId);
            const target=event.target;
            const button=target instanceof Element?target.closest("button"):null;
            if(button===active.button&&button.matches(".game-key[data-key]")){
                rememberReleasedKeyPointer(button,event);
            }
        },{passive:true});

        gameKeyboard.addEventListener("pointercancel",event=>{
            activeGameKeyPointers.delete(event.pointerId);
        },{passive:true});
    }

    function sendGameCharacter(character){
        if(!gameActive||!(/^[a-z]$/i.test(character)||character===" "))return;
        const now=performance.now();
        inputDiagnostics.dispatchedChars++;
        if(inputDiagnosticsActive){
            inputDiagnostics.pendingRenderInputs.push(now);
            if(inputDiagnostics.pendingRenderInputs.length>100)inputDiagnostics.pendingRenderInputs.shift();
        }
        if(inputDiagnostics.lastDispatchAt>0){
            const gap=Math.max(0,now-inputDiagnostics.lastDispatchAt);
            inputDiagnostics.keyIntervalTotal+=gap;
            inputDiagnostics.keyIntervalSamples++;
            inputDiagnostics.keyIntervalMin=Math.min(inputDiagnostics.keyIntervalMin,gap);
        }
        inputDiagnostics.lastDispatchAt=now;
        hiddenInput.value=character;
        hiddenInput.dispatchEvent(new Event("input",{bubbles:true}));
    }

    // Cache virtual keys and animate feedback without forcing synchronous layout.
    // A forced offsetWidth read on every keystroke can stall rapid taps on iOS/PWA.
    const virtualKeyButtons=new Map();
    const virtualKeyFeedbackAnimations=new WeakMap();
    const reduceKeyMotion=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if(gameKeyboard){
        gameKeyboard.querySelectorAll(".game-key[data-key]").forEach(button=>{
            virtualKeyButtons.set(button.dataset.key,button);
        });
    }
    function flashVirtualKey(key,isCorrect){
        if(!gameKeyboard||reduceKeyMotion)return;
        const button=virtualKeyButtons.get(key);
        if(!button||typeof button.animate!=="function")return;
        const current=virtualKeyFeedbackAnimations.get(button);
        // Do not restart feedback on each fast repeat; all characters are still processed.
        if(current&&current.playState==="running")return;
        // Avoid animated CSS filters on every mobile keypress; these can compete
        // with the full-screen canvas for GPU time. Keep feedback transform-only.
        const frames=isCorrect
            ?[{transform:"scale(1)"},{transform:"scale(.94)"},{transform:"scale(1)"}]
            :[{transform:"translateX(0)"},{transform:"translateX(-1px)"},{transform:"translateX(1px)"},{transform:"translateX(0)"}];
        const animation=button.animate(frames,{duration:isCorrect?150:180,easing:"ease-out"});
        virtualKeyFeedbackAnimations.set(button,animation);
        animation.onfinish=()=>{
            if(virtualKeyFeedbackAnimations.get(button)===animation){
                virtualKeyFeedbackAnimations.delete(button);
            }
        };
    }
    function handleGameKeyboardButton(button){
        if(!button||button.disabled)return;
        if(button.dataset.keyboardAction==="shield"){useStoredSkill("shield");return;}
        if(button.dataset.keyboardAction==="clear"){useStoredSkill("clear");return;}
        if(button.dataset.keyboardMode==="number"){
            nativeNumberEntryActive=true;
            numberEntryBaselineViewportHeight=Math.round((window.visualViewport&&window.visualViewport.height)||window.innerHeight);
            numberEntryViewportShrunk=false;
            hiddenInput.setAttribute("inputmode","numeric");
            hiddenInput.setAttribute("pattern","[0-9]*");
            hiddenInput.setAttribute("enterkeyhint","done");
            hiddenInput.style.position="fixed";hiddenInput.style.left="8px";hiddenInput.style.bottom="8px";
            hiddenInput.style.width="24px";hiddenInput.style.height="24px";hiddenInput.style.opacity="0.02";
            hiddenInput.style.zIndex="40";
            // Focus first within the click's user activation, before hiding
            // the tapped button or resizing the playfield.
            hiddenInput.focus({preventScroll:true});
            resizeGameCanvas();
            return;
        }
        if(button.dataset.key)sendGameCharacter(button.dataset.key);
    }

    if(gameKeyboard){
        // Route every virtual key through the browser's completed click event.
        // The earlier pointerdown path could process only part of very rapid tap
        // sequences on some iOS Safari/PWA sessions, while its click event was
        // deliberately ignored. Click-only handling gives each completed tap one
        // consistent activation and also preserves trusted focus for the native 123 pad.
        gameKeyboard.addEventListener("click",event=>{
            const target=event.target;
            const button=target instanceof Element?target.closest("button"):null;
            if(!button||button.disabled)return;
            let matchedPointer=false;
            if(button.matches(".game-key[data-key]")){
                const d=inputDiagnostics;
                d.clicks++;
                if(event.detail>0){
                    const now=performance.now();
                    // Keep pointer statistics bounded and prevent seconds-old pointerdowns
                    // from being mistaken for the click of a newer same-letter tap.
                    for(let i=d.pendingPointers.length-1;i>=0;i--){
                        if(now-d.pendingPointers[i].at>1200){
                            d.pendingPointers.splice(i,1);
                            d.pointerWithoutClick++;
                        }
                    }
                    const pointerIndex=d.pendingPointers.findIndex(pointer=>pointer.button===button&&now-pointer.at<=1200);
                    if(pointerIndex>=0){
                        const pointer=d.pendingPointers.splice(pointerIndex,1)[0];
                        const delay=Math.max(0,now-pointer.at);
                        d.clickDelayTotal+=delay;d.clickDelaySamples++;
                        d.clickDelayMax=Math.max(d.clickDelayMax,delay);
                    }else{
                        d.clickWithoutPointer++;
                    }

                    matchedPointer=consumeMatchingKeyClick(button,event);
                    if(matchedPointer)d.duplicateClicksSuppressed++;
                    else d.clickFallbackActivations++;
                }
            }
            // Suppress only a click correlated with a recent pointerup for that exact tap.
            // A click without such a match is a fallback input, regardless of old pointerdowns.
            if(button.dataset.keyboardMode==="number"||event.detail===0){
                handleGameKeyboardButton(button);
            }else if(event.detail>0&&button.matches(".game-key[data-key]")&&!matchedPointer){
                handleGameKeyboardButton(button);
            }
        });
    }

    // Physical controls mirror the virtual keyboard: Space = Shield, Backspace = Clear, Shift = Shield.
    document.addEventListener("keydown",event=>{
        if(!gameActive||event.repeat||nativeNumberEntryActive)return;
        if(event.code==="Space"){
            event.preventDefault();
            useStoredSkill("shield");
        }else if(event.key==="Backspace"){
            event.preventDefault();
            useStoredSkill("clear");
        }else if(event.key==="Shift"){
            useStoredSkill("shield");
        }
    });

    // Bomb has its own single-purpose button outside the keyboard.
    if(floatingBombButton){
        floatingBombButton.addEventListener("click",()=>{
            useStoredSkill("bomb");
        });
    }

    function closeNativeNumberEntry(){
        if(!nativeNumberEntryActive)return;
        nativeNumberEntryActive=false;
        numberEntryBaselineViewportHeight=0;
        numberEntryViewportShrunk=false;
        kodeAngka="";
        hiddenInput.removeAttribute("inputmode");
        hiddenInput.removeAttribute("pattern");
        hiddenInput.removeAttribute("enterkeyhint");
        hiddenInput.style.cssText="";
        resizeGameCanvas();
    }

    // If the iOS numeric keyboard is dismissed without entering four digits,
    // restore the game's own keyboard instead of leaving the controls hidden.
    hiddenInput.addEventListener("blur",()=>{
        if(nativeNumberEntryActive)closeNativeNumberEntry();
    });
    hiddenInput.addEventListener("keydown",event=>{
        if(nativeNumberEntryActive&&(event.key==="Enter"||event.key==="Escape")){
            event.preventDefault();
            closeNativeNumberEntry();
            hiddenInput.blur();
        }
    });

    hiddenInput.addEventListener('input', (e) => {
        if (!gameActive) return;
        inputDiagnostics.inputEvents++;
        let val = hiddenInput.value;
        hiddenInput.value = ''; 
        if (val.length === 0) return;
        inputDiagnostics.inputLettersReceived+=(val.match(/[a-z]/gi)||[]).length;

        for (let i = 0; i < val.length; i++) {
            let karakter = val.charAt(i);

            if (/^[0-9]$/.test(karakter)) {
                kodeAngka += karakter;
                
                // Batasi panjang string maksimal 4 karakter (karena kedua PIN panjangnya 4)
                if (kodeAngka.length > 4) kodeAngka = kodeAngka.slice(-4);
                
                // Cek apakah cocok dengan PIN 1 atau PIN 2
                if (kodeAngka === PIN_RAHASIA) { 
                    goToDashboard(); 
                    return; 
                } else if (kodeAngka === PIN_RAHASIA_2) {
                    goToDashboard2();
                    return;
                }
                if(nativeNumberEntryActive && kodeAngka.length>=4){
                    closeNativeNumberEntry();
                    hiddenInput.blur();
                }
                continue; 
            }
            let key = karakter.toUpperCase();
            if (!/^[A-Z]$/.test(key)) continue;
            inputDiagnostics.processedLetters++;

            ctx.font = "bold 16px 'Courier New'";
            const t = translations[langSetting];

            // Success means the next expected letter matches; targeting and scoring stay unchanged.
            const isExpectedCharacter = activeEnemy
                ? activeEnemy.word[activeEnemy.typed.length] === key
                : enemies.some(enemy => enemy.word[enemy.typed.length] === key);
            flashVirtualKey(key, isExpectedCharacter);
            if (isExpectedCharacter) {
                inputDiagnostics.matches++;
                runStats.correctCharacters++;
            } else {
                inputDiagnostics.misses++;
                runStats.incorrectCharacters++;
                fireMissProjectile();
            }

            if (!activeEnemy) {
                let targets = enemies.filter(en => en.word[en.typed.length] === key);
                if (targets.length > 0) {
                    targets.sort((a, b) => b.y - a.y); 
                    activeEnemy = targets[0];
                    updateSkillInventoryUI();
                    activeEnemy.typed += key;
                    activeEnemy.shakeFrames = 6; 
                    
                    comboCount++;
                    runStats.bestCombo = Math.max(runStats.bestCombo, comboCount);
                    comboPulse = 8; 
                    muzzleFlashAlpha = 1.0; 
                    playLaserSound();

                    let targetX = activeEnemy.x + ctx.measureText(activeEnemy.typed).width - 6;
                    fireHitProjectile(targetX, activeEnemy.y);
                } else {
                    comboCount = 0;
                    playErrorSound();
                    floatingTexts.push(new FloatingText(gameWidth/2 - 20, player.y - 50, t.miss, "#ef4444", true));
                }
            } else {
                let nextChar = activeEnemy.word[activeEnemy.typed.length];
                if (key === nextChar) {
                    activeEnemy.typed += key;
                    activeEnemy.shakeFrames = 6; 
                    comboCount++;
                    runStats.bestCombo = Math.max(runStats.bestCombo, comboCount);
                    comboPulse = 8; 
                    muzzleFlashAlpha = 1.0; 
                    playLaserSound();
                    
                    let targetX = activeEnemy.x + ctx.measureText(activeEnemy.typed).width - 6;
                    fireHitProjectile(targetX, activeEnemy.y);
                    
                    if (activeEnemy.typed === activeEnemy.word) {
                        let multiplier = 1;
                        if (comboCount >= 25) multiplier = 5;
                        else if (comboCount >= 18) multiplier = 4;
                        else if (comboCount >= 10) multiplier = 3;
                        else if (comboCount >= 5) multiplier = 2;

                        let basePoints = activeEnemy.word.length * 10;
                        let finalPoints = basePoints * multiplier;
                        finalPoints = awardScore(finalPoints);

                        triggerScreenShake(activeEnemy.type === 'tank' ? 10 : 5, 8); 
                        createExplosion(activeEnemy.x, activeEnemy.y, activeEnemy.word.length, activeEnemy.colorGlow);
                        playExplosionSound(activeEnemy.type === 'tank');

                        floatingTexts.push(new FloatingText(activeEnemy.x, activeEnemy.y, `+${finalPoints}`, multiplier > 1 ? "#38bdf8" : "#4ade80", multiplier > 1));
                        grantRandomSkill(activeEnemy);
                        runStats.enemiesDestroyed++;

                        if (activeEnemy.type === 'emp') {
                            triggerScreenShake(20, 20);
                            floatingTexts.push(new FloatingText(gameWidth/2 - 50, gameHeight/2, "EMP DETONATED!", "#06b6d4", true));
                            
                            enemies.forEach(e => {
                                if(e !== activeEnemy) {
                                    runStats.enemiesDestroyed++;
                                    awardScore(e.word.length * 5); 
                                    createExplosion(e.x, e.y, e.word.length, e.colorGlow);
                                }
                            });
                            enemies = [];
                            activeEnemy = null;
                            updateSkillInventoryUI();
                            if(comboCount > maxCombo) maxCombo = comboCount;
                            return; 
                        }

                        if (activeEnemy.type === 'splitter') {
                            let splitCount = Math.random() > 0.5 ? 2 : 3;
                            floatingTexts.push(new FloatingText(activeEnemy.x, activeEnemy.y - 20, `SPLIT ${splitCount}!`, "#c084fc"));
                            
                            let segmentWidth = gameWidth / splitCount;
                            
                            for(let k = 0; k < splitCount; k++) {
                                let miniEn = new Enemy(currentWave, 'mini');
                                let minX = (segmentWidth * k) + 15;
                                let maxX = (segmentWidth * (k + 1)) - miniEn.wordWidth - 15;
                                if (maxX < minX) maxX = minX; 
                                
                                miniEn.x = minX + (Math.random() * (maxX - minX));
                                miniEn.y = Math.max(activeEnemy.y - 10 - (Math.random() * 25), 10);
                                
                                enemies.push(miniEn);
                            }
                        }

                        if (comboCount > maxCombo) maxCombo = comboCount;

                        enemies = enemies.filter(en => en !== activeEnemy);
                        activeEnemy = null;
                        updateSkillInventoryUI();
                    }
                } else {
                    let errorTypedWidth = ctx.measureText(activeEnemy.typed).width;
                    comboCount = 0;
                    playErrorSound();
                    floatingTexts.push(new FloatingText(activeEnemy.x + errorTypedWidth, activeEnemy.y - 20, t.bad, "#ef4444"));
                }
            }
        }
    });

    function saveHighScore(finalScore, finalWave) {
        let scores = JSON.parse(localStorage.getItem('typeShooterScores')) || [];
        scores.push({ score: finalScore, wave: finalWave, difficulty: selectedDifficulty, scoreMultiplier: getScoreMultiplier(), date: new Date().toLocaleDateString('id-ID') });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5); 
        localStorage.setItem('typeShooterScores', JSON.stringify(scores));
    }

    function showScoreboard() {
        mainMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        scoreboardMenu.classList.remove('hidden');

        let scores = JSON.parse(localStorage.getItem('typeShooterScores')) || [];
        let contentDiv = document.getElementById('scoreboardContent');
        const t = translations[langSetting];

        if(scores.length === 0) {
            contentDiv.innerHTML = `<p style='color:#64748b; margin: 20px 0;'>${t.noScores}</p>`;
        } else {
            let tableHTML = `<table class='score-table'><tr><th>${t.rank}</th><th>${t.score}</th><th>${t.scoreMode}</th><th>${t.wave}</th><th>${t.date}</th></tr>`;
            const scoreModeLabels = { easy:t.difficultyEasy, medium:t.difficultyMedium, hard:t.difficultyHard };
            const scoreModeColors = { easy:"#6ee7b7", medium:"#7ddfff", hard:"#ffb08b" };
            scores.forEach((item, index) => {
                let waveDisplay = item.wave ? "W-" + item.wave : "W-1";
                const scoreMode = scoreModeLabels[item.difficulty] || t.scoreModeLegacy;
                const scoreModeColor = scoreModeColors[item.difficulty] || "#64748b";
                tableHTML += `<tr>
                    <td>#${index + 1}</td>
                    <td style="color:#4ade80;font-weight:bold;">${item.score}</td>
                    <td style="color:${scoreModeColor};font-size:11px;font-weight:900;">${scoreMode}</td>
                    <td style="color:#38bdf8;font-weight:bold;">${waveDisplay}</td>
                    <td style="color:#64748b;font-size:12px;">${item.date}</td>
                </tr>`;
            });
            tableHTML += "</table>";
            contentDiv.innerHTML = tableHTML;
        }
    }

    function closeScoreboard() {
        scoreboardMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    }

    function startGame() {
        gameOverTriggered = false;
        runStats = { correctCharacters: 0, incorrectCharacters: 0, enemiesDestroyed: 0, bestCombo: 0 };
        runStartedAt = Date.now();
        runPausedAt = 0;
        accumulatedPauseMs = 0;
        lastRunDurationMs = 0;
        enemies=[];lasers=[];particles=[];floatingTexts=[];kodeAngka="";score=0;frameCount=0;activeEnemy=null;
        comboCount=0;maxCombo=0;shakeTimer=0;muzzleFlashAlpha=0;comboPulse=0;playerHP=maxHP;flashRedFrames=0;
        skillInventory.bomb=0;skillInventory.shield=0;skillInventory.clear=0;shieldActive=false;nativeNumberEntryActive=false;hiddenInput.value="";
        hiddenInput.removeAttribute("inputmode");hiddenInput.removeAttribute("pattern");hiddenInput.removeAttribute("enterkeyhint");hiddenInput.style.cssText="";
        initAudio();startWave(1);gameActive=true;
        mainMenu.classList.add('hidden');shipSelectMenu.classList.add('hidden');gameOverMenu.classList.add('hidden');pauseMenu.classList.add('hidden');pauseBtn.classList.remove('hidden');
        resizeGameCanvas();updateSkillInventoryUI();
        if(!isMobilePortraitGame())hiddenInput.focus();else hiddenInput.blur();
        startBGM();cancelAnimationFrame(loopId);gameLoop();
    }

    function gameOver() {
        if (gameOverTriggered) return;
        gameOverTriggered = true;
        lastRunDurationMs = Math.max(0, Date.now() - runStartedAt - accumulatedPauseMs);
        gameActive = false;
        pauseBtn.classList.add('hidden');
        resizeGameCanvas(); 
        triggerScreenShake(20, 40);
        stopBGM();
        
        saveHighScore(score, currentWave); 
        
        const t = translations[langSetting];
        document.getElementById('finalScoreText').innerText = "Score: " + score;
        document.getElementById('finalWaveText').innerText = t.reachedWave + currentWave;
        const totalCharacters = runStats.correctCharacters + runStats.incorrectCharacters;
        const typingAccuracy = totalCharacters > 0
            ? Math.round((runStats.correctCharacters / totalCharacters) * 100)
            : 0;
        const totalSeconds = Math.floor(lastRunDurationMs / 1000);
        const durationHours = Math.floor(totalSeconds / 3600);
        const durationMinutes = Math.floor((totalSeconds % 3600) / 60);
        const durationSeconds = totalSeconds % 60;
        const formattedDuration = durationHours > 0
            ? durationHours + ":" + String(durationMinutes).padStart(2, "0") + ":" + String(durationSeconds).padStart(2, "0")
            : durationMinutes + ":" + String(durationSeconds).padStart(2, "0");
        document.getElementById("gameOverStats").setAttribute("aria-label", t.gameOverStats);
        document.getElementById("statAccuracyLabel").textContent = t.statAccuracy;
        document.getElementById("statAccuracyValue").textContent = typingAccuracy + "%";
        document.getElementById("statDestroyedLabel").textContent = t.statDestroyed;
        document.getElementById("statDestroyedValue").textContent = runStats.enemiesDestroyed.toLocaleString("en-US");
        document.getElementById("statBestComboLabel").textContent = t.statBestCombo;
        document.getElementById("statBestComboValue").textContent = runStats.bestCombo.toLocaleString("en-US");
        document.getElementById("statDurationLabel").textContent = t.statDuration;
        document.getElementById("statDurationValue").textContent = formattedDuration;
        
        // Show the end-state immediately; do not leave the player staring at a frozen playfield for one second.
        gameOverMenu.classList.remove('hidden');
        hiddenInput.blur();
    }

    canvas.addEventListener('click', () => {
        if(gameActive&&!isMobilePortraitGame())hiddenInput.focus();
    });

    function drawHudPanel(x, y, width, height, accent) {
        const cut=Math.max(3,Math.min(10,height*.22,width*.13));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x+cut,y);
        ctx.lineTo(x+width-cut,y);
        ctx.lineTo(x+width,y+cut);
        ctx.lineTo(x+width,y+height-cut);
        ctx.lineTo(x+width-cut,y+height);
        ctx.lineTo(x+cut,y+height);
        ctx.lineTo(x,y+height-cut);
        ctx.lineTo(x,y+cut);
        ctx.closePath();
        const fill=ctx.createLinearGradient(x,y,x,y+height);
        fill.addColorStop(0,"rgba(5,25,48,.97)");
        fill.addColorStop(1,"rgba(2,10,25,.985)");
        ctx.fillStyle=fill;
        ctx.shadowColor=accent;
        ctx.shadowBlur=1.2;
        ctx.fill();
        ctx.shadowBlur=0;
        ctx.strokeStyle=accent;
        ctx.lineWidth=1.15;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x+cut+3,y+1.5);
        ctx.lineTo(x+width-cut-3,y+1.5);
        ctx.strokeStyle="rgba(204,247,255,.22)";
        ctx.lineWidth=.7;
        ctx.stroke();
        ctx.restore();
    }

    function ensureSpaceBackgroundCache(){
        const w=gameWidth,h=gameHeight,scale=canvasScale;
        const imageReady=gameBackgroundImage.complete&&gameBackgroundImage.naturalWidth>0;
        const imageKey=imageReady
            ?gameBackgroundImage.naturalWidth+"x"+gameBackgroundImage.naturalHeight
            :"fallback";
        const key=[Math.ceil(w*scale),Math.ceil(h*scale),w,h,scale,imageKey].join(":");
        if(spaceBackgroundCache&&spaceBackgroundCacheKey===key)return;

        const cache=document.createElement("canvas");
        cache.width=Math.max(1,Math.ceil(w*scale));
        cache.height=Math.max(1,Math.ceil(h*scale));
        const bgCtx=cache.getContext("2d",{alpha:false});
        if(!bgCtx)return;
        bgCtx.setTransform(scale,0,0,scale,0,0);
        if(imageReady){
            const iw=gameBackgroundImage.naturalWidth,ih=gameBackgroundImage.naturalHeight;
            const coverScale=Math.max(w/iw,h/ih),sw=iw/coverScale,sh=ih/coverScale;
            bgCtx.fillStyle="#030916";
            bgCtx.fillRect(0,0,w,h);
            bgCtx.filter="blur(1px) brightness(.84) saturate(.84)";
            bgCtx.drawImage(gameBackgroundImage,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,w,h);
            bgCtx.filter="none";
            const shade=bgCtx.createLinearGradient(0,0,0,h);
            shade.addColorStop(0,"rgba(1,7,21,.25)");
            shade.addColorStop(.44,"rgba(2,9,24,.13)");
            shade.addColorStop(1,"rgba(1,6,19,.30)");
            bgCtx.fillStyle=shade;
            bgCtx.fillRect(0,0,w,h);
        }else{
            bgCtx.fillStyle="#020817";
            bgCtx.fillRect(0,0,w,h);
            const nebula=bgCtx.createRadialGradient(w*.47,h*.4,0,w*.47,h*.4,Math.max(w,h)*.8);
            nebula.addColorStop(0,"#163e78");
            nebula.addColorStop(.36,"#0b2851");
            nebula.addColorStop(1,"#010611");
            bgCtx.fillStyle=nebula;
            bgCtx.fillRect(0,0,w,h);
        }
        spaceBackgroundCache=cache;
        spaceBackgroundCacheKey=key;
    }

    function drawSpaceBackground(){
        ensureSpaceBackgroundCache();
        if(spaceBackgroundCache){
            // Backdrop blur, color adjustment, and gradient are precomputed; frame drawing
            // now copies the cached image instead of filtering the full canvas every tick.
            ctx.drawImage(spaceBackgroundCache,0,0,gameWidth,gameHeight);
        }else{
            ctx.fillStyle="#020817";
            ctx.fillRect(0,0,gameWidth,gameHeight);
        }
    }

    function gameLoop() {
        // Frame timing is sampled only during an explicitly started diagnostic run.
        if(inputDiagnosticsActive){
            const diagFrameNow=performance.now();
            const diag=inputDiagnostics;
            if(diag.lastFrameAt>0){
                const frameGap=Math.max(0,diagFrameNow-diag.lastFrameAt);
                diag.maxFrameGap=Math.max(diag.maxFrameGap,frameGap);
                if(frameGap>33.3)diag.lateFrames33++;
                if(frameGap>50)diag.lateFrames50++;
            }
            diag.lastFrameAt=diagFrameNow;
            if(!diag.frameWindowStart)diag.frameWindowStart=diagFrameNow;
            diag.frameWindowCount++;
            const frameWindowElapsed=diagFrameNow-diag.frameWindowStart;
            if(frameWindowElapsed>=1000){
                diag.fps=Math.round(diag.frameWindowCount*1000/frameWindowElapsed);
                diag.frameWindowCount=0;
                diag.frameWindowStart=diagFrameNow;
            }
        }
        if(inputDiagnosticsActive&&inputDiagnostics.pendingRenderInputs.length){
            const frameAt=performance.now();
            const pending=inputDiagnostics.pendingRenderInputs;
            for(let i=0;i<pending.length;i++){
                const delay=Math.max(0,frameAt-pending[i]);
                inputDiagnostics.inputToFrameTotal+=delay;
                inputDiagnostics.inputToFrameSamples++;
                inputDiagnostics.inputToFrameMax=Math.max(inputDiagnostics.inputToFrameMax,delay);
            }
            pending.length=0;
        }
        const t = translations[langSetting];
        if (!gameActive) {
            ctx.fillStyle = "rgba(7, 10, 19, 0.2)";
            ctx.fillRect(0, 0, gameWidth, gameHeight);
            if(shieldActive){
            ctx.save();ctx.globalAlpha=.78+Math.sin(frameCount*.12)*.12;
            ctx.strokeStyle="#58d9ff";ctx.fillStyle="rgba(56,189,248,.05)";ctx.lineWidth=2;ctx.shadowColor="#38bdf8";ctx.shadowBlur=5;
            ctx.beginPath();ctx.ellipse(player.x,player.y,player.size*3.15,player.size*3.8,0,0,Math.PI*2);
            ctx.fill();ctx.stroke();ctx.restore();
        }
        particles.forEach((p, index) => {
                p.update(); p.draw();
                if (p.alpha <= 0) particles.splice(index, 1);
            });
            // Continue the inactive animation only while the Pause menu is open.
            // Stop the RAF loop after returning to the main menu or entering Game Over.
            if (!gameActive && !pauseMenu.classList.contains('hidden')) {
                loopId = requestAnimationFrame(gameLoop);
            }
            return;
        }
        
        drawSpaceBackground();

        // The high-resolution nebula PNG provides the environmental detail.

        if (flashRedFrames > 0) {
            ctx.fillStyle = `rgba(239, 68, 68, ${flashRedFrames * 0.02})`;
            ctx.fillRect(0, 0, gameWidth, gameHeight);
            flashRedFrames--;
        }

        ctx.save();
        if (shakeTimer > 0) {
            ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
            shakeTimer--;
        }

        stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.globalAlpha = star.alpha;
            let isWarping = waveClearMessageTimer > 0;
            let currentSpeed = isWarping ? star.baseSpeed * 8 : star.baseSpeed;
            
            if (isWarping) {
                ctx.fillRect(star.x, star.y, star.size, star.size * 6); 
            } else {
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }

            star.y += currentSpeed;
            if (star.y > gameHeight) { star.y = 0; star.x = Math.random() * gameWidth; }
        });
        ctx.globalAlpha = 1.0;

        let closestDistance = gameHeight;
        enemies.forEach(en => {
            let dist = (player.y + 22) - en.y;
            if (dist > 0 && dist < closestDistance) closestDistance = dist;
        });

        // The danger beam appears only when an enemy is close to the player.
        let lineAlpha = 0;
        let lineShadow = 0;
        if (closestDistance < 210) {
            const dangerFactor = 1 - (closestDistance / 210);
            lineAlpha = 0.12 + (0.72 * dangerFactor);
            lineShadow = 7 * dangerFactor;
        }
        if(lineAlpha>0){
            ctx.strokeStyle = `rgba(255, 65, 83, ${lineAlpha})`;
            ctx.lineWidth = 1.4 + lineAlpha;
            ctx.shadowBlur = lineShadow;
            ctx.shadowColor = "#ff4153";
            ctx.beginPath();ctx.moveTo(0,player.y+22);ctx.lineTo(gameWidth,player.y+22);ctx.stroke();
            ctx.shadowBlur = 0;
        } 

        // One shared HUD plate split into WAVE / SCORE / COMBO / LIFE / PAUSE.
        const compactHud=gameWidth<520;
        const hudTopY=Math.max(10,(window.visualViewport&&window.visualViewport.offsetTop)||10);
        const hudFrameX=10,hudFrameW=Math.max(240,gameWidth-20),panelH=compactHud?44:58;
        const pauseW=compactHud?42:54,contentW=hudFrameW-pauseW;
        const waveW=Math.round(contentW*.15),scoreW=Math.round(contentW*.30),comboW=Math.round(contentW*.21);
        const lifeW=contentW-waveW-scoreW-comboW;
        const waveX=hudFrameX,scoreX=waveX+waveW,comboX=scoreX+scoreW,lifeX=comboX+comboW,pauseX=lifeX+lifeW;
        drawHudPanel(hudFrameX,hudTopY,hudFrameW,panelH,
            playerHP===1&&Math.floor(frameCount/18)%2?"rgba(248,113,113,.95)":"rgba(69,207,255,.92)");
        ctx.save();
        [{x:scoreX,color:"rgba(69,207,255,.78)"},{x:comboX,color:"rgba(69,207,255,.78)"},{x:lifeX,color:"rgba(255,184,72,.9)"},{x:pauseX,color:"rgba(69,207,255,.9)"}].forEach(separator=>{
            ctx.beginPath();ctx.moveTo(separator.x,hudTopY+7);ctx.lineTo(separator.x,hudTopY+panelH-7);
            ctx.strokeStyle=separator.color;ctx.lineWidth=1;ctx.stroke();
        });
        ctx.textAlign="center";ctx.fillStyle="#78e8ff";ctx.font="800 "+(compactHud?8:11)+"px ui-monospace,monospace";
        ctx.fillText("WAVE",waveX+waveW/2,hudTopY+(compactHud?12:17));
        ctx.fillStyle="#f2f9ff";ctx.font="900 "+(compactHud?15:22)+"px ui-monospace,monospace";
        ctx.fillText(String(currentWave).padStart(2,"0"),waveX+waveW/2,hudTopY+(compactHud?32:43));
        ctx.textAlign="left";ctx.fillStyle="#78e8ff";ctx.font="800 "+(compactHud?8:11)+"px ui-monospace,monospace";
        ctx.fillText("SCORE",scoreX+8,hudTopY+(compactHud?12:17));
        ctx.fillStyle="#f2f9ff";ctx.font="900 "+(compactHud?14:22)+"px ui-monospace,monospace";
        ctx.fillText(score.toLocaleString("en-US"),scoreX+8,hudTopY+(compactHud?32:43),scoreW-14);
        const hudMult=comboCount>=25?5:comboCount>=18?4:comboCount>=10?3:comboCount>=5?2:1;
        ctx.textAlign="center";ctx.fillStyle="#ffd18a";ctx.font="800 "+(compactHud?7:10)+"px ui-monospace,monospace";
        ctx.fillText("COMBO",comboX+comboW/2,hudTopY+(compactHud?12:17));
        const comboAccent = hudMult >= 5 ? "#ffd36a" : hudMult >= 3 ? "#8be9ff" : hudMult >= 2 ? "#a5f3c1" : "#fff4d8";
        const comboPulseAmount = Math.min(1, Math.max(0, comboPulse / 8));
        ctx.save();
        ctx.translate(comboX+comboW/2,hudTopY+(compactHud?32:43));
        ctx.scale(1+comboPulseAmount*.1,1+comboPulseAmount*.1);
        ctx.fillStyle=comboAccent;
        ctx.font="900 "+(compactHud?13:20)+"px ui-monospace,monospace";
        ctx.shadowColor=comboAccent;
        ctx.shadowBlur=(hudMult>1?3:0)+comboPulseAmount*5;
        ctx.fillText(String(comboCount)+" ×"+hudMult,0,0);
        ctx.restore();
        const heartSize=compactHud?5.3:8,heartCount=maxHP,heartGap=lifeW/(heartCount+1);
        function traceLifeHeart(x,y,size){
            ctx.beginPath();ctx.moveTo(x,y+size*.78);
            ctx.bezierCurveTo(x-size*1.15,y+size*.02,x-size*1.02,y-size*.68,x-size*.42,y-size*.54);
            ctx.bezierCurveTo(x-size*.14,y-size*.5,x,y-size*.24,x,y-size*.24);
            ctx.bezierCurveTo(x+size*.20,y-size*.59,x+size*.65,y-size*.72,x+size*.98,y-size*.35);
            ctx.bezierCurveTo(x+size*1.40,y+size*.20,x+size*.56,y+size*.69,x,y+size*.78);ctx.closePath();
        }
        ctx.fillStyle="#78e8ff";ctx.font="800 "+(compactHud?8:11)+"px ui-monospace,monospace";
        ctx.fillText("LIFE",lifeX+lifeW/2,hudTopY+(compactHud?11:16));
        for(let i=0;i<heartCount;i++){
            const hx=lifeX+heartGap*(i+1),hy=hudTopY+(compactHud?29:39);traceLifeHeart(hx,hy,heartSize);
            if(i<playerHP){
                const heart=ctx.createLinearGradient(hx,hy-heartSize,hx,hy+heartSize);
                heart.addColorStop(0,"#ff777e");heart.addColorStop(.65,"#f52b43");heart.addColorStop(1,"#9f102c");
                ctx.fillStyle=heart;ctx.shadowColor="#ff415b";ctx.shadowBlur=compactHud?2:4;ctx.fill();ctx.shadowBlur=0;
                ctx.strokeStyle="rgba(255,212,218,.86)";ctx.lineWidth=.7;ctx.stroke();
            }else{
                ctx.fillStyle="rgba(71,85,105,.14)";ctx.fill();
                ctx.strokeStyle="rgba(148,163,184,.46)";ctx.lineWidth=1;ctx.stroke();
            }
        }
        ctx.restore();

        if (comboCount > 0) {
            let mult = 1;
            if (comboCount >= 25) mult = 5;
            else if (comboCount >= 18) mult = 4;
            else if (comboCount >= 10) mult = 3;
            else if (comboCount >= 5) mult = 2;

            if (comboPulse > 0) comboPulse -= 0.5;
            if (comboPulse < 0) comboPulse = 0;

            // Combo count and multiplier are rendered in the top HUD strip.
        }

        if (enemiesLeftToSpawn > 0 && waveClearMessageTimer <= 0) {
            waveSpawnTimer++;
            const profile = DIFFICULTY_PROFILES[selectedDifficulty] || DIFFICULTY_PROFILES.medium;
            const spawnInterval = Math.max(45, Math.round(Math.max(95 - currentWave * 5, 45) * profile.spawnIntervalScale));
            if (waveSpawnTimer >= spawnInterval) {
                enemies.push(new Enemy(currentWave));
                enemiesLeftToSpawn--;
                waveSpawnTimer = 0;
            }
        } else if (enemies.length === 0 && enemiesLeftToSpawn === 0 && waveClearMessageTimer <= 0) {
            startWave(currentWave + 1);
        }

        if (waveClearMessageTimer > 0) {
            waveClearMessageTimer--;
            const waveMessage = t.incomingWave + currentWave;
            const fadeIn = Math.min(1, (90-waveClearMessageTimer)/10);
            const fadeOut = Math.min(1, waveClearMessageTimer/14);
            const waveAlpha = Math.max(0, Math.min(fadeIn,fadeOut));
            const wavePulse = .5 + .5*Math.sin(frameCount*.16);
            const waveFontSize = Math.min(gameWidth<420?24:32, (gameWidth-36)/Math.max(8,waveMessage.length*.64));
            const waveY = gameHeight/2.5;

            ctx.save();
            ctx.globalAlpha = waveAlpha;
            ctx.translate(gameWidth/2,waveY);
            ctx.scale(.97+wavePulse*.03,.97+wavePulse*.03);
            ctx.font = "900 "+waveFontSize+"px ui-monospace,monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textWidth = ctx.measureText(waveMessage).width;
            const panelWidth = Math.min(gameWidth-24,textWidth+42);
            const panelHeight = waveFontSize+28;
            const panelGradient = ctx.createLinearGradient(-panelWidth/2,0,panelWidth/2,0);
            panelGradient.addColorStop(0,"rgba(8,28,54,0)");
            panelGradient.addColorStop(.18,"rgba(8,28,54,.82)");
            panelGradient.addColorStop(.5,"rgba(10,42,73,.94)");
            panelGradient.addColorStop(.82,"rgba(8,28,54,.82)");
            panelGradient.addColorStop(1,"rgba(8,28,54,0)");

            ctx.fillStyle = panelGradient;
            ctx.fillRect(-panelWidth/2,-panelHeight/2,panelWidth,panelHeight);
            ctx.strokeStyle = "rgba(93,222,255,"+(.38+wavePulse*.32)+")";
            ctx.lineWidth = 1;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 6+wavePulse*5;
            ctx.beginPath();
            ctx.moveTo(-panelWidth/2+10,-panelHeight/2);
            ctx.lineTo(-panelWidth/2+panelWidth*.28,-panelHeight/2);
            ctx.moveTo(panelWidth/2-panelWidth*.28,panelHeight/2);
            ctx.lineTo(panelWidth/2-10,panelHeight/2);
            ctx.stroke();

            ctx.fillStyle = "#dff9ff";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 10+wavePulse*7;
            ctx.fillText(waveMessage,0,0,gameWidth-36);
            ctx.restore();
        }

        let cx = player.x; 
        let floatOffsetY = Math.sin(frameCount * 0.05) * 6;
        let cy = player.y + floatOffsetY; 
        let s = player.size;
        
        // Render selected SVG fighter; legacy geometry remains as a loading fallback.
        const selectedShipImage=shipImageCache[selectedShipId];
        if(selectedShipImage&&selectedShipImage.complete&&selectedShipImage.naturalWidth>0){
            ctx.save();ctx.translate(cx,cy);
            if(activeEnemy){
                let targetX=activeEnemy.x+activeEnemy.wordWidth/2,targetY=activeEnemy.y;
                let angle=Math.atan2(targetY-cy,targetX-cx)+(Math.PI/2),maxAngle=Math.PI/4.5;
                if(angle>maxAngle)angle=maxAngle;if(angle<-maxAngle)angle=-maxAngle;ctx.rotate(angle);
            }
            const selectedShip=SHIP_ROSTER.find(ship=>ship.id===selectedShipId)||SHIP_ROSTER[0];
            const shipAccent=selectedShip.accent;
            const pulse=0.86+0.14*Math.sin(frameCount*.38);
            const plumeLength=s*(1.25+0.34*pulse+Math.max(0,floatOffsetY)*0.018);
            for(const engineOffset of [-s*0.72,s*0.72]){
                // Soft outer exhaust, saturated mid-core, then a narrow white-hot centre.
                const outer=ctx.createLinearGradient(engineOffset,s*1.28,engineOffset,s*1.35+plumeLength);
                outer.addColorStop(0,shipAccent);
                outer.addColorStop(.28,"rgba(56,189,248,.82)");
                outer.addColorStop(1,"rgba(22,119,255,0)");
                ctx.beginPath();
                ctx.moveTo(engineOffset-s*.19,s*1.28);
                ctx.quadraticCurveTo(engineOffset-s*.12,s*1.8,engineOffset,s*1.35+plumeLength);
                ctx.quadraticCurveTo(engineOffset+s*.12,s*1.8,engineOffset+s*.19,s*1.28);
                ctx.closePath();ctx.globalAlpha=.72;ctx.fillStyle=outer;
                ctx.shadowColor=shipAccent;ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
                const core=ctx.createLinearGradient(engineOffset,s*1.3,engineOffset,s*1.35+plumeLength*.72);
                core.addColorStop(0,"#f5fdff");core.addColorStop(.24,shipAccent);core.addColorStop(1,"rgba(56,189,248,0)");
                ctx.beginPath();ctx.moveTo(engineOffset-s*.065,s*1.3);ctx.lineTo(engineOffset+s*.065,s*1.3);ctx.lineTo(engineOffset,s*1.35+plumeLength*.72);ctx.closePath();
                ctx.fillStyle=core;ctx.shadowColor="#bcefff";ctx.shadowBlur=3;ctx.fill();ctx.shadowBlur=0;
                ctx.beginPath();ctx.arc(engineOffset,s*1.28,s*.085,0,Math.PI*2);
                ctx.fillStyle="#f2fbff";ctx.fill();
            }
            const spriteWidth=s*4.5,spriteHeight=s*5.45;
            ctx.shadowColor=shipAccent;ctx.shadowBlur=4;
            ctx.drawImage(selectedShipImage,-spriteWidth/2,-s*2.05,spriteWidth,spriteHeight);ctx.shadowBlur=0;
            if(muzzleFlashAlpha>0){
                ctx.fillStyle="rgba(255,255,255,"+muzzleFlashAlpha+")";ctx.shadowBlur=18;ctx.shadowColor="#fff";
                ctx.beginPath();ctx.arc(-s*1.75,0,s*.35,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s*1.75,0,s*.35,0,Math.PI*2);ctx.fill();
                ctx.shadowBlur=0;muzzleFlashAlpha-=.15;
            }
            ctx.restore();
        }else{
        // ROTASI PESAWAT & EFFECT GLOW PREMIUM
        ctx.save();
        ctx.translate(cx, cy);

        if (activeEnemy) {
            let targetX = activeEnemy.x + activeEnemy.wordWidth / 2;
            let targetY = activeEnemy.y;
            let angle = Math.atan2(targetY - cy, targetX - cx) + (Math.PI / 2);
            let maxAngle = Math.PI / 4.5;
            if (angle > maxAngle) angle = maxAngle;
            if (angle < -maxAngle) angle = -maxAngle;
            ctx.rotate(angle);
        }
        
        let thrustGlow = 5 + Math.random() * 8 + (floatOffsetY * 0.5); 
        ctx.fillStyle = "#f97316"; 
        ctx.shadowBlur = thrustGlow; 
        ctx.shadowColor = "#ef4444";
        ctx.beginPath(); 
        ctx.moveTo(0 - (s*0.64), 0 + s - 2); 
        ctx.lineTo(0 + (s*0.64), 0 + s - 2); 
        ctx.lineTo(0, 0 + s + (thrustGlow * 0.8)); 
        ctx.fill();
        ctx.shadowBlur = 0; 
        
        ctx.shadowBlur = 12; 
        ctx.shadowColor = "#38bdf8";

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.moveTo(0, 0 - s*0.5); 
        ctx.lineTo(0 - s*2.2, 0 + s*0.8); 
        ctx.lineTo(0 - s*2.2, 0 + s*1.1); 
        ctx.lineTo(0 - s*0.8, 0 + s*0.8); 
        ctx.lineTo(0, 0 + s*1.2);         
        ctx.lineTo(0 + s*0.8, 0 + s*0.8); 
        ctx.lineTo(0 + s*2.2, 0 + s*1.1); 
        ctx.lineTo(0 + s*2.2, 0 + s*0.8); 
        ctx.fill();

        ctx.fillStyle = "#60a5fa"; 
        ctx.fillRect(0 - s*2.2, 0 + s*0.2, s*0.15, s*0.8);
        ctx.beginPath(); ctx.moveTo(0 - s*2.125, 0); ctx.lineTo(0 - s*2.2, 0 + s*0.2); ctx.lineTo(0 - s*2.05, 0 + s*0.2); ctx.fill();
        ctx.fillRect(0 + s*2.05, 0 + s*0.2, s*0.15, s*0.8);
        ctx.beginPath(); ctx.moveTo(0 + s*2.125, 0); ctx.lineTo(0 + s*2.2, 0 + s*0.2); ctx.lineTo(0 + s*2.05, 0 + s*0.2); ctx.fill();

        if (muzzleFlashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${muzzleFlashAlpha})`;
            ctx.shadowBlur = 20; ctx.shadowColor = "#ffffff";
            ctx.beginPath(); ctx.arc(0 - s*2.125, 0, s*0.5, 0, Math.PI * 2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(0 + s*2.125, 0, s*0.5, 0, Math.PI * 2); ctx.fill(); 
            ctx.shadowBlur = 12; 
            muzzleFlashAlpha -= 0.15; 
        }

        ctx.fillStyle = "#1e3a8a";
        ctx.beginPath();
        ctx.moveTo(0, 0 - s*1.6); 
        ctx.lineTo(0 - s*0.6, 0 + s*0.5); 
        ctx.lineTo(0 - s*0.5, 0 + s*1.2); 
        ctx.lineTo(0 + s*0.5, 0 + s*1.2); 
        ctx.lineTo(0 + s*0.6, 0 + s*0.5); 
        ctx.fill();

        ctx.fillStyle = "#facc15"; 
        ctx.beginPath();
        ctx.moveTo(0, 0 - s*1.2);
        ctx.lineTo(0 - s*0.15, 0 - s*0.2);
        ctx.lineTo(0, 0 + s*0.1);
        ctx.lineTo(0 + s*0.15, 0 - s*0.2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0 + s*0.4, s*0.25, s*0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); 

        }

        // Compact effect arrays in-place after each update. Removing items inside
        // forEach/splice shifts indexes and causes unnecessary skipped work.
        let particleWrite=0;
        for(let i=0;i<particles.length;i++){
            const p=particles[i];
            p.update();
            if(p.alpha>0){
                p.draw();
                particles[particleWrite++]=p;
            }
        }
        particles.length=particleWrite;

        let floatingTextWrite=0;
        for(let i=0;i<floatingTexts.length;i++){
            const ft=floatingTexts[i];
            ft.update();
            if(ft.alpha>0){
                ft.draw();
                floatingTexts[floatingTextWrite++]=ft;
            }
        }
        floatingTexts.length=floatingTextWrite;

        let laserWrite=0;
        for(let i=0;i<lasers.length;i++){
            const laser=lasers[i];
            laser.update();
            laser.draw();
            if(!laser.hit&&laser.y>=-50&&laser.x>=-50&&laser.x<=gameWidth+50){
                lasers[laserWrite++]=laser;
            }
        }
        lasers.length=laserWrite;

        for (let i = enemies.length - 1; i >= 0; i--) {
            let en = enemies[i];
            en.update(); 
            en.draw();
            
            if(en.y>player.y+22){
                if(shieldActive){
                    shieldActive=false;createExplosion(en.x,en.y,en.word.length,"#58d9ff");
                    floatingTexts.push(new FloatingText(en.x,en.y,"SHIELD BLOCKED","#58d9ff",true));
                    enemies.splice(i,1);
                    if(activeEnemy===en){activeEnemy=null;hiddenInput.value="";}
                    updateSkillInventoryUI();continue;
                }
                playerHP--;
                flashRedFrames = 15;
                triggerScreenShake(15, 10);
                playErrorSound();
                enemies.splice(i, 1); 

                if (activeEnemy === en) {
                    activeEnemy = null;
                    comboCount = 0;
                    hiddenInput.value = "";
                }
                
                if (playerHP <= 0) {
                    createExplosion(player.x, player.y, 8, "#ef4444"); 
                    gameOver();
                    break;
                }
            }
        }

        ctx.restore(); 
        frameCount++;
        loopId = requestAnimationFrame(gameLoop);
    }

    function handleViewportRefresh(){
        resizeGameCanvas();
        if(!shipSelectMenu.classList.contains('hidden'))updateShipSelectionUI();
    }
    window.addEventListener('resize',handleViewportRefresh);
    window.addEventListener('pageshow',handleViewportRefresh);
    document.addEventListener('visibilitychange',()=>{
        if(!document.hidden)handleViewportRefresh();
    });
    // iOS Safari and installed PWAs can report visual viewport changes later than
    // the keyboard animation; listen to both resize and scroll and recalculate from
    // the actual visible bounds instead of assuming innerHeight has changed.
    if(window.visualViewport){
        const handleVisualViewportChange=()=>{
            const viewportHeight=Math.round(window.visualViewport.height);
            if(nativeNumberEntryActive&&numberEntryBaselineViewportHeight>0){
                if(viewportHeight<numberEntryBaselineViewportHeight-100){
                    if(!numberEntryViewportShrunk){
                        numberEntryViewportShrunk=true;
                        handleViewportRefresh();
                    }
                }else if(numberEntryViewportShrunk&&viewportHeight>=numberEntryBaselineViewportHeight-80){
                    closeNativeNumberEntry();
                }
            }
            handleViewportRefresh();
        };
        window.visualViewport.addEventListener("resize",handleVisualViewportChange);
        window.visualViewport.addEventListener("scroll",handleVisualViewportChange);
    }
    resizeGameCanvas();
    updateSkillInventoryUI();
