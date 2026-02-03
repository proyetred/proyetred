class BossAttack {
    constructor(x, y, type, game, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.options = options;
        this.width = 0;
        this.height = 0;
        this.alpha = 1;
        this.projectiles = [];
        this.timer = 0;

        if (this.type === 'laser') {
            this.width = this.options.width || 10;
            this.height = this.game.canvas.height - y;
            this.alpha = 1;
        } else if (this.type === 'aoe') {
            this.radius = 10;
        } else if (this.type === 'dispersing') {
            const count = this.options.count || 8;
            for (let i = 0; i < count; i++) {
                this.projectiles.push({
                    x: this.x,
                    y: this.y,
                    width: 10,
                    height: 10,
                    speedX: Math.cos(i * 2 * Math.PI / count) * 4,
                    speedY: Math.sin(i * 2 * Math.PI / count) * 4
                });
            }
        } else if (this.type === 'homing') {
            this.width = 15;
            this.height = 15;
            this.speed = 4;
        }
    }

    update() {
        this.timer++;
        if (this.type === 'laser') {
            if (this.timer > 45) this.alpha -= 0.05;
        } else if (this.type === 'aoe') {
            this.radius += 3;
            if (this.timer > 75) this.alpha -= 0.02;
        } else if (this.type === 'dispersing') {
            for (let p of this.projectiles) {
                p.x += p.speedX;
                p.y += p.speedY;
            }
            if (this.timer > 100) this.alpha = 0;
        } else if (this.type === 'homing') {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
            if (this.timer > 200) this.alpha = 0;
        }
    }

    draw() {
        this.game.ctx.globalAlpha = this.alpha;
        if (this.type === 'laser') {
            this.game.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.game.ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        } else if (this.type === 'aoe') {
            this.game.ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
            this.game.ctx.beginPath();
            this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            this.game.ctx.fill();
        } else if (this.type === 'dispersing') {
            this.game.ctx.fillStyle = '#ffff00';
            for (let p of this.projectiles) {
                this.game.ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        } else if (this.type === 'homing') {
            this.game.ctx.fillStyle = '#ff00ff';
            this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        this.game.ctx.globalAlpha = 1;
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.keys = {};
        this.gameState = 'menu'; // menu, playing, gameOver, gameWon
        this.gameRunning = false;
        this.images = {};
        this.imagesLoaded = 0;
        this.imageCount = 12; // 4 players, 2 enemies, 5 bosses, 1 life
        this.playerShip = 'player1';
        this.background = new Background(this.canvas);

        this.audio = {};
        this.bgMusic = [
            'FullMetal/Material/tema1.mp3',
            'FullMetal/Material/tema2.mp3',
            'FullMetal/Material/tema3.mp3',
            'FullMetal/Material/tema4.mp3',
            'FullMetal/Material/tema5.mp3'
        ];

        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;

        this.preloadImages();
    }

    preloadImages() {
        const sources = {
            player1: 'FullMetal/Pilotos/Piloto 1.png',
            player2: 'FullMetal/Pilotos/Piloto 2.png',
            player3: 'FullMetal/Pilotos/Piloto 3.png',
            player4: 'FullMetal/Pilotos/Piloto 4.png',
            enemy1: 'FullMetal/Enemigos/Enemy 1.png',
            enemy2: 'FullMetal/Enemigos/Enemy 2.png',
            boss1: 'FullMetal/Enemigos/Boss 1.png',
            boss2: 'FullMetal/Enemigos/Boss 2.png',
            boss3: 'FullMetal/Enemigos/Boss 3.png',
            boss4: 'FullMetal/Enemigos/Boss 4.png',
            boss5: 'FullMetal/Enemigos/Boss 5.png',
            life: 'FullMetal/Material/Vida.png'
        };

        for (let key in sources) {
            this.images[key] = new Image();
            this.images[key].src = sources[key];
            this.images[key].onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.imageCount) {
                    document.getElementById('loading-message').style.display = 'none';
                    document.getElementById('play-button').disabled = false;
                }
            };
        }
    }

    init() {
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 70,
            width: 50,
            height: 50,
            speed: 8, // Increased player speed
            lives: 3
        };
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.boss = null;
        this.explosions = [];
        this.bossAttacks = [];
        this.score = 0;
        this.level = 1;
        this.createEnemies();
        this.gameState = 'playing';
        this.playBgMusic();

        document.getElementById('game-over-menu').style.display = 'none';
        document.getElementById('game-won-menu').style.display = 'none';
    }

    createEnemies() {
        this.enemies = [];
        if (this.level % 3 === 0) { // Boss level
            const bossType = 'boss' + ((this.level / 3 - 1) % 5 + 1);
            this.boss = {
                x: this.canvas.width / 2 - 50,
                y: -100,
                width: 100,
                height: 100,
                speed: 3 + this.level * 0.2,
                health: 30 * (this.level / 3),
                maxHealth: 30 * (this.level / 3),
                type: bossType,
                attackCooldown: 90 - (this.level / 3) * 5, // Faster attacks
                attackTimer: 0,
                state: 'entering', // entering, fighting, dying
                deathTimer: 0,
                alpha: 1
            };
        } else {
            const enemyCount = 15 + this.level * 3; // More enemies
            for (let i = 0; i < enemyCount; i++) {
                this.enemies.push({
                    x: Math.random() * (this.canvas.width - 40),
                    y: -Math.random() * 600 - 40,
                    width: 40,
                    height: 40,
                    speed: 2 + Math.random() * this.level, // Faster enemies
                    baseX: Math.random() * (this.canvas.width - 40),
                    angle: Math.random() * 2 * Math.PI,
                    type: Math.random() < 0.5 ? 'enemy1' : 'enemy2'
                });
            }
        }
    }

    draw() {
        this.background.draw(this.ctx, this.dataArray);
        if (this.gameState === 'playing') {
            this.drawPlayer();
            this.drawBullets();
            this.drawEnemyBullets();
            this.drawEnemies();
            if (this.boss) this.drawBoss();
            this.drawBossAttacks();
            this.drawExplosions();
            this.drawUI();
        } else if (this.gameState === 'gameOver') {
            this.drawGameOver();
        } else if (this.gameState === 'gameWon') {
            this.drawGameWon();
        }
    }

    drawPlayer() {
        this.ctx.drawImage(this.images[this.playerShip], this.player.x, this.player.y, this.player.width, this.player.height);
    }

    drawBullets() {
        this.ctx.fillStyle = '#00bfff';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    drawEnemyBullets() {
        this.ctx.fillStyle = '#ff00ff';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    drawEnemies() {
        for (let enemy of this.enemies) {
            this.ctx.drawImage(this.images[enemy.type], enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }

    drawBoss() {
        this.ctx.globalAlpha = this.boss.alpha;
        this.ctx.drawImage(this.images[this.boss.type], this.boss.x, this.boss.y, this.boss.width, this.boss.height);
        this.ctx.globalAlpha = 1;

        if (this.boss.state === 'fighting') {
            const healthBarWidth = this.boss.width;
            const healthBarHeight = 10;
            const healthPercentage = this.boss.health / this.boss.maxHealth;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(this.boss.x, this.boss.y - healthBarHeight - 5, healthBarWidth, healthBarHeight);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(this.boss.x, this.boss.y - healthBarHeight - 5, healthBarWidth * healthPercentage, healthBarHeight);
        }
    }

    drawBossAttacks() {
        for (let attack of this.bossAttacks) {
            attack.draw();
        }
    }

    drawExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            this.ctx.fillStyle = `rgba(255, 165, 0, ${explosion.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            explosion.radius += 0.8; // Faster explosions
            explosion.alpha -= 0.03;
            if (explosion.alpha <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    drawUI() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Orbitron, sans-serif';
        this.ctx.fillText('Puntaje: ' + this.score, 10, 30);
        this.ctx.fillText('Nivel: ' + this.level, this.canvas.width / 2 - 50, 30);
        for (let i = 0; i < this.player.lives; i++) {
            this.ctx.drawImage(this.images.life, this.canvas.width - 120 + (i * 40), 10, 30, 30);
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '50px Orbitron, sans-serif';
        this.ctx.fillText('FIN DEL JUEGO', this.canvas.width / 2 - 150, this.canvas.height / 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Orbitron, sans-serif';
        this.ctx.fillText('Presiona R para reiniciar', this.canvas.width / 2 - 120, this.canvas.height / 2 + 40);
    }

    drawGameWon() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '50px Orbitron, sans-serif';
        this.ctx.fillText('¡GANASTE!', this.canvas.width / 2 - 120, this.canvas.height / 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Orbitron, sans-serif';
        this.ctx.fillText('Presiona N para el siguiente nivel', this.canvas.width / 2 - 150, this.canvas.height / 2 + 40);
    }

    update() {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
        }
        this.background.update(this.dataArray);

        if (this.gameState !== 'playing') return;

        this.updatePlayer();
        this.updateBullets();
        this.updateEnemyBullets();
        this.updateEnemies();
        if (this.boss) this.updateBoss();
        this.updateBossAttacks();
        this.checkCollisions();

        if (this.enemies.length === 0 && !this.boss) {
            this.gameState = 'gameWon';
        }
    }

    updatePlayer() {
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.player.y += this.player.speed;
        }

        // Horizontal boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }

        // Vertical boundaries
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.height;
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= 10; // Faster player bullets
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].y += 7; // Faster enemy bullets
            if (this.enemyBullets[i].y > this.canvas.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateEnemies() {
        for (let enemy of this.enemies) {
            enemy.y += enemy.speed;
            enemy.x = enemy.baseX + Math.sin(enemy.angle) * 50;
            enemy.angle += 0.05;

            if (enemy.y > this.canvas.height) {
                enemy.y = -40;
                enemy.x = Math.random() * (this.canvas.width - 40);
                enemy.baseX = enemy.x;
            }

            if (Math.random() < 0.002 * this.level) { // Increased firing rate
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 10
                });
            }
        }
    }

    updateBoss() {
        if (this.boss.state === 'entering') {
            this.boss.y += 3;
            if (this.boss.y >= 50) {
                this.boss.y = 50;
                this.boss.state = 'fighting';
            }
            return;
        }

        if (this.boss.state === 'dying') {
            this.boss.deathTimer++;
            if (this.boss.deathTimer % 8 === 0) { // More explosions
                this.createExplosion(this.boss.x + Math.random() * this.boss.width, this.boss.y + Math.random() * this.boss.height);
            }
            this.boss.alpha -= 0.015; // Faster fade out
            if (this.boss.alpha <= 0) {
                this.boss = null;
            }
            return;
        }

        this.boss.x += this.boss.speed;
        if (this.boss.x + this.boss.width > this.canvas.width || this.boss.x < 0) {
            this.boss.speed *= -1;
        }

        this.boss.attackTimer++;
        if (this.boss.attackTimer >= this.boss.attackCooldown) {
            this.boss.attackTimer = 0;
            this.executeBossAttack();
        }
    }

    executeBossAttack() {
        const attackOptions = [];
        switch (this.boss.type) {
            case 'boss1':
                attackOptions.push({ type: 'normal' });
                break;
            case 'boss2':
                attackOptions.push({ type: 'normal' }, { type: 'laser', options: { width: 8 } });
                break;
            case 'boss3':
                attackOptions.push({ type: 'homing' }, { type: 'laser', options: { width: 18 } });
                break;
            case 'boss4':
                attackOptions.push({ type: 'dispersing', options: { count: 16 } }, { type: 'aoe' });
                break;
            case 'boss5':
                attackOptions.push({ type: 'dispersing', options: { count: 20 } }, { type: 'homing' }, { type: 'laser', options: { width: 30 } }, { type: 'aoe' });
                break;
        }

        const attack = attackOptions[Math.floor(Math.random() * attackOptions.length)];

        if (attack.type === 'normal') {
            for (let i = 0; i < 5; i++) {
                this.enemyBullets.push({
                    x: this.boss.x + this.boss.width / 2 - 2,
                    y: this.boss.y + this.boss.height,
                    width: 4,
                    height: 10,
                    speedY: 7
                });
            }
        } else {
            this.bossAttacks.push(new BossAttack(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height, attack.type, this, attack.options));
        }
    }

    updateBossAttacks() {
        for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
            this.bossAttacks[i].update();
            if (this.bossAttacks[i].alpha <= 0) {
                this.bossAttacks.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // Player bullets with enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.isColliding(this.bullets[i], this.enemies[j])) {
                    this.createExplosion(this.enemies[j].x + this.enemies[j].width / 2, this.enemies[j].y + this.enemies[j].height / 2);
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 10;
                    break;
                }
            }
        }

        // Player bullets with boss
        if (this.boss && this.boss.state === 'fighting') {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                if (this.isColliding(this.bullets[i], this.boss)) {
                    this.bullets.splice(i, 1);
                    this.boss.health--;
                    this.score += 10;
                    if (this.boss.health <= 0) {
                        this.boss.state = 'dying';
                        this.score += 100;
                    }
                    break;
                }
            }
        }

        // Enemy bullets with player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (this.isColliding(this.enemyBullets[i], this.player)) {
                this.enemyBullets.splice(i, 1);
                this.handlePlayerHit();
            }
        }

        // Boss attacks with player
        for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
            const attack = this.bossAttacks[i];
            if (attack.type === 'laser') {
                if (this.isColliding({x: attack.x - attack.width / 2, y: attack.y, width: attack.width, height: attack.height}, this.player)) {
                    this.handlePlayerHit();
                }
            } else if (attack.type === 'aoe') {
                const dx = this.player.x + this.player.width / 2 - attack.x;
                const dy = this.player.y + this.player.height / 2 - attack.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < attack.radius + this.player.width / 2) {
                    this.handlePlayerHit();
                }
            } else if (attack.type === 'dispersing') {
                for (let p of attack.projectiles) {
                    if (this.isColliding(p, this.player)) {
                        this.handlePlayerHit();
                    }
                }
            } else if (attack.type === 'homing') {
                if (this.isColliding(attack, this.player)) {
                    this.handlePlayerHit();
                }
            }
        }

        // Enemies with player
        for (let enemy of this.enemies) {
            if (this.isColliding(enemy, this.player)) {
                this.handlePlayerHit();
            }
        }

        // Boss with player
        if (this.boss && this.boss.state === 'fighting' && this.isColliding(this.boss, this.player)) {
            this.handlePlayerHit();
        }
    }

    handlePlayerHit() {
        this.player.lives--;
        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        if (this.player.lives <= 0) {
            this.gameState = 'gameOver';
        } else {
            this.player.x = this.canvas.width / 2 - 25;
            this.player.y = this.canvas.height - 70;
        }
    }

    createExplosion(x, y) {
        if(this.audio.explosion) {
            this.audio.explosion.currentTime = 0;
            this.audio.explosion.play();
        }
        this.explosions.push({ x, y, radius: 10, alpha: 1 });
    }

    isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    loop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        if (this.gameRunning) return;
        this.gameRunning = true;
        this.loop();
    }

    stop() {
        this.gameRunning = false;
        if(this.audio.menu) this.audio.menu.pause();
        if(this.audio.bg) this.audio.bg.pause();
    }

    setVolume(volume) {
        if(this.audio.menu) this.audio.menu.volume = volume;
        if(this.audio.bg) this.audio.bg.volume = volume;
        if(this.audio.shoot) this.audio.shoot.volume = volume;
        if(this.audio.explosion) this.audio.explosion.volume = volume;
    }

    setupAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.audio.menu = document.getElementById('audio-menu');
            this.audio.bg = document.getElementById('audio-bg');
            this.audio.shoot = document.getElementById('audio-shoot');
            this.audio.explosion = document.getElementById('audio-explosion');

            this.source = this.audioContext.createMediaElementSource(this.audio.bg);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.audio.bg.addEventListener('ended', () => this.playBgMusic());

            this.setVolume(0.4); // Set initial volume
        }
    }

    playBgMusic() {
        const randomIndex = Math.floor(Math.random() * this.bgMusic.length);
        this.audio.bg.src = this.bgMusic[randomIndex];
        this.audio.bg.play();
    }

    shoot() {
        if (this.gameState !== 'playing') return;

        if(this.audio.shoot) {
            this.audio.shoot.currentTime = 0;
            this.audio.shoot.play();
        }
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 10
        });
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
        if (this.gameState === 'playing' && e.key === ' ') {
            this.shoot();
        }
        if (this.gameState === 'gameOver' && (e.key === 'r' || e.key === 'R')) {
            this.init();
        }
        if (this.gameState === 'gameWon' && (e.key === 'n' || e.key === 'N')) {
            this.level++;
            this.createEnemies();
            this.gameState = 'playing';
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
}