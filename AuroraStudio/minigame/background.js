class Background {
    constructor(canvas) {
        this.canvas = canvas;
        this.stars = [];
        this.planets = [];
        this.particles = [];
        this.init();
    }

    init() {
        // Create stars
        for (let i = 0; i < 200; i++) { // More stars
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2,
                baseAlpha: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.5 + 0.2,
                speed: Math.random() * 0.3 + 0.1,
                color: '#FFFFFF'
            });
        }

        // Create planets
        for (let i = 0; i < 5; i++) { // More planets
            this.planets.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 50 + 20,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                speed: Math.random() * 0.1 + 0.05,
                baseRadius: Math.random() * 50 + 20,
            });
        }
    }

    draw(ctx, dataArray) {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const bass = dataArray ? dataArray[2] / 255 : 0;
        const mid = dataArray ? dataArray[40] / 255 : 0;
        const treble = dataArray ? dataArray[100] / 255 : 0;

        // Draw planets
        for (let planet of this.planets) {
            ctx.save();
            ctx.fillStyle = planet.color;
            ctx.shadowColor = planet.color;
            ctx.shadowBlur = 20 + bass * 30;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw stars
        for (let star of this.stars) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10 + mid * 15;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw particles (neon glows)
        for (let particle of this.particles) {
            ctx.save();
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 25; // Increased shadow blur for a more prominent glow
            ctx.globalAlpha = particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw frequency visualizer (futuristic)
        if (dataArray) {
            ctx.save();
            const bufferLength = dataArray.length;
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = 100 + bass * 50;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 0.7;
                const angle = (i / bufferLength) * 2 * Math.PI;
                const hue = (i / bufferLength) * 360;
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.7)`;
                ctx.lineWidth = 3;
                ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowBlur = 15;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    update(dataArray) {
        let bass = 0, mid = 0, treble = 0;
        if (dataArray) {
            bass = dataArray[2] / 255; // Low frequencies
            mid = dataArray[40] / 255; // Mid frequencies
            treble = dataArray[100] / 255; // High frequencies
        }

        // Update stars
        for (let star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            star.alpha = star.baseAlpha + mid * 0.5;
            star.radius = 1 + treble * 1.5;
        }

        // Update planets
        for (let planet of this.planets) {
            planet.y += planet.speed;
            if (planet.y - planet.radius > this.canvas.height) {
                planet.y = -planet.radius;
                planet.x = Math.random() * this.canvas.width;
            }
            planet.radius = planet.baseRadius + bass * 20;
        }

        // Update particles
        if (bass > 0.6 && Math.random() > 0.9) { // Adjusted trigger
            this.createParticles();
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.015; // Slower fade
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    createParticles() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        const hue = Math.random() * 360;
        for (let i = 0; i < 10; i++) { // Fewer particles for a cleaner look
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                radius: Math.random() * 4 + 2, // Slightly larger
                color: `hsl(${hue}, 90%, 70%)`,
                alpha: 1,
                vx: Math.cos(angle) * (Math.random() * 2),
                vy: Math.sin(angle) * (Math.random() * 2)
            });
        }
    }
}