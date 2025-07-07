const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const roarDisplay = document.getElementById('roarDisplay');
const scoreElement = document.getElementById('score');
const hitsElement = document.getElementById('hits');

// Game state
let score = 0;
let hits = 0;
let sizeMultiplier = 1; 
let bullets = [];      
let particles = [];                     
let animationId;
let numberOfHitsBeforeExplosion = 100; 

// Godzilla object
const godzilla = {

    x: 400,
    y: 300,
    width: 743 * sizeMultiplier,
    height: 369 * sizeMultiplier,
    //width: 1011 * sizeMultiplier,
    //height: 723 * sizeMultiplier,
    vx: 4,
    vy: 3,
    color: '#e74c3c',
    hitFlash: 0
};

// Bullet class
class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 8;
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        
        this.life = 100;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        return this.life > 0 && 
               this.x > 0 && this.x < canvas.width && 
               this.y > 0 && this.y < canvas.height;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet trail
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Particle class for hit effects
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 30;
        this.maxLife = 30;
        this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
        
        return this.life > 0;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Update Godzilla
function updateGodzilla() {
    godzilla.x += godzilla.vx;
    godzilla.y += godzilla.vy;
    
    // Bounce off walls
    if (godzilla.x <= 0 || godzilla.x >= canvas.width - godzilla.width) {
        godzilla.vx = -godzilla.vx;
        godzilla.x = Math.max(0, Math.min(canvas.width - godzilla.width, godzilla.x));
    }
    
    if (godzilla.y <= 0 || godzilla.y >= canvas.height - godzilla.height) {
        godzilla.vy = -godzilla.vy;
        godzilla.y = Math.max(0, Math.min(canvas.height - godzilla.height, godzilla.y));
    }
    
    // Reduce hit flash
    if (godzilla.hitFlash > 0) {
        godzilla.hitFlash--;
    }
}

// Load Godzilla image
const godzillaImage = new Image();
godzillaImage.src = 'images/godzilla2.png';

// Update drawGodzilla function to use the image
function drawGodzilla() {
    ctx.save();

    // Flash effect when hit
    if (godzilla.hitFlash > 0) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
    }

    // Draw Godzilla image
    ctx.drawImage(godzillaImage, godzilla.x, godzilla.y, godzilla.width, godzilla.height);

    ctx.restore();
}

// Load sound effects
const shootSound = new Audio('sounds/shoot.mp3');
const hitSound = new Audio('sounds/hit.mp3');
const explosionSound = new Audio('sounds/explosion.mp3');

// Play sound when shooting
function shootBullet(targetX, targetY) {
    const startX = canvas.width / 2;
    const startY = canvas.height - 50;
    bullets.push(new Bullet(startX, startY, targetX, targetY));
    shootSound.play();
}

// Check collision between bullet and Godzilla
function checkCollision(bullet) {
    const isHit = bullet.x > godzilla.x && 
                  bullet.x < godzilla.x + godzilla.width &&
                  bullet.y > godzilla.y && 
                  bullet.y < godzilla.y + godzilla.height;
    if (isHit) {
        hitSound.play();
    }
    return isHit;
}

// Show roar effect
function showRoar() {
    const roarTexts = ['RARRR!', 'ROAAAR!', 'GRAAAH!', 'ROOOOAR!'];
    roarDisplay.textContent = roarTexts[Math.floor(Math.random() * roarTexts.length)];
    roarDisplay.classList.add('show');
    
    setTimeout(() => {
        roarDisplay.classList.remove('show');
    }, 500);
}

// Create hit particles
function createHitEffect(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y));
    }
}

// Play sound during explosion
function createExplosion(x, y) {
    explosionSound.play();
    for (let i = 0; i < 200; i++) {
        const particle = new Particle(x, y);
        particle.color = `hsl(${Math.random() * 30 + 10}, 100%, 50%)`;
        particles.push(particle);
    }

    // Split Godzilla image into fragments
    const fragmentSize = 50;
    for (let i = 0; i < godzilla.width; i += fragmentSize) {
        for (let j = 0; j < godzilla.height; j += fragmentSize) {
            particles.push({
                x: godzilla.x + i,
                y: godzilla.y + j,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                width: fragmentSize,
                height: fragmentSize,
                life: 60,
                draw() {
                    ctx.save();
                    ctx.globalAlpha = this.life / 60;
                    ctx.drawImage(
                        godzillaImage,
                        i, j, fragmentSize, fragmentSize,
                        this.x, this.y, fragmentSize, fragmentSize
                    );
                    ctx.restore();
                },
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life--;
                    return this.life > 0;
                }
            });
        }
    }
}                        

// Modify game loop to delay reset after explosion
let explosionTimer = 0;

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw Godzilla
    if (hits < numberOfHitsBeforeExplosion) {
        updateGodzilla();
        drawGodzilla();
    } else {
        // Trigger explosion and stop Godzilla
        if (explosionTimer === 0) {
            createExplosion(godzilla.x + godzilla.width / 2, godzilla.y + godzilla.height / 2);
        }
        explosionTimer++;

        // Delay reset for 2 seconds (60 frames per second)
        if (explosionTimer > 120) {
            hits = 0; // Reset hits after explosion
            explosionTimer = 0; // Reset explosion timer
        }
    }

    // Update bullets
    bullets = bullets.filter(bullet => {
        if (!bullet.update()) {
            return false;
        }

        // Check collision with Godzilla
        if (hits < numberOfHitsBeforeExplosion && checkCollision(bullet)) {
            hits++;
            score += 100;
            hitsElement.textContent = hits;
            scoreElement.textContent = score;

            // Effects
            showRoar();
            godzilla.hitFlash = 15;
            createHitEffect(bullet.x, bullet.y);

            // Make Godzilla bounce faster after hit
            godzilla.vx *= 1.1;
            godzilla.vy *= 1.1;

            // Limit max speed
            const maxSpeed = 8;
            if (Math.abs(godzilla.vx) > maxSpeed) godzilla.vx = maxSpeed * Math.sign(godzilla.vx);
            if (Math.abs(godzilla.vy) > maxSpeed) godzilla.vy = maxSpeed * Math.sign(godzilla.vy);

            return false;
        }

        bullet.draw();
        return true;
    });

    // Update particles
    particles = particles.filter(particle => {
        if (!particle.update()) {
            return false;
        }
        particle.draw();
        return true;
    });

    // Draw crosshair at bottom center
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height - 50);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height - 50);
    ctx.moveTo(canvas.width / 2, canvas.height - 60);
    ctx.lineTo(canvas.width / 2, canvas.height - 40);
    ctx.stroke();

    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    shootBullet(x, y);
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        const x = godzilla.x + godzilla.width / 2 + (Math.random() - 0.5) * 100;
        const y = godzilla.y + godzilla.height / 2 + (Math.random() - 0.5) * 100;
        shootBullet(x, y);
    }
});

// Update canvas dimensions to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight         * 0.8; // Adjust height to leave space for UI elements

// Adjust Godzilla's initial position and size based on new canvas dimensions
godzilla.x = canvas.width / 2 - godzilla.width / 2;
godzilla.y = canvas.height / 2 - godzilla.height / 2;


// Update event listeners to handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Re-center Godzilla after resize
    godzilla.x = canvas.width / 2 - godzilla.width / 2;
    godzilla.y = canvas.height / 2 - godzilla.height / 2;
});

// Reset game
function resetGame() {
    score = 0;
    hits = 0;
    bullets = [];
    particles = [];
    godzilla.x = 400;
    godzilla.y = 300;
    godzilla.vx = 4;
    godzilla.vy = 3;
    godzilla.hitFlash = 0;
    
    scoreElement.textContent = score;
    hitsElement.textContent = hits;
}

// Start game
gameLoop();