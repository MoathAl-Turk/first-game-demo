const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");

// --- 1. THEME SYSTEM ---
const themes = {
    default: { pageBg: "#222", canvasBg: "#333", text: "white", player: "cyan", obstacles: "red", treasure: "gold" },
    purpleGreen: { pageBg: "#1a0530", canvasBg: "#300050", text: "#00ff00", player: "#00ff00", obstacles: "#800080", treasure: "#adff2f" },
    blackWhite: { pageBg: "#e0e0e0", canvasBg: "#ffffff", text: "#000000", player: "#000000", obstacles: "#555555", treasure: "#000000" }
};

let currentTheme = themes.default;

function setTheme(themeName) {
    currentTheme = themes[themeName];
    document.body.style.backgroundColor = currentTheme.pageBg;
    document.body.style.color = currentTheme.text;
    canvas.style.backgroundColor = currentTheme.canvasBg;
}

// --- 2. GAME DATA & LOGIC ---
const levels = [
    { // LEVEL 1
        start: { x: 30, y: 200 },
        treasure: { x: 530, y: 175, width: 50, height: 50 },
        obstacles: [ { x: 150, y: 0, width: 30, height: 250 }, { x: 350, y: 150, width: 30, height: 250 } ]
    },
    { // LEVEL 2
        start: { x: 30, y: 30 },
        treasure: { x: 530, y: 320, width: 50, height: 50 },
        obstacles: [ { x: 100, y: 0, width: 30, height: 300 }, { x: 230, y: 100, width: 30, height: 300 }, { x: 360, y: 0, width: 30, height: 300 }, { x: 490, y: 100, width: 30, height: 300 } ]
    },
    { // LEVEL 3
        start: { x: 30, y: 200 },
        treasure: { x: 530, y: 200, width: 50, height: 50 },
        obstacles: [ { x: 100, y: 0, width: 40, height: 160 }, { x: 100, y: 240, width: 40, height: 160 }, { x: 250, y: 80, width: 40, height: 320 }, { x: 400, y: 0, width: 40, height: 320 } ]
    },
    { // LEVEL 4 (The Joke Level!)
        start: { x: 30, y: 200 },
        treasure: { x: 530, y: 200, width: 50, height: 50 },
        obstacles: [ { x: 150, y: 0, width: 20, height: 320 }, { x: 300, y: 80, width: 20, height: 320 }, { x: 450, y: 0, width: 20, height: 320 } ]
    }
];

let currentLevelIndex = 0;
let player = { x: 0, y: 0, radius: 15, speed: 4 };
let treasure = {};
let obstacles = [];
let keys = {};
let isTransitioning = false; 
let isDead = false; // NEW: tracks if the player is dead so they can't move

// Joke Level Variables
let jokeMessage = "";
let jokeTimer = null;
let isPitchBlack = false;

function loadLevel(index) {
    let levelData = levels[index];
    player.x = levelData.start.x; 
    player.y = levelData.start.y;
    
    treasure = { x: levelData.treasure.x, y: levelData.treasure.y, width: levelData.treasure.width, height: levelData.treasure.height, isOpen: false }; 
    
    obstacles = levelData.obstacles;
    
    if (index === 3) {
        levelText.innerText = "???";
        jokeMessage = "Where am I?";
        isPitchBlack = false;
        clearTimeout(jokeTimer);
        
        jokeTimer = setTimeout(() => {
            isPitchBlack = true;
            jokeMessage = " what???";
        }, 2000);
    } else {
        levelText.innerText = "Level " + (index + 1);
    }
    
    keys = {}; 
    isTransitioning = false; 
    isDead = false; // Bring the player back to life
}

window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// --- NEW: MOBILE CONTROLS ---
function bindDpad(btnId, keyName) {
    const btn = document.getElementById(btnId);
    
    // Touch events for mobile phones
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Stops the screen from scrolling
        keys[keyName] = true;
    });
    btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        keys[keyName] = false;
    });

    // Mouse events for testing the buttons on your computer
    btn.addEventListener("mousedown", () => keys[keyName] = true);
    btn.addEventListener("mouseup", () => keys[keyName] = false);
    btn.addEventListener("mouseleave", () => keys[keyName] = false); // Stops movement if mouse slides off button
}

bindDpad("btn-up", "ArrowUp");
bindDpad("btn-down", "ArrowDown");
bindDpad("btn-left", "ArrowLeft");
bindDpad("btn-right", "ArrowRight");

// --- 3. RENDER SHAPES ---
function draw() {
    if (currentLevelIndex === 3 && isPitchBlack) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Treasure
    if (treasure.isOpen) {
        ctx.strokeStyle = currentTheme.treasure;
        ctx.lineWidth = 4;
        ctx.strokeRect(treasure.x + 2, treasure.y + 2, treasure.width - 4, treasure.height - 4);
    } else {
        ctx.fillStyle = currentTheme.treasure;
        ctx.fillRect(treasure.x, treasure.y, treasure.width, treasure.height);
    }

    // Draw Obstacles
    ctx.fillStyle = currentTheme.obstacles;
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

    // Draw Player (Hide if dead)
    if (!isDead) {
        ctx.fillStyle = currentTheme.player;
        if (currentLevelIndex === 3) {
            // SQUARE for Level 4
            ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
            
            // Text
            ctx.fillStyle = "white";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(jokeMessage, player.x, player.y - 25);
        } else {
            // CIRCLE for other levels
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// --- 4. LOGIC & COLLISIONS ---
function update() {
    // If transitioning or dead, skip all movement/collision logic
    if (isTransitioning || isDead) return; 

    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Wall Collision
    obstacles.forEach(obs => {
        if (player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y &&
            player.y - player.radius < obs.y + obs.height) {
            
            if (currentLevelIndex === 3) {
                // Joke Level Death: Trap them on level 4!
                alert("u killed me...");
                loadLevel(3); 
            } else {
                // NEW Normal Death: Freeze the game and force them to respawn
                isDead = true; 
                alert("You died! Hit the Respawn button at the bottom right to start over.");
            }
        }
    });

    // Treasure Collision
    if (!isDead && player.x + player.radius > treasure.x &&
        player.x - player.radius < treasure.x + treasure.width &&
        player.y + player.radius > treasure.y &&
        player.y - player.radius < treasure.y + treasure.height) {
        
        treasure.isOpen = true; 
        isTransitioning = true; 
        
        setTimeout(() => {
            currentLevelIndex++; 
            
            if (currentLevelIndex === 3) {
                const bwBtn = document.getElementById("bwButton");
                if (bwBtn && bwBtn.disabled) {
                    bwBtn.disabled = false;
                    bwBtn.innerText = "🔓 Black & White (Unlocked!)";
                    alert("Achievement Unlocked: Black & White Theme!");
                }
            }
            
            if (currentLevelIndex >= levels.length) {
                // They beat Level 4! Auto-reset back to the very beginning.
                alert("You beat the whole game! Resetting back to Level 1...");
                currentLevelIndex = 0; 
                loadLevel(0);
            } else {
                loadLevel(currentLevelIndex);
            }
        }, 500);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

loadLevel(currentLevelIndex);
gameLoop();
