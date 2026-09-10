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
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 175, width: 50, height: 50 }, obstacles: [ { x: 150, y: 0, width: 30, height: 250 }, { x: 350, y: 150, width: 30, height: 250 } ] },
    { start: { x: 30, y: 30 }, treasure: { x: 530, y: 320, width: 50, height: 50 }, obstacles: [ { x: 100, y: 0, width: 30, height: 300 }, { x: 230, y: 100, width: 30, height: 300 }, { x: 360, y: 0, width: 30, height: 300 }, { x: 490, y: 100, width: 30, height: 300 } ] },
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 200, width: 50, height: 50 }, obstacles: [ { x: 100, y: 0, width: 40, height: 160 }, { x: 100, y: 240, width: 40, height: 160 }, { x: 250, y: 80, width: 40, height: 320 }, { x: 400, y: 0, width: 40, height: 320 } ] },
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 200, width: 50, height: 50 }, obstacles: [ { x: 150, y: 0, width: 20, height: 320 }, { x: 300, y: 80, width: 20, height: 320 }, { x: 450, y: 0, width: 20, height: 320 } ] },
    { // LEVEL 5: Scrolling Combat Level
        width: 1400, 
        start: { x: 30, y: 200 },
        treasure: { x: 1300, y: 175, width: 50, height: 50 },
        obstacles: [ 
            { x: 200, y: 0, width: 40, height: 150 }, 
            { x: 200, y: 250, width: 40, height: 150 },
            { x: 800, y: 0, width: 40, height: 150 },
            { x: 800, y: 250, width: 40, height: 150 }
        ],
        npc: { x: 500, y: 200, hp: 3, radius: 25, isDead: false }
    }
];

let currentLevelIndex = 0;
let player = { x: 0, y: 0, radius: 15, speed: 4, facing: "right", attackTimer: 0, canAttack: true, text: "" };
let treasure = {};
let obstacles = [];
let npc = null;
let keys = {};
let isTransitioning = false; 
let isDead = false; 
let cameraX = 0; 

// Dialogue tracking
let jokeMessage = "";
let isPitchBlack = false;
let dialogueTimers = [];

function clearDialogueTimers() {
    dialogueTimers.forEach(timer => clearTimeout(timer));
    dialogueTimers = [];
}

function loadLevel(index) {
    let levelData = levels[index];
    player.x = levelData.start.x; 
    player.y = levelData.start.y;
    player.text = "";
    player.facing = "right";
    
    treasure = { x: levelData.treasure.x, y: levelData.treasure.y, width: levelData.treasure.width, height: levelData.treasure.height, isOpen: false }; 
    obstacles = levelData.obstacles;
    
    if (levelData.npc) {
        npc = { ...levelData.npc, text: "" };
    } else {
        npc = null;
    }
    
    clearDialogueTimers();
    isPitchBlack = false;
    jokeMessage = "";

    if (index === 3) {
        levelText.innerText = "???";
        jokeMessage = "Where am I?";
        dialogueTimers.push(setTimeout(() => { isPitchBlack = true; jokeMessage = " what???"; }, 2000));
    } 
    else if (index === 4) {
        levelText.innerText = "Level 5";
        isPitchBlack = true; 
        
        npc.text = "where did u come from ???";
        dialogueTimers.push(setTimeout(() => { 
            npc.text = ""; 
            player.text = "i dont know"; 
        }, 2500));
        dialogueTimers.push(setTimeout(() => { player.text = ""; }, 4500));
    } 
    else {
        levelText.innerText = "Level " + (index + 1);
    }
    
    keys = {}; 
    isTransitioning = false; 
    isDead = false; 
}

window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

function bindButton(btnId, keyName) {
    const btn = document.getElementById(btnId);
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[keyName] = false; });
    btn.addEventListener("mousedown", () => keys[keyName] = true);
    btn.addEventListener("mouseup", () => keys[keyName] = false);
    btn.addEventListener("mouseleave", () => keys[keyName] = false);
}
bindButton("btn-up", "ArrowUp");
bindButton("btn-down", "ArrowDown");
bindButton("btn-left", "ArrowLeft");
bindButton("btn-right", "ArrowRight");
bindButton("btn-hit", "e"); 

function drawHexagon(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + r * Math.cos((Math.PI / 3) * i), y + r * Math.sin((Math.PI / 3) * i));
    }
    ctx.closePath();
    ctx.fill();
}

// --- 3. RENDER SHAPES ---
function draw() {
    if (isPitchBlack) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw Treasure
    if (treasure.isOpen) {
        ctx.strokeStyle = currentTheme.treasure; ctx.lineWidth = 4;
        ctx.strokeRect(treasure.x + 2, treasure.y + 2, treasure.width - 4, treasure.height - 4);
    } else {
        ctx.fillStyle = currentTheme.treasure;
        ctx.fillRect(treasure.x, treasure.y, treasure.width, treasure.height);
    }

    // Draw Obstacles
    ctx.fillStyle = currentTheme.obstacles;
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

    // Draw NPC
    if (npc && !npc.isDead) {
        drawHexagon(npc.x, npc.y, npc.radius, "magenta");
        
        ctx.fillStyle = "red"; ctx.fillRect(npc.x - 15, npc.y - 35, 30, 5);
        ctx.fillStyle = "green"; ctx.fillRect(npc.x - 15, npc.y - 35, npc.hp * 10, 5);
        
        if (npc.text) {
            ctx.fillStyle = "white"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(npc.text, npc.x, npc.y - 45);
        }
    }

    // Draw Player
    if (!isDead) {
        ctx.fillStyle = currentTheme.player;
        if (currentLevelIndex === 3) {
            ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(jokeMessage, player.x, player.y - 25);
        } else {
            ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
        }

        if (player.text) {
            ctx.fillStyle = "white"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(player.text, player.x, player.y - 25);
        }

        // Draw Stick if Attacking
        if (player.attackTimer > 0) {
            ctx.fillStyle = "#8B4513"; 
            if (player.facing === "right") ctx.fillRect(player.x, player.y - 4, 40, 8);
            else if (player.facing === "left") ctx.fillRect(player.x - 40, player.y - 4, 40, 8);
            else if (player.facing === "up") ctx.fillRect(player.x - 4, player.y - 40, 8, 40);
            else if (player.facing === "down") ctx.fillRect(player.x - 4, player.y, 8, 40);
        }
    }
    ctx.restore(); 
}

// --- 4. LOGIC & COLLISIONS ---
function update() {
    if (isTransitioning || isDead) return; 

    if (keys["ArrowUp"] || keys["w"]) { player.y -= player.speed; player.facing = "up"; }
    if (keys["ArrowDown"] || keys["s"]) { player.y += player.speed; player.facing = "down"; }
    if (keys["ArrowLeft"] || keys["a"]) { player.x -= player.speed; player.facing = "left"; }
    if (keys["ArrowRight"] || keys["d"]) { player.x += player.speed; player.facing = "right"; }

    let levelWidth = levels[currentLevelIndex].width || 600;
    player.x = Math.max(player.radius, Math.min(levelWidth - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    cameraX = Math.max(0, Math.min(player.x - canvas.width / 2, levelWidth - canvas.width));

    // --- COMBAT LOGIC ---
    if (keys["e"]) {
        if (player.canAttack) {
            player.canAttack = false;
            player.attackTimer = 15; 

            if (npc && !npc.isDead) {
                let hit = false;
                let attackReach = 65; 
                let attackWidth = 40; 

                if (player.facing === "right" && npc.x > player.x && npc.x - player.x < attackReach && Math.abs(npc.y - player.y) < attackWidth) hit = true;
                if (player.facing === "left" && player.x > npc.x && player.x - npc.x < attackReach && Math.abs(npc.y - player.y) < attackWidth) hit = true;
                if (player.facing === "up" && player.y > npc.y && player.y - npc.y < attackReach && Math.abs(npc.x - player.x) < attackWidth) hit = true;
                if (player.facing === "down" && npc.y > player.y && npc.y - player.y < attackReach && Math.abs(npc.x - player.x) < attackWidth) hit = true;

                if (hit) {
                    npc.hp--;
                    if (npc.hp <= 0) {
                        npc.isDead = true;
                        player.text = "this is gonna be long right...";
                        dialogueTimers.push(setTimeout(() => { player.text = ""; }, 3000));
                    }
                }
            }
        }
    } else {
        player.canAttack = true; 
    }
    if (player.attackTimer > 0) player.attackTimer--;

    // Wall Collision
    obstacles.forEach(obs => {
        if (player.x + player.radius > obs.x && player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y && player.y - player.radius < obs.y + obs.height) {
            
            if (currentLevelIndex === 3) {
                alert("u killed me..."); loadLevel(3); 
            } else {
                isDead = true; 
                alert("You died! Hit the Respawn button at the top right to start over.");
            }
        }
    });

    // NPC Body Collision
    if (npc && !npc.isDead) {
        let dx = player.x - npc.x;
        let dy = player.y - npc.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + npc.radius - 5) { 
            isDead = true; 
            alert("You touched the weird hexagon! Hit the Respawn button to start over.");
        }
    }

    // Treasure Collision
    if (!isDead && player.x + player.radius > treasure.x && player.x - player.radius < treasure.x + treasure.width &&
        player.y + player.radius > treasure.y && player.y - player.radius < treasure.y + treasure.height) {
        
        treasure.isOpen = true; 
        isTransitioning = true; 
        
        setTimeout(() => {
            currentLevelIndex++; 
            if (currentLevelIndex === 3) {
                const bwBtn = document.getElementById("bwButton");
                if (bwBtn && bwBtn.disabled) {
                    bwBtn.disabled = false; bwBtn.innerText = "🔓 Black & White (Unlocked!)";
                    alert("Achievement Unlocked: Black & White Theme!");
                }
            }
            if (currentLevelIndex >= levels.length) {
                alert("You beat the whole game! Resetting back to Level 1...");
                currentLevelIndex = 0; loadLevel(0);
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
