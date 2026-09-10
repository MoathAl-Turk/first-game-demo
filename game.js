const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");

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

const levels = [
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 175, width: 50, height: 50 }, obstacles: [ { x: 150, y: 0, width: 30, height: 250 }, { x: 350, y: 150, width: 30, height: 250 } ] },
    { start: { x: 30, y: 30 }, treasure: { x: 530, y: 320, width: 50, height: 50 }, obstacles: [ { x: 100, y: 0, width: 30, height: 300 }, { x: 230, y: 100, width: 30, height: 300 }, { x: 360, y: 0, width: 30, height: 300 }, { x: 490, y: 100, width: 30, height: 300 } ] },
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 200, width: 50, height: 50 }, obstacles: [ { x: 100, y: 0, width: 40, height: 160 }, { x: 100, y: 240, width: 40, height: 160 }, { x: 250, y: 80, width: 40, height: 320 }, { x: 400, y: 0, width: 40, height: 320 } ] },
    { start: { x: 30, y: 200 }, treasure: { x: 530, y: 200, width: 50, height: 50 }, obstacles: [ { x: 150, y: 0, width: 20, height: 320 }, { x: 300, y: 80, width: 20, height: 320 }, { x: 450, y: 0, width: 20, height: 320 } ] },
    { // LEVEL 5: Scrolling Combat Level
        width: 1400, // Longer level!
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
// NEW Player properties: facing, attack frames, dialogue text
let player = { x: 0, y: 0, radius: 15, speed: 4, facing: "right", attackTimer: 0, canAttack: true, text: "" };
let treasure = {};
let obstacles = [];
let npc = null;
let keys = {};
let isTransitioning = false; 
let isDead = false; 
let cameraX = 0; // NEW: Camera offset

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
        isPitchBlack = true; // Level 5 is also a black void
        
        // NPC Dialogue Sequence
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

// Mobile & On-Screen Buttons
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
bindButton("btn-hit", "e"); // Binds the UI Hit button to "e"

function drawHexagon(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + r * Math.cos((Math.PI / 3) * i), y + r * Math.sin((Math.PI / 3) * i));
    }
    ctx.closePath();
    ctx.fill();
}

function draw() {
    // 1. Draw Background
    if (isPitchBlack) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // NEW: Apply Camera Offset!
    ctx.save();
    ctx.translate(-cameraX, 0);

    // 2. Draw Treasure
    if (treasure.isOpen) {
        ctx.strokeStyle = currentTheme.treasure; ctx.lineWidth = 4;
        ctx.strokeRect(treasure.x + 2, treasure.y + 2, treasure.width - 4, treasure.height - 4);
    } else {
        ctx.fillStyle = currentTheme.treasure;
        ctx.fillRect(treasure.x, treasure.y, treasure.width, treasure.height);
    }

    // 3. Draw Obstacles
    ctx.fillStyle = currentTheme.obstacles;
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

    // 4. Draw NPC (Hexagon)
    if (npc && !npc.isDead) {
        drawHexagon(npc.x, npc.y, npc.radius, "magenta");
        
        // NPC HP Bar
        ctx.fillStyle = "red"; ctx.fillRect(npc.x - 15, npc.y - 35, 30, 5);
        ctx.fillStyle = "green"; ctx.fillRect(npc.x - 15, npc.y - 35, npc.hp * 10, 5);
        
        // NPC Text
        if (npc.text) {
            ctx.fillStyle = "white"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(npc.text, npc.x, npc.y - 45);
        }
    }

    // 5. Draw Player
    if (!isDead) {
        ctx.fillStyle = currentTheme.player;
        if (currentLevelIndex === 3) {
            ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(jokeMessage, player.x, player.y - 25);
        } else {
            ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
        }

        // Floating Player Text
        if (player.text) {
            ctx.fillStyle = "white"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(player.text, player.x, player.y - 25);
        }

        // Draw Sword if Attacking
        if (player.attackTimer > 0) {
            ctx.fillStyle = "white"; // Sword is white
            if (player.facing === "right") ctx.fillRect(player.x + 10, player.y - 4, 30, 8);
            else if (player.facing === "left") ctx.fillRect(player.x - 40, player.y - 4, 30, 8);
            else if (player.facing === "up") ctx.fillRect(player.x - 4, player.y - 40, 8, 30);
            else if (player.facing === "down") ctx.fillRect(player.x - 4, player.y + 10, 8, 30);
        }
    }
    ctx.restore(); // Stop applying camera offset for UI elements
}

function update() {
    if (isTransitioning || isDead) return; 

    // --- MOVEMENT & FACING ---
    if (keys["ArrowUp"] || keys["w"]) { player.y -= player.speed; player.facing = "up"; }
    if (keys["ArrowDown"] || keys["s"]) { player.y += player.speed; player.facing = "down"; }
    if (keys["ArrowLeft"] || keys["a"]) { player.x -= player.speed; player.facing = "left"; }
    if (keys["ArrowRight"] || keys["d"]) { player.x += player.speed; player.facing = "right"; }

    // Keep player inside the level bounds
    let levelWidth = levels[currentLevelIndex].width || 600;
    player.x = Math.max(player.radius, Math.min(levelWidth - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // --- CAMERA CALCULATION ---
    // Smoothly track the player if the level is wide
    cameraX = Math.max(0, Math.min(player.x - canvas.width / 2, levelWidth - canvas.width));

    // --- COMBAT LOGIC ---
    if (keys["e"]) {
        if (player.canAttack) {
            player.canAttack = false;
            player.attackTimer = 15; // Sword stays out for 15 frames

            // Check if sword hits NPC
            if (npc && !npc.isDead) {
                let hit = false;
                if (player.facing === "right" && npc.x > player.x && npc.x - player.x < 50 && Math.abs(npc.y - player.y) < 30) hit = true;
                if (player.facing === "left" && player.x > npc.x && player.x - npc.x < 50 && Math.abs(npc.y - player.y) < 30) hit = true;
                if (player.facing === "up" && player.y > npc.y && player.y - npc.y < 50 && Math.abs(npc.x - player.x) < 30) hit = true;
                if (player.facing === "down" && npc.y > player.y && npc.y - player.y < 50 && Math.abs(npc.x - player.x) < 30) hit = true;

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
        player.canAttack = true; // Must release the button to swing again
    }
    if (player.attackTimer > 0) player.attackTimer--;

    // --- COLLISIONS ---
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

    // NPC Body Collision (If player runs into the NPC while it is alive, they die)
    if (npc && !npc.isDead) {
        let dx = player.x - npc.x;
        let dy = player.y - npc.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + npc.radius - 5) { // -5 gives a tiny bit of forgiveness
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
