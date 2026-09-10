// 1. Setup the Canvas and Context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// --- NEW: Track Keyboard Inputs ---
// We use a dictionary-like object to keep track of what is currently being held down.
const keys = {
    right: { pressed: false },
    left: { pressed: false }
};

// When you PRESS a key down
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyD':
        case 'ArrowRight':
            keys.right.pressed = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left.pressed = true;
            break;
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
            // Jump! (We use -12 because higher up on the screen means a lower Y value)
            // The `if` statement ensures we can only jump if we are touching the ground.
            if (player.velocityY === 0) {
                player.velocityY = -12; 
            }
            break;
    }
});

// When you RELEASE a key
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyD':
        case 'ArrowRight':
            keys.right.pressed = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left.pressed = false;
            break;
    }
});
// ----------------------------------

// 2. Define the Player Class
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = 100;
        this.y = 100;
        
        this.velocityY = 0;
        this.gravity = 0.5;
        this.speed = 5; // NEW: How fast the player runs
    }

    draw() {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // --- NEW: Horizontal movement ---
        // Move left or right depending on which key is pressed
        if (keys.right.pressed) {
            this.x += this.speed;
        } else if (keys.left.pressed) {
            this.x -= this.speed;
        }

        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Collision detection: stop at the bottom of the canvas
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0; // Resets velocity so the game knows we are on the ground
        }

        this.draw();
    }
}

const player = new Player();

// 3. The Game Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    requestAnimationFrame(animate);
}

animate();
