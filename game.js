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
    }
];

let currentLevelIndex = 0;
let player = { x: 0, y: 0, radius: 15, speed: 4 };
let treasure = {};
let obstacles = [];
let keys = {};
let isTransitioning = false; 

function loadLevel(index) {
    let levelData = levels[index];
    player.x = levelData.start.x; 
    player.y = levelData.start.y;
    
    treasure = { x: levelData.treasure.x, y: levelData.treasure.y, width: levelData.treasure.width, height: levelData.treasure.height, isOpen: false }; 
    
    obstacles = levelData.obstacles;
    levelText.innerText = "Level " + (index + 1);
    keys = {}; 
    isTransitioning = false; 
}

window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// --- 3. RENDER SHAPES ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Draw Player
    ctx.fillStyle = currentTheme.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
}

// --- 4. LOGIC & COLLISIONS ---
function update() {
    if (isTransitioning) return; 

    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    obstacles.forEach(obs => {
        if (player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y &&
            player.y - player.radius < obs.y + obs.height) {
            
            alert("Ouch! You hit a wall. Starting over from Level 1.");
            currentLevelIndex = 0; 
            loadLevel(currentLevelIndex);
        }
    });

    if (player.x + player.radius > treasure.x &&
        player.x - player.radius < treasure.x + treasure.width &&
        player.y + player.radius > treasure.y &&
        player.y - player.radius < treasure.y + treasure.height) {
        
        treasure.isOpen = true; 
        isTransitioning = true; 
        
        setTimeout(() => {
            currentLevelIndex++; 
            if (currentLevelIndex === 3) {
                const bwBtn = document.getElementById("bwButton");
                if (bwBtn.disabled) {
                    bwBtn.disabled = false;
                    bwBtn.innerText = "🔓 Black & White (Unlocked!)";
                    alert("Achievement Unlocked: Black & White Theme!");
                }
            }
            
            if (currentLevelIndex >= levels.length) {
                alert("You beat the whole game! Restarting...");
                currentLevelIndex = 0; 
            }
            loadLevel(currentLevelIndex);
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
