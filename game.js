// 1. Setup the Canvas and Context (the drawing API)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set the resolution of the game window
canvas.width = 800;
canvas.height = 600;

// 2. Define the Player Class
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = 100;
        this.y = 100;
        
        // Basic physics variables
        this.velocityY = 0;
        this.gravity = 0.5;
    }

    draw() {
        ctx.fillStyle = "red"; // Our temporary player sprite
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Temporary collision detection: stop at the bottom of the canvas
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
        }

        this.draw();
    }
}

// Instantiate our player
const player = new Player();

// 3. The Game Loop
function animate() {
    // Clear the previous frame so old drawings don't smear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update the player's math and redraw them
    player.update();

    // Recursively call the loop ~60 times a second
    requestAnimationFrame(animate);
}

// Start the engine!
animate();
