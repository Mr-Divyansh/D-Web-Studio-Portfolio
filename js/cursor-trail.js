(function () {
    "use strict";

    var canvas, ctx, width, height, particles, mouse, rafId, enabled;

    var PARTICLE_COUNT = 24;
    // Brand colours pulled from the page's custom properties so the trail
    // respects theme changes automatically.
    var COLORS = [
        "rgba(34, 104, 230, 0.55)",    // --blue  (dark theme)
        "rgba(227, 190, 120, 0.45)",   // --gold
        "rgba(111, 178, 255, 0.50)",   // --blue-light
        "rgba(74, 222, 154, 0.40)"     // --live
    ];

    function init() {
        canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";
        canvas.style.willChange = "transform";
        document.body.appendChild(canvas);

        ctx = canvas.getContext("2d", { alpha: true });
        particles = [];
        mouse = { x: -1000, y: -1000 };
        enabled = true;
        rafId = null;

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("scroll", onScroll);
        document.addEventListener("visibilitychange", onVisibilityChange);

        if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            enabled = false;
            canvas.style.display = "none";
        }

        animate();
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function onMouseMove(e) {
        if (!enabled) return;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        spawnParticles();
    }

    function onScroll() {
        if (!enabled) return;
        mouse.x = -1000;
        mouse.y = -1000;
    }

    function onVisibilityChange() {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
        } else {
            animate();
        }
    }

    function spawnParticles() {
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: mouse.x + (Math.random() * 12 - 6),
                y: mouse.y + (Math.random() * 12 - 6),
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2 - 0.5,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.015,
                size: Math.random() * 3 + 1.5,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    }

    function update() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.size *= 0.96;
            if (p.life <= 0 || p.size < 0.3) {
                particles.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function animate() {
        if (!enabled) return;
        update();
        draw();
        rafId = requestAnimationFrame(animate);
    }

    // Public API
    window.cursorTrail = {
        enable: function () {
            if (!canvas) return;
            enabled = true;
            canvas.style.display = "block";
            animate();
        },
        disable: function () {
            enabled = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (canvas) canvas.style.display = "none";
        },
        destroy: function () {
            window.cursorTrail.disable();
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            canvas = null;
            ctx = null;
            particles = [];
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();